package com.training.feedbacktool.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.List;

/**
 * Standardized API response wrapper that provides consistent structure
 * for all API endpoints including success and error responses.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    @JsonProperty("success")
    private boolean success;

    @JsonProperty("message")
    private String message;

    @JsonProperty("data")
    private T data;

    @JsonProperty("errors")
    private List<String> errors;

    @JsonProperty("timestamp")
    private String timestamp;

    @JsonProperty("status")
    private int status;

    @JsonProperty("path")
    private String path;

    // Private constructor to enforce builder pattern
    private ApiResponse() {
        this.timestamp = Instant.now().toString();
    }

    // Success response with data
    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = true;
        response.data = data;
        response.status = HttpStatus.OK.value();
        response.message = "Request completed successfully";
        return response;
    }

    // Success response with data and custom message
    public static <T> ApiResponse<T> success(T data, String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = true;
        response.data = data;
        response.message = message;
        response.status = HttpStatus.OK.value();
        return response;
    }

    // Success response with data, message and status
    public static <T> ApiResponse<T> success(T data, String message, HttpStatus status) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = true;
        response.data = data;
        response.message = message;
        response.status = status.value();
        return response;
    }

    // Success response without data (for void operations)
    public static ApiResponse<Void> success(String message) {
        ApiResponse<Void> response = new ApiResponse<>();
        response.success = true;
        response.message = message;
        response.status = HttpStatus.OK.value();
        return response;
    }

    // Error response with single error message
    public static <T> ApiResponse<T> error(String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = false;
        response.message = message;
        response.errors = List.of(message);
        response.status = HttpStatus.BAD_REQUEST.value();
        return response;
    }

    // Error response with single error message and status
    public static <T> ApiResponse<T> error(String message, HttpStatus status) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = false;
        response.message = message;
        response.errors = List.of(message);
        response.status = status.value();
        return response;
    }

    // Error response with multiple error messages
    public static <T> ApiResponse<T> error(String message, List<String> errors) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = false;
        response.message = message;
        response.errors = errors;
        response.status = HttpStatus.BAD_REQUEST.value();
        return response;
    }

    // Error response with multiple error messages and status
    public static <T> ApiResponse<T> error(String message, List<String> errors, HttpStatus status) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = false;
        response.message = message;
        response.errors = errors;
        response.status = status.value();
        return response;
    }

    // Builder methods for additional properties
    public ApiResponse<T> withPath(String path) {
        this.path = path;
        return this;
    }

    // Getters
    public boolean isSuccess() {
        return success;
    }

    public String getMessage() {
        return message;
    }

    public T getData() {
        return data;
    }

    public List<String> getErrors() {
        return errors;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public int getStatus() {
        return status;
    }

    public String getPath() {
        return path;
    }
}