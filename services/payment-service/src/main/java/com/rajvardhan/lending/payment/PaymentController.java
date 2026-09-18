package com.rajvardhan.lending.payment;

import jakarta.validation.*;
import jakarta.validation.constraints.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {
    private final PaymentService service;

    public PaymentController(PaymentService service) {
        this.service = service;
    }

    @PostMapping
    public Payment pay(@RequestHeader("Idempotency-Key") @NotBlank String key, @Valid @RequestBody Request r, Authentication a) {
        if (a == null || a.getName() == null) throw new IllegalArgumentException("User not authenticated");
        return service.pay(UUID.fromString(a.getName()), r.loanId(), r.amount(), key);
    }

    @GetMapping
    public List<Payment> mine(Authentication a) {
        if (a == null || a.getName() == null) throw new IllegalArgumentException("User not authenticated");
        return service.byCustomer(UUID.fromString(a.getName()));
    }

    @GetMapping("/{id}")
    public Payment getById(@PathVariable UUID id) {
        return service.getById(id);
    }

    public static class Request {
        @NotNull
        private UUID loanId;

        @NotNull
        @DecimalMin("0.01")
        private BigDecimal amount;

        public Request() {
        }

        public Request(UUID loanId, BigDecimal amount) {
            this.loanId = loanId;
            this.amount = amount;
        }

        public UUID loanId() {
            return loanId;
        }

        public UUID getLoanId() {
            return loanId;
        }

        public void setLoanId(UUID loanId) {
            this.loanId = loanId;
        }

        public BigDecimal amount() {
            return amount;
        }

        public BigDecimal getAmount() {
            return amount;
        }

        public void setAmount(BigDecimal amount) {
            this.amount = amount;
        }
    }
}