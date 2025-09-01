package com.training.feedbacktool.dto;

import java.time.Instant;

public record SurveyResponse(
                Long id,
                String title,
                String description,
                String status,
                Instant createdAt,
                Instant updatedAt,
                Instant endDate) {
}
