package com.training.feedbacktool.controller;

import com.training.feedbacktool.common.ApiResponse;
import com.training.feedbacktool.dto.SimpleAnswerDTO;
import com.training.feedbacktool.entity.Response;
import com.training.feedbacktool.entity.Answer;
import com.training.feedbacktool.entity.User;
import com.training.feedbacktool.repository.ResponsesRepository;
import com.training.feedbacktool.repository.AnswersRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/responses")
@CrossOrigin(origins = "*")
public class ResponsesController {

    private final ResponsesRepository responsesRepository;
    private final AnswersRepository answersRepository;

    public ResponsesController(ResponsesRepository responsesRepository, AnswersRepository answersRepository) {
        this.responsesRepository = responsesRepository;
        this.answersRepository = answersRepository;
    }

    @GetMapping("/debug")
    public ResponseEntity<ApiResponse<String>> debugAuth() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String debugInfo = auth == null ? "No authentication found"
                    : "Authenticated as: " + auth.getName() + " with authorities: " + auth.getAuthorities();
            ApiResponse<String> response = ApiResponse.success(debugInfo, "Authentication debug information");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse<String> response = ApiResponse.error("Failed to get authentication info: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getResponseCount() {
        try {
            long count = responsesRepository.count();
            Map<String, Object> result = new HashMap<>();
            result.put("count", count);
            result.put("message", "Total responses in database");
            ApiResponse<Map<String, Object>> response = ApiResponse.success(result,
                    "Response count retrieved successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse<Map<String, Object>> response = ApiResponse
                    .error("Failed to get response count: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/survey/{surveyId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getResponsesBySurveyId(@PathVariable Long surveyId) {
        try {
            System.out.println("Getting responses for survey ID: " + surveyId);
            List<Answer> answers = answersRepository.findBySurveyId(surveyId);
            List<Response> surveyResponses = responsesRepository.findBySurveyId(surveyId);
            System.out.println("Found " + answers.size() + " answers and " + surveyResponses.size()
                    + " responses for survey " + surveyId);

            // Create a map of responses by user for completion time lookup
            Map<String, Response> responseByUser = new HashMap<>();
            for (Response resp : surveyResponses) {
                String userKey = resp.getUser() != null ? resp.getUser().getEmail() : "anonymous_" + resp.getId();
                responseByUser.put(userKey, resp);
            }

            // Group answers by respondent
            Map<String, List<Answer>> answersByRespondent = new HashMap<>();

            for (Answer answer : answers) {
                User user = answer.getUser();
                String respondentKey;
                if (user != null) {
                    respondentKey = user.getEmail(); // Use email as unique identifier for authenticated users
                } else {
                    // For anonymous users, we'll group them by creation time proximity
                    // This is a simple approach - in reality you might use session IDs
                    respondentKey = "anonymous_" + answer.getCreatedAt().toString().substring(0, 19); // Group by minute
                }

                if (!answersByRespondent.containsKey(respondentKey)) {
                    answersByRespondent.put(respondentKey, new ArrayList<>());
                }
                answersByRespondent.get(respondentKey).add(answer);
            }

            // Convert to response structure
            List<Map<String, Object>> responses = new ArrayList<>();
            int responseNumber = 1;

            for (Map.Entry<String, List<Answer>> entry : answersByRespondent.entrySet()) {
                List<Answer> respondentAnswers = entry.getValue();

                // Get respondent info from first answer
                Answer firstAnswer = respondentAnswers.get(0);
                User user = firstAnswer.getUser();

                // Create response object
                Map<String, Object> response = new HashMap<>();
                response.put("responseId", responseNumber++);
                response.put("respondentName", user != null ? user.getName() : "Anonymous User");
                response.put("respondentEmail", user != null ? user.getEmail() : null);
                response.put("isAnonymous", user == null);

                // Add user details when not anonymous
                if (user != null) {
                    Map<String, Object> userDetails = new HashMap<>();
                    userDetails.put("id", user.getId());
                    userDetails.put("name", user.getName());
                    userDetails.put("email", user.getEmail());
                    response.put("user", userDetails);
                } else {
                    response.put("user", null);
                }

                response.put("submittedAt", respondentAnswers.stream()
                        .map(Answer::getCreatedAt)
                        .min(java.time.Instant::compareTo)
                        .orElse(firstAnswer.getCreatedAt()));
                response.put("totalAnswers", respondentAnswers.size());

                // Add completion time from Response entity
                String userKey = user != null ? user.getEmail() : "anonymous_" + firstAnswer.getId();
                Response matchingResponse = responseByUser.get(userKey);
                if (matchingResponse == null && user == null) {
                    // For anonymous users, try to find response by time proximity
                    matchingResponse = surveyResponses.stream()
                            .filter(r -> r.getUser() == null)
                            .filter(r -> Math.abs(r.getCreatedAt().getEpochSecond()
                                    - firstAnswer.getCreatedAt().getEpochSecond()) < 300) // Within 5 minutes
                            .findFirst()
                            .orElse(null);
                }
                response.put("completionTimeSeconds",
                        matchingResponse != null ? matchingResponse.getCompletionTimeSeconds() : null);

                // Convert answers to DTOs and sort by question order
                List<SimpleAnswerDTO> answerDTOs = respondentAnswers.stream()
                        .map(answer -> new SimpleAnswerDTO(
                                answer.getId(),
                                answer.getAnswerText(),
                                answer.getCreatedAt(),
                                answer.getQuestion().getId(),
                                answer.getQuestion().getQuestionText(),
                                answer.getQuestion().getType(),
                                user != null ? user.getName() : "Anonymous User",
                                user != null ? user.getEmail() : null,
                                user == null))
                        .sorted((a, b) -> a.questionId().compareTo(b.questionId()))
                        .collect(Collectors.toList());

                response.put("answers", answerDTOs);
                responses.add(response);
            }

            // Sort responses by submission time
            responses.sort((r1, r2) -> {
                java.time.Instant time1 = (java.time.Instant) r1.get("submittedAt");
                java.time.Instant time2 = (java.time.Instant) r2.get("submittedAt");
                return time1.compareTo(time2);
            });

            // Calculate average completion time
            List<Integer> completionTimes = responses.stream()
                    .map(r -> (Integer) r.get("completionTimeSeconds"))
                    .filter(time -> time != null && time > 0)
                    .collect(Collectors.toList());

            Double averageCompletionTime = completionTimes.isEmpty() ? null
                    : completionTimes.stream().mapToInt(Integer::intValue).average().orElse(0.0);

            Map<String, Object> result = new HashMap<>();
            result.put("surveyId", surveyId);
            result.put("totalResponses", responses.size());
            result.put("totalAnswers", answers.size());
            result.put("averageCompletionTimeSeconds", averageCompletionTime);
            result.put("responses", responses);

            String message = responses.isEmpty() ? "No responses found for survey ID: " + surveyId
                    : "Successfully retrieved " + responses.size() + " responses for survey ID: " + surveyId;

            ApiResponse<Map<String, Object>> apiResponse = ApiResponse.success(result, message);
            return ResponseEntity.ok(apiResponse);

        } catch (Exception e) {
            System.err.println("Error getting responses for survey " + surveyId + ": " + e.getMessage());
            e.printStackTrace();
            ApiResponse<Map<String, Object>> response = ApiResponse.error(
                    "Failed to retrieve responses for survey ID: " + surveyId + ". " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<Response>>> getAllResponses() {
        try {
            System.out.println("Getting all responses...");
            List<Response> responses = responsesRepository.findAll();
            System.out.println("Found " + responses.size() + " responses");

            String message = responses.isEmpty() ? "No responses found"
                    : "Successfully retrieved " + responses.size() + " responses";

            ApiResponse<List<Response>> response = ApiResponse.success(responses, message);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error getting responses: " + e.getMessage());
            e.printStackTrace();
            ApiResponse<List<Response>> response = ApiResponse.error("Failed to retrieve responses: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Response>> getResponseById(@PathVariable Long id) {
        try {
            Optional<Response> response = responsesRepository.findById(id);
            if (response.isPresent()) {
                ApiResponse<Response> apiResponse = ApiResponse.success(response.get(),
                        "Response retrieved successfully");
                return ResponseEntity.ok(apiResponse);
            } else {
                ApiResponse<Response> apiResponse = ApiResponse.error("Response not found with ID: " + id,
                        HttpStatus.NOT_FOUND);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(apiResponse);
            }
        } catch (Exception e) {
            ApiResponse<Response> response = ApiResponse.error("Failed to retrieve response: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Response>> createResponse(@RequestBody Response response) {
        try {
            Response savedResponse = responsesRepository.save(response);
            ApiResponse<Response> apiResponse = ApiResponse.success(savedResponse, "Response created successfully",
                    HttpStatus.CREATED);
            return ResponseEntity.status(HttpStatus.CREATED).body(apiResponse);
        } catch (Exception e) {
            ApiResponse<Response> apiResponse = ApiResponse.error("Failed to create response: " + e.getMessage(),
                    HttpStatus.BAD_REQUEST);
            return ResponseEntity.badRequest().body(apiResponse);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteResponse(@PathVariable Long id) {
        try {
            if (!responsesRepository.existsById(id)) {
                ApiResponse<Void> response = ApiResponse.error("Response not found with ID: " + id,
                        HttpStatus.NOT_FOUND);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            responsesRepository.deleteById(id);
            ApiResponse<Void> response = ApiResponse.success("Response deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse<Void> response = ApiResponse.error("Failed to delete response: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
