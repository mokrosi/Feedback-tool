package com.training.feedbacktool.repository;

import com.training.feedbacktool.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AnswersRepository extends JpaRepository<Answer, Long> {

    // Find answers by survey ID
    @Query("SELECT a FROM Answer a WHERE a.question.survey.id = :surveyId")
    List<Answer> findBySurveyId(@Param("surveyId") Long surveyId);

    // Find answers by question ID
    @Query("SELECT a FROM Answer a WHERE a.question.id = :questionId")
    List<Answer> findByQuestionId(@Param("questionId") Long questionId);

    // Delete answers by survey ID
    @Modifying
    @Query("DELETE FROM Answer a WHERE a.question.survey.id = :surveyId")
    void deleteBySurveyId(@Param("surveyId") Long surveyId);

    // Find surveys user has responded to
    @Query("SELECT DISTINCT a.question.survey.id FROM Answer a WHERE a.user.id = :userId")
    List<Long> findSurveyIdsRespondedByUser(@Param("userId") Long userId);

    // Count answers by user for a specific survey
    @Query("SELECT COUNT(a) FROM Answer a WHERE a.user.id = :userId AND a.question.survey.id = :surveyId")
    Long countAnswersByUserAndSurvey(@Param("userId") Long userId, @Param("surveyId") Long surveyId);

    // Get completion date for user's survey responses
    @Query("SELECT MIN(a.createdAt) FROM Answer a WHERE a.user.id = :userId AND a.question.survey.id = :surveyId")
    java.time.Instant findCompletionDateByUserAndSurvey(@Param("userId") Long userId, @Param("surveyId") Long surveyId);

    // Find answers by user and survey - for getting user's own response
    @Query("SELECT a FROM Answer a WHERE a.user.id = :userId AND a.question.survey.id = :surveyId ORDER BY a.question.orderNumber")
    List<Answer> findByUserIdAndSurveyId(@Param("userId") Long userId, @Param("surveyId") Long surveyId);

}
