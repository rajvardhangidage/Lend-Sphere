package com.rajvardhan.lending.loan;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "loan_products")
public class LoanProduct {
    @Id
    private UUID id;
    @Column(nullable = false)
    private String name;
    @Column(name = "min_amount", nullable = false)
    private BigDecimal minAmount;
    @Column(name = "max_amount", nullable = false)
    private BigDecimal maxAmount;
    @Column(name = "annual_interest_rate", nullable = false)
    private BigDecimal annualInterestRate;
    @Column(name = "max_tenure_months", nullable = false)
    private int maxTenureMonths;
    @Column(nullable = false)
    private boolean active;

    protected LoanProduct() {
    }

    public LoanProduct(UUID id, String name, BigDecimal minAmount, BigDecimal maxAmount, BigDecimal annualInterestRate, int maxTenureMonths, boolean active) {
        this.id = id;
        this.name = name;
        this.minAmount = minAmount;
        this.maxAmount = maxAmount;
        this.annualInterestRate = annualInterestRate;
        this.maxTenureMonths = maxTenureMonths;
        this.active = active;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public BigDecimal getMinAmount() {
        return minAmount;
    }

    public BigDecimal getMaxAmount() {
        return maxAmount;
    }

    public BigDecimal getAnnualInterestRate() {
        return annualInterestRate;
    }

    public int getMaxTenureMonths() {
        return maxTenureMonths;
    }

    public boolean isActive() {
        return active;
    }
}
