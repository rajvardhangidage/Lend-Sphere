package com.rajvardhan.lending.customer;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customers")
public class CustomerController {
    private final CustomerRepository repo;

    public CustomerController(CustomerRepository repo) {
        this.repo = repo;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerResponse create(@Valid @RequestBody CreateCustomerRequest request, Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new IllegalArgumentException("User not authenticated");
        }
        UUID userId = UUID.fromString(auth.getName());
        if (repo.findByUserId(userId).isPresent()) throw new IllegalArgumentException("Customer already exists");
        Customer c = repo.save(new Customer(userId, request.fullName(), request.phone(), request.dateOfBirth()));
        return toResponse(c);
    }

    @GetMapping("/me")
    public CustomerResponse me(Authentication auth) {
        if (auth == null || auth.getName() == null) throw new IllegalArgumentException("User not authenticated");
        return repo.findByUserId(UUID.fromString(auth.getName())).map(this::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Customer profile not found"));
    }

    @GetMapping("/{id}")
    public CustomerResponse getById(@PathVariable UUID id) {
        return repo.findById(id).map(this::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
    }

    private CustomerResponse toResponse(Customer c) {
        return new CustomerResponse(c.getId(), c.getFullName(), c.getPhone(), c.getDateOfBirth(), c.getKycStatus());
    }

    public static class CreateCustomerRequest {
        @NotBlank
        private String fullName;
        private String phone;
        private LocalDate dateOfBirth;

        public CreateCustomerRequest() {
        }

        public CreateCustomerRequest(String fullName, String phone, LocalDate dateOfBirth) {
            this.fullName = fullName;
            this.phone = phone;
            this.dateOfBirth = dateOfBirth;
        }

        public String fullName() {
            return fullName;
        }

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String phone() {
            return phone;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public LocalDate dateOfBirth() {
            return dateOfBirth;
        }

        public LocalDate getDateOfBirth() {
            return dateOfBirth;
        }

        public void setDateOfBirth(LocalDate dateOfBirth) {
            this.dateOfBirth = dateOfBirth;
        }
    }

    public static class CustomerResponse {
        private UUID id;
        private String fullName;
        private String phone;
        private LocalDate dateOfBirth;
        private String kycStatus;

        public CustomerResponse() {
        }

        public CustomerResponse(UUID id, String fullName, String phone, LocalDate dateOfBirth, String kycStatus) {
            this.id = id;
            this.fullName = fullName;
            this.phone = phone;
            this.dateOfBirth = dateOfBirth;
            this.kycStatus = kycStatus;
        }

        public UUID id() {
            return id;
        }

        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public String fullName() {
            return fullName;
        }

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String phone() {
            return phone;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public LocalDate dateOfBirth() {
            return dateOfBirth;
        }

        public LocalDate getDateOfBirth() {
            return dateOfBirth;
        }

        public void setDateOfBirth(LocalDate dateOfBirth) {
            this.dateOfBirth = dateOfBirth;
        }

        public String kycStatus() {
            return kycStatus;
        }

        public String getKycStatus() {
            return kycStatus;
        }

        public void setKycStatus(String kycStatus) {
            this.kycStatus = kycStatus;
        }
    }
}
