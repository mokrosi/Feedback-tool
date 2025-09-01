package com.training.feedbacktool.common;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Optional;
import java.util.function.Supplier;

/**
 * Utility class for creating consistent controller responses.
 * Provides helper methods to handle common patterns like CRUD operations.
 */
public class ResponseUtils {

    /**
     * Handle a service operation that might throw exceptions
     */
    public static <T> ResponseEntity<ApiResponse<T>> handleServiceCall(
            Supplier<T> serviceCall,
            String successMessage) {
        return handleServiceCall(serviceCall, successMessage, HttpStatus.OK);
    }

    /**
     * Handle a service operation with custom success status
     */
    public static <T> ResponseEntity<ApiResponse<T>> handleServiceCall(
            Supplier<T> serviceCall,
            String successMessage,
            HttpStatus successStatus) {
        try {
            T result = serviceCall.get();
            ApiResponse<T> response = ApiResponse.success(result, successMessage, successStatus);
            return ResponseEntity.status(successStatus).body(response);
        } catch (IllegalArgumentException e) {
            ApiResponse<T> response = ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST);
            return ResponseEntity.badRequest().body(response);
        } catch (IllegalStateException e) {
            ApiResponse<T> response = ApiResponse.error(e.getMessage(), HttpStatus.CONFLICT);
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        } catch (Exception e) {
            ApiResponse<T> response = ApiResponse.error(
                    "An unexpected error occurred: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Handle optional results (like findById operations)
     */
    public static <T> ResponseEntity<ApiResponse<T>> handleOptionalResult(
            Optional<T> optional,
            String notFoundMessage,
            String successMessage) {
        if (optional.isPresent()) {
            ApiResponse<T> response = ApiResponse.success(optional.get(), successMessage);
            return ResponseEntity.ok(response);
        } else {
            ApiResponse<T> response = ApiResponse.error(notFoundMessage, HttpStatus.NOT_FOUND);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    /**
     * Handle list results with appropriate messages for empty lists
     */
    public static <T> ResponseEntity<ApiResponse<List<T>>> handleListResult(
            List<T> list,
            String entityName) {
        String message = list.isEmpty() ? "No " + entityName + " found"
                : "Successfully retrieved " + list.size() + " " + entityName;

        ApiResponse<List<T>> response = ApiResponse.success(list, message);
        return ResponseEntity.ok(response);
    }

    /**
     * Handle delete operations
     */
    public static ResponseEntity<ApiResponse<Void>> handleDelete(
            Runnable deleteOperation,
            String successMessage) {
        try {
            deleteOperation.run();
            ApiResponse<Void> response = ApiResponse.success(successMessage);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            ApiResponse<Void> response = ApiResponse.error(e.getMessage(), HttpStatus.NOT_FOUND);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            ApiResponse<Void> response = ApiResponse.error(
                    "Failed to delete: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Create a standardized error response
     */
    public static <T> ResponseEntity<ApiResponse<T>> createErrorResponse(
            String message,
            HttpStatus status) {
        ApiResponse<T> response = ApiResponse.error(message, status);
        return ResponseEntity.status(status).body(response);
    }

    /**
     * Create a standardized success response
     */
    public static <T> ResponseEntity<ApiResponse<T>> createSuccessResponse(
            T data,
            String message,
            HttpStatus status) {
        ApiResponse<T> response = ApiResponse.success(data, message, status);
        return ResponseEntity.status(status).body(response);
    }
}