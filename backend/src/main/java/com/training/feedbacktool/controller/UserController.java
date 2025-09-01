package com.training.feedbacktool.controller;

import com.training.feedbacktool.common.ApiResponse;
import com.training.feedbacktool.service.UserService;
import com.training.feedbacktool.dto.CreateUserRequest;
import com.training.feedbacktool.dto.CreateUserResponse;
import com.training.feedbacktool.dto.UserDashboardResponse;
import com.training.feedbacktool.dto.UserOwnResponseDTO;
import com.training.feedbacktool.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService service;
    private final JwtUtil jwtUtil;

    public UserController(UserService service, JwtUtil jwtUtil) {
        this.service = service;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/create")
    // Removed @PreAuthorize - now allows unauthenticated user creation
    public ResponseEntity<ApiResponse<CreateUserResponse>> create(@Valid @RequestBody CreateUserRequest req) {
        try {
            CreateUserResponse created = service.create(req);
            ApiResponse<CreateUserResponse> response = ApiResponse.success(created, "User created successfully",
                    HttpStatus.CREATED);
            return ResponseEntity.created(URI.create("/users/" + created.userId())).body(response);
        } catch (IllegalArgumentException e) {
            ApiResponse<CreateUserResponse> response = ApiResponse.error("Failed to create user: " + e.getMessage(),
                    HttpStatus.BAD_REQUEST);
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            ApiResponse<CreateUserResponse> response = ApiResponse.error("User creation failed: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDashboardResponse>> getUserDashboard(HttpServletRequest request) {
        try {
            // Extract JWT token from Authorization header
            String authorizationHeader = request.getHeader("Authorization");
            if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
                ApiResponse<UserDashboardResponse> response = ApiResponse.error(
                        "Authorization header missing or invalid",
                        HttpStatus.UNAUTHORIZED);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            String jwt = authorizationHeader.substring(7);
            Long userId;
            try {
                userId = jwtUtil.extractUserId(jwt);
                if (userId == null) {
                    ApiResponse<UserDashboardResponse> response = ApiResponse.error("User ID not found in token",
                            HttpStatus.UNAUTHORIZED);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
                }
            } catch (Exception e) {
                ApiResponse<UserDashboardResponse> response = ApiResponse.error(
                        "Invalid token format: " + e.getMessage(),
                        HttpStatus.UNAUTHORIZED);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            UserDashboardResponse dashboard = service.getUserDashboard(userId);
            ApiResponse<UserDashboardResponse> response = ApiResponse.success(dashboard,
                    "User dashboard retrieved successfully");
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            ApiResponse<UserDashboardResponse> response = ApiResponse.error("User not found: " + e.getMessage(),
                    HttpStatus.NOT_FOUND);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            ApiResponse<UserDashboardResponse> response = ApiResponse.error(
                    "Failed to get user dashboard: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/responses/survey/{surveyId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserOwnResponseDTO>> getUserResponse(@PathVariable Long surveyId,
            HttpServletRequest request) {
        try {
            // Extract JWT token from Authorization header
            String authorizationHeader = request.getHeader("Authorization");
            if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
                ApiResponse<UserOwnResponseDTO> response = ApiResponse.error(
                        "Authorization header missing or invalid",
                        HttpStatus.UNAUTHORIZED);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            String jwt = authorizationHeader.substring(7);
            Long userId;
            try {
                userId = jwtUtil.extractUserId(jwt);
                if (userId == null) {
                    ApiResponse<UserOwnResponseDTO> response = ApiResponse.error("User ID not found in token",
                            HttpStatus.UNAUTHORIZED);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
                }
            } catch (Exception e) {
                ApiResponse<UserOwnResponseDTO> response = ApiResponse.error(
                        "Invalid token format: " + e.getMessage(),
                        HttpStatus.UNAUTHORIZED);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            UserOwnResponseDTO userResponse = service.getUserResponse(userId, surveyId);
            ApiResponse<UserOwnResponseDTO> response = ApiResponse.success(userResponse,
                    "User response retrieved successfully");
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            ApiResponse<UserOwnResponseDTO> response = ApiResponse.error(e.getMessage(),
                    HttpStatus.NOT_FOUND);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            ApiResponse<UserOwnResponseDTO> response = ApiResponse.error(
                    "Failed to get user response: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
