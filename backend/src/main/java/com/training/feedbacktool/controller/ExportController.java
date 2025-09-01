package com.training.feedbacktool.controller;

import com.training.feedbacktool.service.ExportService;
import com.training.feedbacktool.service.ExportService.ExportOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/exports")
@CrossOrigin(origins = "*")
public class ExportController {

    private static final Logger logger = LoggerFactory.getLogger(ExportController.class);
    private final ExportService exportService;

    public ExportController(ExportService exportService) {
        this.exportService = exportService;
    }

    /**
     * Export survey analysis as CSV
     */
    @GetMapping("/surveys/{surveyId}/analysis/csv")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportSurveyAnalysisAsCSV(
            @PathVariable Long surveyId,
            @RequestParam(defaultValue = "true") boolean includeQuestionAnalysis,
            @RequestParam(defaultValue = "true") boolean includeRespondentData,
            @RequestParam(defaultValue = "false") boolean includeRawResponses) {

        try {
            logger.info("Starting CSV export for survey ID: {}", surveyId);

            ExportOptions options = new ExportOptions(
                    includeQuestionAnalysis,
                    includeRespondentData,
                    includeRawResponses);

            byte[] csvData = exportService.exportSurveyAnalysisAsCSV(surveyId, options);

            logger.info("CSV export completed successfully for survey ID: {}, data size: {} bytes",
                    surveyId, csvData.length);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.setContentDisposition(ContentDisposition.attachment()
                    .filename("survey_analysis_" + surveyId + "_" +
                            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv")
                    .build());

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(csvData);

        } catch (IllegalArgumentException e) {
            logger.error("Survey not found for ID: {}", surveyId, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            logger.error("Error exporting survey analysis for ID: {}", surveyId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}