import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar
} from "recharts";
import {
    ArrowLeft,
    Eye,
    Users,
    BarChart3,
    Clock,
    Calendar,
    Download,
    Share2,
    Settings,
    TrendingUp,
    Filter,
    Search,
    X,
    CheckCircle,
    AlertCircle,
    FileText,
    MessageSquare,
    Hash,
    Globe,
    UserCheck,
    UserX,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Copy,
    RefreshCw,
    Edit3,
    Trash2,
    QrCode
} from "lucide-react";
import QRCode from "qrcode";
import styles from "./SurveyViewPage.module.css";
import { SurveyService, ResponseService } from "../../services/apiServices";
import { useDialog } from "../../hooks/useDialog";
import Dialog from "../../components/Dialog";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
    exportSurveyResponses,
    exportSurveyAnalytics,
    exportSurveySummary
} from "../../utils/csvExporter";

const COLORS = {
    primary: "#667eea",
    secondary: "#764ba2",
    success: "#43e97b",
    warning: "#feca57",
    error: "#ff6b6b",
    info: "#38bdf8",
    neutral: "#6b7280"
};

const CHART_COLORS = [
    "#667eea", "#764ba2", "#43e97b", "#feca57", "#ff6b6b",
    "#38bdf8", "#f97316", "#06d6a0", "#f72585", "#4c956c"
];

