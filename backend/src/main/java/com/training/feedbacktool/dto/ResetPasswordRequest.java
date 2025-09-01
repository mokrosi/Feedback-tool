package com.training.feedbacktool.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "Token is required") String token,

        @NotBlank(message = "Password is required") @Size(min = 6, message = "Password must be at least 6 characters long") String newPassword) {
}