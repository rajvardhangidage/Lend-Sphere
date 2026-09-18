package com.rajvardhan.lending.loan;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "repayment_schedule")
public class Repayment {
    @Id
    private UUID id;
    @Column(name = "loan_application_id", nullable = false)
    private UUID loanApplicationId;
    @Column(name = "installment_number", nullable = false)
    private int installmentNumber;
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal principal;
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal interest;
    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;
    @Column(nullable = false)
    private String status;

    protected Repayment() {
    }

    public Repayment(UUID loanId, int n, LocalDate due, BigDecimal principal, BigDecimal interest) {
        this.id = UUID.randomUUID();
        this.loanApplicationId = loanId;
        this.installmentNumber = n;
        this.dueDate = due;
        this.principal = principal;
        this.interest = interest;
        this.totalAmount = principal.add(interest);
        this.status = "DUE";
    }

    public UUID getId() {
        return id;
    }

    public UUID getLoanApplicationId() {
        return loanApplicationId;
    }

    public int getInstallmentNumber() {
        return installmentNumber;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public BigDecimal getPrincipal() {
        return principal;
    }

    public BigDecimal getInterest() {
        return interest;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public String getStatus() {
        return status;
    }
}
