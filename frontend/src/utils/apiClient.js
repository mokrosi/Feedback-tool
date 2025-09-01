import axios from "axios";

// Configuration constants
const CONFIG = {
  BASE_URL: import.meta.env.VITE_BACKEND_URL || "http://localhost:8080/api",
  TOKEN_KEY: "jwt_token",
  USER_DATA_KEY: "user_data",
  TIMEOUT: 10000, // 10 seconds
};

// Auth utility functions
const authUtils = {
  // Navigation callback - will be set by AuthContext
  navigationCallback: null,

  setNavigationCallback(callback) {
    this.navigationCallback = callback;
  },

  getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
  },

  setToken(token) {
    localStorage.setItem(CONFIG.TOKEN_KEY, token);
  },

  removeToken() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_DATA_KEY);
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  logout() {
    this.removeToken();
    // Use React Router navigation instead of window.location
    if (this.navigationCallback) {
      this.navigationCallback("/login");
    } else {
      // Fallback for edge cases (should rarely happen)
      console.warn(
        "Navigation callback not set, falling back to window.location"
      );
      window.location.href = "/login";
    }
  },

  // Method for manual logout that calls backend
  async logoutWithBackend() {
    try {
      const token = this.getToken();
      if (token) {
        // Call backend logout - note: this might fail if token is invalid
        await axiosInstance.post("/auth/logout");
      }
    } catch (error) {
      // Don't throw error for logout - we want to clear local storage anyway
      console.warn("Backend logout failed:", error.message);
    } finally {
      this.logout(); // Always clear local storage and navigate
    }
  },
};

// Create axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: CONFIG.BASE_URL,
  timeout: CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add authentication token
