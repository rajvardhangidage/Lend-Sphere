package com.rajvardhan.lending.notification;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    @Mock
    private NotificationRepository repo;

    private NotificationController controller;

    @BeforeEach
    void setUp() {
        controller = new NotificationController(repo);
    }

    @Test
    void testGetAllReturnsList() {
        Notification n = new Notification("LOAN_APPROVED", "loan-1", "IN_APP", "cust-1");
        when(repo.findAll()).thenReturn(List.of(n));

        List<Notification> list = controller.getAll();
        assertEquals(1, list.size());
        assertEquals("LOAN_APPROVED", list.get(0).getEventType());
    }

    @Test
    void testGetByRecipientReturnsList() {
        Notification n = new Notification("PAYMENT_SUCCESS", "pay-1", "IN_APP", "cust-1");
        when(repo.findByRecipient("cust-1")).thenReturn(List.of(n));

        List<Notification> list = controller.getByRecipient("cust-1");
        assertEquals(1, list.size());
        assertEquals("cust-1", list.get(0).getRecipient());
    }
}
