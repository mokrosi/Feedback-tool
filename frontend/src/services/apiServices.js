import { apiClient } from "../utils/apiClient";

/**
 * Survey service layer - encapsulates all survey-related API operations
 * Provides a clean interface for components to interact with survey APIs
 */
export class SurveyService {
  static baseUrl = "/surveys";

  /**
   * Get all surveys (admin view with statistics)
   */
  static async getAllSurveys() {
    const response = await apiClient.get(`${this.baseUrl}/admin`);
    return apiClient.extractData(response);
  }

  /**
   * Get basic survey list
   */
  static async getSurveyList() {
    const response = await apiClient.get(this.baseUrl);
    return apiClient.extractData(response);
  }

  /**
   * Get public survey (for respondents)
   */
  static async getPublicSurvey(surveyId) {
    const response = await apiClient.get(`${this.baseUrl}/${surveyId}/public`);
    return apiClient.extractData(response);
  }

  /**
   * Get survey for editing (admin only)
   */
  static async getSurvey(surveyId) {
    const response = await apiClient.get(`${this.baseUrl}/${surveyId}`);
    return apiClient.extractData(response);
  }

  /**
   * Get survey results (admin only)
   */
  static async getSurveyResults(surveyId) {
    const response = await apiClient.get(`${this.baseUrl}/${surveyId}/results`);
    return apiClient.extractData(response);
  }

  /**
   * Create a new survey
   */
  static async createSurvey(surveyData) {
    const response = await apiClient.post(this.baseUrl, surveyData);
    return apiClient.extractData(response);
  }

  /**
   * Update an existing survey
   */
  static async updateSurvey(surveyId, surveyData) {
    const response = await apiClient.put(
      `${this.baseUrl}/${surveyId}`,
      surveyData
    );
    return apiClient.extractData(response);
  }

  /**
   * Delete a survey
   */
  static async deleteSurvey(surveyId) {
    const response = await apiClient.delete(`${this.baseUrl}/${surveyId}`);
    return apiClient.extractData(response);
  }

  /**
   * Get survey statistics
   */
  static async getSurveyStats(surveyId) {
    const response = await apiClient.get(`${this.baseUrl}/${surveyId}/stats`);
    return apiClient.extractData(response);
  }

  /**
   * Submit survey response (public endpoint)
   */
  static async submitResponse(surveyId, responseData) {
    const response = await apiClient.post(
      `/public/surveys/${surveyId}/responses`,
      responseData
    );
    return apiClient.extractData(response);
  }

  /**
   * Get survey responses (admin only)
   */
  static async getSurveyResponses(surveyId) {
    const response = await apiClient.get(`/responses/survey/${surveyId}`);
    return apiClient.extractData(response);
  }

  /**
   * Filter surveys by status
   */
  static filterByStatus(surveys, status) {
    if (!status || status === "ALL") {
      return surveys;
    }
    return surveys.filter((survey) => survey.status === status);
  }

  /**
   * Calculate survey statistics from survey list
   */
  static calculateStats(surveys) {
    const totalSurveys = surveys.length;
    const activeSurveys = surveys.filter((s) => s.status === "ACTIVE").length;
    const totalResponses = surveys.reduce(
      (sum, s) => sum + (s.totalResponses || 0),
      0
    );
    const avgCompletionRate =
      totalSurveys > 0
        ? Math.round(
            surveys.reduce((sum, s) => sum + (s.completionRate || 0), 0) /
              totalSurveys
          )
        : 0;

    // Calculate recent statistics
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const newSurveysThisMonth = surveys.filter((s) => {
      const createdDate = new Date(s.createdAt);
      return (
        createdDate.getMonth() === currentMonth &&
        createdDate.getFullYear() === currentYear
      );
    }).length;

    return {
      totalSurveys,
      activeSurveys,
      totalResponses,
      avgCompletionRate,
      newSurveysThisMonth,
      // Mock some additional stats that would need backend calculation
      responsesThisWeek: Math.floor(totalResponses * 0.2),
      responsesLastWeek: Math.floor(totalResponses * 0.15),
    };
  }

