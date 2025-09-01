import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApiForm } from '../../hooks/useApi';
import { AuthService } from '../../services/apiServices';
import { SimpleSpinner } from '../../components/LoadingSpinner';
import styles from './ForgotPassword.module.css';

const ForgotPassword = () => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState('');
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
        lastSubmitResult
    } = useApiForm(
        (data) => AuthService.requestPasswordReset(data.email),
        {
            initialValues: { email: '' },
            onSuccess: (result) => {
                setSubmittedEmail(values.email);
                setIsSubmitted(true);
            },
            onError: (error, details) => {
                console.error('Password reset error:', details);
            }
        }
    );

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic email validation
        if (!values.email) {
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(values.email)) {
            return;
        }

        try {
            await submit();
        } catch (error) {
            // Error is handled by the form hook
        }
    };

    const handleEmailChange = (e) => {
        setValue('email', e.target.value);
    };

    const resetForm = () => {
        setIsSubmitted(false);
        setSubmittedEmail('');
        setValue('email', '');
    };

    if (isSubmitted) {
        return (
            <div className={styles.forgotPasswordPage}>
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
                            Check your email
                        </h2>

                        <p className={styles.successMessage}>
                            We've sent a password reset link to{' '}
                            <span className={styles.emailHighlight}>{submittedEmail}</span>
                        </p>

                        <p className={styles.helpText}>
                            Didn't receive the email? Check your spam folder or{' '}
                            <button
                                onClick={resetForm}
                                className={styles.tryAgainButton}
                            >
                                try another email address
                            </button>
                        </p>

                        <div className={styles.navigation}>
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

    return (
        <div className={styles.forgotPasswordPage}>
            {/* Animated Background Elements */}
            <div className={styles.backgroundElements}>
                <div className={styles.floatingShape1}></div>
                <div className={styles.floatingShape2}></div>
                <div className={styles.floatingShape3}></div>
            </div>

            <div className={`${styles.container} ${isVisible ? styles.fadeIn : ''}`}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        Reset your password
                    </h2>
                    <p className={styles.subtitle}>
                        Enter your email address and we'll send you a link to reset your password.
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
                        <label htmlFor="email" className={styles.label}>
                            Email Address
                        </label>
                        <div className={styles.inputWrapper}>
                            <svg className={styles.inputIcon} viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={values.email}
                                onChange={handleEmailChange}
                                disabled={submitting}
                                className={`${styles.input} ${errors.email ? styles.error : ''}`}
                                placeholder="Enter your email address"
                            />
                        </div>
                        {errors.email && (
                            <div className={styles.errorText}>
                                <svg viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.email}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || !values.email}
                        className={styles.submitButton}
                    >
                        {submitting ? (
                            <>
                                <SimpleSpinner size="small" variant="white" />
                                Sending...
                            </>
                        ) : (
                            <>
                                Send Reset Link
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
                    <div className={styles.signupText}>
                        Don't have an account?{' '}
                        <Link to="/signup" className={styles.signupLink}>
                            Sign up
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;