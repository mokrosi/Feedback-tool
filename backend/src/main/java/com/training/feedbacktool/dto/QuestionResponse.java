package com.training.feedbacktool.dto;

public record QuestionResponse(
                Long id,
                String type,
                String questionText,
                String optionsJson,
                Integer orderNumber,
                Boolean required) {
}