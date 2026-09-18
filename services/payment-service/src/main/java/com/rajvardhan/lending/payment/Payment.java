package com.rajvardhan.lending.payment;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payments")
public class Payment {
    @Id
    private UUID id;
    @Column(name = "loan_id", nullable = false)
    private UUID loanId;
    @Column(name = "customer_id", nullable = false)
    private UUID customerId;
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;
    @Column(name = "idempotency_key", nullable = false, unique = true)
    private String idempotencyKey;
    @Column(nullable = false)
    private String status;
    @Column(name = "provider_reference")
    private String providerReference;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Payment() {
    }

    public Payment(UUID loanId, UUID customerId, BigDecimal amount, String key) {
        this.id = UUID.randomUUID();
        this.loanId = loanId;
        this.customerId = customerId;
        this.amount = amount;
        this.idempotencyKey = key;
        this.status = "SUCCESS";
        this.providerReference = "SIM-" + UUID.randomUUID();
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getLoanId() {
        return loanId;
    }

    public UUID getCustomerId() {
        return customerId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getStatus() {
        return status;
    }

    public String getProviderReference() {
        return providerReference;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}