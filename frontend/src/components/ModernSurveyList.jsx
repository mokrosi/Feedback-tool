import React, { useState, useCallback } from 'react';
import { useApiCall, useApiList } from '../hooks/useApi';
import { SurveyService } from '../services/apiServices';
import { apiClient, errorHandler } from '../utils/apiClient';
import styles from './ModernSurveyList.module.css';

/**
 * Modern Survey List Component demonstrating best practices for API integration
 * Uses the new API response structure with proper error handling and loading states
 */
export default function ModernSurveyList() {
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [selectedSurvey, setSelectedSurvey] = useState(null);

    // Using the custom hook for automatic state management
    const {
        items: surveys,
        loading,
        error,
        fetchItems: refetchSurveys,
        createItem: createSurvey,
        deleteItem: deleteSurvey,
        errorMessage
    } = useApiList('/surveys/admin', {
        immediate: true,
        onItemCreated: (newSurvey) => {
            console.log('New survey created:', newSurvey);
            // Show success toast or notification
            showSuccessMessage('Survey created successfully!');
        },
        onItemDeleted: (surveyId) => {
            console.log('Survey deleted:', surveyId);
            setSelectedSurvey(null);
            showSuccessMessage('Survey deleted successfully!');
        },
        onError: (error, details) => {
            console.error('Survey operation failed:', details);
            showErrorMessage(details.message);
        }
    });

    // Using custom API call hook for survey statistics
    const {
        data: statistics,
        loading: statsLoading,
        execute: refreshStats,
        errorMessage: statsError
    } = useApiCall(
        () => SurveyService.getAllSurveys().then(surveys => SurveyService.calculateStats(surveys)),
        {
            immediate: true,
            onSuccess: (stats) => {
                console.log('Statistics loaded:', stats);
            }
        }
    );

    // Filter surveys based on status
    const filteredSurveys = React.useMemo(() => {
        if (!surveys) return [];
        return SurveyService.filterByStatus(surveys, filterStatus);
    }, [surveys, filterStatus]);

    // Handle survey creation with form validation
    const handleCreateSurvey = useCallback(async (surveyData) => {
        try {
            // Validate data before submission
            const validation = SurveyService.validateSurvey(surveyData);
            if (!validation.isValid) {
                showErrorMessage('Please fix the validation errors');
                return { success: false, errors: validation.errors };
            }

            // Create survey using the service layer
            const newSurvey = await createSurvey(surveyData);

            // Refresh statistics after creation
            refreshStats();

            return { success: true, data: newSurvey };
        } catch (error) {
            const errorDetails = apiClient.getErrorDetails(error);
            return { success: false, error: errorDetails.message, errors: errorDetails.errors };
        }
    }, [createSurvey, refreshStats]);

    // Handle survey deletion with confirmation
    const handleDeleteSurvey = useCallback(async (surveyId) => {
        const confirmed = window.confirm('Are you sure you want to delete this survey?');
        if (!confirmed) return;

        try {
            await deleteSurvey(surveyId);
            refreshStats();
        } catch (error) {
            console.error('Delete failed:', error);
        }
    }, [deleteSurvey, refreshStats]);

    // Handle survey results viewing
    const handleViewResults = useCallback(async (surveyId) => {
        try {
            const results = await SurveyService.getSurveyResults(surveyId);
            console.log('Survey results:', results);
            // Navigate to results page or show modal
        } catch (error) {
            const errorDetails = apiClient.getErrorDetails(error);
            showErrorMessage(`Failed to load results: ${errorDetails.message}`);
        }
    }, []);

    // Handle manual refresh
    const handleRefresh = useCallback(async () => {
        try {
            await Promise.all([
                refetchSurveys(),
                refreshStats()
            ]);
            showSuccessMessage('Data refreshed successfully!');
        } catch (error) {
            console.error('Refresh failed:', error);
        }
    }, [refetchSurveys, refreshStats]);

    // Utility functions for user feedback
    const showSuccessMessage = (message) => {
        // Implement your toast/notification system here
        console.log('✅ Success:', message);
    };

    const showErrorMessage = (message) => {
        // Implement your toast/notification system here
        console.error('❌ Error:', message);
    };

    // Loading state
    if (loading && !surveys) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
                <p>Loading surveys...</p>
            </div>
        );
    }

    // Error state
    if (error && !surveys) {
        return (
            <div className={styles.errorContainer}>
                <div className={styles.errorIcon}>⚠️</div>
                <h3>Failed to Load Surveys</h3>
                <p>{errorMessage}</p>
                <button onClick={handleRefresh} className={styles.retryButton}>
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className={styles.surveyListContainer}>
            {/* Header with actions */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Survey Management</h1>
                    <p>Manage your surveys and track their performance</p>
                </div>
                <div className={styles.headerActions}>
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className={styles.refreshButton}
                    >
                        {loading ? '🔄' : '↻'} Refresh
                    </button>
                    <button
                        onClick={() => {/* Handle create survey */ }}
                        className={styles.createButton}
                    >
                        + Create Survey
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            {statistics && (
                <div className={styles.statsGrid}>
                    <StatCard
                        title="Total Surveys"
                        value={statistics.totalSurveys}
                        icon="📊"
                        loading={statsLoading}
                    />
                    <StatCard
                        title="Active Surveys"
                        value={statistics.activeSurveys}
                        icon="⚡"
                        loading={statsLoading}
                    />
                    <StatCard
                        title="Total Responses"
                        value={statistics.totalResponses}
                        icon="💬"
                        loading={statsLoading}
                    />
                    <StatCard
                        title="Avg Completion"
                        value={`${statistics.avgCompletionRate}%`}
                        icon="✅"
                        loading={statsLoading}
                    />
                </div>
            )}

            {/* Filters */}
            <div className={styles.filtersContainer}>
                <div className={styles.filters}>
                    {['ALL', 'ACTIVE', 'INACTIVE', 'DRAFT'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`${styles.filterButton} ${filterStatus === status ? styles.active : ''}`}
                        >
                            {status} ({status === 'ALL' ? surveys?.length || 0 :
                                surveys?.filter(s => s.status === status).length || 0})
                        </button>
                    ))}
                </div>
            </div>

            {/* Error display for operations */}
            {errorMessage && (
                <div className={styles.errorBanner}>
                    <span className={styles.errorIcon}>⚠️</span>
                    {errorMessage}
                    <button onClick={() => window.location.reload()} className={styles.dismissButton}>
                        ✕
                    </button>
                </div>
            )}

            {/* Survey List */}
            <div className={styles.surveyGrid}>
                {filteredSurveys.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📋</div>
                        <h3>No surveys found</h3>
                        <p>
                            {filterStatus === 'ALL'
                                ? 'Create your first survey to get started!'
                                : `No surveys with status "${filterStatus}"`}
                        </p>
                        {filterStatus === 'ALL' && (
                            <button className={styles.createButton}>
                                Create Your First Survey
                            </button>
                        )}
                    </div>
                ) : (
                    filteredSurveys.map(survey => (
                        <SurveyCard
                            key={survey.id}
                            survey={survey}
                            onSelect={() => setSelectedSurvey(survey)}
                            onDelete={() => handleDeleteSurvey(survey.id)}
                            onViewResults={() => handleViewResults(survey.id)}
                            isSelected={selectedSurvey?.id === survey.id}
                        />
                    ))
                )}
            </div>

            {/* Loading overlay for operations */}
            {loading && surveys && (
                <div className={styles.loadingOverlay}>
                    <div className={styles.spinner} />
                </div>
            )}
        </div>
    );
}

