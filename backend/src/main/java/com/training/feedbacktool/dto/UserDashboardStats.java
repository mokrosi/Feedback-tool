package com.training.feedbacktool.dto;

public record UserDashboardStats(
                int completedSurveysCount,
                Double averageCompletionTimeMinutes,
                Integer totalTimeSpentMinutes) {
}