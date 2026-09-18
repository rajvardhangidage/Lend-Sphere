package com.rajvardhan.lending.customer;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerControllerTest {

    @Mock
    private CustomerRepository repo;

    @Mock
    private Authentication auth;

    private CustomerController controller;

    @BeforeEach
    void setUp() {
        controller = new CustomerController(repo);
    }

    @Test
    void testCreateCustomerSuccess() {
        UUID userId = UUID.randomUUID();
        when(auth.getName()).thenReturn(userId.toString());
        when(repo.findByUserId(userId)).thenReturn(Optional.empty());
        when(repo.save(any(Customer.class))).thenAnswer(inv -> inv.getArgument(0));

        CustomerController.CreateCustomerRequest request = new CustomerController.CreateCustomerRequest(
                "Jane Doe", "1234567890", LocalDate.of(1995, 5, 20)
        );

        CustomerController.CustomerResponse response = controller.create(request, auth);

        assertNotNull(response);
        assertEquals("Jane Doe", response.fullName());
        assertEquals("1234567890", response.phone());
        assertEquals("PENDING", response.kycStatus());
        verify(repo).save(any(Customer.class));
    }

    @Test
    void testCreateDuplicateCustomerThrowsException() {
        UUID userId = UUID.randomUUID();
        when(auth.getName()).thenReturn(userId.toString());
        when(repo.findByUserId(userId)).thenReturn(Optional.of(new Customer(userId, "Jane", "123", LocalDate.now())));

        CustomerController.CreateCustomerRequest request = new CustomerController.CreateCustomerRequest(
                "Jane Doe", "1234567890", LocalDate.now()
        );

        assertThrows(IllegalArgumentException.class, () -> controller.create(request, auth));
        verify(repo, never()).save(any());
    }

    @Test
    void testGetMeSuccess() {
        UUID userId = UUID.randomUUID();
        when(auth.getName()).thenReturn(userId.toString());
        Customer customer = new Customer(userId, "Jane Doe", "1234567890", LocalDate.of(1995, 5, 20));
        when(repo.findByUserId(userId)).thenReturn(Optional.of(customer));

        CustomerController.CustomerResponse response = controller.me(auth);

        assertNotNull(response);
        assertEquals("Jane Doe", response.fullName());
    }

    @Test
    void testGetMeNotFoundThrowsException() {
        UUID userId = UUID.randomUUID();
        when(auth.getName()).thenReturn(userId.toString());
        when(repo.findByUserId(userId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> controller.me(auth));
    }

    @Test
    void testGetByIdSuccess() {
        UUID customerId = UUID.randomUUID();
        Customer customer = new Customer(UUID.randomUUID(), "John Smith", "9876543210", LocalDate.of(1990, 1, 1));
        when(repo.findById(customerId)).thenReturn(Optional.of(customer));

        CustomerController.CustomerResponse response = controller.getById(customerId);
        assertNotNull(response);
        assertEquals("John Smith", response.fullName());
    }
}
