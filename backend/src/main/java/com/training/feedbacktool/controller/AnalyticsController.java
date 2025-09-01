package com.training.feedbacktool.controller;

import com.training.feedbacktool.common.ApiResponse;
import com.training.feedbacktool.service.AnalyticsService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')") // Admin only for all analytics endpoints
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /**
     * Get response trends over time (last 30 days)
     */
    @GetMapping("/response-trends")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getResponseTrends(
            @RequestParam(defaultValue = "30") int days) {
        try {
            List<Map<String, Object>> trends = analyticsService.getResponseTrends(days);
            ApiResponse<List<Map<String, Object>>> response = ApiResponse.success(trends,
                    "Response trends retrieved successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse<List<Map<String, Object>>> response = ApiResponse.error(
                    "Failed to retrieve response trends: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Get recent activity (last 50 activities)
     */
    @GetMapping("/recent-activity")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRecentActivity(
            @RequestParam(defaultValue = "5") int limit) {
        try {
            List<Map<String, Object>> activities = analyticsService.getRecentActivity(limit);
            ApiResponse<List<Map<String, Object>>> response = ApiResponse.success(activities,
                    "Recent activity retrieved successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse<List<Map<String, Object>>> response = ApiResponse.error(
                    "Failed to retrieve recent activity: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Get dashboard overview stats
     */
    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardOverview() {
        try {
            Map<String, Object> overview = analyticsService.getDashboardOverview();
            ApiResponse<Map<String, Object>> response = ApiResponse.success(overview,
                    "Dashboard overview retrieved successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse<Map<String, Object>> response = ApiResponse.error(
                    "Failed to retrieve dashboard overview: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Get recent responses with detailed information for admin dashboard
     */
    @GetMapping("/recent-responses")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRecentResponses(
            @RequestParam(defaultValue = "5") int limit) {
        try {
            List<Map<String, Object>> recentResponses = analyticsService.getRecentResponses(limit);
            ApiResponse<List<Map<String, Object>>> response = ApiResponse.success(recentResponses,
                    "Recent responses retrieved successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse<List<Map<String, Object>>> response = ApiResponse.error(
                    "Failed to retrieve recent responses: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Get survey performance metrics
     */
    @GetMapping("/survey-performance")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSurveyPerformance() {
        try {
            List<Map<String, Object>> performance = analyticsService.getSurveyPerformance();
            ApiResponse<List<Map<String, Object>>> response = ApiResponse.success(performance,
                    "Survey performance metrics retrieved successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse<List<Map<String, Object>>> response = ApiResponse.error(
                    "Failed to retrieve survey performance metrics: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }
}