package com.rajvardhan.lending.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final UserRepository repository;
    private final JwtService jwtService;
    private final PasswordEncoder encoder;

    public AuthController(UserRepository repository, JwtService jwtService, PasswordEncoder encoder) {
        this.repository = repository;
        this.jwtService = jwtService;
        this.encoder = encoder;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public TokenResponse register(@Valid @RequestBody RegisterRequest request) {
        String cleanEmail = request.email().toLowerCase().trim();
        if (repository.existsByEmailIgnoreCase(cleanEmail)) {
            throw new IllegalArgumentException("Email already registered");
        }
        String userRole = (request.role() != null && !request.role().isBlank())
                ? request.role().toUpperCase().trim() : "CUSTOMER";
        User user = repository.save(new User(cleanEmail, encoder.encode(request.password()), userRole));
        return new TokenResponse(jwtService.generate(user));
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest request) {
        String cleanEmail = request.email().toLowerCase().trim();
        User user = repository.findByEmailIgnoreCase(cleanEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
        if (!user.isEnabled() || !encoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        return new TokenResponse(jwtService.generate(user));
    }

    @GetMapping("/me")
    public Map<String, Object> me(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new IllegalArgumentException("User not authenticated");
        }
        User user = repository.findById(UUID.fromString(auth.getName()))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return Map.of(
                "id", user.getId().toString(),
                "email", user.getEmail(),
                "role", user.getRole(),
                "enabled", user.isEnabled()
        );
    }

    public static class RegisterRequest {
        @Email
        @NotBlank
        private String email;

        @NotBlank
        @Size(min = 8, max = 72)
        private String password;

        private String role;

        public RegisterRequest() {
        }

        public RegisterRequest(String email, String password) {
            this(email, password, "CUSTOMER");
        }

        public RegisterRequest(String email, String password, String role) {
            this.email = email;
            this.password = password;
            this.role = role != null && !role.isBlank() ? role : "CUSTOMER";
        }

        public String email() {
            return email;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String password() {
            return password;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public String role() {
            return role;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }
    }

    public static class LoginRequest {
        @Email
        @NotBlank
        private String email;

        @NotBlank
        private String password;

        public LoginRequest() {
        }

        public LoginRequest(String email, String password) {
            this.email = email;
            this.password = password;
        }

        public String email() {
            return email;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String password() {
            return password;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    public static class TokenResponse {
        private String accessToken;

        public TokenResponse() {
        }

        public TokenResponse(String accessToken) {
            this.accessToken = accessToken;
        }

        public String accessToken() {
            return accessToken;
        }

        public String getAccessToken() {
            return accessToken;
        }

        public void setAccessToken(String accessToken) {
            this.accessToken = accessToken;
        }
    }
}
