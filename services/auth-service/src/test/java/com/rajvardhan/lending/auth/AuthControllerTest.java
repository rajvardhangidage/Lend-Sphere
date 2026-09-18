package com.rajvardhan.lending.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private UserRepository repository;

    @Mock
    private JwtService jwtService;

    private AuthController controller;
    private final org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder encoder = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();

    @BeforeEach
    void setUp() {
        controller = new AuthController(repository, jwtService, encoder);
    }

    @Test
    void testRegisterSuccess() {
        AuthController.RegisterRequest req = new AuthController.RegisterRequest("newuser@example.com", "Password123");
        when(repository.existsByEmailIgnoreCase("newuser@example.com")).thenReturn(false);
        when(repository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generate(any(User.class))).thenReturn("mock-token");

        AuthController.TokenResponse resp = controller.register(req);

        assertNotNull(resp);
        assertEquals("mock-token", resp.accessToken());
        verify(repository).save(any(User.class));
    }

    @Test
    void testRegisterExistingEmailThrowsException() {
        AuthController.RegisterRequest req = new AuthController.RegisterRequest("existing@example.com", "Password123");
        when(repository.existsByEmailIgnoreCase("existing@example.com")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> controller.register(req));
        verify(repository, never()).save(any());
    }

    @Test
    void testLoginSuccess() {
        org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder encoder = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
        User user = new User("user@example.com", encoder.encode("ValidPassword"), "CUSTOMER");

        when(repository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        when(jwtService.generate(user)).thenReturn("mock-token");

        AuthController.LoginRequest req = new AuthController.LoginRequest("user@example.com", "ValidPassword");
        AuthController.TokenResponse resp = controller.login(req);

        assertEquals("mock-token", resp.accessToken());
    }

    @Test
    void testLoginInvalidPasswordThrowsException() {
        org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder encoder = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
        User user = new User("user@example.com", encoder.encode("ValidPassword"), "CUSTOMER");

        when(repository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));

        AuthController.LoginRequest req = new AuthController.LoginRequest("user@example.com", "WrongPassword");
        assertThrows(IllegalArgumentException.class, () -> controller.login(req));
    }
}
