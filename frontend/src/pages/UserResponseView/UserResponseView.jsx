import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserService, SurveyService } from '../../services/apiServices';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
    ArrowLeft,
    CheckCircle,
    Calendar,
    Clock,
    User,
    FileText,
    Star,
    Quote
} from 'lucide-react';
import styles from './UserResponseView.module.css';

const UserResponseView = () => {
    const { surveyId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [survey, setSurvey] = useState(null);
    const [userResponse, setUserResponse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserResponse = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch survey details and user's response
                const [surveyData, responseData] = await Promise.all([
                    SurveyService.getPublicSurvey(surveyId),
                    UserService.getUserResponse(surveyId)
                ]);

                setSurvey(surveyData);
                setUserResponse(responseData);
            } catch (err) {
                console.error('Error fetching user response:', err);

                // Try to get survey details for context
                try {
                    const surveyData = await SurveyService.getPublicSurvey(surveyId);
                    setSurvey(surveyData);
                } catch (surveyErr) {
                    console.error('Error fetching survey details:', surveyErr);
                }

                // Set appropriate error message based on the error
                if (err.response?.status === 404) {
                    setError('You haven\'t completed this survey yet, or your response could not be found.');
                } else if (err.response?.status === 401) {
                    setError('You are not authorized to view this response. Please log in again.');
                } else if (err.response?.status === 403) {
                    setError('You don\'t have permission to view this response.');
                } else {
                    setError('Failed to load your response. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        };

        if (surveyId) {
            fetchUserResponse();
        }
    }, [surveyId]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatQuestionType = (type) => {
        const typeMap = {
            'TEXT': 'Text',
            'MULTIPLE_CHOICE': 'Multiple Choice',
            'CHECKBOX': 'Checkbox',
            'RADIO': 'Radio Button',
            'DROPDOWN': 'Dropdown',
            'RATING': 'Rating',
            'DATE': 'Date',
            'EMAIL': 'Email',
            'NUMBER': 'Number'
        };
        return typeMap[type] || type;
    };

    const renderAnswer = (question, answer) => {
        if (!answer || answer.answerText === null || answer.answerText === undefined) {
            return <span className={styles.noAnswer}>No answer provided</span>;
        }

        switch (question.type) {
            case 'RATING':
                // Prefer ratingValue field if available, fallback to parsing answerText
                let rating;
                if (answer.ratingValue !== null && answer.ratingValue !== undefined) {
                    rating = answer.ratingValue;
                } else if (answer.answerText && answer.answerText.startsWith('RATING:')) {
                    rating = parseInt(answer.answerText.split(':')[1]);
                } else {
                    rating = parseInt(answer.answerText);
                }

                // Ensure rating is a valid number
                if (isNaN(rating) || rating < 0 || rating > 5) {
                    return <span className={styles.noAnswer}>Invalid rating value</span>;
                }

                return (
                    <div className={styles.ratingDisplay}>
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                size={20}
                                className={i < rating ? styles.starFilled : styles.starEmpty}
                                fill={i < rating ? '#FFD700' : 'none'}
                            />
                        ))}
                        <span className={styles.ratingText}>({rating}/5)</span>
                    </div>
                );

            case 'MULTIPLE_CHOICE':
            case 'CHECKBOX':
                if (Array.isArray(answer.answerText)) {
                    return (
                        <div className={styles.multipleAnswers}>
                            {answer.answerText.map((item, index) => (
                                <span key={index} className={styles.answerChip}>
                                    {item}
                                </span>
                            ))}
                        </div>
                    );
                }
                return <span className={styles.singleAnswer}>{answer.answerText}</span>;

            case 'TEXT':
            case 'LONG_TEXT':
                return (
                    <div className={styles.textAnswer}>
                        <Quote className={styles.quoteIcon} size={16} />
                        {answer.answerText}
                    </div>
                );

            default:
                return <span className={styles.singleAnswer}>{answer.answerText}</span>;
        }
    };

    if (loading) {
        return (
            <div className={styles.responsePage}>
                <LoadingSpinner
                    fullScreen={true}
                    text="Loading your response..."
                    size="large"
                    variant="primary"
                />
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.responsePage}>
                <div className={styles.errorContainer}>
                    <h2>Error Loading Response</h2>
                    <p>{error}</p>
                    <button
                        onClick={() => navigate('/user/dashboard')}
                        className={styles.backButton}
                    >
                        <ArrowLeft size={16} />
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.responsePage}>
            {/* Animated Background Elements */}
            <div className={styles.backgroundElements}>
                <div className={styles.floatingShape1}></div>
                <div className={styles.floatingShape2}></div>
                <div className={styles.floatingShape3}></div>
            </div>

            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <button
                        onClick={() => navigate('/user/dashboard')}
                        className={styles.backButton}
                    >
                        <ArrowLeft size={20} />
                        Back to Dashboard
                    </button>
                    <div className={styles.headerInfo}>
                        <h1 className={styles.surveyTitle}>{survey?.title}</h1>
                        <p className={styles.surveyDescription}>{survey?.description}</p>
                        <div className={styles.responseMeta}>
                            <span className={styles.metaItem}>
                                <CheckCircle size={16} />
                                Response Submitted
                            </span>
                            <span className={styles.metaItem}>
                                <Calendar size={16} />
                                {formatDate(userResponse?.submittedAt)}
                            </span>
                            {userResponse?.completionTimeSeconds && (
                                <span className={styles.metaItem}>
                                    <Clock size={16} />
                                    Completed in {Math.round(userResponse.completionTimeSeconds / 60)} minutes
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className={styles.mainContent}>
                <div className={styles.responseContainer}>
                    <div className={styles.responseHeader}>
                        <div className={styles.responseTitle}>
                            <User className={styles.responseIcon} size={24} />
                            <h2>Your Response</h2>
                        </div>
                        <div className={styles.responseStats}>
                            <div className={styles.statItem}>
                                <FileText size={16} />
                                <span>{userResponse?.answers?.length || 0} questions answered</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.questionsAndAnswers}>
                        {survey?.questions?.map((question, index) => {
                            const answer = userResponse?.answers?.find(a => a.questionId === question.id);

                            return (
                                <div key={question.id} className={styles.questionCard}>
                                    <div className={styles.questionHeader}>
                                        <div className={styles.questionNumber}>
                                            Q{question.orderNumber || index + 1}
                                        </div>
                                        <div className={styles.questionInfo}>
                                            <h3 className={styles.questionText}>{question.questionText}</h3>
                                            <div className={styles.questionMeta}>
                                                <span className={styles.questionType}>
                                                    {formatQuestionType(question.type)}
                                                </span>
                                                {question.required && (
                                                    <span className={styles.requiredBadge}>Required</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.answerSection}>
                                        <div className={styles.answerLabel}>Your Answer:</div>
                                        <div className={styles.answerContent}>
                                            {renderAnswer(question, answer)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Response Summary */}
                    <div className={styles.responseSummary}>
                        <h3>Response Summary</h3>
                        <div className={styles.summaryGrid}>
                            <div className={styles.summaryCard}>
                                <div className={styles.summaryIcon}>📝</div>
                                <div className={styles.summaryContent}>
                                    <div className={styles.summaryValue}>
                                        {userResponse?.answers?.length || 0} / {survey?.questions?.length || 0}
                                    </div>
                                    <div className={styles.summaryLabel}>Questions Answered</div>
                                </div>
                            </div>
                            <div className={styles.summaryCard}>
                                <div className={styles.summaryIcon}>✅</div>
                                <div className={styles.summaryContent}>
                                    <div className={styles.summaryValue}>
                                        {Math.round(((userResponse?.answers?.length || 0) / (survey?.questions?.length || 1)) * 100)}%
                                    </div>
                                    <div className={styles.summaryLabel}>Completion Rate</div>
                                </div>
                            </div>
                            <div className={styles.summaryCard}>
                                <div className={styles.summaryIcon}>📅</div>
                                <div className={styles.summaryContent}>
                                    <div className={styles.summaryValue}>
                                        {new Date(userResponse?.submittedAt || Date.now()).toLocaleDateString()}
                                    </div>
                                    <div className={styles.summaryLabel}>Submitted On</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserResponseView;