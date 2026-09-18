package com.rajvardhan.lending.payment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    Optional<Payment> findByIdempotencyKey(String key);

    List<Payment> findByCustomerId(UUID customerId);
}