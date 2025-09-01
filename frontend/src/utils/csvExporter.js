/**
 * CSV Export Utility
 * Handles exporting survey response data to CSV format
 */

/**
 * Convert data to CSV format
 * @param {Array} data - Array of objects to convert
 * @param {Array} headers - Array of header strings
 * @returns {string} CSV formatted string
 */
export const convertToCSV = (data, headers) => {
  if (!data || data.length === 0) {
    return "";
  }

  // Create CSV headers
  const csvHeaders = headers.join(",");

  // Create CSV rows
  const csvRows = data.map((row) => {
    return headers
      .map((header) => {
        const value = row[header] || "";
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const escaped = String(value).replace(/"/g, '""');
        return escaped.includes(",") ||
          escaped.includes('"') ||
          escaped.includes("\n")
          ? `"${escaped}"`
          : escaped;
      })
      .join(",");
  });

  return [csvHeaders, ...csvRows].join("\n");
};

/**
 * Download CSV file
 * @param {string} csvContent - CSV formatted string
 * @param {string} filename - Name of the file to download
 */
export const downloadCSV = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Format survey responses for CSV export
 * @param {Object} surveyData - Survey data object
 * @param {Object} responsesData - Responses data object
 * @returns {Object} Formatted data ready for CSV export
 */
export const formatSurveyDataForCSV = (surveyData, responsesData) => {
  if (!surveyData || !responsesData || !responsesData.responses) {
    return { data: [], headers: [] };
  }

  const { questions = [] } = surveyData;
  const { responses = [] } = responsesData;

  // Create headers
  const headers = [
    "Response ID",
    "Respondent Name",
    "Respondent Email",
    "Is Anonymous",
    "Submitted At",
    "Completion Status",
  ];

  // Add question headers
  questions.forEach((question, index) => {
    const questionNumber = question.orderNumber || index + 1;
    const questionText = question.questionText || `Question ${questionNumber}`;
    headers.push(`Q${questionNumber}: ${questionText}`);
  });

  // Format response data
  const formattedData = responses.map((response) => {
    const row = {
      "Response ID": response.responseId || "N/A",
      "Respondent Name": response.respondentName || "Anonymous",
      "Respondent Email": response.respondentEmail || "Not provided",
      "Is Anonymous": response.isAnonymous ? "Yes" : "No",
      "Submitted At": response.submittedAt
        ? new Date(response.submittedAt).toLocaleString()
        : "N/A",
      "Completion Status": response.isComplete ? "Complete" : "Incomplete",
    };

    // Add answers for each question
    questions.forEach((question, index) => {
      const questionNumber = question.orderNumber || index + 1;
      const questionText =
        question.questionText || `Question ${questionNumber}`;
      const headerKey = `Q${questionNumber}: ${questionText}`;

      // Find the answer for this question
      const answer = response.answers?.find(
        (ans) =>
          ans.questionId === question.id ||
          ans.questionText === question.questionText
      );

      if (answer) {
        // Handle different answer formats
        let answerText = answer.answerText || answer.answer || "";

        // For multiple choice questions, handle array of selections
        if (Array.isArray(answerText)) {
          answerText = answerText.join("; ");
        }

        // For rating questions, ensure it's a readable format
        if (question.type === "RATING" && typeof answerText === "number") {
          answerText = `${answerText}/5`;
        }

        row[headerKey] = answerText;
      } else {
        row[headerKey] = "No response";
      }
    });

    return row;
  });

  return { data: formattedData, headers };
};

/**
 * Format survey analytics for CSV export
 * @param {Object} surveyData - Survey data object
 * @param {Object} analyticsData - Analytics data object
 * @returns {Object} Formatted analytics data ready for CSV export
 */
export const formatAnalyticsDataForCSV = (surveyData, analyticsData) => {
  if (!surveyData || !analyticsData) {
    return { data: [], headers: [] };
  }

  const headers = [
    "Question Number",
    "Question Text",
    "Question Type",
    "Total Responses",
    "Completion Rate (%)",
    "Most Popular Answer",
    "Average Rating",
    "Response Count",
  ];

  const formattedData =
    surveyData.questions?.map((question, index) => {
      const questionNumber = question.orderNumber || index + 1;

      // Find corresponding analytics data
      const questionAnalytics = analyticsData.questionCompletionData?.find(
        (q) => q.question === `Q${questionNumber}`
      );

      const row = {
        "Question Number": questionNumber,
        "Question Text": question.questionText || "N/A",
        "Question Type": question.type || "N/A",
        "Total Responses": questionAnalytics?.total || 0,
        "Completion Rate (%)": questionAnalytics?.completion || 0,
        "Most Popular Answer": "N/A", // Would need to calculate from response data
        "Average Rating": question.type === "RATING" ? "N/A" : "Not applicable",
        "Response Count": questionAnalytics?.total || 0,
      };

      return row;
    }) || [];

  return { data: formattedData, headers };
};

/**
 * Export survey responses to CSV
 * @param {Object} surveyData - Survey data object
 * @param {Object} responsesData - Responses data object
 * @param {string} surveyTitle - Title of the survey for filename
 */
export const exportSurveyResponses = (
  surveyData,
  responsesData,
  surveyTitle = "Survey"
) => {
  try {
    const { data, headers } = formatSurveyDataForCSV(surveyData, responsesData);

    if (data.length === 0) {
      throw new Error("No data to export");
    }

    const csvContent = convertToCSV(data, headers);
    const filename = `${surveyTitle.replace(/[^a-z0-9]/gi, "_")}_responses_${
      new Date().toISOString().split("T")[0]
    }.csv`;

    downloadCSV(csvContent, filename);
    return true;
  } catch (error) {
    console.error("Export failed:", error);
    throw error;
  }
};

/**
 * Export survey analytics to CSV
 * @param {Object} surveyData - Survey data object
 * @param {Object} analyticsData - Analytics data object
 * @param {string} surveyTitle - Title of the survey for filename
 */
export const exportSurveyAnalytics = (
  surveyData,
  analyticsData,
  surveyTitle = "Survey"
) => {
  try {
    const { data, headers } = formatAnalyticsDataForCSV(
      surveyData,
      analyticsData
    );

    if (data.length === 0) {
      throw new Error("No analytics data to export");
    }

    const csvContent = convertToCSV(data, headers);
    const filename = `${surveyTitle.replace(/[^a-z0-9]/gi, "_")}_analytics_${
      new Date().toISOString().split("T")[0]
    }.csv`;

    downloadCSV(csvContent, filename);
    return true;
  } catch (error) {
    console.error("Analytics export failed:", error);
    throw error;
  }
};

/**
 * Export summary data to CSV
 * @param {Object} surveyData - Survey data object
 * @param {Object} responsesData - Responses data object
 * @param {Object} analyticsData - Analytics data object
 * @param {string} surveyTitle - Title of the survey for filename
 */
export const exportSurveySummary = (
  surveyData,
  responsesData,
  analyticsData,
  surveyTitle = "Survey"
) => {
  try {
    const headers = ["Metric", "Value", "Description"];

    const totalResponses = responsesData?.responses?.length || 0;
    const totalQuestions = surveyData?.questions?.length || 0;
    const averageCompletion =
      analyticsData?.respondentAnalysis?.totalRespondents || 0;
    const authenticatedUsers =
      analyticsData?.respondentAnalysis?.authenticatedUsers || 0;
    const anonymousUsers =
      analyticsData?.respondentAnalysis?.anonymousUsers || 0;

    const summaryData = [
      {
        Metric: "Survey Title",
        Value: surveyData?.title || "N/A",
        Description: "Title of the survey",
      },
      {
        Metric: "Survey Status",
        Value: surveyData?.status || "N/A",
        Description: "Current status of the survey",
      },
      {
        Metric: "Created Date",
        Value: surveyData?.createdAt
          ? new Date(surveyData.createdAt).toLocaleDateString()
          : "N/A",
        Description: "Date when survey was created",
      },
      {
        Metric: "Total Questions",
        Value: totalQuestions,
        Description: "Number of questions in the survey",
      },
      {
        Metric: "Total Responses",
        Value: totalResponses,
        Description: "Total number of responses received",
      },
      {
        Metric: "Authenticated Users",
        Value: authenticatedUsers,
        Description: "Number of responses from authenticated users",
      },
      {
        Metric: "Anonymous Users",
        Value: anonymousUsers,
        Description: "Number of responses from anonymous users",
      },
      {
        Metric: "Authentication Rate",
        Value:
          totalResponses > 0
            ? `${Math.round((authenticatedUsers / totalResponses) * 100)}%`
            : "0%",
        Description: "Percentage of authenticated responses",
      },
    ];

    const csvContent = convertToCSV(summaryData, headers);
    const filename = `${surveyTitle.replace(/[^a-z0-9]/gi, "_")}_summary_${
      new Date().toISOString().split("T")[0]
    }.csv`;

    downloadCSV(csvContent, filename);
    return true;
  } catch (error) {
    console.error("Summary export failed:", error);
    throw error;
  }
};
