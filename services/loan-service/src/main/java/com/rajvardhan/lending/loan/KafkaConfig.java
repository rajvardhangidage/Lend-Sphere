package com.rajvardhan.lending.loan;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class KafkaConfig {
    @Bean
    NewTopic loanEvents() {
        return new NewTopic("loan.events", 3, (short) 1);
    }
}
