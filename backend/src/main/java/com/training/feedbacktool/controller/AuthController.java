package com.training.feedbacktool.controller;

import com.training.feedbacktool.common.ApiResponse;
import com.training.feedbacktool.service.AuthService;
import com.training.feedbacktool.dto.LoginRequest;
import com.training.feedbacktool.dto.LoginResponse;
import com.training.feedbacktool.dto.UserProfileResponse;
import com.training.feedbacktool.dto.ForgotPasswordRequest;
import com.training.feedbacktool.dto.ResetPasswordRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
// CORS is now handled globally by CorsConfig
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse loginResponse = authService.login(request);
            ApiResponse<LoginResponse> response = ApiResponse.success(loginResponse, "Login successful");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            ApiResponse<LoginResponse> response = ApiResponse.error("Invalid credentials: " + e.getMessage(),
                    HttpStatus.UNAUTHORIZED);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        } catch (Exception e) {
            ApiResponse<LoginResponse> response = ApiResponse.error("Login failed: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/logout")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> logout(HttpServletRequest request) {
        try {
            // Extract JWT token from Authorization header
            String authorizationHeader = request.getHeader("Authorization");
            if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
                ApiResponse<String> response = ApiResponse.error("Authorization header missing or invalid",
                        HttpStatus.UNAUTHORIZED);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            String jwt = authorizationHeader.substring(7);
            authService.logout(jwt);

            ApiResponse<String> response = ApiResponse.success("", "Logout successful");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            ApiResponse<String> response = ApiResponse.error("Invalid token: " + e.getMessage(),
                    HttpStatus.BAD_REQUEST);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            ApiResponse<String> response = ApiResponse.error("Logout failed: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentUser(HttpServletRequest request) {
        try {
            // Extract JWT token from Authorization header
            String authorizationHeader = request.getHeader("Authorization");
            if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
                ApiResponse<UserProfileResponse> response = ApiResponse.error("Authorization header missing or invalid",
                        HttpStatus.UNAUTHORIZED);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            String jwt = authorizationHeader.substring(7);
            UserProfileResponse userProfile = authService.getCurrentUser(jwt);

            ApiResponse<UserProfileResponse> response = ApiResponse.success(userProfile,
                    "User profile retrieved successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            ApiResponse<UserProfileResponse> response = ApiResponse.error("Invalid token: " + e.getMessage(),
                    HttpStatus.UNAUTHORIZED);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        } catch (Exception e) {
            ApiResponse<UserProfileResponse> response = ApiResponse.error(
                    "Failed to retrieve user profile: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            authService.forgotPassword(request);
            ApiResponse<String> response = ApiResponse.success("",
                    "If an account with that email exists, a password reset link has been sent");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse<String> response = ApiResponse.error(
                    "Failed to process forgot password request: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request);
            ApiResponse<String> response = ApiResponse.success("", "Password has been reset successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            ApiResponse<String> response = ApiResponse.error("Password reset failed: " + e.getMessage(),
                    HttpStatus.BAD_REQUEST);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            ApiResponse<String> response = ApiResponse.error("Password reset failed: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/reset-password/validate/{token}")
    public ResponseEntity<ApiResponse<Boolean>> validateResetToken(@PathVariable String token) {
        try {
            boolean isValid = authService.validateResetToken(token);
            ApiResponse<Boolean> response = ApiResponse.success(isValid,
                    isValid ? "Token is valid" : "Token is invalid or expired");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse<Boolean> response = ApiResponse.error("Failed to validate token: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }
}