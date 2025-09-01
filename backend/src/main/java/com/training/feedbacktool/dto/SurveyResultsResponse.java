package com.training.feedbacktool.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record SurveyResultsResponse(
                Long surveyId,
                String surveyTitle,
                String surveyDescription,
                Instant surveyCreatedAt,
                int totalResponses,
                int totalQuestions,
                List<QuestionResultDTO> questionResults,
                List<RespondentDTO> respondents) {

        public record QuestionResultDTO(
                        Long questionId,
                        String questionText,
                        String questionType,
                        Integer orderNumber,
                        Boolean required,
                        int totalAnswers,
                        double completionRate, // percentage of respondents who answered this question
                        List<AnswerSummaryDTO> answers,
                        QuestionAnalyticsDTO analytics) {
        }

        public record QuestionAnalyticsDTO(
                        // For RATING questions
                        Double averageRating,
                        Double medianRating,
                        Integer minRating,
                        Integer maxRating,
                        Map<String, Integer> ratingDistribution, // "1" -> 5, "2" -> 10, etc.

                        // For MULTIPLE_CHOICE, RADIO, DROPDOWN questions
                        Map<String, Integer> optionCounts, // option -> count
                        Map<String, Double> optionPercentages, // option -> percentage
                        String mostPopularOption,
                        String leastPopularOption,

                        // For TEXT, LONG_TEXT questions
                        Integer averageTextLength,
                        Integer minTextLength,
                        Integer maxTextLength,
                        List<String> commonKeywords, // most frequent words (optional)

                        // For all question types
                        Map<String, Object> customMetrics // extensible for future analytics
        ) {
        }

        public record AnswerSummaryDTO(
                        Long answerId,
                        String answerText,
                        Integer ratingValue, // For rating questions (0-5)
                        Instant submittedAt,
                        RespondentInfoDTO respondent) {
        }

        public record RespondentDTO(
                        String respondentId, // "user_123" or "anonymous_1", "anonymous_2" etc.
                        String name,
                        String email,
                        boolean isAnonymous,
                        int totalAnswersSubmitted,
                        Instant firstSubmissionAt,
                        List<ResponseDetailDTO> responses) {
        }

        public record ResponseDetailDTO(
                        Long questionId,
                        String questionText,
                        String answerText,
                        Integer ratingValue, // For rating questions (0-5)
                        Instant submittedAt) {
        }

        public record RespondentInfoDTO(
                        String respondentId,
                        String name,
                        String email,
                        boolean isAnonymous) {
        }
}