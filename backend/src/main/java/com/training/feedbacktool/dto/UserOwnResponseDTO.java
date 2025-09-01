package com.training.feedbacktool.dto;

import java.time.Instant;
import java.util.List;

public record UserOwnResponseDTO(
        Long responseId,
        Long surveyId,
        Instant submittedAt,
        Integer completionTimeSeconds,
        List<UserAnswerDTO> answers) {
}