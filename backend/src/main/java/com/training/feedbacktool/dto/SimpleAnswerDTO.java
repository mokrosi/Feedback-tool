package com.training.feedbacktool.dto;

import java.time.Instant;

public record SimpleAnswerDTO(
        Long id,
        String answerText,
        Instant createdAt,
        Long questionId,
        String questionText,
        String questionType,
        String respondentName,
        String respondentEmail,
        boolean isAnonymous) {
}