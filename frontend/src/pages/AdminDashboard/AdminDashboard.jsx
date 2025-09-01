import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import {
  Edit3,
  Eye,
  MoreHorizontal,
  Calendar,
  Clock,
  BarChart3,
  HelpCircle,
  Search,
  X,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  FileText,
  Trash2,
  Plus,
  Target,
  Activity,
  Users,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  FileEdit,
  User
} from "lucide-react";
import styles from "./AdminDashboard.module.css";
import { apiClient } from "../../utils/apiClient";
import { Dialog } from "../../components";
import { useDialog } from "../../hooks/useDialog";
import { SurveyService, AnalyticsService, ResponseService } from "../../services/apiServices";

export default function AdminDashboard() {
  const [surveys, setSurveys] = useState([]);
  const [statistics, setStatistics] = useState({
    totalSurveys: 0,
    activeSurveys: 0,
    totalResponses: 0,
    responsesThisWeek: 0,
    responsesLastWeek: 0,
    newSurveysThisMonth: 0
  });
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [responseTrends, setResponseTrends] = useState([{ date: "", responses: 0 }]); // Initialize with an empty object to avoid rendering issues
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentResponses, setRecentResponses] = useState([]);
  const [chartData, setChartData] = useState([]); // State for chart data
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const {
    dialogState,
    closeDialog,
    showDangerConfirmation,
    showSuccess,
    showDanger,
    setLoading: setDialogLoading
  } = useDialog();

  useEffect(() => {
    // Trigger entrance animation
    setIsVisible(true);

    // Fetch all required data
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch surveys and analytics data in parallel
        const [surveysResponse, responseTrendsData, recentActivityData, overviewData, recentResponsesData] = await Promise.all([
          apiClient.get('/surveys/admin'),
          AnalyticsService.getResponseTrends(30), // Last 30 days for the chart (whole month)
          AnalyticsService.getRecentActivity(4), // Last 4 activities
          AnalyticsService.getDashboardOverview(),
          AnalyticsService.getRecentResponses(5) // Get latest 5 responses with detailed info
        ]);

        // console.log('Full API Response:', surveysResponse);
        // console.log('Response trends:', responseTrendsData);
        // console.log('Recent activity:', recentActivityData);
        // console.log('Overview data:', overviewData);
        // console.log('Recent responses:', recentResponsesData);

        // Handle surveys data
        let surveysArray = [];
        if (Array.isArray(surveysResponse)) {
          surveysArray = surveysResponse;
        } else if (surveysResponse && Array.isArray(surveysResponse.data)) {
          surveysArray = surveysResponse.data;
        } else {
          // console.warn('Unexpected response format:', surveysResponse);
          surveysArray = [];
        }

        // console.log('Final surveys array:', surveysArray);
        setSurveys(surveysArray);

        // Set analytics data - extract the data array from the response
        setResponseTrends(responseTrendsData || []);
        setRecentActivity(recentActivityData || []);
        // console.log(responseTrendsData)
        // console.log('Setting responseTrends to:', responseTrendsData?.data);
        // console.log('responseTrendsData length:', responseTrendsData?.data?.length || 0);

        // Process recent responses - handle both array and object formats
        let processedResponses = [];
        if (recentResponsesData) {
          // Check if it's an object with numbered keys (like your data format)
          if (typeof recentResponsesData === 'object' && !Array.isArray(recentResponsesData)) {
            // Convert object to array and sort by submission time (most recent first)
            processedResponses = Object.values(recentResponsesData)
              .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
              .map(response => ({
                id: response.responseId || response.surveyId,
                surveyName: response.surveyName,
                userName: response.isAnonymous ? null : response.userName,
                submittedAt: response.submittedAt,
                completionPercentage: response.completionPercentage,
                formattedTime: response.formattedTime,
                formattedDate: response.formattedDate,
                isAnonymous: response.isAnonymous,
                responseId: response.responseId
              }));
          } else if (Array.isArray(recentResponsesData)) {
            // Handle array format
            processedResponses = recentResponsesData.map(response => ({
              id: response.responseId || response.surveyId,
              surveyName: response.surveyName,
              userName: response.isAnonymous ? null : response.userName,
              submittedAt: response.submittedAt,
              completionPercentage: response.completionPercentage,
              formattedTime: response.formattedTime,
              formattedDate: response.formattedDate,
              isAnonymous: response.isAnonymous,
              responseId: response.responseId
            }));
          }
        }
        setRecentResponses(processedResponses);
        console.log('Processed recent responses:', processedResponses);
        console.log('Recent responses data:', recentResponsesData);

        // Update statistics with overview data or calculate from surveys
        if (overviewData) {
          setStatistics({
            totalSurveys: overviewData.totalSurveys || surveysArray.length,
            activeSurveys: overviewData.activeSurveys || surveysArray.filter(s => s.status === 'ACTIVE').length,
            totalResponses: overviewData.totalResponses || surveysArray.reduce((sum, s) => sum + s.totalResponses, 0),
            responsesThisWeek: overviewData.responsesThisWeek || 0,
            responsesLastWeek: overviewData.responsesLastWeek || 0,
            newSurveysThisMonth: overviewData.newSurveysThisMonth || 0
          });
        } else {
          // Fallback to calculated statistics
          const totalSurveys = surveysArray.length;
          const activeSurveys = surveysArray.filter(s => s.status === 'ACTIVE').length;
          const totalResponses = surveysArray.reduce((sum, s) => sum + s.totalResponses, 0);

          setStatistics({
            totalSurveys,
            activeSurveys,
            totalResponses,
            responsesThisWeek: Math.floor(totalResponses * 0.2),
            responsesLastWeek: Math.floor(totalResponses * 0.15),
            newSurveysThisMonth: surveysArray.filter(s => {
              const createdDate = new Date(s.createdAt);
              const currentDate = new Date();
              return createdDate.getMonth() === currentDate.getMonth() &&
                createdDate.getFullYear() === currentDate.getFullYear();
            }).length
          });
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        const errorDetails = apiClient.getErrorDetails(err);
        setError(errorDetails.message || 'Failed to load dashboard data. Please try again.');

        // Set fallback data for charts
        setResponseTrends([
          { date: "Today", responses: 0, fullDate: new Date().toISOString().split('T')[0] }
        ]);
        setRecentActivity([
          { id: 1, action: "System initialized", survey: "Welcome", time: "just now", type: "system" }
        ]);
        setRecentResponses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Mock data for charts (keeping these as they require more complex backend changes)

  // console.log('responseTrends received:', responseTrends);
  // console.log('responseTrends length:', responseTrends?.length);
  // console.log('First responseTrends item:', responseTrends?.[0]);

  // Determine chart data to use - only render when data is available
  // let chartData = responseTrends
  useEffect(() => {
    if (responseTrends && Object.keys(responseTrends).length > 0) {
      setChartData(
        Object.values(responseTrends).map((item) => ({
          date: item.date,
          responses: item.responses || 0
        }))
      );
    }
    // console.log("responseTrends", responseTrends);
  }, [responseTrends]);



  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Logout should always succeed from the user's perspective
    }
  };

  const handleDeleteSurvey = async (surveyId, surveyTitle) => {
    showDangerConfirmation(
      'Delete Survey',
      `Are you sure you want to delete "${surveyTitle}"? This action cannot be undone and will permanently remove all associated responses.`,
      async () => {
        try {
          setDialogLoading(true);
          await SurveyService.deleteSurvey(surveyId);

          // Remove the survey from the local state
          setSurveys(prevSurveys => {
            const updatedSurveys = prevSurveys.filter(s => s.id !== surveyId);

            // Update statistics with the updated surveys list
            const updatedStats = SurveyService.calculateStats(updatedSurveys);
            setStatistics(updatedStats);

            return updatedSurveys;
          });

          closeDialog();
          // showSuccess('Survey Deleted', 'The survey has been successfully deleted.');

        } catch (error) {
          console.error('Error deleting survey:', error);
          const errorMessage = apiClient.getErrorMessage(error);
          closeDialog();
          // showDanger('Delete Failed', errorMessage || 'Failed to delete the survey. Please try again.');
        } finally {
          setDialogLoading(false);
        }
      },
      () => {
        setActiveDropdown(null); // Close dropdown when cancelled
      }
    );
  };

  const toggleDropdown = (surveyId, event) => {
    event.stopPropagation();
    setActiveDropdown(activeDropdown === surveyId ? null : surveyId);
  };

  const closeDropdown = () => {
    setActiveDropdown(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (activeDropdown) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdown]);

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'A';
  };

  const filteredSurveys = useMemo(() => {
    let filtered = surveys;

    // Filter by status
    if (filterStatus !== "ALL") {
      filtered = filtered.filter(survey => survey.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(survey =>
        survey.title.toLowerCase().includes(term) ||
        (survey.description && survey.description.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [surveys, filterStatus, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredSurveys.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSurveys = filteredSurveys.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm]);



  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCompletionTime = (seconds) => {
    if (!seconds || seconds <= 0) {
      return "N/A";
    }

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

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return formatDate(dateString);
  };

  const getTrendIcon = (current, previous) => {
    if (current > previous) return "↗";
    if (current < previous) return "↘";
    return "→";
  };

  const getTrendClass = (current, previous) => {
    if (current > previous) return styles.trendUp;
    if (current < previous) return styles.trendDown;
    return styles.trendNeutral;
  };

  if (loading) {
    return (
      <div className={styles.dashboardPage}>
        <div className={styles.backgroundElements}>
          <div className={styles.floatingShape1}></div>
          <div className={styles.floatingShape2}></div>
          <div className={styles.floatingShape3}></div>
          <div className={styles.floatingShape4}></div>
        </div>

        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <div className={styles.loadingText}>Loading admin dashboard...</div>
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
            <h1 className={styles.adminTitle}>
              <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              Admin Dashboard
            </h1>
            <p className={styles.adminSubtitle}>Survey management and analytics overview</p>
            <p className={styles.welcomeText}>Welcome back, {user?.name} ({user?.role})</p>
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
            <div className={styles.statHeader}>
              <Target className={styles.statIcon} size={24} />
              <div className={`${styles.statTrend} ${getTrendClass(statistics.totalSurveys, statistics.totalSurveys - 1)}`}>
                {getTrendIcon(statistics.totalSurveys, statistics.totalSurveys - 1)} +{statistics.newSurveysThisMonth}
              </div>
            </div>
            <div className={styles.statValue}>{statistics.totalSurveys}</div>
            <div className={styles.statLabel}>Total Surveys</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <CheckCircle className={styles.statIcon} size={24} />
              <div className={`${styles.statTrend} ${getTrendClass(statistics.activeSurveys, Math.max(0, statistics.activeSurveys - 1))}`}>
                {getTrendIcon(statistics.activeSurveys, Math.max(0, statistics.activeSurveys - 1))}
                {statistics.activeSurveys > 0 ? '+' : ''}1
              </div>
            </div>
            <div className={styles.statValue}>{statistics.activeSurveys}</div>
            <div className={styles.statLabel}>Active Surveys</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <TrendingUp className={styles.statIcon} size={24} />
              <div className={`${styles.statTrend} ${getTrendClass(statistics.responsesThisWeek, statistics.responsesLastWeek)}`}>
                {getTrendIcon(statistics.responsesThisWeek, statistics.responsesLastWeek)} +{statistics.responsesThisWeek - statistics.responsesLastWeek}
              </div>
            </div>
            <div className={styles.statValue}>{statistics.totalResponses}</div>
            <div className={styles.statLabel}>Total Responses</div>
          </div>

          {/* Analytics Card */}
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <Activity className={styles.statIcon} size={24} />
              {statistics.totalSurveys > 0 && (
                <div className={`${styles.statTrend} ${getTrendClass(statistics.responsesThisWeek, statistics.responsesLastWeek)}`}>
                  {getTrendIcon(statistics.responsesThisWeek, statistics.responsesLastWeek)}
                  {statistics.responsesThisWeek >= statistics.responsesLastWeek ? '+' : ''}
                  {Math.abs(statistics.responsesThisWeek - statistics.responsesLastWeek)}
                </div>
              )}
            </div>
            <div className={styles.quickActionsInCard}>
              <div className={styles.analyticsInfo}>
                <div className={styles.analyticsSubtitle}>
                  {statistics.totalSurveys > 0
                    ? `Avg: ${Math.round(statistics.totalResponses / statistics.totalSurveys)} responses/survey`
                    : 'No survey data available'
                  }
                </div>
                {statistics.totalSurveys > 0 && (
                  <div className={styles.analyticsMetrics}>
                    <div className={styles.metricItem}>
                      <TrendingUp size={14} />
                      <span>{statistics.responsesThisWeek} this week</span>
                    </div>
                    <div className={styles.metricItem}>
                      <CheckCircle size={14} />
                      <span>
                        {surveys.length > 0
                          ? `${Math.round(surveys.reduce((sum, s) => sum + (s.completionRate || 0), 0) / surveys.length)}% avg completion`
                          : '0% completion'
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className={styles.mainContentGrid}>
          {/* Survey Management - Full Width */}
          <div className={styles.surveyManagementSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderContent}>
                <div className={styles.sectionTitleGroup}>
                  <h2 className={styles.sectionTitle}>
                    <ClipboardList className={styles.sectionIcon} size={24} />
                    Survey Management
                  </h2>

                </div>
                <button
                  className={styles.createSurveyButton}
                  onClick={() => navigate("/admin/surveys/create")}
                >
                  <Plus size={18} />
                  Create Survey
                </button>
              </div>
            </div>
            <div className={styles.sectionContent}>
              {/* Search and Filters */}
              <div className={styles.surveyControls}>
                <div className={styles.searchContainer}>
                  <Search className={styles.searchIcon} size={20} />
                  <input
                    type="text"
                    placeholder="Search surveys by title or description..."
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

                <div className={styles.surveyFilters}>
                  {["ALL", "ACTIVE", "INACTIVE", "DRAFT"].map((status) => (
                    <button
                      key={status}
                      className={`${styles.filterButton} ${filterStatus === status ? styles.active : ''}`}
                      onClick={() => setFilterStatus(status)}
                    >
                      {status} ({status === "ALL" ? surveys.length : surveys.filter(s => s.status === status).length})
                    </button>
                  ))}
                </div>
              </div>

              {/* Survey List */}
              <div className={styles.surveyListContainer}>
                {loading && (
                  <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <div className={styles.loadingText}>Loading surveys...</div>
                  </div>
                )}

                {error && (
                  <div className={styles.errorContainer}>
                    <p className={styles.errorText}>{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className={styles.retryButton}
                    >
                      Retry
                    </button>
                  </div>
                )}

                {!loading && !error && filteredSurveys.length === 0 && (
                  <div className={styles.emptyState}>
                    <FileText className={styles.emptyIcon} size={64} />
                    <div className={styles.emptyTitle}>No surveys found</div>
                    <div className={styles.emptyDescription}>
                      {searchTerm
                        ? `No surveys match "${searchTerm}" ${filterStatus !== "ALL" ? `with status ${filterStatus}` : ''}.`
                        : `No surveys found ${filterStatus !== "ALL" ? `with status ${filterStatus}` : ''}.`
                      }
                    </div>
                  </div>
                )}                {!loading && !error && paginatedSurveys.length > 0 && (
                  <>
                    <div className={styles.surveyGrid}>
                      {paginatedSurveys.map((survey) => (
                        <div
                          key={survey.id}
                          className={`${styles.enhancedSurveyCard} ${selectedSurveyId === survey.id ? styles.selected : ''} ${styles[`status${survey.status.charAt(0) + survey.status.slice(1).toLowerCase()}`]}`}
                          onClick={() => setSelectedSurveyId(survey.id)}
                        >
                          <div className={styles.surveyCardHeader}>
                            <div className={styles.surveyTitleSection}>
                              <h3 className={styles.surveyCardTitle}>{survey.title}</h3>
                              <span className={`${styles.statusBadge} ${styles[`status${survey.status.charAt(0) + survey.status.slice(1).toLowerCase()}`]}`}>
                                {survey.status}
                              </span>
                            </div>
                            <div className={styles.surveyActions}>
                              <button
                                className={styles.actionBtn}
                                title="Edit Survey"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/admin/surveys/${survey.id}/edit`);
                                }}
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                className={styles.actionBtn}
                                title="View Details"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/admin/surveys/${survey.id}`);
                                }}
                              >
                                <Eye size={16} />
                              </button>
                              <div className={styles.dropdownContainer}>
                                <button
                                  className={styles.actionBtn}
                                  title="More Options"
                                  onClick={(e) => toggleDropdown(survey.id, e)}
                                >
                                  <MoreHorizontal size={16} />
                                </button>
                                {activeDropdown === survey.id && (
                                  <div className={styles.dropdown}>
                                    <button
                                      className={styles.dropdownItem}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSurvey(survey.id, survey.title);
                                        setActiveDropdown(null);
                                      }}
                                    >
                                      <Trash2 size={14} />
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className={styles.surveyCardContent}>
                            {survey.description && (
                              <div className={styles.surveyDescription}>
                                {survey.description}
                              </div>
                            )}

                            <div className={styles.surveyMetaGrid}>
                              <div className={styles.metaItem}>
                                <Calendar className={styles.metaIcon} size={16} />
                                <span className={styles.metaLabel}>Created:</span>
                                <span className={styles.metaValue}>{formatDate(survey.createdAt)}</span>
                              </div>
                              <div className={styles.metaItem}>
                                <Clock className={styles.metaIcon} size={16} />
                                <span className={styles.metaLabel}>Updated:</span>
                                <span className={styles.metaValue}>{formatDate(survey.updatedAt)}</span>
                              </div>
                              <div className={styles.metaItem}>
                                <BarChart3 className={styles.metaIcon} size={16} />
                                <span className={styles.metaLabel}>Responses:</span>
                                <span className={styles.metaValue}>{survey.totalResponses}</span>
                              </div>
                              <div className={styles.metaItem}>
                                <HelpCircle className={styles.metaIcon} size={16} />
                                <span className={styles.metaLabel}>Questions:</span>
                                <span className={styles.metaValue}>{survey.totalQuestions}</span>
                              </div>
                            </div>
                          </div>

                          {/* <div className={styles.surveyProgress}>
                            <div className={styles.progressInfo}>
                              <span>Completion Rate: {survey.completionRate}%</span>
                              <span className={styles.progressPercentage}>{survey.completionRate}%</span>
                            </div>
                            <div className={styles.progressBar}>
                              <div
                                className={styles.progressFill}
                                style={{ width: `${survey.completionRate}%` }}
                              ></div>
                            </div>
                          </div> */}
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className={styles.pagination}>
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className={styles.paginationBtn}
                        >
                          <ChevronLeft size={16} />
                          Previous
                        </button>

                        <div className={styles.paginationInfo}>
                          <span>
                            Page {currentPage} of {totalPages} ({filteredSurveys.length} surveys)
                          </span>
                        </div>

                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className={styles.paginationBtn}
                        >
                          Next
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Grid - Response Trends and Recent Responses */}
        <div className={styles.contentGrid} data-section="analytics">
          {/* Response Trends */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <TrendingUp className={styles.sectionIcon} size={24} />
                Response Trends
              </h2>
              <p className={styles.sectionSubtitle}>Real-time response activity trends</p>
            </div>
            <div className={`${styles.sectionContent} ${styles.chartSectionContent}`}>
              {loading ? (
                <div className={styles.chartLoadingContainer}>
                  <div className={styles.spinner}></div>
                  <div className={styles.loadingText}>Loading response trends...</div>
                </div>
              ) : chartData.length === 0 ? (
                <div className={styles.chartEmptyContainer}>
                  <div className={styles.emptyChartMessage}>No response data available</div>
                </div>
              ) : (
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorResponses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#667eea" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                      <XAxis dataKey="date" stroke="#718096" />
                      <YAxis stroke="#718096" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255,255,255,0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="responses"
                        stroke="#667eea"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorResponses)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Recent Responses */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <FileEdit className={styles.sectionIcon} size={24} />
                Recent Responses
              </h2>
              <p className={styles.sectionSubtitle}>Latest 5 survey responses submitted</p>
            </div>
            <div className={styles.sectionContent}>
              <div className={styles.responsesList}>
                {recentResponses.length === 0 ? (
                  <div className={styles.emptyResponsesState}>
                    <AlertCircle className={styles.emptyResponsesIcon} size={48} />
                    <div className={styles.emptyResponsesTitle}>No responses yet</div>
                    <div className={styles.emptyResponsesDescription}>Survey responses will appear here when submitted</div>
                  </div>
                ) : (
                  recentResponses.map((response, index) => (
                    <div key={response.responseId || response.id || index} className={styles.responseItem}>
                      <div className={styles.responseIcon}>
                        <FileEdit size={20} />
                      </div>
                      <div className={styles.responseContent}>
                        <div className={styles.responseHeader}>
                          <div className={styles.responseSurvey}>{response.surveyName}</div>
                          <div className={styles.responseTime} title={response.formattedDate}>
                            {response.formattedTime}
                          </div>
                        </div>
                        <div className={styles.responseDetails}>
                          <div className={styles.responseUser}>
                            <User className={styles.userIcon} size={14} />
                            <span>{response.userName || 'Anonymous User'}</span>
                          </div>
                          <div className={styles.responseCompletion}>
                            <div className={styles.completionText}>
                              {response.completionPercentage}% completed
                            </div>
                            <div className={styles.completionBar}>
                              <div
                                className={styles.completionFill}
                                style={{ width: `${response.completionPercentage}%` }}
                              ></div>
                            </div>
                            {response.completionTimeSeconds && (
                              <div className={styles.completionTime}>
                                ⏱️ {formatCompletionTime(response.completionTimeSeconds)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Dialog for confirmations and alerts */}
      <Dialog {...dialogState} onClose={closeDialog} />
    </div>
  );
}
