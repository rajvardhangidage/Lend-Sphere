package com.rajvardhan.lending.loan;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoanControllerTest {

    @Mock
    private LoanService service;

    @Mock
    private LoanApplicationRepository repo;

    @Mock
    private Authentication auth;

    private LoanController controller;

    @BeforeEach
    void setUp() {
        controller = new LoanController(service, repo);
    }

    @Test
    void testProductsReturnsList() {
        LoanProduct p = new LoanProduct(UUID.randomUUID(), "Personal Loan", BigDecimal.valueOf(5000), BigDecimal.valueOf(50000), BigDecimal.valueOf(10.0), 12, true);
        when(service.activeProducts()).thenReturn(List.of(p));

        List<LoanProduct> result = controller.products();
        assertEquals(1, result.size());
        assertEquals("Personal Loan", result.get(0).getName());
    }

    @Test
    void testApplyCallsService() {
        UUID customerId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        when(auth.getName()).thenReturn(customerId.toString());

        LoanApplication loan = new LoanApplication(customerId, productId, BigDecimal.valueOf(10000), 12);
        when(service.apply(customerId, productId, BigDecimal.valueOf(10000), 12)).thenReturn(loan);

        LoanController.ApplyRequest req = new LoanController.ApplyRequest(productId, BigDecimal.valueOf(10000), 12);
        LoanApplication result = controller.apply(req, auth);

        assertNotNull(result);
        assertEquals(customerId, result.getCustomerId());
    }

    @Test
    void testScheduleReturnsList() {
        UUID loanId = UUID.randomUUID();
        Repayment r = new Repayment(loanId, 1, java.time.LocalDate.now(), BigDecimal.valueOf(1000), BigDecimal.valueOf(100));
        when(service.getSchedule(loanId)).thenReturn(List.of(r));

        List<Repayment> schedule = controller.schedule(loanId);
        assertEquals(1, schedule.size());
        assertEquals(1, schedule.get(0).getInstallmentNumber());
    }
}
