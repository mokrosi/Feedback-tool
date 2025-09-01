package com.training.feedbacktool.dto;

import java.time.Instant;

public record UserResponse(
        Long id,
        String email,
        String name,
        String role,
        Instant createdAt) {
}
