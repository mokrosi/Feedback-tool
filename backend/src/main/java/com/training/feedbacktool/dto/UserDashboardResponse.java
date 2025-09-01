package com.training.feedbacktool.dto;

import java.util.List;

public record UserDashboardResponse(
        UserDashboardStats stats,
        List<UserSurveyResponse> pendingSurveys,
        List<UserSurveyResponse> completedSurveys) {
}