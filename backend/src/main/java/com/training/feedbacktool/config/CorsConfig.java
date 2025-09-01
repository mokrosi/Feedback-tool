package com.training.feedbacktool.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Value("${cors.allowed.origins:*}")
    private String allowedOrigins;

    @Value("${cors.allowed.credentials:true}")
    private boolean allowCredentials;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Use environment-specific origins
        if ("*".equals(allowedOrigins)) {
            // Development: allow all origins with patterns
            configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        } else {
            // Production: use specific origins
            configuration.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        }

        // Allow specific HTTP methods
        configuration.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"));

        // Allow all headers
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // Allow credentials (important for cookies, authorization headers, etc.)
        configuration.setAllowCredentials(allowCredentials);

        // Expose headers that the frontend can access
        configuration.setExposedHeaders(Arrays.asList(
                "Access-Control-Allow-Origin",
                "Access-Control-Allow-Credentials",
                "Authorization",
                "Content-Type"));

        // How long the browser can cache the preflight response
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}