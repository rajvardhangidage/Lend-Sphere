package com.rajvardhan.lending.loan;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RepaymentRepository extends JpaRepository<Repayment, UUID> {
    List<Repayment> findByLoanApplicationIdOrderByInstallmentNumberAsc(UUID loanApplicationId);
}
