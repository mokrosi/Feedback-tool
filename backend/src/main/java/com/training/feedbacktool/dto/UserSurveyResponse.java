package com.training.feedbacktool.dto;

import java.time.Instant;

public record UserSurveyResponse(
        Long id,
        String title,
        String description,
        String status,
        Instant deadline,
        Instant completedDate,
        String estimatedTime,
        Integer responses) {
}