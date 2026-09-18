package com.rajvardhan.lending.loan;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface LoanApplicationRepository extends JpaRepository<LoanApplication, UUID> {
    List<LoanApplication> findByCustomerId(UUID customerId);
}
