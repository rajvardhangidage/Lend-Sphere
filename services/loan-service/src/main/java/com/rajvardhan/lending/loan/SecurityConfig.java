package com.rajvardhan.lending.loan;

import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.*;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {
    @Bean
    SecurityFilterChain security(HttpSecurity http, JwtAuthenticationFilter jwt) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(org.springframework.security.config.http.SessionCreationPolicy.STATELESS))
                .addFilterBefore(jwt, UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(a -> a.requestMatchers(
                        "/actuator/**", "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/error",
                        "/api/v1/loans/products"
                ).permitAll()
                        .requestMatchers(
                                "/api/v1/loans/*/approve", "/api/v1/loans/*/reject",
                                "/api/v1/loans/applications/*/approve", "/api/v1/loans/applications/*/reject",
                                "/api/v1/loans/applications/all"
                        ).hasAnyRole("ADMIN", "LOAN_OFFICER")
                        .anyRequest().authenticated());
        return http.build();
    }
}
