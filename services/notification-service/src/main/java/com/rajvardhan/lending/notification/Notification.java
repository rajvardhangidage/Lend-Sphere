package com.rajvardhan.lending.notification;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notifications")
public class Notification {
    @Id
    private UUID id;
    @Column(name = "event_type")
    private String eventType;
    @Column(name = "aggregate_id")
    private String aggregateId;
    private String channel;
    private String recipient;
    private String status;
    @Column(name = "created_at")
    private Instant createdAt;

    protected Notification() {
    }

    public Notification(String e, String a, String c, String r) {
        id = UUID.randomUUID();
        eventType = e;
        aggregateId = a;
        channel = c;
        recipient = r;
        status = "PROCESSED";
        createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getEventType() {
        return eventType;
    }

    public String getAggregateId() {
        return aggregateId;
    }

    public String getChannel() {
        return channel;
    }

    public String getRecipient() {
        return recipient;
    }

    public String getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}