  /**
   * Group surveys by status for charts
   */
  static groupByStatus(surveys) {
    const statusCounts = surveys.reduce((acc, survey) => {
      acc[survey.status] = (acc[survey.status] || 0) + 1;
      return acc;
    }, {});

    return [
      { name: "Active", value: statusCounts.ACTIVE || 0, color: "#43e97b" },
      { name: "Inactive", value: statusCounts.INACTIVE || 0, color: "#ff6b6b" },
      { name: "Draft", value: statusCounts.DRAFT || 0, color: "#feca57" },
    ].filter((item) => item.value > 0);
  }

  /**
   * Format survey data for display
   */
  static formatSurvey(survey) {
    return {
      ...survey,
      formattedCreatedAt: this.formatDate(survey.createdAt),
      formattedUpdatedAt: this.formatDate(survey.updatedAt),
      statusDisplay: this.formatStatus(survey.status),
      completionDisplay: `${survey.completionRate || 0}%`,
      responsesSummary: `${survey.totalResponses || 0} responses`,
    };
  }

  /**
   * Format date for display
   */
  static formatDate(dateString) {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  /**
   * Format status for display
   */
  static formatStatus(status) {
    const statusMap = {
      ACTIVE: "Active",
      INACTIVE: "Inactive",
      DRAFT: "Draft",
    };
    return statusMap[status] || status;
  }

  /**
   * Validate survey data before submission
   */
  static validateSurvey(surveyData) {
    const errors = {};

    if (!surveyData.title || surveyData.title.trim().length === 0) {
      errors.title = "Survey title is required";
    } else if (surveyData.title.length > 200) {
      errors.title = "Survey title must be 200 characters or less";
    }

    if (!surveyData.description || surveyData.description.trim().length === 0) {
      errors.description = "Survey description is required";
    } else if (surveyData.description.length > 1000) {
      errors.description = "Survey description must be 1000 characters or less";
    }

    if (!surveyData.status) {
      errors.status = "Survey status is required";
    } else if (!["ACTIVE", "INACTIVE", "DRAFT"].includes(surveyData.status)) {
      errors.status = "Invalid survey status";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Export survey data (placeholder for future implementation)
   */
  static async exportSurvey(surveyId, format = "csv") {
    // This would typically call a backend endpoint for export
    throw new Error("Export functionality not yet implemented");
  }

  /**
   * Duplicate a survey
   */
  static async duplicateSurvey(surveyId) {
    // This would need a backend endpoint
    throw new Error("Duplicate functionality not yet implemented");
  }
}

/**
 * Response service layer - encapsulates response-related API operations
 */
export class ResponseService {
  static baseUrl = "/responses";

  /**
   * Get all responses
   */
  static async getAllResponses() {
    const response = await apiClient.get(`${this.baseUrl}/list`);
    return apiClient.extractData(response);
  }

  /**
   * Get responses for a specific survey
   */
  static async getResponsesBySurvey(surveyId) {
    const response = await apiClient.get(`${this.baseUrl}/survey/${surveyId}`);
    return apiClient.extractData(response);
  }

  /**
   * Get response count
   */
  static async getResponseCount() {
    const response = await apiClient.get(`${this.baseUrl}/count`);
    return apiClient.extractData(response);
  }

  /**
   * Get response by ID
   */
  static async getResponse(responseId) {
    const response = await apiClient.get(`${this.baseUrl}/${responseId}`);
    return apiClient.extractData(response);
  }

  /**
   * Delete response
   */
  static async deleteResponse(responseId) {
    const response = await apiClient.delete(`${this.baseUrl}/${responseId}`);
    return apiClient.extractData(response);
  }

  /**
   * Submit survey response (public)
   */
  static async submitSurveyResponse(surveyId, responseData) {
    const response = await apiClient.post(
      `/public/surveys/${surveyId}/responses`,
      responseData
    );
    return apiClient.extractData(response);
  }

  /**
   * Export responses
   */
  static async exportResponses(surveyId, format = "csv") {
    // This would typically call a backend endpoint for export
    throw new Error("Export functionality not yet implemented");
  }

  /**
   * Format response data for display
   */
  static formatResponse(response) {
    return {
      ...response,
      formattedSubmittedAt: this.formatDate(response.submittedAt),
      respondentDisplay: response.respondentName || "Anonymous User",
      answerCount: response.answers?.length || 0,
    };
  }

  /**
   * Format date for display
   */
  static formatDate(dateString) {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

/**
 * Authentication service layer - encapsulates auth-related API operations
 */
export class AuthService {
  static baseUrl = "/auth";

  /**
   * Request password reset
   */
  static async requestPasswordReset(email) {
    const response = await apiClient.post(`${this.baseUrl}/forgot-password`, {
      email,
    });
    return apiClient.extractData(response);
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token, newPassword) {
    const response = await apiClient.post(`${this.baseUrl}/reset-password`, {
      token,
      newPassword,
    });
    return apiClient.extractData(response);
  }

  /**
   * Validate reset token
   */
  static async validateResetToken(token) {
    const response = await apiClient.get(
      `${this.baseUrl}/reset-password/validate/${token}`
    );
    return apiClient.extractData(response);
  }
}

/**
 * User service layer - encapsulates user-related API operations
 */
export class UserService {
  static baseUrl = "/users";

  /**
   * Create a new user
   */
  static async createUser(userData) {
    const response = await apiClient.post(`${this.baseUrl}/create`, userData);
    return apiClient.extractData(response);
  }

  /**
   * Get user profile (if endpoint exists)
   */
  static async getUserProfile(userId) {
    const response = await apiClient.get(`${this.baseUrl}/${userId}`);
    return apiClient.extractData(response);
  }

  /**
   * Update user profile
   */
  static async updateUser(userId, userData) {
    const response = await apiClient.put(`${this.baseUrl}/${userId}`, userData);
    return apiClient.extractData(response);
  }

  /**
   * Validate user data
   */
  static validateUser(userData) {
    const errors = {};

    if (!userData.name || userData.name.trim().length === 0) {
      errors.name = "Name is required";
    } else if (userData.name.length > 100) {
      errors.name = "Name must be 100 characters or less";
    }

    if (!userData.email || userData.email.trim().length === 0) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!userData.password || userData.password.length === 0) {
      errors.password = "Password is required";
    } else if (userData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Get user dashboard data
   */
  static async getUserDashboard() {
    const response = await apiClient.get(`${this.baseUrl}/dashboard`);
    return apiClient.extractData(response);
  }

  /**
   * Get user's response to a specific survey
   */
  static async getUserResponse(surveyId) {
    const response = await apiClient.get(
      `${this.baseUrl}/responses/survey/${surveyId}`
    );
    return apiClient.extractData(response);
  }
}

/**
 * Analytics service layer - encapsulates analytics-related API operations
 */
export class AnalyticsService {
  static baseUrl = "/analytics";

  /**
   * Get response trends data
   */
  static async getResponseTrends(days = 30) {
    const response = await apiClient.get(
      `${this.baseUrl}/response-trends?days=${days}`
    );
    return apiClient.extractData(response);
  }

  /**
   * Get recent activity
   */
  static async getRecentActivity(limit = 50) {
    const response = await apiClient.get(
      `${this.baseUrl}/recent-activity?limit=${limit}`
    );
    return apiClient.extractData(response);
  }

  /**
   * Get recent responses with detailed information
   */
  static async getRecentResponses(limit = 5) {
    const response = await apiClient.get(
      `${this.baseUrl}/recent-responses?limit=${limit}`
    );
    return apiClient.extractData(response);
  }

  /**
   * Get dashboard overview
   */
  static async getDashboardOverview() {
    const response = await apiClient.get(`${this.baseUrl}/overview`);
    return apiClient.extractData(response);
  }

  /**
   * Get survey performance metrics
   */
  static async getSurveyPerformance() {
    const response = await apiClient.get(`${this.baseUrl}/survey-performance`);
    return apiClient.extractData(response);
  }
}
