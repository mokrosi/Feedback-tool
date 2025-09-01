package com.training.feedbacktool.controller;

import com.training.feedbacktool.common.ApiResponse;
import com.training.feedbacktool.service.SurveyService;
import com.training.feedbacktool.dto.AdminSurveyResponse;
import com.training.feedbacktool.dto.CreateSurveyRequest;
import com.training.feedbacktool.dto.SurveyResponse;
import com.training.feedbacktool.dto.PublicSurveyResponse;
import com.training.feedbacktool.dto.SurveyResultsResponse;
import com.training.feedbacktool.dto.UpdateSurveyRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/surveys")
@CrossOrigin(origins = "*")
public class SurveyController {

    private final SurveyService service;

    public SurveyController(SurveyService service) {
        this.service = service;
    }

    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN')") // Admin only
    public ResponseEntity<ApiResponse<SurveyResponse>> create(@Valid @RequestBody CreateSurveyRequest req) {
        try {
            SurveyResponse created = service.create(req);
            ApiResponse<SurveyResponse> response = ApiResponse.success(created, "Survey created successfully",
                    HttpStatus.CREATED);
            return ResponseEntity.created(URI.create("/surveys/" + created.id())).body(response);
        } catch (Exception e) {
            ApiResponse<SurveyResponse> response = ApiResponse.error("Failed to create survey: " + e.getMessage(),
                    HttpStatus.BAD_REQUEST);
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')") // Admin only
    public ResponseEntity<ApiResponse<SurveyResponse>> createSurvey(@Valid @RequestBody CreateSurveyRequest req) {
        try {
            SurveyResponse created = service.create(req);
            ApiResponse<SurveyResponse> response = ApiResponse.success(created, "Survey created successfully",
                    HttpStatus.CREATED);
            return ResponseEntity.created(URI.create("/surveys/" + created.id())).body(response);
        } catch (Exception e) {
            ApiResponse<SurveyResponse> response = ApiResponse.error("Failed to create survey: " + e.getMessage(),
                    HttpStatus.BAD_REQUEST);
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')") // Admin only
    public ResponseEntity<ApiResponse<List<SurveyResponse>>> listAll() {
        try {
            List<SurveyResponse> surveys = service.listAll();
            ApiResponse<List<SurveyResponse>> response = ApiResponse.success(surveys,
                    surveys.isEmpty() ? "No surveys found" : "Successfully retrieved " + surveys.size() + " surveys");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse<List<SurveyResponse>> response = ApiResponse
                    .error("Failed to retrieve surveys: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')") // Admin only
    public ResponseEntity<ApiResponse<List<AdminSurveyResponse>>> listAllWithStats() {
        try {
            List<AdminSurveyResponse> surveys = service.listAllWithStats();
            ApiResponse<List<AdminSurveyResponse>> response = ApiResponse.success(surveys,
                    surveys.isEmpty() ? "No surveys found"
                            : "Successfully retrieved " + surveys.size() + " surveys with statistics");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse<List<AdminSurveyResponse>> response = ApiResponse
                    .error("Failed to retrieve survey statistics: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')") // Admin only
    public ResponseEntity<ApiResponse<PublicSurveyResponse>> getSurvey(@PathVariable Long id) {
        try {
            PublicSurveyResponse survey = service.findByIdWithQuestions(id);
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

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')") // Admin only
    public ResponseEntity<ApiResponse<SurveyResponse>> updateSurvey(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSurveyRequest req) {
        try {
            SurveyResponse updated = service.updateSurvey(id, req);
            ApiResponse<SurveyResponse> response = ApiResponse.success(updated, "Survey updated successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            ApiResponse<SurveyResponse> response = ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST);
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            ApiResponse<SurveyResponse> response = ApiResponse.error("Failed to update survey: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/{id}/public")
    // No authentication required for public survey access
    public ResponseEntity<ApiResponse<PublicSurveyResponse>> getPublicSurvey(@PathVariable Long id) {
        try {
            PublicSurveyResponse survey = service.findByIdWithQuestions(id);
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

    @GetMapping("/{id}/results")
    @PreAuthorize("hasRole('ADMIN')") // Admin only - survey results are sensitive
    public ResponseEntity<ApiResponse<SurveyResultsResponse>> getSurveyResults(@PathVariable Long id) {
        try {
            SurveyResultsResponse results = service.getSurveyResults(id);
            ApiResponse<SurveyResultsResponse> response = ApiResponse.success(results,
                    "Survey results retrieved successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            ApiResponse<SurveyResultsResponse> response = ApiResponse.error("Survey not found with ID: " + id,
                    HttpStatus.NOT_FOUND);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            ApiResponse<SurveyResultsResponse> response = ApiResponse
                    .error("Failed to retrieve survey results: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')") // Admin only
    public ResponseEntity<ApiResponse<Void>> deleteSurvey(@PathVariable Long id) {
        try {
            service.deleteSurvey(id);
            ApiResponse<Void> response = ApiResponse.success(null, "Survey deleted successfully", HttpStatus.OK);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            ApiResponse<Void> response = ApiResponse.error("Survey not found with ID: " + id, HttpStatus.NOT_FOUND);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            ApiResponse<Void> response = ApiResponse.error("Failed to delete survey: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
