package com.training.feedbacktool.dto;

import java.time.Instant;
import java.util.List;

public record PublicSurveyResponse(
                Long id,
                String title,
                String description,
                String status,
                Instant createdAt,
                Instant updatedAt,
                Instant endDate,
                List<QuestionResponse> questions) {
}