package com.rajvardhan.lending.loan;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/v1/loans")
public class LoanController {
    private final LoanService service;
    private final LoanApplicationRepository repo;

    public LoanController(LoanService service, LoanApplicationRepository repo) {
        this.service = service;
        this.repo = repo;
    }

    @GetMapping("/products")
    public List<LoanProduct> products() {
        return service.activeProducts();
    }

    @PostMapping("/applications")
    @ResponseStatus(HttpStatus.CREATED)
    public LoanApplication apply(@Valid @RequestBody ApplyRequest r, Authentication auth) {
        if (auth == null || auth.getName() == null) throw new IllegalArgumentException("User not authenticated");
        return service.apply(UUID.fromString(auth.getName()), r.productId(), r.amount(), r.tenureMonths());
    }

    @GetMapping("/applications")
    public List<LoanApplication> mine(Authentication auth) {
        if (auth == null || auth.getName() == null) throw new IllegalArgumentException("User not authenticated");
        return repo.findByCustomerId(UUID.fromString(auth.getName()));
    }

    @GetMapping("/applications/all")
    public List<LoanApplication> all() {
        return service.allApplications();
    }

    @GetMapping({ "/{id}", "/applications/{id}" })
    public LoanApplication getById(@PathVariable UUID id) {
        return service.getLoan(id);
    }

    @GetMapping({ "/{id}/schedule", "/applications/{id}/schedule" })
    public List<Repayment> schedule(@PathVariable UUID id) {
        return service.getSchedule(id);
    }

    @PostMapping({ "/{id}/approve", "/applications/{id}/approve" })
    public LoanApplication approve(@PathVariable UUID id) {
        return service.approve(id);
    }

    @PostMapping({ "/{id}/reject", "/applications/{id}/reject" })
    public LoanApplication reject(@PathVariable UUID id) {
        return service.reject(id);
    }

    public static class ApplyRequest {
        @NotNull
        private UUID productId;

        @NotNull
        @DecimalMin("0.01")
        private BigDecimal amount;

        @Min(1)
        private int tenureMonths;

        public ApplyRequest() {
        }

        public ApplyRequest(UUID productId, BigDecimal amount, int tenureMonths) {
            this.productId = productId;
            this.amount = amount;
            this.tenureMonths = tenureMonths;
        }

        public UUID productId() {
            return productId;
        }

        public UUID getProductId() {
            return productId;
        }

        public void setProductId(UUID productId) {
            this.productId = productId;
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

        public int tenureMonths() {
            return tenureMonths;
        }

        public int getTenureMonths() {
            return tenureMonths;
        }

        public void setTenureMonths(int tenureMonths) {
            this.tenureMonths = tenureMonths;
        }
    }
}
