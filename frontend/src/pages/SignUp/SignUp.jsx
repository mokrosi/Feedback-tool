import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./SignUp.module.css";

export default function SignUp() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    const { register } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Trigger entrance animation
        setIsVisible(true);
    }, []);

    useEffect(() => {
        // Calculate password strength
        if (formData.password) {
            let strength = 0;
            if (formData.password.length >= 8) strength++;
            if (/[A-Z]/.test(formData.password)) strength++;
            if (/[a-z]/.test(formData.password)) strength++;
            if (/[0-9]/.test(formData.password)) strength++;
            if (/[^A-Za-z0-9]/.test(formData.password)) strength++;
            setPasswordStrength(strength);
        } else {
            setPasswordStrength(0);
        }
    }, [formData.password]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters long");
            setLoading(false);
            return;
        }

        const result = await register(formData.name, formData.email, formData.password);

        if (result.success) {
            console.log('Registration successful! Navigation will be handled by App routing.');
            // No need to handle navigation here - App.jsx will handle it
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    const getPasswordStrengthText = () => {
        switch (passwordStrength) {
            case 0:
            case 1:
                return "Weak";
            case 2:
            case 3:
                return "Medium";
            case 4:
            case 5:
                return "Strong";
            default:
                return "";
        }
    };

    const getPasswordStrengthColor = () => {
        switch (passwordStrength) {
            case 0:
            case 1:
                return "#ff4757";
            case 2:
            case 3:
                return "#ffa502";
            case 4:
            case 5:
                return "#2ed573";
            default:
                return "#ddd";
        }
    };

    return (
        <div className={styles.signupPage}>
            {/* Animated Background Elements */}
            <div className={styles.backgroundElements}>
                <div className={styles.floatingShape1}></div>
                <div className={styles.floatingShape2}></div>
                <div className={styles.floatingShape3}></div>
                <div className={styles.floatingShape4}></div>
            </div>

            {/* Main Content Container */}
            <div className={`${styles.signupContainer} ${isVisible ? styles.fadeIn : ''}`}>
                {/* Left Panel - Hero Section */}
                <div className={styles.heroPanel}>
                    <div className={styles.heroContent}>
                        {/* Logo Section */}
                        <div className={styles.logoContainer}>
                            <div className={styles.logo}>
                                <svg viewBox="0 0 50 50" className={styles.logoSvg}>
                                    <circle cx="25" cy="25" r="20" className={styles.logoCircle} />
                                    <path d="M15 25 L22 32 L35 18" className={styles.logoCheck} />
                                </svg>
                            </div>
                            <h1 className={styles.logoText}>FeedbackPro</h1>
                        </div>

                        {/* Hero Text */}
                        <div className={styles.heroText}>
                            <h2>Join Our Community</h2>
                            <p>Start your journey with our powerful feedback platform. Create surveys, collect insights, and make data-driven decisions.</p>
                        </div>

                        {/* Benefits List */}
                        <div className={styles.benefits}>
                            <div className={styles.benefit}>
                                <div className={styles.benefitIcon}>🚀</div>
                                <div>
                                    <h3>Quick Setup</h3>
                                    <p>Get started in minutes with our intuitive interface</p>
                                </div>
                            </div>
                            <div className={styles.benefit}>
                                <div className={styles.benefitIcon}>📈</div>
                                <div>
                                    <h3>Advanced Analytics</h3>
                                    <p>Powerful insights and detailed reporting tools</p>
                                </div>
                            </div>
                            <div className={styles.benefit}>
                                <div className={styles.benefitIcon}>🎯</div>
                                <div>
                                    <h3>Targeted Surveys</h3>
                                    <p>Create custom surveys for your specific needs</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Signup Form */}
                <div className={styles.formPanel}>
                    <div className={styles.formContainer}>
                        {/* Form Header */}
                        <div className={styles.formHeader}>
                            <h2>Create Account</h2>
                            <p>Join thousands of users already using FeedbackPro</p>
                        </div>

                        {/* Signup Form */}
                        <form onSubmit={handleSubmit} className={styles.form}>
                            {/* Error Message */}
                            {error && (
                                <div className={styles.errorMessage}>
                                    <svg className={styles.errorIcon} viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            {/* Name Input */}
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Full Name</label>
                                <div className={styles.inputWrapper}>
                                    <svg className={styles.inputIcon} viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                    <input
                                        className={styles.input}
                                        type="text"
                                        name="name"
                                        placeholder="Enter your full name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        disabled={loading}
                                        autoComplete="name"
                                    />
                                </div>
                            </div>

                            {/* Email Input */}
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Email Address</label>
                                <div className={styles.inputWrapper}>
                                    <svg className={styles.inputIcon} viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                    </svg>
                                    <input
                                        className={styles.input}
                                        type="email"
                                        name="email"
                                        placeholder="Enter your email address"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        disabled={loading}
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Password</label>
                                <div className={styles.inputWrapper}>
                                    <svg className={styles.inputIcon} viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                    <input
                                        className={styles.input}
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder="Create a strong password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required
                                        disabled={loading}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className={styles.passwordToggle}
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={loading}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <svg viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {/* Password Strength Indicator */}
                                {formData.password && (
                                    <div className={styles.passwordStrength}>
                                        <div className={styles.strengthBar}>
                                            <div
                                                className={styles.strengthProgress}
                                                style={{
                                                    width: `${(passwordStrength / 5) * 100}%`,
                                                    backgroundColor: getPasswordStrengthColor()
                                                }}
                                            ></div>
                                        </div>
                                        <span
                                            className={styles.strengthText}
                                            style={{ color: getPasswordStrengthColor() }}
                                        >
                                            {getPasswordStrengthText()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password Input */}
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Confirm Password</label>
                                <div className={styles.inputWrapper}>
                                    <svg className={styles.inputIcon} viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                    <input
                                        className={styles.input}
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        placeholder="Confirm your password"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        required
                                        disabled={loading}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className={styles.passwordToggle}
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        disabled={loading}
                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                    >
                                        {showConfirmPassword ? (
                                            <svg viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Terms and Conditions */}
                            <div className={styles.termsSection}>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" required disabled={loading} />
                                    <span className={styles.checkmark}></span>
                                    I agree to the{" "}
                                    <Link to="/terms" className={styles.termsLink}>Terms of Service</Link>{" "}
                                    and{" "}
                                    <Link to="/privacy" className={styles.termsLink}>Privacy Policy</Link>
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button
                                className={`${styles.submitButton} ${loading ? styles.loading : ''}`}
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className={styles.spinner}></div>
                                        Creating Account...
                                    </>
                                ) : (
                                    <>
                                        Create Account
                                        <svg className={styles.buttonIcon} viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}



                        {/* Login Link */}
                        <p className={styles.loginText}>
                            Already have an account?{" "}
                            <Link
                                to="/login"
                                onClick={(e) => {
                                    e.preventDefault();
                                    navigate('/login', { state: location.state });
                                }}
                                className={styles.loginLink}
                            >
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}