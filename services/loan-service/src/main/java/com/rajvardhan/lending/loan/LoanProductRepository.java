package com.rajvardhan.lending.loan;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface LoanProductRepository extends JpaRepository<LoanProduct, UUID> {
    List<LoanProduct> findByActiveTrue();
}
