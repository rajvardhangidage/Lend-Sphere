package com.rajvardhan.lending.payment;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class PaymentService {
    private final PaymentRepository repo;
    private final KafkaTemplate<String, PaymentEvent> kafka;

    public PaymentService(PaymentRepository repo, KafkaTemplate<String, PaymentEvent> kafka) {
        this.repo = repo;
        this.kafka = kafka;
    }

    @Transactional
    public Payment pay(UUID customerId, UUID loanId, BigDecimal amount, String key) {
        if (amount.signum() <= 0) throw new IllegalArgumentException("Payment amount must be positive");
        Optional<Payment> existing = repo.findByIdempotencyKey(key);
        if (existing.isPresent()) return existing.get();
        Payment p = repo.save(new Payment(loanId, customerId, amount, key));
        kafka.send("payment.events", p.getId().toString(), new PaymentEvent("PAYMENT_SUCCESS", p.getId(), loanId, customerId, amount));
        return p;
    }

    public List<Payment> byCustomer(UUID id) {
        return repo.findByCustomerId(id);
    }

    public Payment getById(UUID id) {
        return repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Payment not found"));
    }
}