export default function SurveyViewPage() {
    const { surveyId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { dialogState, showDialog, closeDialog } = useDialog();

    // State management
    const [surveyDetails, setSurveyDetails] = useState(null);
    const [surveyResults, setSurveyResults] = useState(null);
    const [surveyResponses, setSurveyResponses] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("ALL");
    const [expandedQuestions, setExpandedQuestions] = useState(new Set());
    const [showShareModal, setShowShareModal] = useState(false);
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
    const qrCanvasRef = useRef(null);

    // Helper functions (moved before useMemo to avoid hoisting issues)
    const generateResponseTrendData = (responses) => {
        if (!responses || responses.length === 0) return [];

        const last30Days = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return {
                date: date.toISOString().split('T')[0],
                count: 0,
                label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            };
        });

        responses.forEach(response => {
            if (response.submittedAt) {
                const responseDate = new Date(response.submittedAt).toISOString().split('T')[0];
                const dayData = last30Days.find(day => day.date === responseDate);
                if (dayData) {
                    dayData.count++;
                }
            }
        });

        return last30Days;
    };

    const generateTimeAnalytics = (responses) => {
        if (!responses || responses.length === 0) return {};

        const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
            hour,
            count: 0,
            label: `${hour}:00`
        }));

        const dailyData = Array.from({ length: 7 }, (_, day) => ({
            day,
            count: 0,
            label: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]
        }));

        responses.forEach(response => {
            if (response.submittedAt) {
                const date = new Date(response.submittedAt);
                const hour = date.getHours();
                const dayOfWeek = date.getDay();

                hourlyData[hour].count++;
                dailyData[dayOfWeek].count++;
            }
        });

        return { hourlyData, dailyData };
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

    const formatCompletionTimeFromSeconds = (seconds) => {
        if (!seconds || seconds <= 0) {
            return "N/A";
        }

        // Format the time
        if (seconds < 60) {
            return `${Math.round(seconds)}s`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.round(seconds % 60);
            return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.round((seconds % 3600) / 60);
            return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        }
    };

    const calculateAverageCompletionTime = (responses) => {
        if (!responses || !responses.responses) {
            return "N/A";
        }

        // Extract completion times from responses
        const completionTimes = responses.responses
            .map(response => response.completionTimeSeconds)
            .filter(time => time && time > 0);

        if (completionTimes.length === 0) {
            return "N/A";
        }

        // Calculate average
        const averageSeconds = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;

        // Format the time
        if (averageSeconds < 60) {
            return `${Math.round(averageSeconds)}s`;
        } else if (averageSeconds < 3600) {
            const minutes = Math.floor(averageSeconds / 60);
            const seconds = Math.round(averageSeconds % 60);
            return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
        } else {
            const hours = Math.floor(averageSeconds / 3600);
            const minutes = Math.round((averageSeconds % 3600) / 60);
            return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        }
    };

    // Fetch survey data
    useEffect(() => {
        const fetchSurveyData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch survey details (public endpoint for basic info)
                const surveyDetailsPromise = SurveyService.getPublicSurvey(surveyId);

                // Fetch survey results (admin only)
                const surveyResultsPromise = SurveyService.getSurveyResults(surveyId);

                // Fetch survey responses (admin only)
                const surveyResponsesPromise = ResponseService.getResponsesBySurvey(surveyId);

                const [details, results, responses] = await Promise.all([
                    surveyDetailsPromise,
                    surveyResultsPromise,
                    surveyResponsesPromise
                ]);

                setSurveyDetails(details);
                setSurveyResults(results);
                setSurveyResponses(responses);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching survey data:", err);
                setError(err.message || "Failed to load survey data");
            } finally {
                setLoading(false);
            }
        };

        if (surveyId) {
            fetchSurveyData();
        }
    }, [surveyId]);

    // Close export dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showExportDropdown && !event.target.closest(`.${styles.exportDropdownContainer}`)) {
                setShowExportDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showExportDropdown]);

    // Processed analytics data
    const analyticsData = useMemo(() => {
        if (!surveyResults || !surveyResponses) return null;

        const { questionResults, respondents } = surveyResults;
        const { responses } = surveyResponses;

        // Ensure questionResults is an array
        if (!Array.isArray(questionResults)) return null;

        // Response trend data (last 30 days)
        const responseTrend = generateResponseTrendData(responses);

        // Question completion rates
        const questionCompletionData = questionResults.map((question, index) => ({
            question: `Q${question.orderNumber || index + 1}`,
            questionText: question.questionText.length > 30
                ? question.questionText.substring(0, 30) + "..."
                : question.questionText,
            completion: Math.min(100, Math.round((question.totalAnswers / surveyResults.totalResponses) * 100)),
            total: question.totalAnswers,
            type: question.questionType
        }));

        // Response distribution by question type
        const questionTypeDistribution = questionResults.reduce((acc, question) => {
            const type = question.questionType || "TEXT";
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        const questionTypeData = Object.entries(questionTypeDistribution).map(([type, count]) => ({
            name: formatQuestionType(type),
            value: count,
            percentage: Math.round((count / questionResults.length) * 100)
        }));

        // Respondent analysis
        const respondentAnalysis = {
            totalRespondents: respondents.length,
            authenticatedUsers: respondents.filter(r => !r.isAnonymous).length,
            anonymousUsers: respondents.filter(r => r.isAnonymous).length,
            averageCompletionTime: formatCompletionTimeFromSeconds(surveyResponses?.averageCompletionTimeSeconds),
            completionRateByQuestion: questionCompletionData
        };

        // Time-based analytics
        const timeAnalytics = generateTimeAnalytics(responses);

        return {
            responseTrend,
            questionCompletionData,
            questionTypeData,
            respondentAnalysis,
            timeAnalytics
        };
    }, [surveyResults, surveyResponses]);

    const toggleQuestionExpansion = (questionId) => {
        const newExpanded = new Set(expandedQuestions);
        if (newExpanded.has(questionId)) {
            newExpanded.delete(questionId);
        } else {
            newExpanded.add(questionId);
        }
        setExpandedQuestions(newExpanded);
    };

    const copyShareLink = () => {
        const shareUrl = `${window.location.origin}/survey/${surveyId}`;
        navigator.clipboard.writeText(shareUrl);
        // Show toast notification
    };

    const generateQRCode = async () => {
        const shareUrl = `${window.location.origin}/survey/${surveyId}`;

        try {
            // Generate QR code as data URL
            const dataUrl = await QRCode.toDataURL(shareUrl, {
                width: 256,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                },
                errorCorrectionLevel: 'H'
            });

            setQrCodeDataUrl(dataUrl);
            return dataUrl;
        } catch (error) {
            console.error('Error generating QR code:', error);
            return null;
        }
    };

    const downloadQRCode = async () => {
        let dataUrl = qrCodeDataUrl;

        if (!dataUrl) {
            dataUrl = await generateQRCode();
            if (!dataUrl) {
                console.error('Failed to generate QR code for download');
                return;
            }
        }

        // Create download link
        const link = document.createElement('a');
        link.download = `survey-${surveyId}-qr-code.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Generate QR code when share modal opens
    useEffect(() => {
        if (showShareModal && !qrCodeDataUrl) {
            generateQRCode();
        }
    }, [showShareModal, surveyId, qrCodeDataUrl]);

    const exportData = async (format = 'csv', type = 'responses') => {
        try {
            console.log(`Starting export of type: ${type}`);
            // setExportLoading(true);

            // Add a small delay to ensure loading state is visible
            await new Promise(resolve => setTimeout(resolve, 500));

            if (type === 'responses') {
                console.log('Exporting responses...');
                await exportSurveyResponses(
                    surveyDetails,
                    surveyResponses,
                    surveyDetails?.title
                );

                // Show success message
                await showDialog({
                    title: "Export Successful",
                    message: "Survey responses have been exported successfully.",
                    type: "success",
                    confirmText: "OK"
                });
            } else if (type === 'analytics') {
                console.log('Exporting analytics...');
                await exportSurveyAnalytics(
                    surveyDetails,
                    analyticsData,
                    surveyDetails?.title
                );

                // Show success message
                await showDialog({
                    title: "Export Successful",
                    message: "Survey analytics have been exported successfully.",
                    type: "success",
                    confirmText: "OK"
                });
            } else if (type === 'summary') {
                console.log('Exporting summary...');
                await exportSurveySummary(
                    surveyDetails,
                    surveyResponses,
                    analyticsData,
                    surveyDetails?.title
                );

                // Show success message
                await showDialog({
                    title: "Export Successful",
                    message: "Survey summary has been exported successfully.",
                    type: "success",
                    confirmText: "OK"
                });
            }

            setShowExportDropdown(false);
            console.log('Export completed successfully');

        } catch (error) {
            console.error("Export failed:", error);
            await showDialog({
                title: "Export Failed",
                message: error.message || "Failed to export data. Please try again.",
                type: "error",
                confirmText: "OK"
            });
        } finally {
            setExportLoading(false);
            setLoading(false);
            console.log('Export process finished');
        }
    };

    const handleDeleteSurvey = async () => {
        const confirmed = await showDialog({
            title: "Delete Survey",
            message: `Are you sure you want to delete "${surveyDetails?.title}"? This action cannot be undone.`,
            type: "danger",
            confirmText: "Delete",
            cancelText: "Cancel"
        });

        if (confirmed) {
            try {
                await SurveyService.deleteSurvey(surveyId);
                // Show success message and navigate back
                navigate("/admin", {
                    state: {
                        message: "Survey deleted successfully",
                        type: "success"
                    }
                });
            } catch (error) {
                console.error("Failed to delete survey:", error);
                await showDialog({
                    title: "Delete Failed",
                    message: "Failed to delete the survey. Please try again.",
                    type: "error",
                    confirmText: "OK"
                });
            }
        }
    };

    const handleEditSurvey = () => {
        navigate(`/admin/surveys/${surveyId}/edit`);
    };

    if (loading) {
        return (
            <div className={styles.surveyViewPage}>
                <div className={styles.backgroundElements}>
                    <div className={styles.floatingShape1}></div>
                    <div className={styles.floatingShape2}></div>
                    <div className={styles.floatingShape3}></div>
                </div>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <div className={styles.loadingText}>Loading survey analytics...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.surveyViewPage}>
                <div className={styles.backgroundElements}>
                    <div className={styles.floatingShape1}></div>
                    <div className={styles.floatingShape2}></div>
                    <div className={styles.floatingShape3}></div>
                </div>
                <div className={styles.errorContainer}>
                    <AlertCircle className={styles.errorIcon} size={64} />
                    <h2 className={styles.errorTitle}>Failed to load survey</h2>
                    <p className={styles.errorMessage}>{error}</p>
                    <div className={styles.errorActions}>
                        <button
                            onClick={() => navigate("/admin")}
                            className={styles.backButton}
                        >
                            <ArrowLeft size={16} />
                            Back to Dashboard
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className={styles.retryButton}
                        >
                            <RefreshCw size={16} />
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.surveyViewPage}>
            {/* Export Loading Overlay */}
            {exportLoading && (
                <LoadingSpinner
                    text="Preparing your export..."
                    size="large"
                    variant="primary"
                    fullScreen={true}
                />
            )}

            {/* Animated Background */}
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
                            <ArrowLeft size={20} />
                            Back to Dashboard
                        </button>
                        <div className={styles.surveyTitleSection}>
                            <h1 className={styles.surveyTitle}>{surveyDetails?.title}</h1>
                            <p className={styles.surveyDescription}>{surveyDetails?.description}</p>
                            <div className={styles.surveyMeta}>
                                <span className={`${styles.statusBadge} ${styles[`status${surveyDetails?.status}`]}`}>
                                    {surveyDetails?.status}
                                </span>
                                <span className={styles.metaItem}>
                                    <Calendar size={14} />
                                    Created {new Date(surveyDetails?.createdAt).toLocaleDateString()}
                                </span>
                                <span className={styles.metaItem}>
                                    <Users size={14} />
                                    {surveyResults?.totalResponses || 0} responses
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className={styles.headerActions}>
                        <button
                            onClick={handleEditSurvey}
                            className={styles.actionButton}
                            title="Edit Survey"
                        >
                            <Edit3 size={16} />
                            Edit
                        </button>
                        <button
                            onClick={handleDeleteSurvey}
                            className={`${styles.actionButton} ${styles.dangerButton}`}
                            title="Delete Survey"
                        >
                            <Trash2 size={16} />
                            Delete
                        </button>
                        <button
                            onClick={() => setShowShareModal(true)}
                            className={styles.actionButton}
                        >
                            <Share2 size={16} />
                            Share
                        </button>

                        {/* Export Dropdown */}
                        <div className={styles.exportDropdownContainer}>
                            <button
                                onClick={() => setShowExportDropdown(!showExportDropdown)}
                                className={styles.actionButton}
                                disabled={exportLoading}
                            >
                                <Download size={16} />
                                {exportLoading ? 'Exporting...' : 'Export'}
                                <ChevronDown size={14} className={styles.dropdownIcon} />
                            </button>

                            {showExportDropdown && (
                                <div className={styles.exportDropdown}>
                                    <button
                                        onClick={() => exportData('csv', 'responses')}
                                        className={styles.exportOption}
                                        disabled={!surveyResponses?.responses?.length || exportLoading}
                                    >
                                        <FileText size={14} />
                                        <span>
                                            <div>Export Responses</div>
                                            <div className={styles.exportOptionDesc}>
                                                Detailed response data (CSV)
                                            </div>
                                        </span>
                                    </button>

                                    <button
                                        onClick={() => exportData('csv', 'analytics')}
                                        className={styles.exportOption}
                                        disabled={!analyticsData?.questionCompletionData?.length || exportLoading}
                                    >
                                        <BarChart3 size={14} />
                                        <span>
                                            <div>Export Analytics</div>
                                            <div className={styles.exportOptionDesc}>
                                                Question analytics data (CSV)
                                            </div>
                                        </span>
                                    </button>

                                    <button
                                        onClick={() => exportData('csv', 'summary')}
                                        className={styles.exportOption}
                                        disabled={exportLoading}
                                    >
                                        <Eye size={14} />
                                        <span>
                                            <div>Export Summary</div>
                                            <div className={styles.exportOptionDesc}>
                                                Survey overview metrics (CSV)
                                            </div>
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => window.open(`/survey/${surveyId}`, '_blank')}
                            className={styles.primaryButton}
                        >
                            <ExternalLink size={16} />
                            View Survey
                        </button>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className={styles.tabNavigation}>
                <div className={styles.tabContainer}>
                    {[
                        { id: "overview", label: "Overview & Analytics", icon: BarChart3 },
                        { id: "responses", label: "Responses", icon: MessageSquare },
                        { id: "questions", label: "Response Analytics", icon: FileText }
                    ].map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`${styles.tabButton} ${activeTab === id ? styles.active : ''}`}
                        >
                            <Icon size={16} />
                            {label}
                        </button>
                    ))}
                </div>
            </nav>

            {/* Main Content */}
            <main className={styles.mainContent}>
                {activeTab === "overview" && (
                    <div className={styles.tabContent}>
                        {/* Key Metrics */}
                        <div className={styles.metricsGrid}>
                            <div className={styles.metricCard}>
                                <div className={styles.metricIcon} style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}>
                                    <Eye size={24} />
                                </div>
                                <div className={styles.metricContent}>
                                    <div className={styles.metricValue}>{surveyResults?.totalResponses || 0}</div>
                                    <div className={styles.metricLabel}>Total Responses</div>
                                   
                                </div>
                            </div>

                            <div className={styles.metricCard}>
                                <div className={styles.metricIcon} style={{ backgroundColor: COLORS.success + '20', color: COLORS.success }}>
                                    <Users size={24} />
                                </div>
                                <div className={styles.metricContent}>
                                    <div className={styles.metricValue}>{analyticsData?.respondentAnalysis.totalRespondents || 0}</div>
                                    <div className={styles.metricLabel}>Unique Respondents</div>
                                    
                                </div>
                            </div>

                            <div className={styles.metricCard}>
                                <div className={styles.metricIcon} style={{ backgroundColor: COLORS.warning + '20', color: COLORS.warning }}>
                                    <Clock size={24} />
                                </div>
                                <div className={styles.metricContent}>
                                    <div className={styles.metricValue}>{analyticsData?.respondentAnalysis.averageCompletionTime || "N/A"}</div>
                                    <div className={styles.metricLabel}>Avg. Completion Time</div>
                                    
                                </div>
                            </div>

                            <div className={styles.metricCard}>
                                <div className={styles.metricIcon} style={{ backgroundColor: COLORS.info + '20', color: COLORS.info }}>
                                    <CheckCircle size={24} />
                                </div>
                                <div className={styles.metricContent}>
                                    <div className={styles.metricValue}>
                                        {surveyResults?.questionResults && surveyResults.questionResults.length > 0
                                            ? Math.min(100, Math.round(surveyResults.questionResults.reduce((sum, question) => sum + Math.min(100, question.completionRate || 0), 0) / surveyResults.questionResults.length))
                                            : 0}%
                                    </div>
                                    <div className={styles.metricLabel}>Completion Rate</div>
                                  
                                </div>
                            </div>
                        </div>

                        {/* Charts Grid - Combined Overview and Analytics */}
                        <div className={styles.chartsGrid}>
                            {/* Response Trend */}
                            <div className={styles.chartCard}>
                                <div className={styles.chartHeader}>
                                    <h3 className={styles.chartTitle}>Response Trend (Last 30 Days)</h3>
                                    <p className={styles.chartSubtitle}>Daily response submissions</p>
                                </div>
                                <div className={styles.chartContainer}>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={analyticsData?.responseTrend || []}>
                                            <defs>
                                                <linearGradient id="colorResponses" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                                            <XAxis dataKey="label" stroke="#718096" fontSize={12} />
                                            <YAxis stroke="#718096" fontSize={12} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'rgba(255,255,255,0.95)',
                                                    border: 'none',
                                                    borderRadius: '12px',
                                                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="count"
                                                stroke={COLORS.primary}
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorResponses)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Question Types Distribution */}
                            <div className={styles.chartCard}>
                                <div className={styles.chartHeader}>
                                    <h3 className={styles.chartTitle}>Question Types</h3>
                                    <p className={styles.chartSubtitle}>Distribution of question types</p>
                                </div>
                                <div className={styles.chartContainer}>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={analyticsData?.questionTypeData || []}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                dataKey="value"
                                                labelLine={false}
                                                label={({ name, percentage }) => `${name} (${percentage}%)`}
                                            >
                                                {(analyticsData?.questionTypeData || []).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'rgba(255,255,255,0.95)',
                                                    border: 'none',
                                                    borderRadius: '12px',
                                                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Response Time Analysis */}
                            {analyticsData?.timeAnalytics?.hourlyData && (
                                <div className={styles.chartCard}>
                                    <div className={styles.chartHeader}>
                                        <h3 className={styles.chartTitle}>Response Time Patterns</h3>
                                        <p className={styles.chartSubtitle}>When do people respond?</p>
                                    </div>
                                    <div className={styles.chartContainer}>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={analyticsData.timeAnalytics.hourlyData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                                                <XAxis dataKey="label" stroke="#718096" fontSize={12} />
                                                <YAxis stroke="#718096" fontSize={12} />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'rgba(255,255,255,0.95)',
                                                        border: 'none',
                                                        borderRadius: '12px',
                                                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                                                    }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="count"
                                                    stroke={COLORS.secondary}
                                                    strokeWidth={3}
                                                    dot={{ fill: COLORS.secondary, strokeWidth: 2, r: 4 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* Day of Week Analysis */}
                            {analyticsData?.timeAnalytics?.dailyData && (
                                <div className={styles.chartCard}>
                                    <div className={styles.chartHeader}>
                                        <h3 className={styles.chartTitle}>Day of Week Distribution</h3>
                                        <p className={styles.chartSubtitle}>Response distribution by weekday</p>
                                    </div>
                                    <div className={styles.chartContainer}>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={analyticsData.timeAnalytics.dailyData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                                                <XAxis dataKey="label" stroke="#718096" fontSize={12} />
                                                <YAxis stroke="#718096" fontSize={12} />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'rgba(255,255,255,0.95)',
                                                        border: 'none',
                                                        borderRadius: '12px',
                                                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                                                    }}
                                                />
                                                <Bar dataKey="count" fill={COLORS.success} radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Respondent Analysis */}
                        <div className={styles.analysisCard}>
                            <div className={styles.cardHeader}>
                                <h3 className={styles.cardTitle}>Respondent Analysis</h3>
                                <p className={styles.cardSubtitle}>Breakdown of survey participants</p>
                            </div>
                            <div className={styles.respondentStats}>
                                <div className={styles.statItem}>
                                    <UserCheck className={styles.statIcon} size={20} />
                                    <div className={styles.statContent}>
                                        <div className={styles.statValue}>{analyticsData?.respondentAnalysis.authenticatedUsers || 0}</div>
                                        <div className={styles.statLabel}>Authenticated Users</div>
                                    </div>
                                </div>
                                <div className={styles.statItem}>
                                    <UserX className={styles.statIcon} size={20} />
                                    <div className={styles.statContent}>
                                        <div className={styles.statValue}>{analyticsData?.respondentAnalysis.anonymousUsers || 0}</div>
                                        <div className={styles.statLabel}>Anonymous Users</div>
                                    </div>
                                </div>
                                <div className={styles.statItem}>
                                    <Globe className={styles.statIcon} size={20} />
                                    <div className={styles.statContent}>
                                        <div className={styles.statValue}>
                                            {analyticsData?.respondentAnalysis.authenticatedUsers && analyticsData?.respondentAnalysis.totalRespondents
                                                ? Math.round((analyticsData.respondentAnalysis.authenticatedUsers / analyticsData.respondentAnalysis.totalRespondents) * 100)
                                                : 0}%
                                        </div>
                                        <div className={styles.statLabel}>Authentication Rate</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "responses" && (
                    <div className={styles.tabContent}>
                        {/* Response Filters */}
                        <div className={styles.filtersContainer}>
                            <div className={styles.searchContainer}>
                                <Search className={styles.searchIcon} size={20} />
                                <input
                                    type="text"
                                    placeholder="Search responses by respondent name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={styles.searchInput}
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm("")}
                                        className={styles.clearSearchBtn}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                            <div className={styles.filterButtons}>
                                {["ALL", "AUTHENTICATED", "ANONYMOUS"].map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setFilterType(filter)}
                                        className={`${styles.filterButton} ${filterType === filter ? styles.active : ''}`}
                                    >
                                        {filter.toLowerCase().replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Responses List */}
                        <div className={styles.responsesList}>
                            {surveyResponses?.responses?.map((response, index) => (
                                <div key={response.responseId || index} className={styles.responseCard}>
                                    <div className={styles.responseHeader}>
                                        <div className={styles.respondentInfo}>
                                            <div className={styles.respondentAvatar}>
                                                {response.isAnonymous ? (
                                                    <UserX size={20} />
                                                ) : (
                                                    response.respondentName?.charAt(0).toUpperCase() || "U"
                                                )}
                                            </div>
                                            <div className={styles.respondentDetails}>
                                                <h4 className={styles.respondentName}>
                                                    {response.isAnonymous ? "Anonymous User" : response.respondentName}
                                                </h4>
                                                <p className={styles.respondentEmail}>
                                                    {response.isAnonymous ? "No email provided" : response.respondentEmail}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={styles.responseActions}>
                                            <span className={styles.responseDate}>
                                                {response.submittedAt ? new Date(response.submittedAt).toLocaleDateString() : "Unknown date"}
                                            </span>
                                            <button
                                                onClick={() => toggleQuestionExpansion(response.responseId)}
                                                className={styles.expandButton}
                                            >
                                                {expandedQuestions.has(response.responseId) ? (
                                                    <ChevronUp size={16} />
                                                ) : (
                                                    <ChevronDown size={16} />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {expandedQuestions.has(response.responseId) && (
                                        <div className={styles.responseAnswers}>
                                            {response.answers?.map((answer, answerIndex) => (
                                                <div key={answerIndex} className={styles.answerItem}>
                                                    <div className={styles.questionText}>{answer.questionText}</div>
                                                    <div className={styles.answerText}>{answer.answerText}</div>
                                                </div>
                                            )) || (
                                                    <div className={styles.noAnswers}>No detailed answers available</div>
                                                )}
                                        </div>
                                    )}
                                </div>
                            )) || (
                                    <div className={styles.emptyResponses}>
                                        <MessageSquare className={styles.emptyIcon} size={64} />
                                        <h3 className={styles.emptyTitle}>No responses yet</h3>
                                        <p className={styles.emptyDescription}>
                                            Responses will appear here once people start filling out your survey.
                                        </p>
                                    </div>
                                )}
                        </div>
                    </div>
                )}

                {activeTab === "questions" && (
                    <div className={styles.tabContent}>
                        {/* Check if there are any responses first */}
                        {(!surveyResults?.totalResponses || surveyResults.totalResponses === 0) ? (
                            <div className={styles.emptyQuestions}>
                                <BarChart3 className={styles.emptyIcon} size={64} />
                                <h3 className={styles.emptyTitle}>No Response Data Available</h3>
                                <p className={styles.emptyDescription}>
                                    Response analytics will appear here once people start submitting responses to your survey.
                                </p>
                            </div>
                        ) : (
                            /* Modern Response Analytics Layout */
                            <div className={styles.responseAnalyticsContainer}>
                                {surveyDetails?.questions?.map((question, index) => {
                                    const questionResult = surveyResults?.questionResults?.find(qr => qr.questionId === question.id);
                                    const analytics = questionResult?.analytics;

                                    return (
                                        <div key={question.id} className={styles.modernQuestionCard}>
                                            {/* Question Header with Enhanced Design */}
                                            <div className={styles.modernQuestionHeader}>
                                                <div className={styles.questionIdentifier}>
                                                    <div className={styles.questionNumberBadge}>
                                                        Q{question.orderNumber || index + 1}
                                                    </div>
                                                    <div className={styles.questionMeta}>
                                                        <span className={styles.questionTypeBadge}>
                                                            {formatQuestionType(question.type)}
                                                        </span>
                                                        {question.required && (
                                                            <span className={styles.requiredIndicator}>
                                                                Required
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={styles.questionStats}>
                                                    <div className={styles.statPill}>
                                                        <Users size={14} />
                                                        <span>{questionResult?.totalAnswers || 0} responses</span>
                                                    </div>
                                                    <div className={styles.statPill}>
                                                        <TrendingUp size={14} />
                                                        <span>{questionResult?.completionRate?.toFixed(1) || 0}% completion</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Main Content Area with Side-by-side Layout */}
                                            <div className={styles.questionMainContent}>
                                                {/* Left Side - Question Info */}
                                                <div className={styles.questionInfoSection}>
                                                    <h4 className={styles.modernQuestionText}>{question.questionText}</h4>

                                                    {/* Question Options Preview */}
                                                    {question.optionsJson && (() => {
                                                        try {
                                                            const parsedOptions = JSON.parse(question.optionsJson);
                                                            if (Array.isArray(parsedOptions) && parsedOptions.length > 0) {
                                                                return (
                                                                    <div className={styles.optionsPreview}>
                                                                        <div className={styles.optionsLabel}>Answer Options:</div>
                                                                        <div className={styles.optionsList}>
                                                                            {parsedOptions.slice(0, 4).map((option, optIndex) => (
                                                                                <div key={optIndex} className={styles.optionChip}>
                                                                                    {option}
                                                                                </div>
                                                                            ))}
                                                                            {parsedOptions.length > 4 && (
                                                                                <div className={styles.optionChip}>
                                                                                    +{parsedOptions.length - 4} more
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                        } catch (error) {
                                                            console.warn('Failed to parse question options:', error);
                                                        }
                                                        return null;
                                                    })()}

                                                    {/* Key Analytics Summary */}
                                                    {analytics && (
                                                        <div className={styles.analyticsPreview}>
                                                            <div className={styles.analyticsPreviewTitle}>Quick Insights</div>
                                                            <div className={styles.insightCards}>
                                                                {/* Rating Insights */}
                                                                {(question.type === 'RATING' || question.type === 'Rating') && analytics.averageRating !== null && (
                                                                    <>
                                                                        <div className={styles.insightCard}>
                                                                            <div className={styles.insightIcon}>⭐</div>
                                                                            <div className={styles.insightContent}>
                                                                                <div className={styles.insightValue}>{analytics.averageRating?.toFixed(1)}</div>
                                                                                <div className={styles.insightLabel}>Avg Rating</div>
                                                                            </div>
                                                                        </div>
                                                                        <div className={styles.insightCard}>
                                                                            <div className={styles.insightIcon}>📊</div>
                                                                            <div className={styles.insightContent}>
                                                                                <div className={styles.insightValue}>{analytics.medianRating?.toFixed(1)}</div>
                                                                                <div className={styles.insightLabel}>Median</div>
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                )}

                                                                {/* Multiple Choice Insights */}
                                                                {['MULTIPLE_CHOICE', 'RADIO', 'DROPDOWN'].includes(question.type) && analytics.mostPopularOption && (
                                                                    <div className={styles.insightCard}>
                                                                        <div className={styles.insightIcon}>🏆</div>
                                                                        <div className={styles.insightContent}>
                                                                            <div className={styles.insightValue}>
                                                                                {analytics.mostPopularOption.length > 20
                                                                                    ? analytics.mostPopularOption.substring(0, 20) + '...'
                                                                                    : analytics.mostPopularOption
                                                                                }
                                                                            </div>
                                                                            <div className={styles.insightLabel}>Most Popular</div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Text Analytics Insights */}
                                                                {['TEXT', 'LONG_TEXT'].includes(question.type) && analytics.averageTextLength !== null && (
                                                                    <div className={styles.insightCard}>
                                                                        <div className={styles.insightIcon}>📝</div>
                                                                        <div className={styles.insightContent}>
                                                                            <div className={styles.insightValue}>{analytics.averageTextLength}</div>
                                                                            <div className={styles.insightLabel}>Avg Length</div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right Side - Beautiful Charts */}
                                                {analytics && (
                                                    <div className={styles.chartsSection}>
                                                        {/* Debug info - Remove in production */}
                                                        {console.log('Question:', question.questionText, 'Type:', question.type, 'Analytics:', analytics)}

                                                        {/* Rating Analytics Chart */}
                                                        {(question.type === 'RATING' || question.type === 'Rating' || question.type?.toLowerCase() === 'rating') && (
                                                            <div className={styles.beautifulChartCard}>
                                                                <div className={styles.chartCardHeader}>
                                                                    <h6 className={styles.chartCardTitle}>Rating Distribution</h6>
                                                                    <div className={styles.chartCardSubtitle}>
                                                                        {analytics.ratingDistribution && typeof analytics.ratingDistribution === 'object' && Object.keys(analytics.ratingDistribution).length > 0
                                                                            ? `${Object.values(analytics.ratingDistribution).reduce((a, b) => a + b, 0)} total ratings`
                                                                            : 'No rating data available yet'
                                                                        }
                                                                    </div>
                                                                </div>
                                                                <div className={styles.chartWrapper}>
                                                                    {analytics.ratingDistribution &&
                                                                        typeof analytics.ratingDistribution === 'object' &&
                                                                        Object.keys(analytics.ratingDistribution).length > 0 ? (
                                                                        <ResponsiveContainer width="100%" height={280}>
                                                                            <BarChart
                                                                                data={Object.entries(analytics.ratingDistribution).map(([rating, count]) => ({
                                                                                    rating: `${rating}★`,
                                                                                    count,
                                                                                    percentage: Math.round((count / Object.values(analytics.ratingDistribution).reduce((a, b) => a + b, 0)) * 100)
                                                                                }))}
                                                                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                                                            >
                                                                                <defs>
                                                                                    <linearGradient id={`ratingGradient-${question.id}`} x1="0" y1="0" x2="0" y2="1">
                                                                                        <stop offset="5%" stopColor="#FFD700" stopOpacity={0.9} />
                                                                                        <stop offset="95%" stopColor="#FFA500" stopOpacity={0.7} />
                                                                                    </linearGradient>
                                                                                </defs>
                                                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                                                <XAxis
                                                                                    dataKey="rating"
                                                                                    stroke="#94A3B8"
                                                                                    fontSize={12}
                                                                                    tick={{ fill: '#94A3B8' }}
                                                                                />
                                                                                <YAxis
                                                                                    stroke="#94A3B8"
                                                                                    fontSize={12}
                                                                                    tick={{ fill: '#94A3B8' }}
                                                                                />
                                                                                <Tooltip
                                                                                    contentStyle={{
                                                                                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                                                                        border: 'none',
                                                                                        borderRadius: '16px',
                                                                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                                                                        color: '#fff'
                                                                                    }}
                                                                                    formatter={(value, name, props) => [
                                                                                        `${value} responses (${props.payload.percentage}%)`,
                                                                                        'Count'
                                                                                    ]}
                                                                                />
                                                                                <Bar
                                                                                    dataKey="count"
                                                                                    fill={`url(#ratingGradient-${question.id})`}
                                                                                    radius={[8, 8, 0, 0]}
                                                                                    stroke="#FFD700"
                                                                                    strokeWidth={1}
                                                                                />
                                                                            </BarChart>
                                                                        </ResponsiveContainer>
                                                                    ) : (
                                                                        /* Placeholder for no data */
                                                                        <div style={{
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            height: '280px',
                                                                            color: '#94A3B8',
                                                                            fontSize: '14px',
                                                                            gap: '12px'
                                                                        }}>
                                                                            <div style={{ fontSize: '48px', opacity: 0.3 }}>📊</div>
                                                                            <div>No rating responses yet</div>
                                                                            <div style={{ fontSize: '12px', opacity: 0.7 }}>
                                                                                Charts will appear once users submit ratings
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Multiple Choice Analytics Chart */}
                                                        {['MULTIPLE_CHOICE', 'RADIO', 'DROPDOWN'].includes(question.type) &&
                                                            analytics.optionCounts &&
                                                            typeof analytics.optionCounts === 'object' &&
                                                            Object.keys(analytics.optionCounts).length > 0 && (
                                                                <div className={styles.beautifulChartCard}>
                                                                    <div className={styles.chartCardHeader}>
                                                                        <h6 className={styles.chartCardTitle}>Option Distribution</h6>
                                                                        <div className={styles.chartCardSubtitle}>
                                                                            {Object.values(analytics.optionCounts).reduce((a, b) => a + b, 0)} total selections
                                                                        </div>
                                                                    </div>
                                                                    <div className={styles.chartWrapper}>
                                                                        <ResponsiveContainer width="100%" height={320}>
                                                                            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                                                                <defs>
                                                                                    {Object.entries(analytics.optionCounts).map((entry, index) => (
                                                                                        <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                                                                                            <stop offset="0%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.9} />
                                                                                            <stop offset="100%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.6} />
                                                                                        </linearGradient>
                                                                                    ))}
                                                                                </defs>
                                                                                <Pie
                                                                                    data={Object.entries(analytics.optionCounts).map(([option, count], index) => ({
                                                                                        name: option.length > 25 ? option.substring(0, 25) + '...' : option,
                                                                                        value: count,
                                                                                        fullName: option,
                                                                                        percentage: Math.round((count / Object.values(analytics.optionCounts).reduce((a, b) => a + b, 0)) * 100),
                                                                                        fill: `url(#gradient-${index})`
                                                                                    }))}
                                                                                    cx="50%"
                                                                                    cy="50%"
                                                                                    outerRadius={90}
                                                                                    innerRadius={30}
                                                                                    dataKey="value"
                                                                                    stroke="#fff"
                                                                                    strokeWidth={2}
                                                                                >
                                                                                    {Object.entries(analytics.optionCounts).map((entry, index) => (
                                                                                        <Cell key={`cell-${index}`} fill={`url(#gradient-${index})`} />
                                                                                    ))}
                                                                                </Pie>
                                                                                <Legend
                                                                                    verticalAlign="bottom"
                                                                                    height={36}
                                                                                    iconType="circle"
                                                                                    wrapperStyle={{
                                                                                        paddingTop: '20px',
                                                                                        fontSize: '12px',
                                                                                        color: '#64748b'
                                                                                    }}
                                                                                    formatter={(value, entry) => entry.payload.fullName}
                                                                                />
                                                                                <Tooltip
                                                                                    contentStyle={{
                                                                                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                                                                        border: 'none',
                                                                                        borderRadius: '16px',
                                                                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                                                                        color: '#fff'
                                                                                    }}
                                                                                    formatter={(value, name, props) => [
                                                                                        `${value} selections (${props.payload.percentage}%)`,
                                                                                        props.payload.fullName
                                                                                    ]}
                                                                                />
                                                                            </PieChart>
                                                                        </ResponsiveContainer>
                                                                    </div>
                                                                </div>
                                                            )}

                                                        {/* Multiple Choice Empty State */}
                                                        {['MULTIPLE_CHOICE', 'RADIO', 'DROPDOWN'].includes(question.type) &&
                                                            (!analytics.optionCounts ||
                                                                typeof analytics.optionCounts !== 'object' ||
                                                                Object.keys(analytics.optionCounts).length === 0) && (
                                                                <div className={styles.beautifulChartCard}>
                                                                    <div className={styles.chartCardHeader}>
                                                                        <h6 className={styles.chartCardTitle}>Option Distribution</h6>
                                                                        <div className={styles.chartCardSubtitle}>No responses yet</div>
                                                                    </div>
                                                                    <div className={styles.chartWrapper}>
                                                                        <div style={{
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            height: '280px',
                                                                            color: '#94A3B8',
                                                                            fontSize: '14px',
                                                                            gap: '12px'
                                                                        }}>
                                                                            <div style={{ fontSize: '48px', opacity: 0.3 }}>🗳️</div>
                                                                            <div>No option selections yet</div>
                                                                            <div style={{ fontSize: '12px', opacity: 0.7 }}>
                                                                                Charts will appear once users submit responses
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                        {/* Text Analytics */}
                                                        {['TEXT', 'LONG_TEXT'].includes(question.type) && analytics.averageTextLength !== null && (
                                                            <div className={styles.beautifulChartCard}>
                                                                <div className={styles.chartCardHeader}>
                                                                    <h6 className={styles.chartCardTitle}>Text Analysis</h6>
                                                                    <div className={styles.chartCardSubtitle}>Response length insights</div>
                                                                </div>
                                                                <div className={styles.textAnalyticsContent}>
                                                                    <div className={styles.textMetrics}>
                                                                        <div className={styles.textMetric}>
                                                                            <div className={styles.textMetricIcon}>📏</div>
                                                                            <div className={styles.textMetricInfo}>
                                                                                <div className={styles.textMetricValue}>{analytics.averageTextLength}</div>
                                                                                <div className={styles.textMetricLabel}>Avg Characters</div>
                                                                            </div>
                                                                        </div>
                                                                        <div className={styles.textMetric}>
                                                                            <div className={styles.textMetricIcon}>📐</div>
                                                                            <div className={styles.textMetricInfo}>
                                                                                <div className={styles.textMetricValue}>{analytics.minTextLength} - {analytics.maxTextLength}</div>
                                                                                <div className={styles.textMetricLabel}>Range</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    {/* Common Keywords */}
                                                                    {analytics.commonKeywords && analytics.commonKeywords.length > 0 && (
                                                                        <div className={styles.keywordsCloud}>
                                                                            <div className={styles.keywordsCloudTitle}>Popular Keywords</div>
                                                                            <div className={styles.keywordsCloudContainer}>
                                                                                {analytics.commonKeywords.slice(0, 8).map((keyword, idx) => (
                                                                                    <span
                                                                                        key={idx}
                                                                                        className={styles.keywordBubble}
                                                                                        style={{
                                                                                            fontSize: `${Math.max(12, 16 - (idx * 0.5))}px`,
                                                                                            opacity: Math.max(0.6, 1 - (idx * 0.1))
                                                                                        }}
                                                                                    >
                                                                                        {keyword}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }) || (
                                        <div className={styles.emptyQuestions}>
                                            <FileText className={styles.emptyIcon} size={64} />
                                            <h3 className={styles.emptyTitle}>No questions found</h3>
                                            <p className={styles.emptyDescription}>
                                                This survey doesn't have any questions yet.
                                            </p>
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Share Modal */}
            {showShareModal && (
                <div className={styles.modalOverlay} onClick={() => setShowShareModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Share Survey</h3>
                            <button
                                onClick={() => setShowShareModal(false)}
                                className={styles.modalCloseBtn}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.modalContent}>
                            <div className={styles.shareContainer}>
                                {/* URL Section */}
                                <div className={styles.shareSection}>
                                    <div className={styles.shareUrlContainer}>
                                        <label className={styles.shareLabel}>Survey URL:</label>
                                        <div className={styles.shareInputGroup}>
                                            <input
                                                type="text"
                                                value={`${window.location.origin}/survey/${surveyId}`}
                                                readOnly
                                                className={styles.shareInput}
                                            />
                                            <button
                                                onClick={copyShareLink}
                                                className={styles.copyButton}
                                            >
                                                <Copy size={16} />
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* QR Code Section */}
                                <div className={styles.shareSection}>
                                    <div className={styles.qrCodeContainer}>
                                        <label className={styles.shareLabel}>QR Code:</label>
                                        <div className={styles.qrCodeWrapper}>
                                            {qrCodeDataUrl ? (
                                                <div className={styles.qrCodeDisplay}>
                                                    <img
                                                        src={qrCodeDataUrl}
                                                        alt="Survey QR Code"
                                                        className={styles.qrCodeImage}
                                                    />
                                                    <p className={styles.qrCodeDescription}>
                                                        Scan this QR code to access the survey
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className={styles.qrCodeLoading}>
                                                    <QrCode size={64} className={styles.qrCodeIcon} />
                                                    <p>Generating QR code...</p>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={downloadQRCode}
                                            className={styles.downloadQrButton}
                                            disabled={!qrCodeDataUrl}
                                        >
                                            <Download size={16} />
                                            Download QR Code
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Dialog Component */}
            <Dialog
                {...dialogState}
                onClose={closeDialog}
            />
        </div>
    );
}
