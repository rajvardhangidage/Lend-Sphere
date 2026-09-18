package com.rajvardhan.lending.payment;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.*;

@Configuration
public class KafkaConfig {
    @Bean
    NewTopic paymentEvents() {
        return new NewTopic("payment.events", 3, (short) 1);
    }
}