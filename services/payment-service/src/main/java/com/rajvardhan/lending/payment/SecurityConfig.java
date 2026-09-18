package com.rajvardhan.lending.payment;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.*;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
class JwtFilter extends OncePerRequestFilter {
    private final String secret;

    JwtFilter(@Value("${app.jwt.secret:${JWT_SECRET:change-me-in-development-only-change-me-in-production}}") String secret) {
        this.secret = secret;
    }

    protected void doFilterInternal(HttpServletRequest r, HttpServletResponse s, FilterChain c) throws ServletException, IOException {
        String h = r.getHeader("Authorization");
        if (h != null && h.startsWith("Bearer ")) try {
            Claims x = Jwts.parser().verifyWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8))).build().parseSignedClaims(h.substring(7)).getPayload();
            String role = x.get("role", String.class);
            String authority = "ROLE_CUSTOMER";
            if (role != null && !role.isBlank()) {
                authority = role.startsWith("ROLE_") ? role : "ROLE_" + role;
            }
            SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(x.getSubject(), null, List.of(new SimpleGrantedAuthority(authority))));
        } catch (Exception ignored) {
        }
        c.doFilter(r, s);
    }
}

@Configuration
public class SecurityConfig {
    @Bean
    SecurityFilterChain security(HttpSecurity h, JwtFilter f) throws Exception {
        h.csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(org.springframework.security.config.http.SessionCreationPolicy.STATELESS))
                .addFilterBefore(f, UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(a -> a.requestMatchers(
                        "/actuator/**", "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/error"
                ).permitAll().anyRequest().authenticated());
        return h.build();
    }
}