package com.training.feedbacktool.service;

import com.training.feedbacktool.entity.Survey;
import com.training.feedbacktool.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.email.from}")
    private String fromEmail;

    @Value("${app.email.enabled:true}")
    private boolean emailEnabled;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendSurveyResponseNotification(List<User> adminUsers, Survey survey, String respondentInfo) {
        if (!emailEnabled) {
            logger.info("Email notifications are disabled");
            return;
        }

        if (adminUsers == null || adminUsers.isEmpty()) {
            logger.warn("No admin users found to notify about survey response");
            return;
        }

        try {
            String subject = "New Survey Response - " + survey.getTitle();
            String body = buildNotificationEmailBody(survey, respondentInfo);

            for (User admin : adminUsers) {
                try {
                    sendEmail(admin.getEmail(), subject, body);
                    logger.info("Survey response notification sent to admin: {}", admin.getEmail());
                } catch (Exception e) {
                    logger.error("Failed to send notification email to admin: {}", admin.getEmail(), e);
                }
            }
        } catch (Exception e) {
            logger.error("Error sending survey response notifications", e);
        }
    }

    private void sendEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
    }

    @Async
    public void sendPasswordResetEmail(String to, String resetToken, String userFirstName) {
        if (!emailEnabled) {
            // For development/testing - just log the token
            logger.info("=== PASSWORD RESET EMAIL ===");
            logger.info("To: {}", to);
            logger.info("Reset Token: {}", resetToken);
            logger.info("Reset URL: http://localhost:5173/reset-password/{}", resetToken);
            logger.info("============================");
            return;
        }

        try {
            String subject = "Reset Your Password - Feedback Tool";
            String resetUrl = buildResetUrl(resetToken);
            String emailBody = buildPasswordResetEmailBody(userFirstName, resetUrl);

            sendEmail(to, subject, emailBody);
            logger.info("Password reset email sent to: {}", to);
        } catch (Exception e) {
            logger.error("Failed to send password reset email to: {}", to, e);
            throw new RuntimeException("Failed to send password reset email", e);
        }
    }

    private String buildResetUrl(String token) {
        // Frontend URL is now configurable via app.frontend.url property
        return frontendUrl + "/reset-password/" + token;
    }

    private String buildPasswordResetEmailBody(String userFirstName, String resetUrl) {
        return String.format("""
                Hi %s,

                We received a request to reset your password for your Feedback Tool account.

                To reset your password, please click the link below:
                %s

                This link will expire in 1 hour for security reasons.

                If you didn't request this password reset, please ignore this email. Your account remains secure.

                Best regards,
                The Feedback Tool Team
                """, userFirstName, resetUrl);
    }

    private String buildNotificationEmailBody(Survey survey, String respondentInfo) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss z")
                .withZone(ZoneId.systemDefault());

        return String.format("""
                Dear Admin,

                A new response has been submitted for one of your surveys.

                Survey Details:
                • Survey Title: %s
                • Survey ID: %d
                • Survey Description: %s
                • Response Time: %s
                • Respondent: %s

                You can view the complete response details by logging into the admin dashboard.

                Best regards,
                Feedback Tool System
                """,
                survey.getTitle(),
                survey.getId(),
                survey.getDescription() != null ? survey.getDescription() : "No description provided",
                formatter.format(Instant.now()),
                respondentInfo);
    }
}