package com.training.feedbacktool.controller;

import com.training.feedbacktool.common.ApiResponse;
import com.training.feedbacktool.dto.PublicSurveyResponse;
import com.training.feedbacktool.dto.SubmitResponseRequest;
import com.training.feedbacktool.service.ResponseService;
import com.training.feedbacktool.service.SurveyService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/surveys")
@CrossOrigin(origins = "*")
public class PublicSurveyController {

    private final SurveyService surveyService;
    private final ResponseService responseService;

    public PublicSurveyController(SurveyService surveyService, ResponseService responseService) {
        this.surveyService = surveyService;
        this.responseService = responseService;
    }

    // GET /public/surveys/{id} -> respondents fetch survey + questions
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PublicSurveyResponse>> getSurvey(@PathVariable Long id) {
        try {
            PublicSurveyResponse survey = surveyService.findByIdWithQuestions(id);
            ApiResponse<PublicSurveyResponse> response = ApiResponse.success(survey, "Survey retrieved successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            ApiResponse<PublicSurveyResponse> response = ApiResponse.error("Survey not found with ID: " + id,
                    HttpStatus.NOT_FOUND);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            ApiResponse<PublicSurveyResponse> response = ApiResponse
                    .error("Failed to retrieve survey: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // POST /public/surveys/{id}/responses -> respondents submit answers
    @PostMapping("/{id}/responses")
    public ResponseEntity<ApiResponse<String>> submitResponses(
            @PathVariable Long id,
            @Valid @RequestBody SubmitResponseRequest request,
            HttpServletRequest httpRequest) {

        try {
            String authHeader = httpRequest.getHeader("Authorization");
            responseService.submitSurveyResponse(id, request, authHeader);
            ApiResponse<String> response = ApiResponse.success("Response submitted successfully",
                    "Survey response submitted successfully", HttpStatus.CREATED);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            ApiResponse<String> response = ApiResponse.error("Invalid request: " + e.getMessage(),
                    HttpStatus.BAD_REQUEST);
            return ResponseEntity.badRequest().body(response);
        } catch (IllegalStateException e) {
            ApiResponse<String> response = ApiResponse.error("Request cannot be processed: " + e.getMessage(),
                    HttpStatus.BAD_REQUEST);
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            ApiResponse<String> response = ApiResponse.error(
                    "An error occurred while submitting the response: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
