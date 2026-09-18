package com.rajvardhan.lending.notification;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventConsumerTest {

    @Mock
    private NotificationRepository repo;

    private EventConsumer consumer;

    @BeforeEach
    void setUp() {
        consumer = new EventConsumer(repo);
    }

    @Test
    void testConsumeLoanEventSavesNotification() {
        UUID loanId = UUID.randomUUID();
        UUID customerId = UUID.randomUUID();
        LoanEvent event = new LoanEvent("LOAN_APPROVED", loanId, customerId, BigDecimal.valueOf(50000));

        consumer.loan(event);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(repo).save(captor.capture());

        Notification saved = captor.getValue();
        assertNotNull(saved);
        assertEquals("LOAN_APPROVED", saved.getEventType());
        assertEquals(loanId.toString(), saved.getAggregateId());
        assertEquals("IN_APP", saved.getChannel());
        assertEquals(customerId.toString(), saved.getRecipient());
        assertEquals("PROCESSED", saved.getStatus());
        assertNotNull(saved.getCreatedAt());
    }

    @Test
    void testConsumePaymentEventSavesNotification() {
        UUID paymentId = UUID.randomUUID();
        UUID loanId = UUID.randomUUID();
        UUID customerId = UUID.randomUUID();
        PaymentEvent event = new PaymentEvent("PAYMENT_SUCCESS", paymentId, loanId, customerId, BigDecimal.valueOf(5000));

        consumer.payment(event);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(repo).save(captor.capture());

        Notification saved = captor.getValue();
        assertNotNull(saved);
        assertEquals("PAYMENT_SUCCESS", saved.getEventType());
        assertEquals(paymentId.toString(), saved.getAggregateId());
        assertEquals(customerId.toString(), saved.getRecipient());
    }
}
