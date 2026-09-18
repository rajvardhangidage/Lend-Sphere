package com.rajvardhan.lending.notification;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {
    private final NotificationRepository repository;

    public NotificationController(NotificationRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Notification> getAll(@RequestParam(required = false) String recipient) {
        if (recipient != null && !recipient.isBlank()) {
            return repository.findByRecipient(recipient.trim());
        }
        return repository.findAll();
    }

    public List<Notification> getAll() {
        return getAll(null);
    }

    @GetMapping("/recipient/{recipient}")
    public List<Notification> getByRecipient(@PathVariable String recipient) {
        return repository.findByRecipient(recipient.trim());
    }

    @GetMapping("/{id}")
    public Notification getById(@PathVariable UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
    }
}
