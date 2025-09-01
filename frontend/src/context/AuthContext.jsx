import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, errorHandler } from '../utils/apiClient';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    // loading: used while we validate token / fetch authoritative user info
    const [loading, setLoading] = useState(true);
    // verified indicates that the user object was fetched/confirmed from the server
    const [verified, setVerified] = useState(false);
    // Add a flag to track if we've completed the initial auth check
    const [authChecked, setAuthChecked] = useState(false);
    const navigate = useNavigate();

    // Set up navigation callback for apiClient
    useEffect(() => {
        apiClient.auth.setNavigationCallback(navigate);
    }, [navigate]);

    // Initialize auth state from localStorage and verify token with backend
    useEffect(() => {
        let mounted = true;

        const init = async () => {
            setLoading(true);
            const token = localStorage.getItem('jwt_token');

            if (!token) {
                // no token, nothing to verify
                if (mounted) {
                    setUser(null);
                    setVerified(false);
                    setAuthChecked(true);
                    setLoading(false);
                }
                return;
            }

            try {
                // Set token immediately to prevent auth issues during verification
                apiClient.auth.setToken(token);

                // Ask backend for authoritative user profile
                const profile = await apiClient.getUserMe();

                if (mounted) {
                    setUser({ ...profile, token });
                    setVerified(true);
                    setAuthChecked(true);

                    // Keep localStorage in sync with authoritative profile
                    localStorage.setItem('user_data', JSON.stringify(profile));
                }
            } catch (error) {
                // If verification fails, clear client state and storage
                console.warn('Token verification failed, clearing local auth:', error.message || error);
                apiClient.auth.removeToken();
                if (mounted) {
                    setUser(null);
                    setVerified(false);
                    setAuthChecked(true);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        init();

        return () => {
            mounted = false;
        };
    }, []);

    const login = async (email, password) => {
        try {
            // Use the enhanced apiClient for login
            const response = await apiClient.post('/auth/login', { email, password });

            // The apiClient now automatically extracts data from the new API response structure
            const data = apiClient.extractData(response);
            const metadata = apiClient.getResponseMetadata(response);

            // Log success message if available
            if (metadata?.message) {
                console.log('Login response:', metadata.message);
            }


            // Store token first
            apiClient.auth.setToken(data.token);
            localStorage.setItem('jwt_token', data.token);

            // Fetch authoritative profile from backend to avoid trusting client-side storage
            let profile;
            try {
                profile = await apiClient.getUserMe();
            } catch (err) {
                // If backend doesn't provide /auth/me immediately, fall back to data returned by login
                profile = {
                    userId: data.userId,
                    email: data.email,
                    name: data.name,
                    role: data.role,
                };
            }

            // Persist and update state from authoritative profile
            localStorage.setItem('user_data', JSON.stringify(profile));
            setUser({ ...profile, token: data.token });
            setVerified(true);
            setAuthChecked(true);

            return {
                success: true,
                user: data,
                message: metadata?.message || 'Login successful'
            };
        } catch (error) {
            console.error('Login error:', error);

            // Use enhanced error handling
            const errorDetails = apiClient.getErrorDetails(error);

            return {
                success: false,
                error: errorDetails.message,
                errors: errorDetails.errors
            };
        }
    };

    const register = async (name, email, password) => {
        try {
            // Use the enhanced apiClient for registration
            const response = await apiClient.post('/users/create', { name, email, password });

            // Extract data using the new API response structure
            const data = apiClient.extractData(response);
            const metadata = apiClient.getResponseMetadata(response);

            // Log success message if available
            if (metadata?.message) {
                console.log('Registration response:', metadata.message);
            }


            // Store token first
            apiClient.auth.setToken(data.token);
            localStorage.setItem('jwt_token', data.token);

            // Fetch authoritative profile from backend (or fallback to returned data)
            let profile;
            try {
                profile = await apiClient.getUserMe();
            } catch (err) {
                profile = {
                    userId: data.userId,
                    email: data.email,
                    name: data.name,
                    role: data.role,
                };
            }

            localStorage.setItem('user_data', JSON.stringify(profile));
            setUser({ ...profile, token: data.token });
            setVerified(true);
            setAuthChecked(true);

            return {
                success: true,
                user: data,
                message: metadata?.message || 'Registration successful'
            };
        } catch (error) {
            console.error('Registration error:', error);

            // Use enhanced error handling
            const errorDetails = apiClient.getErrorDetails(error);

            return {
                success: false,
                error: errorDetails.message,
                errors: errorDetails.errors
            };
        }
    };

    const logout = async () => {
        try {
            // Call backend logout endpoint to blacklist the token
            await apiClient.auth.logoutWithBackend();
        } catch (error) {
            // The logoutWithBackend method already handles errors gracefully
            console.error('Logout error:', error);
        } finally {
            // Ensure user state is cleared
            setUser(null);
            setVerified(false);
            setAuthChecked(true);
        }
    };

    const isAuthenticated = () => {
        // Don't check authentication status while still loading or before initial check
        if (loading || !authChecked) return false;

        // Only consider authenticated if user exists, token is present and profile was verified by server
        return !!user && !!user.token && verified;
    };

    const hasRole = (requiredRole) => {
        // Don't trust local-only user objects: the 'verified' flag ensures server confirmation
        return isAuthenticated() && user.role === requiredRole;
    };

    const isAdmin = () => {
        return hasRole('ADMIN');
    };

    const isUser = () => {
        return hasRole('USER');
    };

    const value = {
        user,
        login,
        register,
        logout,
        // Re-fetch authoritative profile from server
        refreshUser: useCallback(async () => {
            try {
                setLoading(true);
                const profile = await apiClient.getUserMe();
                const token = apiClient.auth.getToken();
                if (profile) {
                    localStorage.setItem('user_data', JSON.stringify(profile));
                    setUser({ ...profile, token });
                    setVerified(true);
                    setAuthChecked(true);
                }
            } catch (error) {
                // if refresh fails, clear auth
                apiClient.auth.removeToken();
                setUser(null);
                setVerified(false);
                setAuthChecked(true);
                throw error;
            } finally {
                setLoading(false);
            }
        }, []),
        isAuthenticated,
        hasRole,
        isAdmin,
        isUser,
        loading,
        authChecked
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};