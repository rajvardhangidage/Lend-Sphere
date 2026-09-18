package com.rajvardhan.lending.payment;

import java.math.BigDecimal;
import java.util.Objects;
import java.util.UUID;

public class PaymentEvent {
    private String type;
    private UUID paymentId;
    private UUID loanId;
    private UUID customerId;
    private BigDecimal amount;

    public PaymentEvent() {
    }

    public PaymentEvent(String type, UUID paymentId, UUID loanId, UUID customerId, BigDecimal amount) {
        this.type = type;
        this.paymentId = paymentId;
        this.loanId = loanId;
        this.customerId = customerId;
        this.amount = amount;
    }

    // Record-style accessors for backward compatibility
    public String type() {
        return type;
    }

    public UUID paymentId() {
        return paymentId;
    }

    public UUID loanId() {
        return loanId;
    }

    public UUID customerId() {
        return customerId;
    }

    public BigDecimal amount() {
        return amount;
    }

    // Standard JavaBeans getters and setters
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public UUID getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(UUID paymentId) {
        this.paymentId = paymentId;
    }

    public UUID getLoanId() {
        return loanId;
    }

    public void setLoanId(UUID loanId) {
        this.loanId = loanId;
    }

    public UUID getCustomerId() {
        return customerId;
    }

    public void setCustomerId(UUID customerId) {
        this.customerId = customerId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PaymentEvent that = (PaymentEvent) o;
        return Objects.equals(type, that.type) &&
                Objects.equals(paymentId, that.paymentId) &&
                Objects.equals(loanId, that.loanId) &&
                Objects.equals(customerId, that.customerId) &&
                Objects.equals(amount, that.amount);
    }

    @Override
    public int hashCode() {
        return Objects.hash(type, paymentId, loanId, customerId, amount);
    }

    @Override
    public String toString() {
        return "PaymentEvent[" +
                "type=" + type + ", " +
                "paymentId=" + paymentId + ", " +
                "loanId=" + loanId + ", " +
                "customerId=" + customerId + ", " +
                "amount=" + amount + ']';
    }
}