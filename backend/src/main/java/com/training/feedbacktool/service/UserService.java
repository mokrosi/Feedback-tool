package com.training.feedbacktool.service;

import com.training.feedbacktool.entity.User;
import com.training.feedbacktool.entity.Survey;
import com.training.feedbacktool.entity.Answer;
import com.training.feedbacktool.entity.Response;
import com.training.feedbacktool.repository.UserRepository;
import com.training.feedbacktool.repository.SurveyRepository;
import com.training.feedbacktool.repository.AnswersRepository;
import com.training.feedbacktool.repository.ResponsesRepository;
import com.training.feedbacktool.dto.CreateUserRequest;
import com.training.feedbacktool.dto.CreateUserResponse;
import com.training.feedbacktool.dto.UserDashboardResponse;
import com.training.feedbacktool.dto.UserDashboardStats;
import com.training.feedbacktool.dto.UserSurveyResponse;
import com.training.feedbacktool.dto.UserOwnResponseDTO;
import com.training.feedbacktool.dto.UserAnswerDTO;
import com.training.feedbacktool.util.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

        private final UserRepository repo;
        private final PasswordEncoder passwordEncoder;
        private final JwtUtil jwtUtil;
        private final SurveyRepository surveyRepository;
        private final AnswersRepository answersRepository;
        private final ResponsesRepository responsesRepository;

        @Value("${app.user.default-role:USER}")
        private String defaultRole;

        public UserService(UserRepository repo, PasswordEncoder passwordEncoder, JwtUtil jwtUtil,
                        SurveyRepository surveyRepository, AnswersRepository answersRepository,
                        ResponsesRepository responsesRepository) {
                this.repo = repo;
                this.passwordEncoder = passwordEncoder;
                this.jwtUtil = jwtUtil;
                this.surveyRepository = surveyRepository;
                this.answersRepository = answersRepository;
                this.responsesRepository = responsesRepository;
        }

        @Transactional
        public CreateUserResponse create(CreateUserRequest req) {
                // Check if email already exists
                if (repo.existsByEmailIgnoreCase(req.email())) {
                        throw new IllegalArgumentException("User with this email already exists");
                }

                // Build entity from request
                User user = User.builder()
                                .email(req.email().trim().toLowerCase())
                                .passwordHash(passwordEncoder.encode(req.password()))
                                .name(req.name().trim())
                                .role(defaultRole.toUpperCase())
                                .build();

                User saved = repo.save(user);

                // Generate JWT token
                String token = jwtUtil.generateToken(saved.getEmail(), saved.getRole(), saved.getId());

                return new CreateUserResponse(
                                token,
                                saved.getEmail(),
                                saved.getName(),
                                saved.getRole(),
                                saved.getId());
        }

        @Transactional(readOnly = true)
        public UserDashboardResponse getUserDashboard(Long userId) {
                // Verify user exists
                if (!repo.existsById(userId)) {
                        throw new IllegalArgumentException("User not found with ID: " + userId);
                }

                // Get all active surveys
                List<Survey> activeSurveys = surveyRepository.findAll().stream()
                                .filter(survey -> "ACTIVE".equals(survey.getStatus()))
                                .collect(Collectors.toList());

                // Get surveys user has responded to
                List<Long> respondedSurveyIds = answersRepository.findSurveyIdsRespondedByUser(userId);

                // Separate completed and pending surveys
                List<UserSurveyResponse> completedSurveys = activeSurveys.stream()
                                .filter(survey -> respondedSurveyIds.contains(survey.getId()))
                                .map(survey -> {
                                        java.time.Instant completedDate = answersRepository
                                                        .findCompletionDateByUserAndSurvey(userId,
                                                                        survey.getId());
                                        Long totalResponses = surveyRepository
                                                        .countAuthenticatedResponsesBySurveyId(survey.getId()) +
                                                        surveyRepository.countAnonymousResponsesBySurveyId(
                                                                        survey.getId());

                                        return new UserSurveyResponse(
                                                        survey.getId(),
                                                        survey.getTitle(),
                                                        survey.getDescription(),
                                                        "COMPLETED",
                                                        null, // No deadline for completed surveys
                                                        completedDate,
                                                        null, // No estimated time for completed surveys
                                                        totalResponses.intValue());
                                })
                                .collect(Collectors.toList());

                List<UserSurveyResponse> pendingSurveys = activeSurveys.stream()
                                .filter(survey -> !respondedSurveyIds.contains(survey.getId()))
                                .map(survey -> {
                                        Long questionCount = surveyRepository.countQuestionsBySurveyId(survey.getId());
                                        String estimatedTime = calculateEstimatedTime(questionCount);

                                        return new UserSurveyResponse(
                                                        survey.getId(),
                                                        survey.getTitle(),
                                                        survey.getDescription(),
                                                        "PENDING",
                                                        calculateDeadline(survey.getCreatedAt()), // Mock deadline logic
                                                        null,
                                                        estimatedTime,
                                                        null);
                                })
                                .collect(Collectors.toList());

                // Calculate stats
                // Calculate average completion time from responses
                List<Response> userResponses = responsesRepository.findByUserId(userId);
                Double averageCompletionTimeMinutes = null;
                Integer totalTimeSpentMinutes = null;

                if (!userResponses.isEmpty()) {
                        // Calculate average completion time
                        List<Integer> completionTimes = userResponses.stream()
                                        .filter(response -> response.getCompletionTimeSeconds() != null)
                                        .map(Response::getCompletionTimeSeconds)
                                        .collect(Collectors.toList());

                        if (!completionTimes.isEmpty()) {
                                double avgSeconds = completionTimes.stream()
                                                .mapToInt(Integer::intValue)
                                                .average()
                                                .orElse(0.0);
                                averageCompletionTimeMinutes = Math.round(avgSeconds / 60.0 * 100.0) / 100.0;

                                // Calculate total time spent
                                int totalSeconds = completionTimes.stream()
                                                .mapToInt(Integer::intValue)
                                                .sum();
                                totalTimeSpentMinutes = totalSeconds / 60;
                        }
                }

                UserDashboardStats stats = new UserDashboardStats(
                                completedSurveys.size(),
                                averageCompletionTimeMinutes,
                                totalTimeSpentMinutes);

                return new UserDashboardResponse(stats, pendingSurveys, completedSurveys);
        }

        @Transactional(readOnly = true)
        public UserOwnResponseDTO getUserResponse(Long userId, Long surveyId) {
                // Verify user exists
                if (!repo.existsById(userId)) {
                        throw new IllegalArgumentException("User not found with ID: " + userId);
                }

                // Get user's answers for this survey
                List<Answer> answers = answersRepository.findByUserIdAndSurveyId(userId, surveyId);

                if (answers.isEmpty()) {
                        throw new IllegalArgumentException(
                                        "No response found for user " + userId + " and survey " + surveyId);
                }

                // Get response metadata (completion time, submission date)
                Response response = responsesRepository.findByUserIdAndSurveyId(userId, surveyId);

                // Convert answers to DTOs
                List<UserAnswerDTO> answerDTOs = answers.stream()
                                .map(answer -> new UserAnswerDTO(
                                                answer.getQuestion().getId(),
                                                answer.getQuestion().getQuestionText(),
                                                answer.getQuestion().getType(),
                                                answer.getAnswerText(),
                                                answer.getRatingValue()))
                                .collect(Collectors.toList());

                // Use response metadata if available, otherwise use answer data
                java.time.Instant submittedAt;
                Integer completionTimeSeconds;
                Long responseId;

                if (response != null) {
                        submittedAt = response.getCreatedAt();
                        completionTimeSeconds = response.getCompletionTimeSeconds();
                        responseId = response.getId();
                } else {
                        // Fallback to answer data if no response record exists
                        submittedAt = answers.stream()
                                        .map(Answer::getCreatedAt)
                                        .min(java.time.Instant::compareTo)
                                        .orElse(java.time.Instant.now());
                        completionTimeSeconds = null; // No completion time available
                        responseId = null; // No response ID available
                }

                return new UserOwnResponseDTO(
                                responseId,
                                surveyId,
                                submittedAt,
                                completionTimeSeconds,
                                answerDTOs);
        }

        private String calculateEstimatedTime(Long questionCount) {
                if (questionCount == null || questionCount == 0) {
                        return "5 minutes";
                }
                // Estimate 1 minute per question, minimum 5 minutes
                long minutes = Math.max(5, questionCount);
                return minutes + " minutes";
        }

        private java.time.Instant calculateDeadline(java.time.Instant createdAt) {
                // Mock logic: surveys have a deadline 30 days after creation
                return createdAt.plusSeconds(30 * 24 * 60 * 60); // 30 days
        }
}
