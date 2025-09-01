package com.training.feedbacktool.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public record UpdateSurveyRequest(
                @NotBlank @Size(max = 150) String title,
                @Size(max = 2000) String description,
                Boolean active,
                Instant endDate,
                @Valid List<CreateQuestionRequest> questions) {
}