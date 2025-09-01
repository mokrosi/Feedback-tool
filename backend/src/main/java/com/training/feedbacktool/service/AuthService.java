package com.training.feedbacktool.service;

import com.training.feedbacktool.dto.LoginRequest;
import com.training.feedbacktool.dto.LoginResponse;
import com.training.feedbacktool.dto.UserProfileResponse;
import com.training.feedbacktool.dto.ForgotPasswordRequest;
import com.training.feedbacktool.dto.ResetPasswordRequest;
import com.training.feedbacktool.entity.User;
import com.training.feedbacktool.entity.PasswordResetToken;
import com.training.feedbacktool.repository.UserRepository;
import com.training.feedbacktool.repository.PasswordResetTokenRepository;
import com.training.feedbacktool.util.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final TokenBlacklistService tokenBlacklistService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil, TokenBlacklistService tokenBlacklistService,
            PasswordResetTokenRepository passwordResetTokenRepository,
            EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.tokenBlacklistService = tokenBlacklistService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailService = emailService;
    }

    public LoginResponse login(LoginRequest request) {
        // Find user by email
        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        // Verify password
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        // Generate JWT token
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole(), user.getId());

        return new LoginResponse(
                token,
                user.getEmail(),
                user.getName(),
                user.getRole(),
                user.getId());
    }

    /**
     * Logout a user by blacklisting their JWT token
     */
    public void logout(String token) {
        try {
            // Extract expiration date from token
            var expirationDate = jwtUtil.extractExpiration(token);

            // Add token to blacklist
            tokenBlacklistService.blacklistToken(token, expirationDate);
        } catch (Exception e) {
            // Token might be invalid, but we still want to "logout" successfully
            // to prevent edge cases where frontend thinks user is logged out but backend
            // doesn't
            throw new IllegalArgumentException("Invalid token");
        }
    }

    /**
     * Get current user profile from JWT token
     */
    public UserProfileResponse getCurrentUser(String token) {
        try {
            // Extract user ID from token
            Long userId = jwtUtil.extractUserId(token);

            // Find user in database
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            return new UserProfileResponse(
                    user.getId(),
                    user.getEmail(),
                    user.getName(),
                    user.getRole(),
                    user.getCreatedAt());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid token or user not found");
        }
    }

    /**
     * Process forgot password request
     */
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        // Find user by email
        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElse(null);

        // Always return success to prevent email enumeration attacks
        // Even if user doesn't exist, we pretend the email was sent
        if (user == null) {
            return;
        }

        // Invalidate any existing tokens for this user
        passwordResetTokenRepository.invalidateAllTokensForUser(user);

        // Generate secure reset token
        String resetToken = generateSecureToken();

        // Create new password reset token (expires in 1 hour)
        PasswordResetToken passwordResetToken = PasswordResetToken.builder()
                .token(resetToken)
                .user(user)
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .used(false)
                .build();

        passwordResetTokenRepository.save(passwordResetToken);

        // Send reset email
        String userFirstName = extractFirstName(user.getName());
        emailService.sendPasswordResetEmail(user.getEmail(), resetToken, userFirstName);
    }

    /**
     * Reset password using token
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        // Find valid token
        PasswordResetToken resetToken = passwordResetTokenRepository
                .findByTokenAndUsedFalse(request.token())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));

        // Check if token is valid (not expired and not used)
        if (!resetToken.isValid()) {
            throw new IllegalArgumentException("Invalid or expired reset token");
        }

        // Update user password
        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        // Mark token as used
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        // Invalidate all other tokens for this user
        passwordResetTokenRepository.invalidateAllTokensForUser(user);
    }

    /**
     * Validate reset token
     */
    public boolean validateResetToken(String token) {
        return passwordResetTokenRepository.findByTokenAndUsedFalse(token)
                .map(PasswordResetToken::isValid)
                .orElse(false);
    }

    /**
     * Generate secure random token for password reset
     */
    private String generateSecureToken() {
        SecureRandom secureRandom = new SecureRandom();
        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
    }

    /**
     * Extract first name from full name
     */
    private String extractFirstName(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) {
            return "User";
        }
        return fullName.split("\\s+")[0];
    }
}