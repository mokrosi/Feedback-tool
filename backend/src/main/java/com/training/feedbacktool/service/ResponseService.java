package com.training.feedbacktool.service;

import com.training.feedbacktool.dto.SubmitResponseRequest;
import com.training.feedbacktool.entity.Answer;
import com.training.feedbacktool.entity.Question;
import com.training.feedbacktool.entity.Response;
import com.training.feedbacktool.entity.Survey;
import com.training.feedbacktool.entity.User;
import com.training.feedbacktool.repository.AnswersRepository;
import com.training.feedbacktool.repository.ResponsesRepository;
import com.training.feedbacktool.repository.SurveyRepository;
import com.training.feedbacktool.repository.UserRepository;
import com.training.feedbacktool.util.JwtUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ResponseService {

    private final SurveyRepository surveyRepository;
    private final AnswersRepository answersRepository;
    private final ResponsesRepository responsesRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    public ResponseService(SurveyRepository surveyRepository,
            AnswersRepository answersRepository,
            ResponsesRepository responsesRepository,
            UserRepository userRepository,
            JwtUtil jwtUtil,
            EmailService emailService) {
        this.surveyRepository = surveyRepository;
        this.answersRepository = answersRepository;
        this.responsesRepository = responsesRepository;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
    }

    @Transactional
    public void submitSurveyResponse(Long surveyId, SubmitResponseRequest request, String authToken) {
        // Get the survey
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new IllegalArgumentException("Survey not found with id: " + surveyId));

        // Check if survey is active
        if (!"ACTIVE".equalsIgnoreCase(survey.getStatus())) {
            throw new IllegalStateException("Survey is not accepting responses");
        }

        // Check if survey has expired
        if (survey.getEndDate() != null && Instant.now().isAfter(survey.getEndDate())) {
            throw new IllegalStateException("Survey has expired and is no longer accepting responses");
        }

        // Extract user from token if authenticated
        User user = null;
        if (authToken != null && authToken.startsWith("Bearer ")) {
            try {
                String jwt = authToken.substring(7);
                String email = jwtUtil.extractEmail(jwt);
                if (email != null && !jwtUtil.isTokenExpired(jwt)) {
                    user = userRepository.findByEmailIgnoreCase(email).orElse(null);
                }
            } catch (Exception e) {
                // Token is invalid, proceed as anonymous
            }
        }

        // Create a map of questions by ID for validation
        Map<Long, Question> questionsById = survey.getQuestions().stream()
                .collect(Collectors.toMap(Question::getId, q -> q));

        // Validate required questions
        validateRequiredQuestions(questionsById, request);

        // Create a Response entity for this survey submission
        Response surveyResponse = Response.builder()
                .survey(survey)
                .user(user) // null for anonymous responses
                .responseText("Survey response submitted") // Generic text for now
                .completionTimeSeconds(request.completionTimeSeconds()) // Store completion time
                .createdAt(Instant.now())
                .build();

        responsesRepository.save(surveyResponse);

        // Save answers
        for (SubmitResponseRequest.AnswerDTO answerDto : request.answers()) {
            Question question = questionsById.get(answerDto.questionId());
            if (question == null) {
                throw new IllegalArgumentException(
                        "Question " + answerDto.questionId() + " is not part of survey " + surveyId);
            }

            // Handle different question types
            boolean isRatingQuestion = "RATING".equalsIgnoreCase(question.getType());
            boolean hasAnswer = false;

            if (isRatingQuestion) {
                // For rating questions, check if ratingValue is provided
                if (answerDto.ratingValue() != null) {
                    // Validate rating range (0-5)
                    if (answerDto.ratingValue() < 0 || answerDto.ratingValue() > 5) {
                        throw new IllegalArgumentException(
                                "Rating value must be between 0 and 5 for question: " + question.getQuestionText());
                    }
                    hasAnswer = true;
                }
            } else {
                // For non-rating questions, check if answerValue is provided
                if (answerDto.answerValue() != null && !answerDto.answerValue().trim().isEmpty()) {
                    hasAnswer = true;
                }
            }

            // Skip empty answers for non-required questions
            if (!hasAnswer) {
                if (Boolean.TRUE.equals(question.getRequired())) {
                    throw new IllegalArgumentException(
                            "Answer is required for question: " + question.getQuestionText());
                }
                continue;
            }

            Answer answer = new Answer();
            answer.setQuestion(question);
            answer.setUser(user); // null for anonymous responses

            if (isRatingQuestion) {
                answer.setRatingValue(answerDto.ratingValue());
                // Set a placeholder text for rating questions until DB migration is applied
                answer.setAnswerText("RATING:" + answerDto.ratingValue());
            } else {
                answer.setAnswerText(answerDto.answerValue().trim());
            }

            answersRepository.save(answer);
        }

        // Send email notification to admin users after successful submission
        try {
            List<User> adminUsers = userRepository.findByRole("ADMIN");
            String respondentInfo = user != null ? user.getName() + " (" + user.getEmail() + ")" : "Anonymous User";
            emailService.sendSurveyResponseNotification(adminUsers, survey, respondentInfo);
        } catch (Exception e) {
            // Log the error but don't fail the submission if email notification fails
            System.err.println("Failed to send email notification: " + e.getMessage());
        }
    }

    private void validateRequiredQuestions(Map<Long, Question> questionsById, SubmitResponseRequest request) {
        // Get all required question IDs
        var requiredQuestionIds = questionsById.values().stream()
                .filter(q -> Boolean.TRUE.equals(q.getRequired()))
                .map(Question::getId)
                .collect(Collectors.toSet());

        // Get answered question IDs (with valid answers)
        var answeredQuestionIds = request.answers().stream()
                .filter(a -> {
                    Question question = questionsById.get(a.questionId());
                    if (question == null)
                        return false;

                    boolean isRatingQuestion = "RATING".equalsIgnoreCase(question.getType());
                    if (isRatingQuestion) {
                        return a.ratingValue() != null && a.ratingValue() >= 0 && a.ratingValue() <= 5;
                    } else {
                        return a.answerValue() != null && !a.answerValue().trim().isEmpty();
                    }
                })
                .map(SubmitResponseRequest.AnswerDTO::questionId)
                .collect(Collectors.toSet());

        // Check if all required questions are answered
        requiredQuestionIds.removeAll(answeredQuestionIds);
        if (!requiredQuestionIds.isEmpty()) {
            var missingQuestions = requiredQuestionIds.stream()
                    .map(questionsById::get)
                    .map(Question::getQuestionText)
                    .collect(Collectors.joining(", "));
            throw new IllegalArgumentException("Please answer all required questions: " + missingQuestions);
        }
    }
}