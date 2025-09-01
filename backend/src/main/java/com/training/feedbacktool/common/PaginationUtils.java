package com.training.feedbacktool.common;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Map;
import java.util.HashMap;

/**
 * Utility class for creating paginated API responses with consistent metadata.
 * Provides helper methods for pagination and response formatting.
 */
public class PaginationUtils {

    /**
     * Create a pageable object with default values
     */
    public static Pageable createPageable(Integer page, Integer size, String sortBy, String sortDirection) {
        int pageNumber = page != null && page >= 0 ? page : 0;
        int pageSize = size != null && size > 0 && size <= 100 ? size : 20; // Max 100 items per page

        Sort sort = Sort.unsorted();
        if (sortBy != null && !sortBy.trim().isEmpty()) {
            Sort.Direction direction = "desc".equalsIgnoreCase(sortDirection) ? Sort.Direction.DESC
                    : Sort.Direction.ASC;
            sort = Sort.by(direction, sortBy.trim());
        }

        return PageRequest.of(pageNumber, pageSize, sort);
    }

    /**
     * Create pagination metadata from Spring Data Page
     */
    public static Map<String, Object> createPaginationMetadata(Page<?> page) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("currentPage", page.getNumber());
        metadata.put("totalPages", page.getTotalPages());
        metadata.put("totalElements", page.getTotalElements());
        metadata.put("pageSize", page.getSize());
        metadata.put("numberOfElements", page.getNumberOfElements());
        metadata.put("first", page.isFirst());
        metadata.put("last", page.isLast());
        metadata.put("empty", page.isEmpty());

        if (page.hasNext()) {
            metadata.put("nextPage", page.getNumber() + 1);
        }
        if (page.hasPrevious()) {
            metadata.put("previousPage", page.getNumber() - 1);
        }

        return metadata;
    }

    /**
     * Create a paginated API response
     */
    public static <T> ApiResponse<Map<String, Object>> createPaginatedResponse(Page<T> page, String message) {
        Map<String, Object> result = new HashMap<>();
        result.put("content", page.getContent());
        result.put("pagination", createPaginationMetadata(page));

        return ApiResponse.success(result,
                message != null ? message : "Successfully retrieved " + page.getNumberOfElements() + " items");
    }

    /**
     * Get pagination info as string for messages
     */
    public static String getPaginationInfo(Page<?> page) {
        return String.format("Page %d of %d (showing %d of %d total items)",
                page.getNumber() + 1,
                page.getTotalPages(),
                page.getNumberOfElements(),
                page.getTotalElements());
    }
}