axiosInstance.interceptors.request.use(
  (config) => {
    // Only exclude specific auth endpoints that don't need tokens (login, register)
    const isPublicAuthEndpoint =
      config.url?.includes("/auth/login") ||
      config.url?.includes("/users/create");

    if (!isPublicAuthEndpoint) {
      const token = authUtils.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Store request info for error handling
    config._isPublicAuthEndpoint = isPublicAuthEndpoint;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor to handle new API response structure and common errors
 * New API responses follow this structure:
 * {
 *   success: boolean,
 *   message: string,
 *   data: any, // actual response data
 *   errors?: string[], // error details
 *   timestamp: string,
 *   status: number
 * }
 */
axiosInstance.interceptors.response.use(
  (response) => {
    const { data } = response;

    // Check if response follows the new API structure
    if (data && typeof data.success === "boolean") {
      if (data.success) {
        // For successful responses, return the actual data
        // but preserve the message for user feedback

        // Handle array responses properly
        if (Array.isArray(data.data)) {
          // For array responses, preserve the array structure
          const responseData = [...data.data]; // Clone the array
          responseData._apiResponse = {
            message: data.message,
            timestamp: data.timestamp,
            status: data.status,
          };
          return {
            ...response,
            data: responseData,
          };
        } else {
          // For object responses, spread normally
          return {
            ...response,
            data: {
              ...data.data, // The actual response data
              _apiResponse: {
                message: data.message,
                timestamp: data.timestamp,
                status: data.status,
              },
            },
          };
        }
      } else {
        // For failed responses, throw error with structured information
        const errorMessage = data.message || "Request failed";
        const errorDetails = data.errors || [errorMessage];

        const error = new Error(errorMessage);
        error.isApiError = true;
        error.errors = errorDetails;
        error.status = data.status || response.status;
        error.timestamp = data.timestamp;

        throw error;
      }
    }

    // For legacy responses that don't follow the new structure, return as is
    return response;
  },
  (error) => {
    // Handle HTTP errors and network issues
    if (error.response) {
      const { status, data } = error.response;

      // Check if error response follows new API structure
      if (data && typeof data.success === "boolean" && !data.success) {
        const errorMessage = data.message || `Server error: ${status}`;
        const errorDetails = data.errors || [errorMessage];

        const apiError = new Error(errorMessage);
        apiError.isApiError = true;
        apiError.errors = errorDetails;
        apiError.status = data.status || status;
        apiError.timestamp = data.timestamp;

        // Handle specific status codes
        switch (status) {
          case 401:
            // Only logout if this is NOT a public auth endpoint (login/register)
            if (!error.config?._isPublicAuthEndpoint) {
              authUtils.logout();
              apiError.message = "Session expired. Please login again.";
            } else {
              // For public auth endpoints, just pass through the error without logout
              apiError.message = data.message || "Invalid credentials";
            }
            break;
          case 403:
            apiError.message =
              "Access denied. You don't have permission to perform this action.";
            break;
          case 404:
            apiError.message = data.message || "Resource not found.";
            break;
        }

        throw apiError;
      }

      // Handle legacy error responses
      switch (status) {
        case 401:
          // Only logout if this is NOT a public auth endpoint (login/register)
          if (!error.config?._isPublicAuthEndpoint) {
            authUtils.logout();
            throw new Error("Session expired. Please login again.");
          } else {
            // For public auth endpoints, just pass through the error without logout
            throw new Error(data?.message || "Invalid credentials");
          }
        case 403:
          throw new Error(
            "Access denied. You don't have permission to perform this action."
          );
        case 404:
          throw new Error("Resource not found.");
        case 422:
          throw new Error(data?.message || "Validation error occurred.");
        case 500:
          throw new Error("Internal server error. Please try again later.");
        default:
          throw new Error(data?.message || `Server error: ${status}`);
      }
    } else if (error.request) {
      // Network error
      throw new Error(
        "Network error. Please check your connection and try again."
      );
    } else {
      // Something else happened
      throw new Error(error.message || "An unexpected error occurred.");
    }
  }
);

// Enhanced API client with response handling utilities
export const apiClient = {
  // Auth utilities
  auth: authUtils,

  /**
   * Extract actual data from API response, handling both new and legacy formats
   */
  extractData(response) {
    // If response has _apiResponse, it's already been processed by interceptor
    if (response && response._apiResponse) {
      const { _apiResponse, ...actualData } = response;
      return actualData;
    }

    // Legacy format - return as is
    return response;
  },

  /**
   * Get API response metadata (message, timestamp, etc.)
   */
  getResponseMetadata(response) {
    return response?._apiResponse || null;
  },

  /**
   * Check if an error is from the API with structured format
   */
  isApiError(error) {
    return error?.isApiError === true;
  },

  /**
   * Get user-friendly error message
   */
  getErrorMessage(error) {
    if (this.isApiError(error)) {
      return error.message;
    }
    return error?.message || "An unexpected error occurred";
  },

  /**
   * Get detailed error information
   */
  getErrorDetails(error) {
    if (this.isApiError(error)) {
      return {
        message: error.message,
        errors: error.errors || [],
        status: error.status,
        timestamp: error.timestamp,
      };
    }
    return {
      message: error?.message || "An unexpected error occurred",
      errors: [error?.message || "An unexpected error occurred"],
      status: null,
      timestamp: null,
    };
  },

  getUserMe() {
    return apiClient.get("/auth/me");
  },

  // Generic HTTP methods with enhanced error handling
  async get(url, config = {}) {
    try {
      const response = await axiosInstance.get(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async post(url, data, config = {}) {
    try {
      const response = await axiosInstance.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async put(url, data, config = {}) {
    try {
      const response = await axiosInstance.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async patch(url, data, config = {}) {
    try {
      const response = await axiosInstance.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async delete(url, config = {}) {
    try {
      const response = await axiosInstance.delete(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // File upload method
  async upload(url, formData, onUploadProgress = null) {
    try {
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      if (onUploadProgress) {
        config.onUploadProgress = onUploadProgress;
      }

      const response = await axiosInstance.post(url, formData, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Download method
  async download(url, filename) {
    try {
      const response = await axiosInstance.get(url, {
        responseType: "blob",
      });

      // Create blob link to download
      const blob = new Blob([response.data]);
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();

      return true;
    } catch (error) {
      throw error;
    }
  },

  // Request with custom config
  async request(config) {
    try {
      const response = await axiosInstance.request(config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Convenience methods for common patterns

  /**
   * Make a request and handle success/error with callbacks
   */
  async withHandlers(requestFn, { onSuccess, onError, onFinally } = {}) {
    try {
      const result = await requestFn();
      if (onSuccess) {
        const metadata = this.getResponseMetadata(result);
        onSuccess(result, metadata);
      }
      return result;
    } catch (error) {
      if (onError) {
        const errorDetails = this.getErrorDetails(error);
        onError(error, errorDetails);
      }
      throw error;
    } finally {
      if (onFinally) {
        onFinally();
      }
    }
  },

  /**
   * Make a request with automatic loading state management
   */
  async withLoading(requestFn, setLoading) {
    setLoading(true);
    try {
      const result = await requestFn();
      return result;
    } finally {
      setLoading(false);
    }
  },
};

// Enhanced error handling utility
export const errorHandler = {
  /**
   * Handle API errors with user-friendly messages
   */
  handle(
    error,
    {
      showToast = true,
      logError = true,
      defaultMessage = "An error occurred",
    } = {}
  ) {
    if (logError) {
      console.error("API Error:", error);
    }

    const errorDetails = apiClient.getErrorDetails(error);

    if (showToast && window.showToast) {
      window.showToast(errorDetails.message, "error");
    }

    return errorDetails;
  },

  /**
   * Create error handler for React components
   */
  createHandler(setError, options = {}) {
    return (error) => {
      const errorDetails = this.handle(error, options);
      if (setError) {
        setError(errorDetails.message);
      }
      return errorDetails;
    };
  },
};

/* 
Enhanced Usage Examples:

// Basic usage (unchanged for backward compatibility)
try {
  const surveys = await apiClient.get('/surveys/admin');
  // surveys now contains the actual data, not wrapped in { data: ... }
} catch (error) {
  console.error(apiClient.getErrorMessage(error));
}

// With metadata access
try {
  const surveys = await apiClient.get('/surveys/admin');
  const metadata = apiClient.getResponseMetadata(surveys);
  console.log('Success message:', metadata?.message);
} catch (error) {
  const errorDetails = apiClient.getErrorDetails(error);
  console.log('Error details:', errorDetails);
}

// With handlers
await apiClient.withHandlers(
  () => apiClient.get('/surveys/admin'),
  {
    onSuccess: (data, metadata) => {
      console.log('Data:', data);
      console.log('Success message:', metadata?.message);
    },
    onError: (error, details) => {
      console.error('Error:', details.message);
      console.error('All errors:', details.errors);
    }
  }
);

// With loading state
const [loading, setLoading] = useState(false);
try {
  const surveys = await apiClient.withLoading(
    () => apiClient.get('/surveys/admin'),
    setLoading
  );
} catch (error) {
  errorHandler.handle(error);
}

// Error handling with React state
const [error, setError] = useState('');
const handleError = errorHandler.createHandler(setError);

try {
  const result = await apiClient.get('/surveys');
} catch (err) {
  handleError(err);
}
*/
