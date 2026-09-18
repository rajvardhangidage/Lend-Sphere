package com.rajvardhan.lending.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private static final String SECRET = "0123456789012345678901234567890123456789";
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, 30);
    }

    @Test
    void testGenerateTokenContainsExpectedClaims() {
        User user = new User("test@example.com", "hashed_password", "CUSTOMER");
        String token = jwtService.generate(user);

        assertNotNull(token);

        Claims claims = Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8)))
                .build()
                .parseSignedClaims(token)
                .getPayload();

        assertEquals(user.getId().toString(), claims.getSubject());
        assertEquals("test@example.com", claims.get("email", String.class));
        assertEquals("CUSTOMER", claims.get("role", String.class));
        assertNotNull(claims.getExpiration());
        assertNotNull(claims.getIssuedAt());
    }

    @Test
    void testSecretTooShortThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> new JwtService("short-secret", 30));
    }
}
