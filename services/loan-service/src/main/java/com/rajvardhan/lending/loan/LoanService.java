package com.rajvardhan.lending.loan;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.*;
import java.time.LocalDate;
import java.util.*;

@Service
public class LoanService {
    private final LoanApplicationRepository loans;
    private final LoanProductRepository products;
    private final RepaymentRepository repayments;
    private final KafkaTemplate<String, LoanEvent> kafka;
    private final StringRedisTemplate redis;

    public LoanService(LoanApplicationRepository loans, LoanProductRepository products, RepaymentRepository repayments,
                       KafkaTemplate<String, LoanEvent> kafka, StringRedisTemplate redis) {
        this.loans = loans;
        this.products = products;
        this.repayments = repayments;
        this.kafka = kafka;
        this.redis = redis;
    }

    public List<LoanProduct> activeProducts() {
        String key = "loan-products:active";
        // Cache is used as an invalidation-friendly marker; database remains source of truth.
        try {
            if (Boolean.TRUE.equals(redis.hasKey(key))) return products.findByActiveTrue();
            List<LoanProduct> result = products.findByActiveTrue();
            redis.opsForValue().set(key, "1", java.time.Duration.ofMinutes(10));
            return result;
        } catch (Exception e) {
            return products.findByActiveTrue();
        }
    }

    public LoanApplication getLoan(UUID id) {
        return loans.findById(id).orElseThrow(() -> new IllegalArgumentException("Loan not found"));
    }

    public List<LoanApplication> allApplications() {
        return loans.findAll();
    }

    public List<Repayment> getSchedule(UUID loanId) {
        return repayments.findByLoanApplicationIdOrderByInstallmentNumberAsc(loanId);
    }

    @Transactional
    public LoanApplication apply(UUID customerId, UUID productId, BigDecimal amount, int tenure) {
        LoanProduct p = products.findById(productId).orElseThrow(() -> new IllegalArgumentException("Loan product not found"));
        if (!p.isActive()) throw new IllegalArgumentException("Loan product is inactive");
        if (amount.compareTo(p.getMinAmount()) < 0 || amount.compareTo(p.getMaxAmount()) > 0)
            throw new IllegalArgumentException("Amount outside product limits");
        if (tenure < 1 || tenure > p.getMaxTenureMonths()) throw new IllegalArgumentException("Invalid tenure");
        return loans.save(new LoanApplication(customerId, productId, amount, tenure));
    }

    @Transactional
    public LoanApplication approve(UUID id) {
        LoanApplication loan = loans.findById(id).orElseThrow(() -> new IllegalArgumentException("Loan not found"));
        if (!"PENDING".equals(loan.getStatus()))
            throw new IllegalArgumentException("Only pending loans can be approved");
        LoanProduct p = products.findById(loan.getProductId()).orElseThrow();
        loan.approve();
        generateSchedule(loan, p);
        LoanApplication saved = loans.save(loan);
        kafka.send("loan.events", id.toString(), new LoanEvent("LOAN_APPROVED", id, loan.getCustomerId(), loan.getAmount()));
        return saved;
    }

    @Transactional
    public LoanApplication reject(UUID id) {
        LoanApplication loan = loans.findById(id).orElseThrow(() -> new IllegalArgumentException("Loan not found"));
        if (!"PENDING".equals(loan.getStatus()))
            throw new IllegalArgumentException("Only pending loans can be rejected");
        loan.reject();
        LoanApplication saved = loans.save(loan);
        kafka.send("loan.events", id.toString(), new LoanEvent("LOAN_REJECTED", id, loan.getCustomerId(), loan.getAmount()));
        return saved;
    }

    private void generateSchedule(LoanApplication loan, LoanProduct p) {
        BigDecimal monthlyRate = p.getAnnualInterestRate().divide(BigDecimal.valueOf(1200), 12, RoundingMode.HALF_UP);
        BigDecimal emi;
        if (monthlyRate.signum() == 0) {
            emi = loan.getAmount().divide(BigDecimal.valueOf(loan.getTenureMonths()), 2, RoundingMode.HALF_UP);
        } else {
            BigDecimal onePlus = BigDecimal.ONE.add(monthlyRate);
            BigDecimal pow = onePlus.pow(loan.getTenureMonths());
            emi = loan.getAmount().multiply(monthlyRate).multiply(pow)
                    .divide(pow.subtract(BigDecimal.ONE), 2, RoundingMode.HALF_UP);
        }
        BigDecimal balance = loan.getAmount();
        for (int i = 1; i <= loan.getTenureMonths(); i++) {
            BigDecimal interest = balance.multiply(monthlyRate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal principal = emi.subtract(interest).max(BigDecimal.ZERO);
            if (i == loan.getTenureMonths()) principal = balance;
            repayments.save(new Repayment(loan.getId(), i, LocalDate.now().plusMonths(i), principal, interest));
            balance = balance.subtract(principal).max(BigDecimal.ZERO);
        }
    }
}
