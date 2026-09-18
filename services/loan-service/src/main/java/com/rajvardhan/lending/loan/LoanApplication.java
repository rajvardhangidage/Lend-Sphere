package com.rajvardhan.lending.loan;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "loan_applications")
public class LoanApplication {
    @Id
    private UUID id;
    @Column(name = "customer_id", nullable = false)
    private UUID customerId;
    @Column(name = "product_id", nullable = false)
    private UUID productId;
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;
    @Column(name = "tenure_months", nullable = false)
    private int tenureMonths;
    @Column(nullable = false)
    private String status;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected LoanApplication() {
    }

    public LoanApplication(UUID customerId, UUID productId, BigDecimal amount, int tenureMonths) {
        this.id = UUID.randomUUID();
        this.customerId = customerId;
        this.productId = productId;
        this.amount = amount;
        this.tenureMonths = tenureMonths;
        this.status = "PENDING";
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getCustomerId() {
        return customerId;
    }

    public UUID getProductId() {
        return productId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public int getTenureMonths() {
        return tenureMonths;
    }

    public String getStatus() {
        return status;
    }

    public void approve() {
        status = "APPROVED";
        updatedAt = Instant.now();
    }

    public void reject() {
        status = "REJECTED";
        updatedAt = Instant.now();
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}

