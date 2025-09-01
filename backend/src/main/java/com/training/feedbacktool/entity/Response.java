package com.training.feedbacktool.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "responses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(exclude = { "survey", "user" })
@ToString(exclude = { "survey", "user" })
public class Response {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Response text cannot be blank")
    @Size(max = 2000, message = "Response text cannot exceed 2000 characters")
    @Column(name = "response_text", nullable = false, length = 2000)
    private String responseText;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "completion_time_seconds")
    private Integer completionTimeSeconds; // Time taken to complete the survey in seconds

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_id", nullable = false)
    private Survey survey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true) // Allow null for anonymous responses
    private User user;

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}