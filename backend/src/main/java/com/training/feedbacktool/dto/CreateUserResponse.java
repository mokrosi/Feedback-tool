package com.training.feedbacktool.dto;

public record CreateUserResponse(
        String token,
        String email,
        String name,
        String role,
        Long userId) {
}