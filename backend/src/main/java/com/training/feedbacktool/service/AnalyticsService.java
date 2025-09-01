package com.training.feedbacktool.service;

import com.training.feedbacktool.entity.Answer;
import com.training.feedbacktool.entity.Response;
import com.training.feedbacktool.entity.Survey;
import com.training.feedbacktool.repository.AnswersRepository;
import com.training.feedbacktool.repository.ResponsesRepository;
import com.training.feedbacktool.repository.SurveyRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final AnswersRepository answersRepository;
    private final SurveyRepository surveyRepository;
    private final ResponsesRepository responsesRepository;

    public AnalyticsService(AnswersRepository answersRepository,
            SurveyRepository surveyRepository,
            ResponsesRepository responsesRepository) {
        this.answersRepository = answersRepository;
        this.surveyRepository = surveyRepository;
        this.responsesRepository = responsesRepository;
    }

    /**
     * Get response trends over time
     */
    public List<Map<String, Object>> getResponseTrends(int days) {
        List<Map<String, Object>> trends = new ArrayList<>();

        // Get all answers from the last 'days' days
        Instant startDate = Instant.now().minus(days, ChronoUnit.DAYS);
        List<Answer> recentAnswers = answersRepository.findAll().stream()
                .filter(answer -> answer.getCreatedAt().isAfter(startDate))
                .collect(Collectors.toList());

        // Group answers by date
        Map<LocalDate, Long> answersByDate = recentAnswers.stream()
                .collect(Collectors.groupingBy(
                        answer -> answer.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate(),
                        Collectors.counting()));

        // Create trend data for each day
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM d");
        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            Long responseCount = answersByDate.getOrDefault(date, 0L);

            Map<String, Object> dayData = new HashMap<>();
            dayData.put("date", date.format(formatter));
            dayData.put("responses", responseCount);
            dayData.put("fullDate", date.toString());

            trends.add(dayData);
        }

        return trends;
    }

    /**
     * Get recent activity
     */
    public List<Map<String, Object>> getRecentActivity(int limit) {
        List<Map<String, Object>> activities = new ArrayList<>();

        try {
            // Get recent surveys
            List<Survey> recentSurveys = surveyRepository.findAll().stream()
                    .sorted((s1, s2) -> s2.getCreatedAt().compareTo(s1.getCreatedAt()))
                    .limit(limit / 2)
                    .collect(Collectors.toList());

            // Get recent answers/responses
            List<Answer> recentAnswers = answersRepository.findAll().stream()
                    .sorted((a1, a2) -> a2.getCreatedAt().compareTo(a1.getCreatedAt()))
                    .limit(limit / 2)
                    .collect(Collectors.toList());

            // Add survey activities
            for (Survey survey : recentSurveys) {
                Map<String, Object> activity = new HashMap<>();
                activity.put("id", survey.getId());
                activity.put("action", determineActivityType(survey));
                activity.put("survey", survey.getTitle());
                activity.put("time", formatTimeAgo(survey.getCreatedAt()));
                activity.put("timestamp", survey.getCreatedAt());
                activity.put("type", "survey");
                activities.add(activity);
            }

            // Add response activities
            Map<Long, Long> responseCounts = new HashMap<>();
            for (Answer answer : recentAnswers) {
                Long surveyId = answer.getQuestion().getSurvey().getId();
                responseCounts.merge(surveyId, 1L, Long::sum);
            }

            for (Answer answer : recentAnswers) {
                if (activities.size() >= limit)
                    break;

                String surveyTitle = answer.getQuestion().getSurvey().getTitle();

                Map<String, Object> activity = new HashMap<>();
                activity.put("id", answer.getId());
                activity.put("action", "New response");
                activity.put("survey", surveyTitle);
                activity.put("time", formatTimeAgo(answer.getCreatedAt()));
                activity.put("timestamp", answer.getCreatedAt());
                activity.put("type", "response");
                activities.add(activity);
            }

            // Sort all activities by timestamp and limit
            activities.sort((a1, a2) -> {
                Instant t1 = (Instant) a1.get("timestamp");
                Instant t2 = (Instant) a2.get("timestamp");
                return t2.compareTo(t1);
            });

            return activities.stream().limit(limit).collect(Collectors.toList());

        } catch (Exception e) {
            // Return fallback data if there's an error
            return createFallbackActivity();
        }
    }

    /**
     * Get dashboard overview statistics
     */
    public Map<String, Object> getDashboardOverview() {
        Map<String, Object> overview = new HashMap<>();

        try {
            // Basic counts
            long totalSurveys = surveyRepository.count();
            long activeSurveys = surveyRepository.findAll().stream()
                    .filter(s -> "ACTIVE".equals(s.getStatus()))
                    .count();
            long totalAnswers = answersRepository.count();

            // Response trends
            Instant oneWeekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
            Instant twoWeeksAgo = Instant.now().minus(14, ChronoUnit.DAYS);

            long responsesThisWeek = answersRepository.findAll().stream()
                    .filter(a -> a.getCreatedAt().isAfter(oneWeekAgo))
                    .count();

            long responsesLastWeek = answersRepository.findAll().stream()
                    .filter(a -> a.getCreatedAt().isAfter(twoWeeksAgo) && a.getCreatedAt().isBefore(oneWeekAgo))
                    .count();

            // New surveys this month
            LocalDate firstOfMonth = LocalDate.now().withDayOfMonth(1);
            Instant startOfMonth = firstOfMonth.atStartOfDay(ZoneId.systemDefault()).toInstant();

            long newSurveysThisMonth = surveyRepository.findAll().stream()
                    .filter(s -> s.getCreatedAt().isAfter(startOfMonth))
                    .count();

            overview.put("totalSurveys", totalSurveys);
            overview.put("activeSurveys", activeSurveys);
            overview.put("totalResponses", totalAnswers);
            overview.put("responsesThisWeek", responsesThisWeek);
            overview.put("responsesLastWeek", responsesLastWeek);
            overview.put("newSurveysThisMonth", newSurveysThisMonth);

        } catch (Exception e) {
            // Return default values if there's an error
            overview.put("totalSurveys", 0L);
            overview.put("activeSurveys", 0L);
            overview.put("totalResponses", 0L);
            overview.put("responsesThisWeek", 0L);
            overview.put("responsesLastWeek", 0L);
            overview.put("newSurveysThisMonth", 0L);
        }

        return overview;
    }

    /**
     * Get survey performance metrics
     */
    public List<Map<String, Object>> getSurveyPerformance() {
        List<Map<String, Object>> performance = new ArrayList<>();

        try {
            List<Survey> surveys = surveyRepository.findAll();

            for (Survey survey : surveys) {
                Map<String, Object> metrics = new HashMap<>();

                // Count responses for this survey
                long responseCount = answersRepository.findBySurveyId(survey.getId()).size();

                // Calculate basic metrics
                metrics.put("surveyId", survey.getId());
                metrics.put("surveyTitle", survey.getTitle());
                metrics.put("totalResponses", responseCount);
                metrics.put("status", survey.getStatus());
                metrics.put("createdAt", survey.getCreatedAt());

                performance.add(metrics);
            }

            // Sort by response count descending
            performance.sort((a, b) -> {
                Long countA = (Long) a.get("totalResponses");
                Long countB = (Long) b.get("totalResponses");
                return countB.compareTo(countA);
            });

        } catch (Exception e) {
            // Return empty list if there's an error
            return new ArrayList<>();
        }

        return performance;
    }

    /**
     * Get recent responses with detailed information for admin dashboard
     */
    public List<Map<String, Object>> getRecentResponses(int limit) {
        System.out.println("Starting getRecentResponses with limit: " + limit);

        try {
            // Get recent responses from the database
            List<Response> recentResponses = responsesRepository.findAll().stream()
                    .sorted((r1, r2) -> r2.getCreatedAt().compareTo(r1.getCreatedAt()))
                    .limit(limit)
                    .collect(Collectors.toList());

            System.out.println("Found " + recentResponses.size() + " responses in database");

            if (recentResponses.isEmpty()) {
                return createFallbackRecentResponses();
            }

            List<Map<String, Object>> result = new ArrayList<>();

            for (Response response : recentResponses) {
                Map<String, Object> responseData = new HashMap<>();

                // Basic response info
                responseData.put("responseId", response.getId());
                responseData.put("surveyId", response.getSurvey().getId());
                responseData.put("surveyName", response.getSurvey().getTitle());
                responseData.put("submittedAt", response.getCreatedAt());

                // User info (handle anonymous case)
                if (response.getUser() != null) {
                    responseData.put("userName", response.getUser().getName());
                    responseData.put("isAnonymous", false);
                } else {
                    responseData.put("userName", "Anonymous User");
                    responseData.put("isAnonymous", true);
                }

                // Get answers for this response to calculate completion
                List<Answer> answers = answersRepository.findBySurveyId(response.getSurvey().getId());

                // Filter answers by this response (if there's a way to link them)
                // For now, we'll estimate based on survey questions
                Survey survey = response.getSurvey();
                long totalQuestions = survey.getQuestions() != null ? survey.getQuestions().size() : 0;

                // Count answers from the user for this survey
                // This is a simplified calculation - you might need to adjust based on your
                // data model
                long answeredQuestions = answers.size() > 0 ? Math.min(answers.size(), totalQuestions) : 0;

                double completionPercentage = totalQuestions > 0 ? (double) answeredQuestions / totalQuestions * 100
                        : 0;

                responseData.put("totalQuestions", totalQuestions);
                responseData.put("answeredQuestions", answeredQuestions);
                responseData.put("completionPercentage", Math.round(completionPercentage));
                responseData.put("completionTimeSeconds", response.getCompletionTimeSeconds());

                // Format time
                responseData.put("formattedTime", formatTimeAgo(response.getCreatedAt()));
                responseData.put("formattedDate", formatDate(response.getCreatedAt()));

                result.add(responseData);
            }

            return result;

        } catch (Exception e) {
            System.err.println("Error in getRecentResponses: " + e.getMessage());
            e.printStackTrace();
            return createFallbackRecentResponses();
        }
    }

    private String formatDate(Instant instant) {
        return instant.atZone(ZoneId.systemDefault())
                .format(DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' HH:mm"));
    }

    private List<Map<String, Object>> createFallbackRecentResponses() {
        List<Map<String, Object>> fallback = new ArrayList<>();

        Map<String, Object> response = new HashMap<>();
        response.put("surveyId", 0L);
        response.put("surveyName", "No responses yet");
        response.put("userName", "System");
        response.put("isAnonymous", false);
        response.put("submittedAt", Instant.now());
        response.put("completionPercentage", 0);
        response.put("totalQuestions", 0L);
        response.put("answeredQuestions", 0L);
        response.put("formattedTime", "just now");
        response.put("formattedDate", formatDate(Instant.now()));

        fallback.add(response);
        return fallback;
    }

    private String determineActivityType(Survey survey) {
        if ("ACTIVE".equals(survey.getStatus())) {
            return "Survey activated";
        } else if ("DRAFT".equals(survey.getStatus())) {
            return "Survey created";
        } else {
            return "Survey updated";
        }
    }

    private String formatTimeAgo(Instant instant) {
        Instant now = Instant.now();
        long minutes = ChronoUnit.MINUTES.between(instant, now);
        long hours = ChronoUnit.HOURS.between(instant, now);
        long days = ChronoUnit.DAYS.between(instant, now);

        if (minutes < 1) {
            return "just now";
        } else if (minutes < 60) {
            return minutes + " minute" + (minutes == 1 ? "" : "s") + " ago";
        } else if (hours < 24) {
            return hours + " hour" + (hours == 1 ? "" : "s") + " ago";
        } else if (days < 7) {
            return days + " day" + (days == 1 ? "" : "s") + " ago";
        } else {
            long weeks = days / 7;
            return weeks + " week" + (weeks == 1 ? "" : "s") + " ago";
        }
    }

    /**
     * Calculate average completion time for a survey in seconds
     */
    public Double getAverageCompletionTime(Long surveyId) {
        try {
            List<Response> responses = responsesRepository.findBySurveyId(surveyId);

            List<Integer> completionTimes = responses.stream()
                    .map(Response::getCompletionTimeSeconds)
                    .filter(time -> time != null && time > 0)
                    .collect(Collectors.toList());

            if (completionTimes.isEmpty()) {
                return null;
            }

            return completionTimes.stream()
                    .mapToInt(Integer::intValue)
                    .average()
                    .orElse(0.0);
        } catch (Exception e) {
            System.err.println("Error calculating average completion time: " + e.getMessage());
            return null;
        }
    }

    /**
     * Format completion time in a human-readable format
     */
    public String formatCompletionTime(Double seconds) {
        if (seconds == null || seconds <= 0) {
            return "N/A";
        }

        if (seconds < 60) {
            return Math.round(seconds) + "s";
        } else if (seconds < 3600) {
            int minutes = (int) Math.round(seconds / 60);
            return minutes + "m " + Math.round(seconds % 60) + "s";
        } else {
            int hours = (int) (seconds / 3600);
            int minutes = (int) Math.round((seconds % 3600) / 60);
            return hours + "h " + minutes + "m";
        }
    }

    private List<Map<String, Object>> createFallbackActivity() {
        List<Map<String, Object>> fallback = new ArrayList<>();

        Map<String, Object> activity1 = new HashMap<>();
        activity1.put("id", 1);
        activity1.put("action", "New response");
        activity1.put("survey", "System initialized");
        activity1.put("time", "just now");
        activity1.put("type", "response");

        fallback.add(activity1);
        return fallback;
    }
}