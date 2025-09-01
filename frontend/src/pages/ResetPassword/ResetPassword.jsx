import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useApiForm } from '../../hooks/useApi';
import { AuthService } from '../../services/apiServices';
import { SimpleSpinner } from '../../components/LoadingSpinner';
import styles from './ResetPassword.module.css';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [tokenValid, setTokenValid] = useState(null);
    const [validatingToken, setValidatingToken] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger entrance animation
        setIsVisible(true);
    }, []);

    const {
        values,
        errors,
        submitting,
        setValue,
        submit,
        generalError,
        setError
    } = useApiForm(
        (data) => AuthService.resetPassword(token, data.password),
        {
            initialValues: {
                password: '',
                confirmPassword: ''
            },
            onSuccess: (result) => {
                setIsSuccess(true);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login', {
                        state: {
                            message: 'Password has been reset successfully. Please log in with your new password.'
                        }
                    });
                }, 3000);
            },
            onError: (error, details) => {
                console.error('Password reset error:', details);
            }
        }
    );

    // Validate token on mount
    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setTokenValid(false);
                setValidatingToken(false);
                return;
            }

            try {
                await AuthService.validateResetToken(token);
                setTokenValid(true);
            } catch (error) {
                setTokenValid(false);
            } finally {
                setValidatingToken(false);
            }
        };

        validateToken();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Clear previous errors
        setError('password', null);
        setError('confirmPassword', null);

        // Validate passwords
        let hasErrors = false;

        if (!values.password) {
            setError('password', 'Password is required');
            hasErrors = true;
        } else if (values.password.length < 8) {
            setError('password', 'Password must be at least 8 characters');
            hasErrors = true;
        }

        if (!values.confirmPassword) {
            setError('confirmPassword', 'Please confirm your password');
            hasErrors = true;
        } else if (values.password !== values.confirmPassword) {
            setError('confirmPassword', 'Passwords do not match');
            hasErrors = true;
        }

        if (hasErrors) {
            return;
        }

        try {
            await submit();
        } catch (error) {
            // Error is handled by the form hook
        }
    };

    const handlePasswordChange = (e) => {
        setValue('password', e.target.value);
        if (errors.password) {
            setError('password', null);
        }
    };

    const handleConfirmPasswordChange = (e) => {
        setValue('confirmPassword', e.target.value);
        if (errors.confirmPassword) {
            setError('confirmPassword', null);
        }
    };

    // Loading state while validating token
    if (validatingToken) {
        return (
            <div className={styles.resetPasswordPage}>
                {/* Animated Background Elements */}
                <div className={styles.backgroundElements}>
                    <div className={styles.floatingShape1}></div>
                    <div className={styles.floatingShape2}></div>
                    <div className={styles.floatingShape3}></div>
                </div>

                <div className={`${styles.container} ${isVisible ? styles.fadeIn : ''}`}>
                    <div className={styles.loadingContainer}>
                        <div className={styles.loadingIcon}>
                            <SimpleSpinner size="large" />
                        </div>
                        <p className={styles.loadingText}>Validating reset link...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Invalid token state
    if (!tokenValid) {
        return (
            <div className={styles.resetPasswordPage}>
                {/* Animated Background Elements */}
                <div className={styles.backgroundElements}>
                    <div className={styles.floatingShape1}></div>
                    <div className={styles.floatingShape2}></div>
                    <div className={styles.floatingShape3}></div>
                </div>

                <div className={`${styles.container} ${isVisible ? styles.fadeIn : ''}`}>
                    <div className={styles.invalidContainer}>
                        <div className={styles.invalidIcon}>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className={styles.invalidTitle}>
                            Invalid Reset Link
                        </h2>
                        <p className={styles.invalidMessage}>
                            This password reset link is invalid or has expired.
                        </p>
                        <div className={styles.invalidActions}>
                            <Link
                                to="/forgot-password"
                                className={styles.primaryButton}
                            >
                                Request New Reset Link
                            </Link>
                            <Link
                                to="/login"
                                className={styles.backLink}
                            >
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Success state
    if (isSuccess) {
        return (
            <div className={styles.resetPasswordPage}>
                {/* Animated Background Elements */}
                <div className={styles.backgroundElements}>
                    <div className={styles.floatingShape1}></div>
                    <div className={styles.floatingShape2}></div>
                    <div className={styles.floatingShape3}></div>
                </div>

                <div className={`${styles.container} ${isVisible ? styles.fadeIn : ''}`}>
                    <div className={styles.successContainer}>
                        <div className={styles.successIcon}>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className={styles.successTitle}>
                            Password Reset Successfully
                        </h2>
                        <p className={styles.successMessage}>
                            Your password has been updated. You will be redirected to the login page shortly.
                        </p>
                        <div className={styles.successNavigation}>
                            <Link
                                to="/login"
                                className={styles.backLink}
                            >
                                Continue to Login →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Reset password form
    return (
        <div className={styles.resetPasswordPage}>
            {/* Animated Background Elements */}
            <div className={styles.backgroundElements}>
                <div className={styles.floatingShape1}></div>
                <div className={styles.floatingShape2}></div>
                <div className={styles.floatingShape3}></div>
            </div>

            <div className={`${styles.container} ${isVisible ? styles.fadeIn : ''}`}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        Set new password
                    </h2>
                    <p className={styles.subtitle}>
                        Please enter your new password below.
                    </p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    {/* General Error Message */}
                    {generalError && (
                        <div className={styles.errorMessage}>
                            <svg className={styles.errorIcon} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {generalError}
                        </div>
                    )}

                    <div className={styles.inputGroup}>
                        <label htmlFor="password" className={styles.label}>
                            New Password
                        </label>
                        <div className={styles.inputWrapper}>
                            <svg className={styles.inputIcon} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={values.password}
                                onChange={handlePasswordChange}
                                disabled={submitting}
                                className={`${styles.input} ${errors.password ? styles.error : ''}`}
                                placeholder="New password (min. 8 characters)"
                            />
                        </div>
                        {errors.password && (
                            <div className={styles.errorText}>
                                <svg viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.password}
                            </div>
                        )}
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="confirmPassword" className={styles.label}>
                            Confirm Password
                        </label>
                        <div className={styles.inputWrapper}>
                            <svg className={styles.inputIcon} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={values.confirmPassword}
                                onChange={handleConfirmPasswordChange}
                                disabled={submitting}
                                className={`${styles.input} ${errors.confirmPassword ? styles.error : ''}`}
                                placeholder="Confirm new password"
                            />
                        </div>
                        {errors.confirmPassword && (
                            <div className={styles.errorText}>
                                <svg viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.confirmPassword}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || !values.password || !values.confirmPassword}
                        className={styles.submitButton}
                    >
                        {submitting ? (
                            <>
                                <SimpleSpinner size="small" variant="white" />
                                Updating Password...
                            </>
                        ) : (
                            <>
                                Update Password
                                <svg className={styles.buttonIcon} viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </>
                        )}
                    </button>
                </form>

                <div className={styles.navigation}>
                    <Link to="/login" className={styles.backLink}>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;