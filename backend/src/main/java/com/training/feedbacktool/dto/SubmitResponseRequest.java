package com.training.feedbacktool.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record SubmitResponseRequest(
                @NotNull(message = "answers are required") List<AnswerDTO> answers,
                Integer completionTimeSeconds // Time taken to complete the survey in seconds
) {
        public record AnswerDTO(
                        @NotNull Long questionId,
                        String answerValue, // text, selected option, etc. (nullable for rating questions)
                        Integer ratingValue // numeric rating 0-5 (nullable for non-rating questions)
        ) {
        }
}
