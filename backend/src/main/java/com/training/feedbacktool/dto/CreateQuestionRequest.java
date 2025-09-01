package com.training.feedbacktool.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateQuestionRequest(
                @NotBlank @Size(max = 50) String type,
                @NotBlank @Size(max = 1000) String questionText,
                String optionsJson,
                @NotNull Integer orderNumber,
                Boolean required) {
}