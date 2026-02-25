package com.dacsan.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket configuration for real-time notifications
 * 
 * Endpoints:
 * - /ws: SockJS connection endpoint
 * 
 * Destinations:
 * - /topic/vendor/{vendorId}/orders: Vendor subscribes for new orders
 * - /topic/customer/{customerId}/order-updates: Customer subscribes for status
 * updates
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register "/ws" endpoint for WebSocket connections
        // SockJS is used as fallback for browsers that don't support WebSocket
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Allow all origins for development
                .withSockJS(); // Enable SockJS fallback
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Enable a simple in-memory message broker
        // "/topic" is used for broadcasting messages (1-to-many)
        // "/queue" can be used for point-to-point messages (1-to-1)
        registry.enableSimpleBroker("/topic", "/queue");

        // Messages with "/app" prefix will be routed to @MessageMapping methods
        registry.setApplicationDestinationPrefixes("/app");
    }
}
