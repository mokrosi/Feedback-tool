package com.training.feedbacktool.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import java.time.Instant;

@Entity
@Table(name = "answers")
public class Answer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Size(max = 1000, message = "Answer text cannot exceed 1000 characters")
    @Column(name = "answer_text", nullable = true, length = 1000)
    private String answerText;

    // For rating questions: store numeric value (0-5 stars)
    @Column(name = "rating_value", nullable = true)
    private Integer ratingValue;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt;

    // Relationship to Question (assuming answers belong to questions)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    // Relationship to User (who provided the answer) - nullable for anonymous
    // responses
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    private User user;

    public Answer() {
    }

    public Answer(String answerText, Question question, User user) {
        this.answerText = answerText;
        this.question = question;
        this.user = user;
    }

    public Answer(Integer ratingValue, Question question, User user) {
        this.ratingValue = ratingValue;
        this.question = question;
        this.user = user;
    }

    public Answer(String answerText, Integer ratingValue, Question question, User user) {
        this.answerText = answerText;
        this.ratingValue = ratingValue;
        this.question = question;
        this.user = user;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAnswerText() {
        return answerText;
    }

    public void setAnswerText(String answerText) {
        this.answerText = answerText;
    }

    public Integer getRatingValue() {
        return ratingValue;
    }

    public void setRatingValue(Integer ratingValue) {
        this.ratingValue = ratingValue;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Question getQuestion() {
        return question;
    }

    public void setQuestion(Question question) {
        this.question = question;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}