package com.training.feedbacktool.service;

import com.training.feedbacktool.repository.PasswordResetTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class TokenCleanupService {

    private static final Logger logger = LoggerFactory.getLogger(TokenCleanupService.class);

    private final PasswordResetTokenRepository passwordResetTokenRepository;

    public TokenCleanupService(PasswordResetTokenRepository passwordResetTokenRepository) {
        this.passwordResetTokenRepository = passwordResetTokenRepository;
    }

    /**
     * Clean up expired password reset tokens every hour
     */
    @Scheduled(fixedRate = 3600000) // 1 hour in milliseconds
    @Transactional
    public void cleanupExpiredTokens() {
        try {
            int deletedCount = passwordResetTokenRepository.deleteExpiredTokens(Instant.now());
            if (deletedCount > 0) {
                logger.info("Cleaned up {} expired password reset tokens", deletedCount);
            }
        } catch (Exception e) {
            logger.error("Error during token cleanup", e);
        }
    }
}