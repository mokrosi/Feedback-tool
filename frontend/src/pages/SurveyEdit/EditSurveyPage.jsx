import React, { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiClient } from "../../utils/apiClient";
import { useNavigate, useParams } from "react-router-dom";
import { SurveyService } from "../../services/apiServices";
import InputWithAI from "../../components/Input/InputWithAI";
import { improveSurveyTitle, improveSurveyDescription } from "../../utils/TextPhrasing";
import { improveQuestionPhrasing } from "../../utils/QuestionPhrasing";
import { Type, FileText, Star, CheckSquare, ChevronDown, GripVertical, Move3D, List, ArrowLeft } from "lucide-react";
import styles from "./EditSurveyPage.module.css";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const QUESTION_TYPES = {
    TEXT: {
        label: "Short Text",
        icon: Type,
        description: "Brief text responses"
    },
    LONG_TEXT: {
        label: "Long Text",
        icon: FileText,
        description: "Detailed text responses"
    },
    RATING: {
        label: "Rating Scale",
        icon: Star,
        description: "Numerical rating scale"
    },
    MULTIPLE_CHOICE: {
        label: "Multiple Choice",
        icon: CheckSquare,
        description: "Select from options"
    }
};

export default function EditSurveyPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { surveyId } = useParams();
    const autoSaveIntervalRef = useRef(null);
    const lastSavedRef = useRef(null);

    // Survey state
    const [survey, setSurvey] = useState({
        title: "",
        description: "",
        status: "DRAFT",
        endDate: ""
    });

    // Questions state
    const [questions, setQuestions] = useState([]);
    const [hasResponses, setHasResponses] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [autoSaveStatus, setAutoSaveStatus] = useState("");
    const [focusedQuestionIndex, setFocusedQuestionIndex] = useState(null);
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
    const [unsavedChanges, setUnsavedChanges] = useState(false);

    // Load survey data on component mount
    useEffect(() => {
        const loadSurvey = async () => {
            try {
                setIsLoading(true);
                const surveyData = await SurveyService.getSurvey(surveyId);

                // Set survey basic info
                setSurvey({
                    title: surveyData.title,
                    description: surveyData.description || "",
                    status: surveyData.status,
                    endDate: surveyData.endDate ? new Date(surveyData.endDate).toISOString().slice(0, 16) : ""
                });

                // Transform questions to match the creation form structure
                const transformedQuestions = surveyData.questions.map((q, index) => ({
                    id: q.id,
                    type: q.type,
                    questionText: q.questionText,
                    optionsJson: q.optionsJson,
                    orderNumber: q.orderNumber || index + 1,
                    required: q.required || false
                }));

                setQuestions(transformedQuestions);

                // Check if survey has responses
                try {
                    const responsesData = await SurveyService.getSurveyResponses(surveyId);
                    setHasResponses(responsesData && responsesData.responses && responsesData.responses.length > 0);
                } catch (responseError) {
                    // If we can't check responses, assume it might have responses for safety
                    console.warn("Could not check survey responses:", responseError);
                    setHasResponses(false);
                }

                setIsLoading(false);
            } catch (error) {
                console.error("Failed to load survey:", error);
                setErrors({ load: "Failed to load survey data" });
                setIsLoading(false);
            }
        };

        if (surveyId) {
            loadSurvey();
        }
    }, [surveyId]);

    // Auto-save functionality
    useEffect(() => {
        const handleAutoSave = async () => {
            if (!unsavedChanges || !survey.title.trim()) return;

            try {
                setAutoSaveStatus("saving");
                // Simulate auto-save (you can implement actual API call here)
                await new Promise(resolve => setTimeout(resolve, 1000));
                setAutoSaveStatus("saved");
                setUnsavedChanges(false);
                lastSavedRef.current = new Date();

                setTimeout(() => setAutoSaveStatus(""), 2000);
            } catch (error) {
                setAutoSaveStatus("error");
                setTimeout(() => setAutoSaveStatus(""), 3000);
            }
        };

        if (autoSaveIntervalRef.current) {
            clearInterval(autoSaveIntervalRef.current);
        }

        autoSaveIntervalRef.current = setInterval(handleAutoSave, 30000); // Auto-save every 30 seconds

        return () => {
            if (autoSaveIntervalRef.current) {
                clearInterval(autoSaveIntervalRef.current);
            }
        };
    }, [unsavedChanges, survey.title]);

    // AI improvement handlers
    const handleTitleImprovement = useCallback(async (currentTitle) => {
        console.log("📋 EditSurvey - Title improvement started:", {
            currentTitle: currentTitle?.substring(0, 100) + (currentTitle?.length > 100 ? "..." : ""),
            length: currentTitle?.length
        });

        if (!currentTitle.trim()) {
            console.warn("⚠️ EditSurvey - Empty title provided");
            alert('Please enter some text first to get AI assistance.');
            return;
        }

        try {
            console.log("🚀 EditSurvey - Calling improveSurveyTitle...");
            const improvedTitle = await improveSurveyTitle(currentTitle);

            console.log("✅ EditSurvey - Title improved:", {
                original: currentTitle,
                improved: improvedTitle,
                originalLength: currentTitle.length,
                improvedLength: improvedTitle?.length
            });

            setSurvey(prev => ({ ...prev, title: improvedTitle }));
            setUnsavedChanges(true);
            if (errors.title) {
                setErrors(prev => ({ ...prev, title: null }));
            }
            return improvedTitle; // Return the improved text
        } catch (error) {
            console.error('❌ EditSurvey - Error improving title:', error);
            alert('Failed to improve title. Please try again.');
            throw error; // Re-throw to maintain error handling
        }
    }, [errors.title]);

    const handleDescriptionImprovement = useCallback(async (currentDescription) => {
        console.log("📝 EditSurvey - Description improvement started:", {
            currentDescription: currentDescription?.substring(0, 100) + (currentDescription?.length > 100 ? "..." : ""),
            length: currentDescription?.length
        });

        if (!currentDescription.trim()) {
            console.warn("⚠️ EditSurvey - Empty description provided");
            alert('Please enter some text first to get AI assistance.');
            return;
        }

        try {
            console.log("🚀 EditSurvey - Calling improveSurveyDescription...");
            const improvedDescription = await improveSurveyDescription(currentDescription);

            console.log("✅ EditSurvey - Description improved:", {
                original: currentDescription,
                improved: improvedDescription,
                originalLength: currentDescription.length,
                improvedLength: improvedDescription?.length
            });

            setSurvey(prev => ({ ...prev, description: improvedDescription }));
            setUnsavedChanges(true);
            return improvedDescription; // Return the improved text
        } catch (error) {
            console.error('❌ EditSurvey - Error improving description:', error);
            alert('Failed to improve description. Please try again.');
            throw error; // Re-throw to maintain error handling
        }
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey)) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        handleSubmit("DRAFT");
                        break;
                    case 'Enter':
                        if (e.shiftKey) {
                            e.preventDefault();
                            addQuestion();
                        }
                        break;
                    case '/':
                        e.preventDefault();
                        setShowKeyboardShortcuts(!showKeyboardShortcuts);
                        break;
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showKeyboardShortcuts]);

    // Add a new question
    const addQuestion = useCallback(() => {
        const newQuestion = {
            id: Date.now(), // Temporary ID for new questions
            type: "TEXT",
            questionText: "",
            optionsJson: null,
            orderNumber: questions.length + 1
        };
        setQuestions(prev => [...prev, newQuestion]);
        setFocusedQuestionIndex(questions.length);
        setUnsavedChanges(true);
    }, [questions.length]);

    // Remove a question
    const removeQuestion = useCallback((index) => {
        setQuestions(prev => {
            const updated = prev.filter((_, i) => i !== index);
            // Update order numbers
            const reordered = updated.map((q, i) => ({ ...q, orderNumber: i + 1 }));
            setUnsavedChanges(true);
            return reordered;
        });
    }, []);

    // Update question
    const updateQuestion = useCallback((index, field, value) => {
        setQuestions(prev => prev.map((q, i) => {
            if (i === index) {
                const updated = { ...q, [field]: value };

                // Clear options when changing from MULTIPLE_CHOICE or RATING
                if (field === "type" && (q.type === "MULTIPLE_CHOICE" || q.type === "RATING") &&
                    value !== "MULTIPLE_CHOICE" && value !== "RATING") {
                    updated.optionsJson = null;
                }

                // Set default options for RATING
                if (field === "type" && value === "RATING") {
                    updated.optionsJson = JSON.stringify({
                        scale: 6,
                        labels: { min: "Poor", max: "Excellent" }
                    });
                }

                // Set default options for MULTIPLE_CHOICE
                if (field === "type" && value === "MULTIPLE_CHOICE") {
                    updated.optionsJson = JSON.stringify(["Option 1", "Option 2"]);
                }

                setUnsavedChanges(true);
                return updated;
            }
            return q;
        }));
    }, []);

    // Handle multiple choice options
    const updateMultipleChoiceOptions = useCallback((questionIndex, options) => {
        updateQuestion(questionIndex, "optionsJson", JSON.stringify(options));
        setUnsavedChanges(true);
    }, [updateQuestion]);

    // Handle rating scale options
    const updateRatingOptions = useCallback((questionIndex, scale, minLabel, maxLabel) => {
        const ratingConfig = {
            scale: parseInt(scale),
            labels: { min: minLabel, max: maxLabel }
        };
        updateQuestion(questionIndex, "optionsJson", JSON.stringify(ratingConfig));
        setUnsavedChanges(true);
    }, [updateQuestion]);

    // Handle question text improvement
    const handleQuestionImprovement = useCallback(async (questionIndex, currentQuestionText) => {
        if (!currentQuestionText.trim()) {
            alert('Please enter some text first to get AI assistance.');
            return;
        }

        try {
            const questionType = questions[questionIndex]?.type || '';
            const improvedQuestion = await improveQuestionPhrasing(currentQuestionText, questionType);
            updateQuestion(questionIndex, 'questionText', improvedQuestion);
            return improvedQuestion; // Return the improved text
        } catch (error) {
            console.error('Error improving question:', error);
            alert('Failed to improve question. Please try again.');
            throw error; // Re-throw to maintain error handling
        }
    }, [questions, updateQuestion]);

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Handle drag end
    const handleDragEnd = useCallback((event) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setQuestions((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                const reorderedItems = arrayMove(items, oldIndex, newIndex);
                // Update order numbers
                const updatedItems = reorderedItems.map((item, index) => ({
                    ...item,
                    orderNumber: index + 1
                }));

                setUnsavedChanges(true);
                return updatedItems;
            });
        }
    }, []);

    // Validation
    const validateForm = () => {
        const newErrors = {};

        if (!survey.title.trim()) {
            newErrors.title = "Survey title is required";
        }

        if (questions.length === 0) {
            newErrors.questions = "At least one question is required";
        }

        questions.forEach((question, index) => {
            if (!question.questionText.trim()) {
                newErrors[`question_${index}_text`] = "Question text is required";
            }

            if (question.type === "MULTIPLE_CHOICE") {
                try {
                    const options = JSON.parse(question.optionsJson || "[]");
                    if (!Array.isArray(options) || options.length < 2) {
                        newErrors[`question_${index}_options`] = "At least 2 options are required";
                    }
                    if (options.some(opt => !opt.trim())) {
                        newErrors[`question_${index}_options`] = "All options must have text";
                    }
                } catch {
                    newErrors[`question_${index}_options`] = "Invalid options format";
                }
            }

            if (question.type === "RATING") {
                try {
                    const config = JSON.parse(question.optionsJson || "{}");
                    if (!config.scale || config.scale < 3 || config.scale > 10) {
                        newErrors[`question_${index}_rating`] = "Rating scale must be between 3-10";
                    }
                } catch {
                    newErrors[`question_${index}_rating`] = "Invalid rating configuration";
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit survey
    const handleSubmit = async (status = "DRAFT") => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setErrors({}); // Clear previous errors

        try {
            const surveyData = {
                title: survey.title,
                description: survey.description,
                active: status === "ACTIVE",
                endDate: survey.endDate ? new Date(survey.endDate).toISOString() : null,
                questions: questions.map(q => ({
                    type: q.type,
                    questionText: q.questionText,
                    optionsJson: q.optionsJson,
                    orderNumber: q.orderNumber,
                    required: q.required || false
                }))
            };

            await SurveyService.updateSurvey(surveyId, surveyData);

            // Survey updated successfully, navigate to admin dashboard
            navigate("/admin");
        } catch (error) {
            const errorDetails = apiClient.getErrorDetails(error);
            const errorMessage = errorDetails.message || "Failed to update survey";

            // Handle specific error cases
            if (errorMessage.includes("Cannot modify questions") ||
                errorMessage.includes("already has responses")) {
                setErrors({
                    submit: "⚠️ This survey already has responses. You can only update the title, description, end date, and publish/unpublish status. To make structural changes, create a new survey instead."
                });
            } else {
                setErrors({ submit: errorMessage });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'A';
    };

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading survey...</p>
            </div>
        );
    }

    return (
        <div className={styles.surveyCreationPage}>
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
                        <button
                            onClick={() => navigate("/admin")}
                            className={styles.backButton}
                        >
                            <ArrowLeft className={styles.backIcon} size={20} />
                            Back
                        </button>
                        <div className={styles.titleSection}>
                            <h1 className={styles.pageTitle}>
                                <svg className={styles.titleIcon} viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                                Edit Survey
                            </h1>
                            <p className={styles.pageSubtitle}>Modify your feedback survey</p>
                        </div>
                        <div className={styles.quickActions}>
                            <button
                                onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
                                className={styles.quickActionButton}
                            >
                                ⌨️ Shortcuts
                            </button>
                        </div>
                    </div>
                    <div className={styles.headerRight}>
                        <div className={styles.statusIndicators}>
                            {autoSaveStatus && (
                                <div className={`${styles.autoSaveStatus} ${styles[autoSaveStatus]}`}>
                                    {autoSaveStatus === "saving" && (
                                        <>
                                            <div className={styles.spinner}></div>
                                            Saving...
                                        </>
                                    )}
                                    {autoSaveStatus === "saved" && (
                                        <>
                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Saved
                                        </>
                                    )}
                                    {autoSaveStatus === "error" && (
                                        <>
                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                            </svg>
                                            Error saving
                                        </>
                                    )}
                                </div>
                            )}
                            {unsavedChanges && !autoSaveStatus && (
                                <div className={styles.unsavedIndicator}>
                                    <span className={styles.unsavedDot}></span>
                                    Unsaved changes
                                </div>
                            )}
                        </div>
                        <div className={styles.userInfo}>
                            <div className={styles.userAvatar}>
                                {getInitials(user?.name)}
                            </div>
                            <div className={styles.userDetails}>
                                <h3>{user?.name}</h3>
                                <p>{user?.role}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Keyboard Shortcuts */}
            {showKeyboardShortcuts && (
                <div className={styles.shortcutsTooltip}>
                    <div className={styles.shortcutsContent}>
                        <h4>Keyboard Shortcuts</h4>
                        <div className={styles.shortcutList}>
                            <div className={styles.shortcutItem}>
                                <kbd>Ctrl + S</kbd>
                                <span>Save Draft</span>
                            </div>
                            <div className={styles.shortcutItem}>
                                <kbd>Ctrl + Shift + Enter</kbd>
                                <span>Add Question</span>
                            </div>
                            <div className={styles.shortcutItem}>
                                <kbd>Ctrl + /</kbd>
                                <span>Toggle Shortcuts</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className={styles.mainContent}>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    {/* Warning Banner for surveys with responses */}
                    {hasResponses && (
                        <div className={styles.warningBanner}>
                            <div className={styles.warningContent}>
                                <svg className={styles.warningIcon} viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                                <div className={styles.warningText}>
                                    <h3>Survey Has Responses</h3>
                                    <p>This survey already has responses from users. You can edit the title, description, end date, and publish/unpublish status, but cannot modify questions. To make structural changes to questions, create a new survey instead.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={styles.surveyBuilder}>
                        {/* Main Content Area */}
                        <div className={styles.mainContentArea}>
                            {/* Survey Information */}
                            <div className={styles.section}>
                                <div className={styles.sectionHeader}>
                                    <h2 className={styles.sectionTitle}>
                                        <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                                        </svg>
                                        Survey Information
                                        {survey.title && <span className={styles.completedBadge}>✓</span>}
                                    </h2>
                                    <p className={styles.sectionSubtitle}>Basic details about your survey</p>
                                </div>
                                <div className={styles.sectionContent}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>
                                            Survey Title <span className={styles.required}>*</span>
                                        </label>
                                        <InputWithAI
                                            type="input"
                                            value={survey.title}
                                            onChange={(e) => {
                                                setSurvey(prev => ({ ...prev, title: e.target.value }));
                                                setUnsavedChanges(true);
                                                if (errors.title) {
                                                    setErrors(prev => ({ ...prev, title: null }));
                                                }
                                            }}
                                            placeholder="Enter survey title..."
                                            error={!!errors.title}
                                            onAIClick={handleTitleImprovement}
                                        />
                                        {errors.title && <span className={styles.errorText}>{errors.title}</span>}
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>
                                            Description
                                            <span className={styles.optional}>(optional)</span>
                                        </label>
                                        <InputWithAI
                                            type="textarea"
                                            value={survey.description}
                                            onChange={(e) => {
                                                setSurvey(prev => ({ ...prev, description: e.target.value }));
                                                setUnsavedChanges(true);
                                            }}
                                            placeholder="Describe your survey's purpose and instructions..."
                                            rows={3}
                                            onAIClick={handleDescriptionImprovement}
                                        />
                                        <div className={styles.characterCount}>
                                            {survey.description.length}/500
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>
                                            Survey End Date
                                            <span className={styles.optional}>(optional)</span>
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={survey.endDate}
                                            onChange={(e) => {
                                                setSurvey(prev => ({ ...prev, endDate: e.target.value }));
                                                setUnsavedChanges(true);
                                            }}
                                            className={styles.input}
                                            placeholder="Set when the survey should stop accepting responses"
                                        />
                                        <div className={styles.helpText}>
                                            If set, the survey will automatically stop accepting responses after this date and time.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Questions Section */}
                            <div className={styles.section}>
                                <div className={styles.sectionHeader}>
                                    <div className={styles.sectionTitleWrapper}>
                                        <h2 className={styles.sectionTitle}>
                                            <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                                            </svg>
                                            Survey Questions
                                            <span className={styles.questionCount}>({questions.length})</span>
                                            {questions.length > 0 && <span className={styles.completedBadge}>✓</span>}
                                        </h2>
                                        <p className={styles.sectionSubtitle}>Add and configure your survey questions</p>
                                    </div>
                                    <div className={styles.sectionActions}>
                                        <button
                                            onClick={addQuestion}
                                            className={styles.addQuestionHeaderButton}
                                            disabled={hasResponses}
                                            title={hasResponses ? "Cannot add questions to surveys with responses" : "Add a new question"}
                                        >
                                            <svg className={styles.addIcon} viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 4.5v15m7.5-7.5h-15" />
                                            </svg>
                                            Add Question
                                        </button>
                                    </div>
                                </div>
                                <div className={styles.sectionContent}>
                                    {errors.questions && <div className={styles.errorBanner}>{errors.questions}</div>}

                                    <SortableContext
                                        items={questions.map(q => q.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className={styles.questionsList}>
                                            {questions.map((question, index) => (
                                                <QuestionEditor
                                                    key={question.id}
                                                    question={question}
                                                    index={index}
                                                    onUpdate={updateQuestion}
                                                    onRemove={removeQuestion}
                                                    onUpdateMultipleChoice={updateMultipleChoiceOptions}
                                                    onUpdateRating={updateRatingOptions}
                                                    onQuestionImprovement={handleQuestionImprovement}
                                                    errors={errors}
                                                    isFocused={focusedQuestionIndex === index}
                                                    questionTypes={QUESTION_TYPES}
                                                    disabled={hasResponses}
                                                />
                                            ))}

                                            {questions.length === 0 && (
                                                <div className={styles.emptyQuestions}>
                                                    <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                                                    </svg>
                                                    <h3 className={styles.emptyTitle}>No questions yet</h3>
                                                    <p className={styles.emptyDescription}>
                                                        Start building your survey by adding your first question
                                                    </p>
                                                    <div className={styles.emptyActions}>
                                                        <button
                                                            onClick={addQuestion}
                                                            className={styles.emptyActionButton}
                                                        >
                                                            Add First Question
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </SortableContext>

                                    {questions.length > 0 && (
                                        <div className={styles.addQuestionSection}>
                                            <button
                                                onClick={addQuestion}
                                                className={styles.addQuestionButton}
                                                disabled={hasResponses}
                                                title={hasResponses ? "Cannot add questions to surveys with responses" : "Add another question"}
                                            >
                                                <svg className={styles.addIcon} viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 4.5v15m7.5-7.5h-15" />
                                                </svg>
                                                Add Question
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Progress Sidebar */}
                        <div className={styles.progressSection}>
                            <div className={styles.progressHeader}>
                                <h3 className={styles.progressTitle}>Survey Progress</h3>
                            </div>

                            <div className={styles.progressChecklist}>
                                <div className={`${styles.progressItem} ${survey.title ? styles.completed : styles.active}`}>
                                    <div className={styles.progressIcon}>
                                        {survey.title ? '✓' : '1'}
                                    </div>
                                    <span className={styles.progressText}>Survey Information</span>
                                </div>
                                <div className={`${styles.progressItem} ${questions.length > 0 ? styles.completed : questions.length === 0 && survey.title ? styles.active : ''}`}>
                                    <div className={styles.progressIcon}>
                                        {questions.length > 0 ? '✓' : '2'}
                                    </div>
                                    <span className={styles.progressText}>Add Questions ({questions.length})</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className={styles.actionSection}>
                                {errors.submit && <div className={styles.errorBanner}>{errors.submit}</div>}



                                <div className={styles.actionButtons}>
                                    <button
                                        onClick={() => navigate("/admin")}
                                        className={styles.cancelButton}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        onClick={() => handleSubmit("DRAFT")}
                                        className={styles.saveDraftButton}
                                        disabled={isSubmitting || !survey.title.trim()}
                                        title={
                                            hasResponses
                                                ? "Save changes and make survey inactive (users cannot submit responses)"
                                                : "Save as draft (users cannot submit responses until published)"
                                        }
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className={styles.spinner}></div>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <svg className={styles.saveIcon} viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                                                </svg>
                                                {hasResponses
                                                    ? (survey.status === "ACTIVE" ? "Save & Make Inactive" : "Save Changes")
                                                    : "Save as Draft"
                                                }
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => handleSubmit("ACTIVE")}
                                        className={styles.publishButton}
                                        disabled={isSubmitting || !survey.title.trim() || (!hasResponses && questions.length === 0)}
                                        title="Make survey active and allow users to submit responses"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className={styles.spinner}></div>
                                                Publishing...
                                            </>
                                        ) : (
                                            <>
                                                <svg className={styles.publishIcon} viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                                </svg>
                                                {survey.status === "ACTIVE" ? "Update & Keep Published" : "Publish Survey"}
                                                {survey.title.trim() && (hasResponses || questions.length > 0) && (
                                                    <span className={styles.readyBadge}>Ready!</span>
                                                )}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Survey Preview in Sidebar */}
                            {questions.length > 0 && survey.title && (
                                <div className={styles.sidebarPreview}>
                                    <h4>Quick Preview</h4>
                                    <div className={styles.miniPreview}>
                                        <h5>{survey.title}</h5>
                                        {survey.description && <p>{survey.description.slice(0, 100)}...</p>}
                                        <div className={styles.miniQuestions}>
                                            {questions.slice(0, 3).map((q, i) => (
                                                <div key={q.id} className={styles.miniQuestion}>
                                                    {i + 1}. {q.questionText || "Question text"}
                                                </div>
                                            ))}
                                            {questions.length > 3 && (
                                                <div className={styles.moreQuestions}>
                                                    +{questions.length - 3} more questions
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Questions Organizer */}
                            {questions.length > 0 && (
                                <div className={styles.questionsOrganizer}>
                                    <div className={styles.organizerHeader}>
                                        <h4 className={styles.organizerTitle}>
                                            <List size={16} />
                                            Question Order
                                        </h4>
                                        <p className={styles.organizerSubtitle}>
                                            {hasResponses ? "View question order" : "Drag to reorder questions"}
                                        </p>
                                    </div>

                                    <SortableContext
                                        items={questions.map(q => q.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className={styles.organizerList}>
                                            {questions.map((question, index) => (
                                                <SortableQuestionItem
                                                    key={question.id}
                                                    question={question}
                                                    index={index}
                                                    questionTypes={QUESTION_TYPES}
                                                    disabled={hasResponses}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </div>
                            )}
                        </div>
                    </div>
                </DndContext>
            </main>
        </div>
    );
}

// Question Editor Component
function QuestionEditor({
    question,
    index,
    onUpdate,
    onRemove,
    onUpdateMultipleChoice,
    onUpdateRating,
    onQuestionImprovement,
    errors,
    isFocused,
    questionTypes,
    disabled = false
}) {
    const [multipleChoiceOptions, setMultipleChoiceOptions] = useState(() => {
        if (question.type === "MULTIPLE_CHOICE" && question.optionsJson) {
            try {
                return JSON.parse(question.optionsJson);
            } catch {
                return ["Option 1", "Option 2"];
            }
        }
        return ["Option 1", "Option 2"];
    });

    const [ratingConfig, setRatingConfig] = useState(() => {
        if (question.type === "RATING" && question.optionsJson) {
            try {
                return JSON.parse(question.optionsJson);
            } catch {
                return { scale: 6, labels: { min: "Poor", max: "Excellent" } };
            }
        }
        return { scale: 6, labels: { min: "Poor", max: "Excellent" } };
    });

    const [isExpanded, setIsExpanded] = useState(!question.questionText.trim());
    const [validationState, setValidationState] = useState("");

    // Real-time validation
    useEffect(() => {
        let state = "";
        if (question.questionText.trim()) {
            if (question.type === "MULTIPLE_CHOICE") {
                const hasValidOptions = multipleChoiceOptions.length >= 2 &&
                    multipleChoiceOptions.every(opt => opt.trim());
                state = hasValidOptions ? "valid" : "warning";
            } else if (question.type === "RATING") {
                state = "valid"; // Always valid since we have a fixed 0-5 star system
            } else {
                state = "valid";
            }
        } else {
            state = "empty";
        }
        setValidationState(state);
    }, [question.questionText, question.type, multipleChoiceOptions, ratingConfig]);

    const handleMultipleChoiceChange = (optionIndex, value) => {
        const updated = [...multipleChoiceOptions];
        updated[optionIndex] = value;
        setMultipleChoiceOptions(updated);
        onUpdateMultipleChoice(index, updated);
    };

    const addMultipleChoiceOption = () => {
        const updated = [...multipleChoiceOptions, `Option ${multipleChoiceOptions.length + 1}`];
        setMultipleChoiceOptions(updated);
        onUpdateMultipleChoice(index, updated);
    };

    const removeMultipleChoiceOption = (optionIndex) => {
        if (multipleChoiceOptions.length > 2) {
            const updated = multipleChoiceOptions.filter((_, i) => i !== optionIndex);
            setMultipleChoiceOptions(updated);
            onUpdateMultipleChoice(index, updated);
        }
    };

    const handleRatingChange = (field, value) => {
        const updated = { ...ratingConfig };
        if (field === "minLabel") {
            updated.labels.min = value;
        } else if (field === "maxLabel") {
            updated.labels.max = value;
        }
        setRatingConfig(updated);
        // Always use scale 6 (0-5 stars) for the new system
        onUpdateRating(index, 6, updated.labels.min, updated.labels.max);
    };

    return (
        <div
            className={`${styles.questionCard} ${isFocused ? styles.focused : ''} ${styles[validationState]} ${disabled ? styles.disabled : ''}`}
        >
            <div className={styles.questionHeader}>
                <div className={styles.questionNumber}>
                    <span>Question {index + 1}</span>
                    {validationState === "valid" && <span className={styles.validIcon}>✓</span>}
                    {validationState === "warning" && <span className={styles.warningIcon}>⚠</span>}
                </div>
                <div className={styles.questionActions}>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={styles.toggleButton}
                        title={isExpanded ? "Collapse" : "Expand"}
                    >
                        <svg
                            className={`${styles.toggleIcon} ${isExpanded ? styles.expanded : ''}`}
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onRemove(index)}
                        className={styles.removeButton}
                        title="Remove question"
                        disabled={disabled}
                    >
                        <svg className={styles.removeIcon} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Question Summary (when collapsed) */}
            {!isExpanded && (
                <div className={styles.questionSummary} onClick={() => setIsExpanded(true)}>
                    <div className={styles.summaryType}>
                        {React.createElement(questionTypes[question.type]?.icon, {
                            className: styles.typeIcon,
                            size: 16
                        })}
                        <span className={styles.typeLabel}>{questionTypes[question.type]?.label}</span>
                    </div>
                    <div className={styles.summaryText}>
                        {question.questionText || <em>Click to add question text</em>}
                    </div>
                </div>
            )}

            {/* Question Content (when expanded) */}
            {isExpanded && (
                <div className={styles.questionContent}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Question Type</label>
                        <div className={styles.selectWrapper}>
                            <select
                                value={question.type}
                                onChange={(e) => onUpdate(index, "type", e.target.value)}
                                className={styles.select}
                                disabled={disabled}
                            >
                                {Object.entries(questionTypes).map(([type, config]) => (
                                    <option key={type} value={type}>
                                        {config.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className={styles.selectIcon} size={16} />
                        </div>
                        <div className={styles.selectedTypeInfo}>
                            {React.createElement(questionTypes[question.type]?.icon, {
                                className: styles.selectedTypeIcon,
                                size: 16
                            })}
                            <span className={styles.selectedTypeDescription}>
                                {questionTypes[question.type]?.description}
                            </span>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            Question Text <span className={styles.required}>*</span>
                        </label>
                        <InputWithAI
                            type="textarea"
                            value={question.questionText}
                            onChange={(e) => onUpdate(index, "questionText", e.target.value)}
                            placeholder="Enter your question..."
                            rows={3}
                            error={!!errors[`question_${index}_text`]}
                            onAIClick={(currentText) => onQuestionImprovement && onQuestionImprovement(index, currentText)}
                            className={errors[`question_${index}_text`] ? styles.error : ''}
                            disabled={disabled}
                        />
                        {errors[`question_${index}_text`] && (
                            <span className={styles.errorText}>{errors[`question_${index}_text`]}</span>
                        )}
                        <div className={styles.characterCount}>
                            {question.questionText.length}/200
                        </div>
                    </div>

                    {/* Multiple Choice Options */}
                    {question.type === "MULTIPLE_CHOICE" && (
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                Answer Options <span className={styles.required}>*</span>
                            </label>
                            <div className={styles.optionsList}>
                                {multipleChoiceOptions.map((option, optionIndex) => (
                                    <div key={optionIndex} className={styles.optionItem}>
                                        <span className={styles.optionNumber}>{optionIndex + 1}.</span>
                                        <input
                                            type="text"
                                            className={styles.optionInput}
                                            placeholder={`Option ${optionIndex + 1}`}
                                            value={option}
                                            onChange={(e) => handleMultipleChoiceChange(optionIndex, e.target.value)}
                                            disabled={disabled}
                                        />
                                        {multipleChoiceOptions.length > 2 && (
                                            <button
                                                onClick={() => removeMultipleChoiceOption(optionIndex)}
                                                className={styles.removeOptionButton}
                                                title="Remove option"
                                                disabled={disabled}
                                            >
                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={addMultipleChoiceOption}
                                className={styles.addOptionButton}
                                disabled={multipleChoiceOptions.length >= 8 || disabled}
                            >
                                <svg className={styles.addIcon} viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Add Option {multipleChoiceOptions.length < 8 ? "" : "(Max 8)"}
                            </button>
                            {errors[`question_${index}_options`] && (
                                <span className={styles.errorText}>{errors[`question_${index}_options`]}</span>
                            )}
                        </div>
                    )}

                    {/* Rating Scale Options */}
                    {question.type === "RATING" && (
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Rating Scale Configuration (0-5 Numbers)</label>
                            <div className={styles.ratingConfig}>
                                <div className={styles.labelInputs}>
                                    <div className={styles.labelInput}>
                                        <label className={styles.subLabel}>Min Label (0)</label>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            placeholder="e.g., Poor"
                                            value={ratingConfig.labels.min}
                                            onChange={(e) => handleRatingChange("minLabel", e.target.value)}
                                            disabled={disabled}
                                        />
                                    </div>
                                    <div className={styles.labelInput}>
                                        <label className={styles.subLabel}>Max Label (5)</label>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            placeholder="e.g., Excellent"
                                            value={ratingConfig.labels.max}
                                            onChange={(e) => handleRatingChange("maxLabel", e.target.value)}
                                            disabled={disabled}
                                        />
                                    </div>
                                </div>
                            </div>
                            {errors[`question_${index}_rating`] && (
                                <span className={styles.errorText}>{errors[`question_${index}_rating`]}</span>
                            )}
                        </div>
                    )}

                    {/* Required Question Toggle */}
                    <div className={styles.formGroup}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={question.required || false}
                                onChange={(e) => onUpdate(index, "required", e.target.checked)}
                                className={styles.checkbox}
                                disabled={disabled}
                            />
                            <span className={styles.checkboxText}>
                                Make this question required
                                <span className={styles.requiredBadge}>*</span>
                            </span>
                        </label>
                        <div className={styles.helpText}>
                            Required questions must be answered before submitting the survey
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Question Preview Component
function QuestionPreview({ question, ratingConfig, multipleChoiceOptions }) {
    if (!question.questionText) {
        return (
            <div className={styles.previewPlaceholder}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p>Question preview will appear here...</p>
            </div>
        );
    }

    return (
        <div className={styles.questionPreview}>
            <h4 className={styles.previewQuestionText}>{question.questionText}</h4>

            {question.type === "TEXT" && (
                <div className={styles.previewInputWrapper}>
                    <input
                        type="text"
                        className={styles.previewInput}
                        placeholder="Short answer..."
                        disabled
                    />
                    <div className={styles.inputHint}>Single line text response</div>
                </div>
            )}

            {question.type === "LONG_TEXT" && (
                <div className={styles.previewInputWrapper}>
                    <textarea
                        className={styles.previewTextarea}
                        placeholder="Long answer..."
                        rows={3}
                        disabled
                    />
                    <div className={styles.inputHint}>Multi-line text response</div>
                </div>
            )}

            {question.type === "MULTIPLE_CHOICE" && (
                <div className={styles.previewOptions}>
                    {multipleChoiceOptions.map((option, index) => (
                        <label key={index} className={styles.previewOption}>
                            <input type="radio" name={`preview_${question.id}`} disabled />
                            <span className={styles.optionText}>{option}</span>
                        </label>
                    ))}
                    <div className={styles.inputHint}>
                        {multipleChoiceOptions.length} options • Single selection
                    </div>
                </div>
            )}

            {question.type === "RATING" && (
                <div className={styles.previewRating}>
                    <div className={styles.ratingScale}>
                        <span className={styles.ratingLabel}>{ratingConfig.labels.min}</span>
                        <div className={styles.ratingButtons}>
                            {Array.from({ length: 6 }, (_, i) => (
                                <button key={i} className={styles.ratingButton} disabled>
                                    {i}
                                </button>
                            ))}
                        </div>
                        <span className={styles.ratingLabel}>{ratingConfig.labels.max}</span>
                    </div>
                    <div className={styles.inputHint}>
                        0-5 numeric rating • {ratingConfig.labels.min} to {ratingConfig.labels.max}
                    </div>
                </div>
            )}
        </div>
    );
}

// Sortable Question Item for Sidebar
function SortableQuestionItem({ question, index, questionTypes, disabled = false }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: question.id,
        disabled: disabled
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.8 : 1,
    };

    const getQuestionPreview = (questionText) => {
        if (!questionText.trim()) return "New question...";
        return questionText.length > 40
            ? questionText.substring(0, 40) + "..."
            : questionText;
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${styles.sortableQuestionItem} ${isDragging ? styles.dragging : ''} ${disabled ? styles.disabled : ''}`}
            {...attributes}
        >
            <div className={styles.questionItemContent}>
                <div className={styles.questionItemHeader}>
                    <span className={styles.questionNumber}>{index + 1}</span>
                    <div className={styles.questionTypeIcon}>
                        {React.createElement(questionTypes[question.type]?.icon, {
                            size: 14
                        })}
                    </div>
                </div>
                <div className={styles.questionItemText}>
                    {getQuestionPreview(question.questionText)}
                </div>
                <div className={styles.questionItemType}>
                    {questionTypes[question.type]?.label}
                </div>
            </div>
            <div
                className={`${styles.dragHandle} ${disabled ? styles.disabled : ''}`}
                {...listeners}
            >
                <GripVertical size={16} />
            </div>
        </div>
    );
}