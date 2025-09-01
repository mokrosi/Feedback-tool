import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient, errorHandler } from "../utils/apiClient";

/**
 * Custom hook for making API calls with automatic state management
 * Provides loading, error, and data states with enhanced error handling
 */
export function useApiCall(apiCallFn, options = {}) {
  const {
    immediate = false, // Whether to call the API immediately
    onSuccess,
    onError,
    defaultData = null,
    deps = [], // Dependencies for auto-reload
  } = options;

  const [data, setData] = useState(defaultData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSuccess, setLastSuccess] = useState(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args) => {
      if (!mountedRef.current) return;

      setLoading(true);
      setError(null);

      try {
        const response = await apiCallFn(...args);

        if (!mountedRef.current) return;

        const result = apiClient.extractData(response);
        const metadata = apiClient.getResponseMetadata(response);

        setData(result);
        setLastSuccess({
          data: result,
          message: metadata?.message,
          timestamp: metadata?.timestamp || new Date().toISOString(),
        });

        if (onSuccess) {
          onSuccess(result, metadata);
        }

        return result;
      } catch (err) {
        if (!mountedRef.current) return;

        const errorDetails = apiClient.getErrorDetails(err);
        setError(errorDetails);

        if (onError) {
          onError(err, errorDetails);
        } else {
          // Default error handling
          console.error("API call failed:", errorDetails);
        }

        throw err;
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [apiCallFn, onSuccess, onError]
  );

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute, ...deps]);

  const reset = useCallback(() => {
    setData(defaultData);
    setError(null);
    setLastSuccess(null);
  }, [defaultData]);

  return {
    data,
    loading,
    error,
    lastSuccess,
    execute,
    reset,
    // Convenience methods
    isSuccess: !loading && !error && data !== null,
    hasData: data !== null && data !== undefined,
    errorMessage: error?.message || null,
    successMessage: lastSuccess?.message || null,
  };
}

/**
 * Hook for managing lists with CRUD operations
 */
export function useApiList(baseUrl, options = {}) {
  const {
    immediate = true,
    onItemCreated,
    onItemUpdated,
    onItemDeleted,
    onError,
  } = options;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all items
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(baseUrl);
      const data = apiClient.extractData(response);
      setItems(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      const errorDetails = apiClient.getErrorDetails(err);
      setError(errorDetails);
      if (onError) onError(err, errorDetails);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, onError]);

  // Create new item
  const createItem = useCallback(
    async (itemData) => {
      try {
        const response = await apiClient.post(baseUrl, itemData);
        const newItem = apiClient.extractData(response);

        setItems((prev) => [...prev, newItem]);
        if (onItemCreated) onItemCreated(newItem);

        return newItem;
      } catch (err) {
        const errorDetails = apiClient.getErrorDetails(err);
        if (onError) onError(err, errorDetails);
        throw err;
      }
    },
    [baseUrl, onItemCreated, onError]
  );

  // Update existing item
  const updateItem = useCallback(
    async (id, itemData) => {
      try {
        const response = await apiClient.put(`${baseUrl}/${id}`, itemData);
        const updatedItem = apiClient.extractData(response);

        setItems((prev) =>
          prev.map((item) => (item.id === id ? updatedItem : item))
        );

        if (onItemUpdated) onItemUpdated(updatedItem);

        return updatedItem;
      } catch (err) {
        const errorDetails = apiClient.getErrorDetails(err);
        if (onError) onError(err, errorDetails);
        throw err;
      }
    },
    [baseUrl, onItemUpdated, onError]
  );

  // Delete item
  const deleteItem = useCallback(
    async (id) => {
      try {
        await apiClient.delete(`${baseUrl}/${id}`);

        setItems((prev) => prev.filter((item) => item.id !== id));
        if (onItemDeleted) onItemDeleted(id);

        return true;
      } catch (err) {
        const errorDetails = apiClient.getErrorDetails(err);
        if (onError) onError(err, errorDetails);
        throw err;
      }
    },
    [baseUrl, onItemDeleted, onError]
  );

  // Get item by ID
  const getItem = useCallback(
    async (id) => {
      try {
        const response = await apiClient.get(`${baseUrl}/${id}`);
        return apiClient.extractData(response);
      } catch (err) {
        const errorDetails = apiClient.getErrorDetails(err);
        if (onError) onError(err, errorDetails);
        throw err;
      }
    },
    [baseUrl, onError]
  );

  // Load items on mount if immediate is true
  useEffect(() => {
    if (immediate) {
      fetchItems();
    }
  }, [immediate, fetchItems]);

  return {
    items,
    loading,
    error,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    getItem,
    // Convenience methods
    isEmpty: items.length === 0,
    count: items.length,
    errorMessage: error?.message || null,
  };
}

/**
 * Hook for form submission with API integration
 */
