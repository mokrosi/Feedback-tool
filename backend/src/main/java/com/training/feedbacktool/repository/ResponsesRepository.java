package com.training.feedbacktool.repository;

import com.training.feedbacktool.entity.Response;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ResponsesRepository extends JpaRepository<Response, Long> {

    // Find responses by survey ID
    @Query("SELECT r FROM Response r WHERE r.survey.id = :surveyId")
    List<Response> findBySurveyId(@Param("surveyId") Long surveyId);

    // Find responses by user ID
    @Query("SELECT r FROM Response r WHERE r.user.id = :userId")
    List<Response> findByUserId(@Param("userId") Long userId);

    // Delete responses by survey ID
    @Modifying
    @Query("DELETE FROM Response r WHERE r.survey.id = :surveyId")
    void deleteBySurveyId(@Param("surveyId") Long surveyId);

    // Find response by user and survey - for getting user's own response completion
    // time
    @Query("SELECT r FROM Response r WHERE r.user.id = :userId AND r.survey.id = :surveyId")
    Response findByUserIdAndSurveyId(@Param("userId") Long userId, @Param("surveyId") Long surveyId);

}
