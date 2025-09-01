package com.training.feedbacktool.dto;

import java.util.List;

public record PublicQuestionDTO(
        Long id,
        String type,            // "text", "long_text", "rating", "multiple_choice"
        String questionText,
        Integer orderNumber,
        List<String> options    // for multiple_choice; null otherwise
) {}