export function useApiForm(submitFn, options = {}) {
  const {
    onSuccess,
    onError,
    resetOnSuccess = false,
    initialValues = {},
  } = options;

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const [lastSubmitResult, setLastSubmitResult] = useState(null);

  const setValue = useCallback(
    (name, value) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      // Clear field error when user starts typing
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: null }));
      }
    },
    [errors]
  );

  const setError = useCallback((name, error) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setLastSubmitResult(null);
    setSubmitCount(0);
  }, [initialValues]);

  const submit = useCallback(
    async (overrideValues = {}) => {
      setSubmitting(true);
      setErrors({});
      setSubmitCount((prev) => prev + 1);

      const finalValues = { ...values, ...overrideValues };

      try {
        const response = await submitFn(finalValues);
        const result = apiClient.extractData(response);
        const metadata = apiClient.getResponseMetadata(response);

        setLastSubmitResult({
          success: true,
          data: result,
          message: metadata?.message,
        });

        if (resetOnSuccess) {
          reset();
        }

        if (onSuccess) {
          onSuccess(result, metadata);
        }

        return result;
      } catch (err) {
        const errorDetails = apiClient.getErrorDetails(err);

        // Handle validation errors
        if (errorDetails.errors && Array.isArray(errorDetails.errors)) {
          const fieldErrors = {};
          errorDetails.errors.forEach((error) => {
            // Try to parse field-specific errors (format: "field: message")
            const match = error.match(/^(\w+):\s*(.+)$/);
            if (match) {
              fieldErrors[match[1]] = match[2];
            } else {
              // General error
              fieldErrors.general = error;
            }
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: errorDetails.message });
        }

        setLastSubmitResult({
          success: false,
          error: errorDetails.message,
          errors: errorDetails.errors,
        });

        if (onError) {
          onError(err, errorDetails);
        }

        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [values, submitFn, onSuccess, onError, resetOnSuccess, reset]
  );

  return {
    values,
    errors,
    submitting,
    submitCount,
    lastSubmitResult,
    setValue,
    setError,
    clearErrors,
    reset,
    submit,
    // Convenience methods
    hasErrors: Object.keys(errors).length > 0,
    isValid: Object.keys(errors).length === 0,
    generalError: errors.general || null,
    canSubmit: !submitting && Object.keys(errors).length === 0,
  };
}

/**
 * Hook for pagination with API integration
 */
export function useApiPagination(baseUrl, options = {}) {
  const { pageSize = 20, immediate = true, params = {} } = options;

  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: pageSize,
    numberOfElements: 0,
    first: true,
    last: true,
    empty: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPage = useCallback(
    async (page = 0, size = pageSize, additionalParams = {}) => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = {
          page,
          size,
          ...params,
          ...additionalParams,
        };

        const response = await apiClient.get(baseUrl, { params: queryParams });
        const result = apiClient.extractData(response);

        // Handle both paginated and non-paginated responses
        if (result.content && result.pagination) {
          // Paginated response
          setData(result.content);
          setPagination(result.pagination);
        } else if (Array.isArray(result)) {
          // Non-paginated array response
          setData(result);
          setPagination({
            currentPage: 0,
            totalPages: 1,
            totalElements: result.length,
            pageSize: result.length,
            numberOfElements: result.length,
            first: true,
            last: true,
            empty: result.length === 0,
          });
        } else {
          throw new Error("Unexpected response format");
        }

        return result;
      } catch (err) {
        const errorDetails = apiClient.getErrorDetails(err);
        setError(errorDetails);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl, pageSize, params]
  );

  const nextPage = useCallback(() => {
    if (!pagination.last) {
      fetchPage(pagination.currentPage + 1);
    }
  }, [fetchPage, pagination.currentPage, pagination.last]);

  const previousPage = useCallback(() => {
    if (!pagination.first) {
      fetchPage(pagination.currentPage - 1);
    }
  }, [fetchPage, pagination.currentPage, pagination.first]);

  const goToPage = useCallback(
    (page) => {
      if (page >= 0 && page < pagination.totalPages) {
        fetchPage(page);
      }
    },
    [fetchPage, pagination.totalPages]
  );

  const refresh = useCallback(() => {
    fetchPage(pagination.currentPage);
  }, [fetchPage, pagination.currentPage]);

  useEffect(() => {
    if (immediate) {
      fetchPage();
    }
  }, [immediate, fetchPage]);

  return {
    data,
    pagination,
    loading,
    error,
    fetchPage,
    nextPage,
    previousPage,
    goToPage,
    refresh,
    // Convenience methods
    hasData: data.length > 0,
    isEmpty: data.length === 0,
    canGoNext: !pagination.last,
    canGoPrevious: !pagination.first,
    errorMessage: error?.message || null,
  };
}
