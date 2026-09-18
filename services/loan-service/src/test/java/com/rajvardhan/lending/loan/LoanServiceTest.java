package com.rajvardhan.lending.loan;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.kafka.core.KafkaTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoanServiceTest {

    @Mock
    private LoanApplicationRepository loans;
    @Mock
    private LoanProductRepository products;
    @Mock
    private RepaymentRepository repayments;
    @Mock
    private KafkaTemplate<String, LoanEvent> kafka;
    @Mock
    private StringRedisTemplate redis;
    @Mock
    private ValueOperations<String, String> valueOps;

    private LoanService service;

    private LoanProduct activeProduct;

    @BeforeEach
    void setUp() {
        service = new LoanService(loans, products, repayments, kafka, redis);
        activeProduct = new LoanProduct(
                UUID.randomUUID(), "Micro Loan",
                BigDecimal.valueOf(5000), BigDecimal.valueOf(100000),
                BigDecimal.valueOf(12.0), 12, true
        );
    }

    @Test
    void testApplySuccess() {
        UUID customerId = UUID.randomUUID();
        when(products.findById(activeProduct.getId())).thenReturn(Optional.of(activeProduct));
        when(loans.save(any(LoanApplication.class))).thenAnswer(inv -> inv.getArgument(0));

        LoanApplication app = service.apply(customerId, activeProduct.getId(), BigDecimal.valueOf(20000), 6);

        assertNotNull(app);
        assertEquals(customerId, app.getCustomerId());
        assertEquals("PENDING", app.getStatus());
        assertEquals(BigDecimal.valueOf(20000), app.getAmount());
    }

    @Test
    void testApplyBelowMinAmountThrowsException() {
        when(products.findById(activeProduct.getId())).thenReturn(Optional.of(activeProduct));
        assertThrows(IllegalArgumentException.class, () ->
                service.apply(UUID.randomUUID(), activeProduct.getId(), BigDecimal.valueOf(1000), 6));
    }

    @Test
    void testApplyExceedsTenureThrowsException() {
        when(products.findById(activeProduct.getId())).thenReturn(Optional.of(activeProduct));
        assertThrows(IllegalArgumentException.class, () ->
                service.apply(UUID.randomUUID(), activeProduct.getId(), BigDecimal.valueOf(10000), 24));
    }

    @Test
    void testApproveGeneratesScheduleAndEmitsKafkaEvent() {
        UUID customerId = UUID.randomUUID();
        LoanApplication loan = new LoanApplication(customerId, activeProduct.getId(), BigDecimal.valueOf(12000), 12);
        when(loans.findById(loan.getId())).thenReturn(Optional.of(loan));
        when(products.findById(activeProduct.getId())).thenReturn(Optional.of(activeProduct));
        when(loans.save(any(LoanApplication.class))).thenAnswer(inv -> inv.getArgument(0));

        LoanApplication approved = service.approve(loan.getId());

        assertEquals("APPROVED", approved.getStatus());
        // Verify 12 repayments were saved
        verify(repayments, times(12)).save(any(Repayment.class));
        // Verify kafka event was sent
        ArgumentCaptor<LoanEvent> captor = ArgumentCaptor.forClass(LoanEvent.class);
        verify(kafka).send(eq("loan.events"), eq(loan.getId().toString()), captor.capture());
        assertEquals("LOAN_APPROVED", captor.getValue().type());
        assertEquals(loan.getId(), captor.getValue().loanId());
    }

    @Test
    void testApproveWithZeroInterestRate() {
        LoanProduct zeroInterestProduct = new LoanProduct(
                UUID.randomUUID(), "Interest Free Loan",
                BigDecimal.valueOf(1000), BigDecimal.valueOf(50000),
                BigDecimal.ZERO, 6, true
        );
        LoanApplication loan = new LoanApplication(UUID.randomUUID(), zeroInterestProduct.getId(), BigDecimal.valueOf(6000), 6);
        when(loans.findById(loan.getId())).thenReturn(Optional.of(loan));
        when(products.findById(zeroInterestProduct.getId())).thenReturn(Optional.of(zeroInterestProduct));
        when(loans.save(any(LoanApplication.class))).thenAnswer(inv -> inv.getArgument(0));

        LoanApplication approved = service.approve(loan.getId());
        assertEquals("APPROVED", approved.getStatus());
        verify(repayments, times(6)).save(any(Repayment.class));
    }

    @Test
    void testRejectEmitsKafkaEvent() {
        LoanApplication loan = new LoanApplication(UUID.randomUUID(), activeProduct.getId(), BigDecimal.valueOf(10000), 6);
        when(loans.findById(loan.getId())).thenReturn(Optional.of(loan));
        when(loans.save(any(LoanApplication.class))).thenAnswer(inv -> inv.getArgument(0));

        LoanApplication rejected = service.reject(loan.getId());

        assertEquals("REJECTED", rejected.getStatus());
        verify(kafka).send(eq("loan.events"), eq(loan.getId().toString()), any(LoanEvent.class));
    }

    @Test
    void testApproveNonPendingThrowsException() {
        LoanApplication loan = new LoanApplication(UUID.randomUUID(), activeProduct.getId(), BigDecimal.valueOf(10000), 6);
        loan.approve();
        when(loans.findById(loan.getId())).thenReturn(Optional.of(loan));

        assertThrows(IllegalArgumentException.class, () -> service.approve(loan.getId()));
    }
}
