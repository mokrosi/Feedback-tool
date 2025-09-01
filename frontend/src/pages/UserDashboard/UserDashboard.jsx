import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserService } from '../../services/apiServices';
import LoadingSpinner from '../../components/LoadingSpinner';
import styles from './UserDashboard.module.css';

const UserDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [completedSurveys, setCompletedSurveys] = useState([]);
    const [dashboardStats, setDashboardStats] = useState({
        completedSurveysCount: 0,
        pendingSurveysCount: 0,
        participationRate: 0,
        averageCompletionTimeMinutes: null,
        totalTimeSpentMinutes: null,
        lastActivityDescription: 'No activity yet'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger entrance animation
        setIsVisible(true);

        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);

                const dashboardData = await UserService.getUserDashboard();

                // Update state with fetched data
                setDashboardStats({
                    completedSurveysCount: dashboardData.stats.completedSurveysCount,
                    pendingSurveysCount: dashboardData.stats.pendingSurveysCount,
                    participationRate: dashboardData.stats.participationRate,
                    averageCompletionTimeMinutes: dashboardData.stats.averageCompletionTimeMinutes,
                    totalTimeSpentMinutes: dashboardData.stats.totalTimeSpentMinutes,
                    lastActivityDescription: dashboardData.stats.lastActivityDescription
                });
                setCompletedSurveys(dashboardData.completedSurveys);

            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
                setError(err.message || 'Failed to load dashboard data');

                // Keep mock data as fallback for now
                const mockCompletedSurveys = [
                    {
                        id: 1,
                        title: "Employee Satisfaction Survey",
                        description: "Annual survey about workplace satisfaction and culture",
                        status: "COMPLETED",
                        completedDate: "2025-08-10",
                        deadline: "2025-08-15",
                        responses: 45
                    },
                    {
                        id: 2,
                        title: "Product Feedback Survey",
                        description: "Share your thoughts on our latest product features",
                        status: "COMPLETED",
                        completedDate: "2025-08-05",
                        deadline: "2025-08-12",
                        responses: 32
                    },
                    {
                        id: 3,
                        title: "Training Effectiveness Survey",
                        description: "Help us improve our training programs",
                        status: "COMPLETED",
                        completedDate: "2025-07-28",
                        deadline: "2025-08-01",
                        responses: 28
                    }
                ];

                setCompletedSurveys(mockCompletedSurveys);

            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
            // Logout should always succeed from the user's perspective
        }
    };

    const handleViewResults = (surveyId) => {
        // Navigate to user response view page
        navigate(`/user/response/${surveyId}`);
    };

    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        // Handle both ISO string and timestamp formats
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <LoadingSpinner
                fullScreen={true}
                text="Loading your dashboard..."
                size="large"
                variant="primary"
            />
        );
    }

    if (error) {
        return (
            <div className={styles.dashboardPage}>
                <div className={styles.errorContainer}>
                    <h2>Error Loading Dashboard</h2>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.dashboardPage}>
            {/* Animated Background Elements */}
            <div className={styles.backgroundElements}>
                <div className={styles.floatingShape1}></div>
                <div className={styles.floatingShape2}></div>
                <div className={styles.floatingShape3}></div>
                <div className={styles.floatingShape4}></div>
            </div>

            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.headerLeft}>
                        <h1 className={styles.welcomeTitle}>Welcome back, {user?.name}</h1>
                        <p className={styles.welcomeSubtitle}>View your completed surveys</p>
                    </div>
                    <div className={styles.headerRight}>
                        <div className={styles.userInfo}>
                            <div className={styles.userAvatar}>
                                {getInitials(user?.name)}
                            </div>
                            <div className={styles.userDetails}>
                                <h3>{user?.name}</h3>
                                <p>{user?.role}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className={styles.logoutButton}
                        >
                            <svg className={styles.logoutIcon} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className={styles.mainContent}>
                {/* Stats Overview */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <svg className={styles.statIcon} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className={styles.statValue}>{dashboardStats.completedSurveysCount}</div>
                        <div className={styles.statLabel}>Completed Surveys</div>
                    </div>
                    <div className={styles.statCard}>
                        <svg className={styles.statIcon} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        <div className={styles.statValue}>
                            {dashboardStats.averageCompletionTimeMinutes
                                ? `${dashboardStats.averageCompletionTimeMinutes}m`
                                : 'N/A'
                            }
                        </div>
                        <div className={styles.statLabel}>Avg. Completion Time</div>
                    </div>
                    <div className={styles.statCard}>
                        <svg className={styles.statIcon} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zM12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                        </svg>
                        <div className={styles.statValue}>
                            {dashboardStats.totalTimeSpentMinutes !== null
                                ? `${dashboardStats.totalTimeSpentMinutes}m`
                                : 'N/A'
                            }
                        </div>
                        <div className={styles.statLabel}>Total Time Spent</div>
                    </div>
                </div>

                {/* Survey Section */}
                <div className={styles.contentGrid}>
                    {/* Completed Surveys */}
                    <div className={`${styles.section} ${styles.fullWidth}`}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>
                                <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Your Completed Surveys
                            </h2>
                            <p className={styles.sectionSubtitle}>Your survey history and contributions</p>
                        </div>
                        <div className={styles.sectionContent}>
                            {completedSurveys.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <h3 className={styles.emptyTitle}>No completed surveys</h3>
                                    <p className={styles.emptyDescription}>
                                        Once you complete surveys, they'll appear here.
                                    </p>
                                </div>
                            ) : (
                                <div className={styles.surveyGrid}>
                                    {completedSurveys.map((survey) => (
                                        <div key={survey.id} className={styles.surveyCard}>
                                            <div className={styles.surveyHeader}>
                                                <h3 className={styles.surveyTitle}>{survey.title}</h3>
                                                <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>
                                                    COMPLETED
                                                </span>
                                            </div>
                                            <p className={styles.surveyDescription}>{survey.description}</p>
                                            <div className={styles.surveyMeta}>
                                                <span>✅ Completed: {formatDate(survey.completedDate)}</span>

                                            </div>
                                            <div className={styles.surveyActions}>
                                                <button
                                                    onClick={() => handleViewResults(survey.id)}
                                                    className={`${styles.actionButton} ${styles.secondaryButton}`}
                                                >
                                                    <svg className={styles.actionIcon} viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                    </svg>
                                                    View Results
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserDashboard;