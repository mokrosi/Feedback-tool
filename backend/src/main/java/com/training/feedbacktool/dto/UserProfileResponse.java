package com.training.feedbacktool.dto;

import java.time.Instant;

/**
 * DTO for user profile information returned by /auth/me endpoint
 */
public record UserProfileResponse(
        Long userId,
        String email,
        String name,
        String role,
        Instant createdAt) {
}