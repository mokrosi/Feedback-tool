package com.training.feedbacktool.dto;

import java.time.Instant;

public record AdminSurveyResponse(
                Long id,
                String title,
                String description,
                String status,
                Instant createdAt,
                Instant updatedAt,
                Instant endDate,
                int totalQuestions,
                int totalResponses,
                int completionRate) {
}