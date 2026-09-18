package com.rajvardhan.lending.notification;

import org.springframework.context.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.*;
import org.apache.kafka.common.serialization.StringDeserializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaConfig {
    @Value("${spring.kafka.bootstrap-servers:${KAFKA_BOOTSTRAP:localhost:9092}}")
    private String bootstrap;

    private <T> ConsumerFactory<String, T> cf(Class<T> type) {
        Map<String, Object> p = new HashMap<>();
        p.put(org.apache.kafka.clients.consumer.ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrap);
        p.put(org.apache.kafka.clients.consumer.ConsumerConfig.GROUP_ID_CONFIG, "notification-service");
        p.put(org.apache.kafka.clients.consumer.ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        p.put(org.apache.kafka.clients.consumer.ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        JsonDeserializer<T> d = new JsonDeserializer<>(type, false);
        d.addTrustedPackages("*");
        return new DefaultKafkaConsumerFactory<>(p, new StringDeserializer(), d);
    }

    @Bean
    ConcurrentKafkaListenerContainerFactory<String, LoanEvent> loanKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, LoanEvent> f = new ConcurrentKafkaListenerContainerFactory<>();
        f.setConsumerFactory(cf(LoanEvent.class));
        return f;
    }

    @Bean
    ConcurrentKafkaListenerContainerFactory<String, PaymentEvent> paymentKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, PaymentEvent> f = new ConcurrentKafkaListenerContainerFactory<>();
        f.setConsumerFactory(cf(PaymentEvent.class));
        return f;
    }
}