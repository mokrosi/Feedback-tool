package com.training.feedbacktool.repository;

import com.training.feedbacktool.entity.Survey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SurveyRepository extends JpaRepository<Survey, Long> {
    boolean existsByTitleIgnoreCase(String title);

    @Query("SELECT COUNT(DISTINCT a.user) FROM Answer a WHERE a.question.survey.id = :surveyId AND a.user IS NOT NULL")
    Long countAuthenticatedResponsesBySurveyId(@Param("surveyId") Long surveyId);

    @Query("SELECT COUNT(a) FROM Answer a WHERE a.question.survey.id = :surveyId AND a.user IS NULL")
    Long countAnonymousResponsesBySurveyId(@Param("surveyId") Long surveyId);

    @Query("SELECT COUNT(q) FROM Question q WHERE q.survey.id = :surveyId")
    Long countQuestionsBySurveyId(@Param("surveyId") Long surveyId);
}