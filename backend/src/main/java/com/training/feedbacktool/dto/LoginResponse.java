package com.training.feedbacktool.dto;

public record LoginResponse(
        String token,
        String email,
        String name,
        String role,
        Long userId
) {}