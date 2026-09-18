package com.rajvardhan.lending.gateway;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class GatewayRouteTest {

    @Test
    void testApplicationClassExists() {
        GatewayApplication app = new GatewayApplication();
        assertNotNull(app);
    }
}