// Statistics Card Component
function StatCard({ title, value, icon, loading }) {
    return (
        <div className={styles.statCard}>
            <div className={styles.statIcon}>{icon}</div>
            <div className={styles.statContent}>
                <div className={styles.statValue}>
                    {loading ? '...' : value}
                </div>
                <div className={styles.statTitle}>{title}</div>
            </div>
        </div>
    );
}

// Survey Card Component
function SurveyCard({ survey, onSelect, onDelete, onViewResults, isSelected }) {
    const formattedSurvey = SurveyService.formatSurvey(survey);

    return (
        <div
            className={`${styles.surveyCard} ${isSelected ? styles.selected : ''}`}
            onClick={onSelect}
        >
            <div className={styles.surveyHeader}>
                <h3 className={styles.surveyTitle}>{survey.title}</h3>
                <span className={`${styles.statusBadge} ${styles[`status${survey.status}`]}`}>
                    {formattedSurvey.statusDisplay}
                </span>
            </div>

            <p className={styles.surveyDescription}>{survey.description}</p>

            <div className={styles.surveyMeta}>
                <div className={styles.metaItem}>
                    <span className={styles.metaIcon}>📅</span>
                    Created: {formattedSurvey.formattedCreatedAt}
                </div>
                <div className={styles.metaItem}>
                    <span className={styles.metaIcon}>📊</span>
                    {formattedSurvey.responsesSummary} ({formattedSurvey.completionDisplay} completion)
                </div>
                <div className={styles.metaItem}>
                    <span className={styles.metaIcon}>❓</span>
                    {survey.totalQuestions || 0} questions
                </div>
            </div>

            <div className={styles.surveyActions}>
                <button
                    onClick={(e) => { e.stopPropagation(); onViewResults(); }}
                    className={styles.actionButton}
                    disabled={!survey.totalResponses}
                >
                    View Results
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); /* Edit survey */ }}
                    className={styles.actionButton}
                >
                    Edit
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className={`${styles.actionButton} ${styles.dangerButton}`}
                >
                    Delete
                </button>
            </div>
        </div>
    );
}