package com.rajvardhan.lending.notification;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class EventConsumer {
    private final NotificationRepository repo;

    public EventConsumer(NotificationRepository repo) {
        this.repo = repo;
    }

    @KafkaListener(topics = "loan.events", groupId = "notification-service", containerFactory = "loanKafkaListenerContainerFactory")
    public void loan(LoanEvent e) {
        if (e == null) return;
        String eventType = e.type() != null ? e.type() : "LOAN_EVENT";
        String aggregateId = e.loanId() != null ? e.loanId().toString() : "";
        String recipient = e.customerId() != null ? e.customerId().toString() : "";
        repo.save(new Notification(eventType, aggregateId, "IN_APP", recipient));
    }

    @KafkaListener(topics = "payment.events", groupId = "notification-service", containerFactory = "paymentKafkaListenerContainerFactory")
    public void payment(PaymentEvent e) {
        if (e == null) return;
        String eventType = e.type() != null ? e.type() : "PAYMENT_EVENT";
        String aggregateId = e.paymentId() != null ? e.paymentId().toString() : "";
        String recipient = e.customerId() != null ? e.customerId().toString() : "";
        repo.save(new Notification(eventType, aggregateId, "IN_APP", recipient));
    }
}