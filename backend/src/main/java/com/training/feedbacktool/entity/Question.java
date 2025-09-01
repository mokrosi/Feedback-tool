package com.training.feedbacktool.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "questions")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "survey_id", nullable = false)
    private Survey survey;

    // keep as String for now (we can convert to enum later)
    @Column(nullable = false)
    private String type; // TEXT, LONG_TEXT, RATING, MULTIPLE_CHOICE

    @Column(name = "question_text", nullable = false, length = 1000)
    private String questionText; // was "text"

    @Column(name = "options", columnDefinition = "json")
    private String optionsJson; // was "options_csv", e.g. ["Poor","OK","Great"]

    @Column(name = "order_number")
    private Integer orderNumber;

    @Column(name = "required")
    private Boolean required = false;

    // getters/setters
    public Long getId() {
        return id;
    }

    public Survey getSurvey() {
        return survey;
    }

    public void setSurvey(Survey survey) {
        this.survey = survey;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public String getOptionsJson() {
        return optionsJson;
    }

    public void setOptionsJson(String optionsJson) {
        this.optionsJson = optionsJson;
    }

    public Integer getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(Integer orderNumber) {
        this.orderNumber = orderNumber;
    }

    public Boolean getRequired() {
        return required;
    }

    public void setRequired(Boolean required) {
        this.required = required;
    }
}
