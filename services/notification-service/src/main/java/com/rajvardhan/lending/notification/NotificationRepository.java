package com.rajvardhan.lending.notification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByRecipient(String recipient);

    List<Notification> findByRecipientOrderByCreatedAtDesc(String recipient);

    List<Notification> findAllByOrderByCreatedAtDesc();
}