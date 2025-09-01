package com.training.feedbacktool.dto;

public record UserAnswerDTO(
                Long questionId,
                String questionText,
                String questionType,
                String answerText,
                Integer ratingValue // For rating questions (0-5)
) {
}