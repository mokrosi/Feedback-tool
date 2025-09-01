package com.training.feedbacktool.service;

import com.training.feedbacktool.dto.SurveyResultsResponse;
import com.training.feedbacktool.dto.SurveyResultsResponse.QuestionResultDTO;
import com.training.feedbacktool.dto.SurveyResultsResponse.QuestionAnalyticsDTO;
import com.training.feedbacktool.dto.SurveyResultsResponse.RespondentDTO;
import com.training.feedbacktool.dto.SurveyResultsResponse.ResponseDetailDTO;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Service
public class ExportService {

    private final SurveyService surveyService;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public ExportService(SurveyService surveyService) {
        this.surveyService = surveyService;
    }

    /**
     * Export survey analysis as CSV
     */
    public byte[] exportSurveyAnalysisAsCSV(Long surveyId, ExportOptions options) throws IOException {
        if (surveyId == null) {
            throw new IllegalArgumentException("Survey ID cannot be null");
        }
        if (options == null) {
            throw new IllegalArgumentException("Export options cannot be null");
        }

        SurveyResultsResponse results = surveyService.getSurveyResults(surveyId);
        if (results == null) {
            throw new IllegalArgumentException("Survey results not found for ID: " + surveyId);
        }

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
                OutputStreamWriter writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8);
                PrintWriter csvWriter = new PrintWriter(writer)) {

            // Survey Overview Section
            csvWriter.println("=== SURVEY ANALYSIS REPORT ===");
            csvWriter.println();
            csvWriter.println(
                    formatCSVRow("Survey Title", results.surveyTitle() != null ? results.surveyTitle() : "N/A"));
            csvWriter.println(formatCSVRow("Survey Description",
                    results.surveyDescription() != null ? results.surveyDescription() : "N/A"));
            csvWriter.println(formatCSVRow("Survey ID", String.valueOf(results.surveyId())));
            csvWriter.println(formatCSVRow("Created At",
                    results.surveyCreatedAt() != null
                            ? results.surveyCreatedAt().atZone(java.time.ZoneId.systemDefault()).format(DATE_FORMATTER)
                            : "N/A"));
            csvWriter.println(formatCSVRow("Total Responses", String.valueOf(results.totalResponses())));
            csvWriter.println(formatCSVRow("Total Questions", String.valueOf(results.totalQuestions())));
            csvWriter.println(formatCSVRow("Overall Completion Rate",
                    results.totalQuestions() > 0
                            ? String.format("%.1f%%",
                                    (double) results.totalResponses() / results.totalQuestions() * 100)
                            : "N/A"));
            csvWriter.println();
            csvWriter.println();

            // Question Analysis Section
            if (options.includeQuestionAnalysis() && results.questionResults() != null) {
                exportQuestionAnalysisToCSV(csvWriter, results.questionResults());
            }

            // Respondent Data Section
            if (options.includeRespondentData() && results.respondents() != null) {
                exportRespondentDataToCSV(csvWriter, results.respondents());
            }

            // Raw Response Data Section
            if (options.includeRawResponses() && results.respondents() != null) {
                exportRawResponsesToCSV(csvWriter, results.respondents());
            }

            csvWriter.flush();
            return outputStream.toByteArray();
        }
    }

    /**
     * Export question analysis to CSV
     */
    private void exportQuestionAnalysisToCSV(PrintWriter csvWriter,
            java.util.List<QuestionResultDTO> questionResults) {
        if (questionResults == null || questionResults.isEmpty()) {
            csvWriter.println("=== QUESTION ANALYSIS ===");
            csvWriter.println();
            csvWriter.println("No question data available");
            csvWriter.println();
            return;
        }

        csvWriter.println("=== QUESTION ANALYSIS ===");
        csvWriter.println(); // Question overview table
        csvWriter.println(formatCSVRow("Question ID", "Question Text", "Question Type", "Order", "Required",
                "Total Answers", "Completion Rate %", "Average Rating", "Most Popular Option"));

        for (QuestionResultDTO question : questionResults) {
            QuestionAnalyticsDTO analytics = question.analytics();
            csvWriter.println(formatCSVRow(
                    String.valueOf(question.questionId()),
                    cleanTextForCSV(question.questionText()),
                    question.questionType(),
                    String.valueOf(question.orderNumber()),
                    String.valueOf(question.required()),
                    String.valueOf(question.totalAnswers()),
                    String.format("%.1f", question.completionRate()),
                    analytics != null && analytics.averageRating() != null
                            ? String.format("%.2f", analytics.averageRating())
                            : "N/A",
                    analytics != null ? cleanTextForCSV(analytics.mostPopularOption()) : "N/A"));
        }

        csvWriter.println();

        // Detailed analytics for each question
        for (QuestionResultDTO question : questionResults) {
            csvWriter.println();
            csvWriter.println("--- Question " + question.orderNumber() + " Detailed Analysis ---");
            csvWriter.println(formatCSVRow("Question:", cleanTextForCSV(question.questionText())));
            csvWriter.println(formatCSVRow("Type:", question.questionType()));
            csvWriter.println();

            QuestionAnalyticsDTO analytics = question.analytics();
            if (analytics != null) {
                // Rating analytics
                if (analytics.averageRating() != null) {
                    csvWriter.println("Rating Statistics:");
                    csvWriter.println(formatCSVRow("Average Rating", String.format("%.2f", analytics.averageRating())));
                    csvWriter.println(formatCSVRow("Median Rating", String.valueOf(analytics.medianRating())));
                    csvWriter.println(formatCSVRow("Min Rating", String.valueOf(analytics.minRating())));
                    csvWriter.println(formatCSVRow("Max Rating", String.valueOf(analytics.maxRating())));

                    if (analytics.ratingDistribution() != null) {
                        csvWriter.println();
                        csvWriter.println("Rating Distribution:");
                        csvWriter.println(formatCSVRow("Rating", "Count", "Percentage"));
                        int totalRatings = analytics.ratingDistribution().values().stream()
                                .mapToInt(Integer::intValue).sum();
                        for (Map.Entry<String, Integer> entry : analytics.ratingDistribution().entrySet()) {
                            double percentage = totalRatings > 0 ? (double) entry.getValue() / totalRatings * 100 : 0.0;
                            csvWriter.println(formatCSVRow(entry.getKey(), String.valueOf(entry.getValue()),
                                    String.format("%.1f%%", percentage)));
                        }
                    }
                }

                // Multiple choice analytics
                if (analytics.optionCounts() != null && !analytics.optionCounts().isEmpty()) {
                    csvWriter.println();
                    csvWriter.println("Option Distribution:");
                    csvWriter.println(formatCSVRow("Option", "Count", "Percentage"));
                    for (Map.Entry<String, Integer> entry : analytics.optionCounts().entrySet()) {
                        Double percentage = analytics.optionPercentages() != null
                                ? analytics.optionPercentages().get(entry.getKey())
                                : null;
                        csvWriter.println(formatCSVRow(
                                cleanTextForCSV(entry.getKey()),
                                String.valueOf(entry.getValue()),
                                percentage != null ? String.format("%.1f%%", percentage) : "N/A"));
                    }
                }

                // Text analytics
                if (analytics.averageTextLength() != null) {
                    csvWriter.println();
                    csvWriter.println("Text Analysis:");
                    csvWriter.println(formatCSVRow("Average Length", String.valueOf(analytics.averageTextLength())));
                    csvWriter.println(formatCSVRow("Min Length", String.valueOf(analytics.minTextLength())));
                    csvWriter.println(formatCSVRow("Max Length", String.valueOf(analytics.maxTextLength())));

                    if (analytics.commonKeywords() != null && !analytics.commonKeywords().isEmpty()) {
                        csvWriter.println(
                                formatCSVRow("Common Keywords", String.join(", ", analytics.commonKeywords())));
                    }
                }
            }
            csvWriter.println();
        }
    }

    /**
     * Export respondent data to CSV
     */
    private void exportRespondentDataToCSV(PrintWriter csvWriter,
            java.util.List<RespondentDTO> respondents) {
        csvWriter.println();
        csvWriter.println("=== RESPONDENT ANALYSIS ===");
        csvWriter.println();

        if (respondents == null || respondents.isEmpty()) {
            csvWriter.println("No respondent data available");
            csvWriter.println();
            return;
        }

        // Summary statistics
        long authenticatedCount = respondents.stream().filter(r -> !r.isAnonymous()).count();
        long anonymousCount = respondents.stream().filter(RespondentDTO::isAnonymous).count();
        csvWriter.println(formatCSVRow("Total Respondents", String.valueOf(respondents.size())));
        csvWriter.println(formatCSVRow("Authenticated Users", String.valueOf(authenticatedCount)));
        csvWriter.println(formatCSVRow("Anonymous Users", String.valueOf(anonymousCount)));
        csvWriter.println(formatCSVRow("Authentication Rate",
                respondents.size() > 0
                        ? String.format("%.1f%%", (double) authenticatedCount / respondents.size() * 100)
                        : "N/A"));
        csvWriter.println();

        // Respondent details table
        csvWriter.println(formatCSVRow("Respondent ID", "Name", "Email", "Type", "Total Answers",
                "First Submission", "Response Count"));

        for (RespondentDTO respondent : respondents) {
            csvWriter.println(formatCSVRow(
                    respondent.respondentId(),
                    respondent.isAnonymous() ? "Anonymous" : cleanTextForCSV(respondent.name()),
                    respondent.isAnonymous() ? "N/A" : cleanTextForCSV(respondent.email()),
                    respondent.isAnonymous() ? "Anonymous" : "Authenticated",
                    String.valueOf(respondent.totalAnswersSubmitted()),
                    respondent.firstSubmissionAt() != null ? respondent.firstSubmissionAt()
                            .atZone(java.time.ZoneId.systemDefault()).format(DATE_FORMATTER) : "N/A",
                    String.valueOf(respondent.responses() != null ? respondent.responses().size() : 0)));
        }
        csvWriter.println();
    }

    /**
     * Export raw responses to CSV
     */
    private void exportRawResponsesToCSV(PrintWriter csvWriter,
            java.util.List<RespondentDTO> respondents) {
        csvWriter.println();
        csvWriter.println("=== RAW RESPONSE DATA ===");
        csvWriter.println();

        if (respondents == null || respondents.isEmpty()) {
            csvWriter.println("No response data available");
            return;
        }

        csvWriter.println(formatCSVRow("Respondent ID", "Respondent Name", "Respondent Email", "Question ID",
                "Question Text", "Answer Text", "Rating Value", "Submitted At"));
        for (RespondentDTO respondent : respondents) {
            if (respondent.responses() != null) {
                for (ResponseDetailDTO response : respondent.responses()) {
                    csvWriter.println(formatCSVRow(
                            respondent.respondentId(),
                            respondent.isAnonymous() ? "Anonymous" : cleanTextForCSV(respondent.name()),
                            respondent.isAnonymous() ? "N/A" : cleanTextForCSV(respondent.email()),
                            String.valueOf(response.questionId()),
                            cleanTextForCSV(response.questionText()),
                            cleanTextForCSV(response.answerText()),
                            response.ratingValue() != null ? String.valueOf(response.ratingValue()) : "N/A",
                            response.submittedAt() != null
                                    ? response.submittedAt().atZone(java.time.ZoneId.systemDefault())
                                            .format(DATE_FORMATTER)
                                    : "N/A"));
                }
            }
        }
    }

    /**
     * Format CSV row with proper escaping
     */
    private String formatCSVRow(String... values) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < values.length; i++) {
            if (i > 0)
                sb.append(",");
            sb.append(escapeCSVValue(values[i]));
        }
        return sb.toString();
    }

    /**
     * Escape CSV value (add quotes if necessary)
     */
    private String escapeCSVValue(String value) {
        if (value == null)
            return "\"\"";

        String cleaned = value.replaceAll("[\r\n]+", " ").trim();

        // If the value contains comma, quote, or newline, wrap in quotes and escape
        // internal quotes
        if (cleaned.contains(",") || cleaned.contains("\"") || cleaned.contains("\n") || cleaned.contains("\r")) {
            return "\"" + cleaned.replace("\"", "\"\"") + "\"";
        }

        return cleaned;
    }

    /**
     * Clean text for CSV output (remove line breaks, excessive whitespace)
     */
    private String cleanTextForCSV(String text) {
        if (text == null)
            return "";
        return text.replaceAll("[\r\n]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    /**
     * Export options configuration
     */
    public static class ExportOptions {
        private final boolean includeQuestionAnalysis;
        private final boolean includeRespondentData;
        private final boolean includeRawResponses;

        public ExportOptions(boolean includeQuestionAnalysis, boolean includeRespondentData,
                boolean includeRawResponses) {
            this.includeQuestionAnalysis = includeQuestionAnalysis;
            this.includeRespondentData = includeRespondentData;
            this.includeRawResponses = includeRawResponses;
        }

        public boolean includeQuestionAnalysis() {
            return includeQuestionAnalysis;
        }

        public boolean includeRespondentData() {
            return includeRespondentData;
        }

        public boolean includeRawResponses() {
            return includeRawResponses;
        }
    }
}