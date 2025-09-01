package com.training.feedbacktool.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank(message = "Email is required") @Email(message = "Email should be valid") String email,

        @NotBlank(message = "Password is required") @Size(min = 6, message = "Password must be at least 6 characters") String password,

        @NotBlank(message = "Name is required") String name

// Removed role field - will use default from service
) {
}