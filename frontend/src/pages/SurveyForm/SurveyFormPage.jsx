import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiClient } from "../../utils/apiClient";
import styles from "./SurveyFormPage.module.css";

export default function SurveyFormPage() {
    const { surveyId } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    const [survey, setSurvey] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [showAuthDialog, setShowAuthDialog] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [showStickyProgress, setShowStickyProgress] = useState(false);

    // Timer states for completion time tracking
    const [startTime, setStartTime] = useState(null);
    const [completionTimeSeconds, setCompletionTimeSeconds] = useState(0);
    const [currentTime, setCurrentTime] = useState(Date.now());

    // Update current time every second for timer display
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Function to format time display
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Get current elapsed time
    const getElapsedTime = () => {
        if (!startTime) return 0;
        return Math.floor((currentTime - startTime) / 1000);
    };

    // Load survey data
    useEffect(() => {
        const loadSurvey = async () => {
            try {
                setLoading(true);

                // Use apiClient for consistent error handling
                const surveyData = await apiClient.get(`/public/surveys/${surveyId}`);

                setSurvey(surveyData);

                // Initialize answers object
                const initialAnswers = {};
                surveyData.questions.forEach(question => {
                    initialAnswers[question.id] = "";
                });
                setAnswers(initialAnswers);

                // Start the timer when survey is loaded
                setStartTime(Date.now());

            } catch (error) {
                console.error('Error loading survey:', error);
                setError(apiClient.getErrorMessage(error));
            } finally {
                setLoading(false);
            }
        };

        if (surveyId) {
            loadSurvey();
        }
    }, [surveyId]);

    useEffect(() => {
        // Trigger entrance animation
        if (!loading) {
            setIsVisible(true);
        }
    }, [loading]);

    // Handle scroll for sticky progress bar
    useEffect(() => {
        const handleScroll = () => {
            const surveyHeader = document.querySelector(`.${styles.surveyHeader}`);
            if (surveyHeader) {
                const headerBottom = surveyHeader.getBoundingClientRect().bottom;
                setShowStickyProgress(headerBottom < 0);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Handle answer changes
    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    // Calculate progress
    const calculateProgress = () => {
        if (!survey || !survey.questions) return 0;

        const totalQuestions = survey.questions.length;
        const answeredQuestions = Object.values(answers).filter(answer =>
            answer && answer.toString().trim() !== ""
        ).length;

        return Math.round((answeredQuestions / totalQuestions) * 100);
    };

    // Check if survey has expired
    const isSurveyExpired = () => {
        if (!survey?.endDate) return false;
        return new Date() > new Date(survey.endDate);
    };

    // Check if survey is inactive
    const isSurveyInactive = () => {
        return survey?.status === "INACTIVE";
    };

    // Check if survey is not available for responses
    const isSurveyNotAvailable = () => {
        return isSurveyInactive() || isSurveyExpired();
    };

    // Check if survey is private and handle authentication
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate required fields
        const missingRequiredFields = [];
        survey.questions.forEach((question) => {
            if (question.required) {
                const answer = answers[question.id];
                if (!answer || answer.toString().trim() === "") {
                    missingRequiredFields.push(question.questionText);
                }
            }
        });

        if (missingRequiredFields.length > 0) {
            setError(`Please answer all required questions: ${missingRequiredFields.join(", ")}`);
            return;
        }

        // Check if survey requires authentication
        if (survey.isPrivate && !isAuthenticated()) {
            setShowAuthDialog(true);
            return;
        }

        await submitSurvey();
    };

    const submitSurvey = async () => {
        setSubmitting(true);
        setError("");

        try {
            // Calculate completion time
            const endTime = Date.now();
            const completionTime = startTime ? Math.round((endTime - startTime) / 1000) : 0;
            setCompletionTimeSeconds(completionTime);

            // Format answers according to the backend DTO format
            const formattedAnswers = Object.entries(answers)
                .filter(([questionId, answer]) => {
                    if (!answer || answer.toString().trim() === "") return false;

                    // Find the question to check its type
                    const question = survey.questions.find(q => q.id.toString() === questionId);
                    return question; // Only include answers for valid questions
                })
                .map(([questionId, answer]) => {
                    const question = survey.questions.find(q => q.id.toString() === questionId);
                    const answerDto = { questionId: parseInt(questionId) };

                    if (question && question.type === "RATING") {
                        // For rating questions, send as numeric ratingValue (0-5)
                        const ratingValue = parseInt(answer);
                        if (ratingValue >= 0 && ratingValue <= 5) {
                            answerDto.ratingValue = ratingValue;
                        }
                    } else {
                        // For other question types, send as text answerValue
                        answerDto.answerValue = answer.toString();
                    }

                    return answerDto;
                });

            const submissionData = {
                answers: formattedAnswers,
                completionTimeSeconds: completionTime
            };

            // Use apiClient for consistent error handling and response structure
            await apiClient.post(`/public/surveys/${surveyId}/responses`, submissionData);
            setSubmitted(true);

        } catch (error) {
            console.error('Error submitting survey:', error);
            setError(apiClient.getErrorMessage(error));
        } finally {
            setSubmitting(false);
        }
    };

    const continueAnonymously = () => {
        setShowAuthDialog(false);
        submitSurvey();
    };

    const goToLogin = () => {
        navigate('/login', { state: { returnTo: `/survey/${surveyId}` } });
    };

    const goToSignup = () => {
        navigate('/signup', { state: { returnTo: `/survey/${surveyId}` } });
    };

    if (loading) {
        return (
            <div className={styles.loadingPage}>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>Loading survey...</p>
                </div>
            </div>
        );
    }

    if (error && !survey) {
        return (
            <div className={styles.errorPage}>
                <div className={styles.errorContainer}>
                    <svg className={styles.errorIcon} viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <h2>Survey Not Found</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate('/')} className={styles.homeButton}>
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className={styles.successPage}>
                <div className={styles.backgroundElements}>
                    <div className={styles.floatingShape1}></div>
                    <div className={styles.floatingShape2}></div>
                </div>
                <div className={styles.successContainer}>
                    <svg className={styles.successIcon} viewBox="0 0 50 50">
                        <circle cx="25" cy="25" r="20" className={styles.successCircle} />
                        <path d="M15 25 L22 32 L35 18" className={styles.successCheck} />
                    </svg>
                    <h2>Thank You!</h2>
                    <p>Your response has been submitted successfully.</p>
                    <button onClick={() => navigate('/')} className={styles.homeButton}>
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.surveyPage}>
            {/* Sticky Progress Bar */}
            {showStickyProgress && (
                <div className={styles.stickyProgressBar}>
                    <div className={styles.stickyProgressContent}>
                        <div className={styles.stickyProgressInfo}>
                            <span className={styles.stickyProgressText}>
                                {survey.title} • {Object.values(answers).filter(answer => answer && answer.toString().trim() !== "").length}/{survey.questions.length}
                            </span>
                            <span className={styles.stickyProgressPercentage}>{calculateProgress()}%</span>
                            <span className={styles.stickyProgressTime}>⏱️ {formatTime(getElapsedTime())}</span>
                        </div>
                        <div className={styles.stickyProgressBarTrack}>
                            <div
                                className={styles.stickyProgressFill}
                                style={{ width: `${calculateProgress()}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Animated Background Elements */}
            <div className={styles.backgroundElements}>
                <div className={styles.floatingShape1}></div>
                <div className={styles.floatingShape2}></div>
                <div className={styles.floatingShape3}></div>
                <div className={styles.floatingShape4}></div>
            </div>

            {/* Main Content Container */}
            <div className={`${styles.surveyContainer} ${isVisible ? styles.fadeIn : ''}`}>
                {/* Survey Header */}
                <div className={styles.surveyHeader}>
                    <div className={styles.logoContainer}>
                        <div className={styles.logo}>
                            <svg viewBox="0 0 50 50" className={styles.logoSvg}>
                                <circle cx="25" cy="25" r="20" className={styles.logoCircle} />
                                <path d="M15 25 L22 32 L35 18" className={styles.logoCheck} />
                            </svg>
                        </div>
                        <h1 className={styles.logoText}>FeedbackPro</h1>
                    </div>

                    {/* Auth Status */}
                    {!isAuthenticated() && (
                        <div className={styles.authPrompt}>
                            <div className={styles.authPromptContent}>
                                <div className={styles.authPromptLeft}>
                                    <svg className={styles.authIcon} viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                    </svg>
                                    <span className={styles.authPromptText}>Sign in to save your progress</span>
                                </div>
                                <div className={styles.authButtons}>
                                    <button
                                        onClick={() => {
                                            // Store return URL in localStorage
                                            const returnUrl = `/survey/${surveyId}`;
                                            console.log('Setting returnTo in localStorage:', returnUrl);
                                            localStorage.setItem('returnTo', returnUrl);
                                            console.log('Stored returnTo:', localStorage.getItem('returnTo'));
                                            navigate('/login', { state: { returnTo: returnUrl } });
                                        }}
                                        className={styles.loginButton}
                                        type="button"
                                    >
                                        <svg className={styles.loginIcon} viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Sign In
                                    </button>
                                    <button
                                        onClick={() => {
                                            // Store return URL in localStorage
                                            localStorage.setItem('returnTo', `/survey/${surveyId}`);
                                            navigate('/signup', { state: { returnTo: `/survey/${surveyId}` } });
                                        }}
                                        className={styles.signupButton}
                                        type="button"
                                    >
                                        <svg className={styles.signupIcon} viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                                        </svg>
                                        Sign Up
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Welcome Message for Authenticated Users */}
                    {isAuthenticated() && (
                        <div className={styles.welcomeMessage}>
                            <svg className={styles.welcomeIcon} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                            <span className={styles.welcomeText}>Welcome back, {user?.name || user?.email}!</span>
                        </div>
                    )}

                    <div className={styles.surveyInfo}>
                        <h2 className={styles.surveyTitle}>{survey.title}</h2>
                        {survey.description && (
                            <p className={styles.surveyDescription}>{survey.description}</p>
                        )}

                       

                        {/* Survey End Date Info */}
                        {survey.endDate && (
                            <div className={styles.endDateInfo}>
                                <svg className={styles.clockIcon} viewBox="0 0 24 24" fill="currentColor">
                                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                                </svg>
                                <span className={`${styles.endDateText} ${isSurveyExpired() ? styles.expired : ''}`}>
                                    {isSurveyExpired()
                                        ? `Survey closed on ${new Date(survey.endDate).toLocaleDateString()}`
                                        : `Survey closes on ${new Date(survey.endDate).toLocaleDateString()}`
                                    }
                                </span>
                            </div>
                        )}

                        {/* Expired Survey Warning */}
                        {isSurveyExpired() && !isSurveyInactive() && (
                            <div className={styles.expiredWarning}>
                                <svg className={styles.warningIcon} viewBox="0 0 24 24" fill="currentColor">
                                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                                </svg>
                                <div className={styles.warningContent}>
                                    <h3>Survey Closed</h3>
                                    <p>This survey is no longer accepting responses. The deadline has passed.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className={styles.progressContainer}>
                        <div className={styles.progressInfo}>
                            <span className={styles.progressText}>
                                Progress: {Object.values(answers).filter(answer => answer && answer.toString().trim() !== "").length} of {survey.questions.length} questions answered
                            </span>
                            <span className={styles.progressPercentage}>{calculateProgress()}%</span>
                            <span className={styles.progressTime}>⏱️ {formatTime(getElapsedTime())}</span>
                        </div>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${calculateProgress()}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Survey Form */}
                <div className={styles.formContainer}>
                    {!isSurveyNotAvailable() ? (
                        <form onSubmit={handleSubmit} className={styles.surveyForm}>
                            {error && (
                                <div className={styles.errorMessage}>
                                    <svg className={styles.errorIcon} viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            {survey.questions.map((question, index) => (
                                <div key={question.id} className={styles.questionCard}>
                                    <div className={styles.questionHeader}>
                                        <span className={styles.questionNumber}>{index + 1}</span>
                                        <h3 className={styles.questionText}>{question.questionText}</h3>
                                        {question.required && <span className={styles.required}>*</span>}
                                    </div>

                                    <div className={styles.answerSection}>
                                        <QuestionInput
                                            question={question}
                                            value={answers[question.id] || ""}
                                            onChange={(value) => handleAnswerChange(question.id, value)}
                                        />
                                    </div>
                                </div>
                            ))}

                            {/* Submit Button */}
                            <div className={styles.submitSection}>
                                <button
                                    type="submit"
                                    className={`${styles.submitButton} ${submitting ? styles.loading : ''}`}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <div className={styles.spinner}></div>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            Submit Survey
                                            <svg className={styles.submitIcon} viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className={styles.expiredFormMessage}>
                            <svg className={styles.expiredIcon} viewBox="0 0 24 24" fill="currentColor">
                                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                            </svg>
                            <h3>Survey Unavailable</h3>
                            <p>
                                {isSurveyInactive()
                                    ? "This survey is currently inactive and not accepting responses. Please contact the survey administrator if you believe this is an error."
                                    : "This survey has closed and is no longer accepting new responses."
                                }
                            </p>
                            <button onClick={() => navigate('/')} className={styles.homeButton}>
                                Return to Home
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Authentication Dialog */}
            {showAuthDialog && (
                <div className={styles.dialogOverlay} onClick={() => setShowAuthDialog(false)}>
                    <div className={styles.authDialog} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.dialogHeader}>
                            <h3>Authentication Required</h3>
                            <button
                                className={styles.closeButton}
                                onClick={() => setShowAuthDialog(false)}
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className={styles.dialogContent}>
                            <p>This survey requires authentication. Would you like to:</p>

                            <div className={styles.authOptions}>
                                <button onClick={goToLogin} className={styles.primaryButton}>
                                    <svg className={styles.buttonIcon} viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Sign In
                                </button>

                                <button onClick={goToSignup} className={styles.secondaryButton}>
                                    <svg className={styles.buttonIcon} viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                                    </svg>
                                    Create Account
                                </button>

                                <button onClick={continueAnonymously} className={styles.tertiaryButton}>
                                    Continue Anonymously
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Question Input Component
function QuestionInput({ question, value, onChange }) {
    const handleRatingChange = (rating) => {
        // Store rating as string for consistency with other input types
        onChange(rating.toString());
    };

    switch (question.type) {
        case "TEXT":
            return (
                <input
                    type="text"
                    className={styles.textInput}
                    placeholder="Enter your answer..."
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required={question.required}
                />
            );

        case "LONG_TEXT":
            return (
                <textarea
                    className={styles.textareaInput}
                    placeholder="Enter your detailed answer..."
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    rows={4}
                    required={question.required}
                />
            );

        case "MULTIPLE_CHOICE":
            const options = question.optionsJson ? JSON.parse(question.optionsJson) : [];
            return (
                <div className={styles.multipleChoiceOptions}>
                    {options.map((option, index) => (
                        <label key={index} className={styles.optionLabel}>
                            <input
                                type="radio"
                                name={`question_${question.id}`}
                                value={option}
                                checked={value === option}
                                onChange={(e) => onChange(e.target.value)}
                                required={question.required}
                            />
                            <span className={styles.optionText}>{option}</span>
                        </label>
                    ))}
                </div>
            );

        case "RATING":
            // Simple 0-5 numeric rating system
            return (
                <div className={styles.ratingInput}>
                    <div className={styles.ratingScale}>
                        <span className={styles.ratingLabel}>Poor</span>
                        <div className={styles.ratingButtons}>
                            {Array.from({ length: 6 }, (_, i) => {
                                const ratingValue = i; // 0 to 5
                                const isSelected = value === ratingValue.toString();

                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        className={`${styles.ratingButton} ${isSelected ? styles.selected : ''}`}
                                        onClick={() => handleRatingChange(ratingValue)}
                                        title={`Rating: ${ratingValue} out of 5`}
                                    >
                                        {ratingValue}
                                    </button>
                                );
                            })}
                        </div>
                        <span className={styles.ratingLabel}>Excellent</span>
                    </div>
                    <div className={styles.ratingHint}>
                        Click a number to rate from 0 (Poor) to 5 (Excellent)
                    </div>
                </div>
            );

        default:
            return (
                <input
                    type="text"
                    className={styles.textInput}
                    placeholder="Enter your answer..."
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required={question.required}
                />
            );
    }
}
