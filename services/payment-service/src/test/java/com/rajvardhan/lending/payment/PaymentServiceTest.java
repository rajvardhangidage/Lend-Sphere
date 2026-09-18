package com.rajvardhan.lending.payment;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository repo;

    @Mock
    private KafkaTemplate<String, PaymentEvent> kafka;

    private PaymentService service;

    @BeforeEach
    void setUp() {
        service = new PaymentService(repo, kafka);
    }

    @Test
    void testPayNewPaymentSuccess() {
        UUID customerId = UUID.randomUUID();
        UUID loanId = UUID.randomUUID();
        String key = "idem-key-123";
        BigDecimal amount = BigDecimal.valueOf(5000);

        when(repo.findByIdempotencyKey(key)).thenReturn(Optional.empty());
        when(repo.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        Payment payment = service.pay(customerId, loanId, amount, key);

        assertNotNull(payment);
        assertEquals(customerId, payment.getCustomerId());
        assertEquals(loanId, payment.getLoanId());
        assertEquals(amount, payment.getAmount());
        assertEquals("SUCCESS", payment.getStatus());
        assertEquals(key, payment.getIdempotencyKey());

        ArgumentCaptor<PaymentEvent> captor = ArgumentCaptor.forClass(PaymentEvent.class);
        verify(kafka).send(eq("payment.events"), eq(payment.getId().toString()), captor.capture());
        assertEquals("PAYMENT_SUCCESS", captor.getValue().type());
        assertEquals(payment.getId(), captor.getValue().paymentId());
    }

    @Test
    void testPayExistingIdempotencyKeyReturnsExistingWithoutRecreating() {
        UUID customerId = UUID.randomUUID();
        UUID loanId = UUID.randomUUID();
        String key = "idem-key-existing";
        Payment existingPayment = new Payment(loanId, customerId, BigDecimal.valueOf(2500), key);

        when(repo.findByIdempotencyKey(key)).thenReturn(Optional.of(existingPayment));

        Payment result = service.pay(customerId, loanId, BigDecimal.valueOf(2500), key);

        assertSame(existingPayment, result);
        verify(repo, never()).save(any());
        verify(kafka, never()).send(anyString(), anyString(), any());
    }

    @Test
    void testPayNegativeOrZeroAmountThrowsException() {
        assertThrows(IllegalArgumentException.class, () ->
                service.pay(UUID.randomUUID(), UUID.randomUUID(), BigDecimal.ZERO, "key-0"));
        assertThrows(IllegalArgumentException.class, () ->
                service.pay(UUID.randomUUID(), UUID.randomUUID(), BigDecimal.valueOf(-100), "key-neg"));
    }

    @Test
    void testByCustomerReturnsList() {
        UUID customerId = UUID.randomUUID();
        when(repo.findByCustomerId(customerId)).thenReturn(List.of(new Payment(UUID.randomUUID(), customerId, BigDecimal.valueOf(100), "k1")));

        List<Payment> list = service.byCustomer(customerId);
        assertEquals(1, list.size());
    }
}
