import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

// Import components
import Login from './pages/Login/Login';
import SignUp from './pages/SignUp/SignUp';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import NotFound from './pages/NotFound';
import LandingPage from './pages/LandingPage/LandingPage';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard'
import UserDashboard from './pages/UserDashboard/UserDashboard';
import SurveyCreationPage from './pages/SurveyCreation/SurveyCreationPage';
import EditSurveyPage from './pages/SurveyEdit/EditSurveyPage';
import SurveyFormPage from './pages/SurveyForm/SurveyFormPage';
import SurveyViewPage from './pages/SurveyView/SurveyViewPage';
import UserResponseView from './pages/UserResponseView';

// Component to handle login route with return URL logic
const LoginRoute = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (isAuthenticated()) {
    // Check for return URL in localStorage first, then navigation state
    const returnToFromStorage = localStorage.getItem('returnTo');
    const returnToFromState = location.state?.returnTo;
    const returnTo = returnToFromStorage || returnToFromState;

    if (returnTo) {
      // Clear the stored return URL and redirect to it
      localStorage.removeItem('returnTo');
      return <Navigate to={returnTo} replace />;
    } else {
      // Default redirect based on user role
      return user?.role === 'ADMIN' ?
        <Navigate to="/admin/dashboard" replace /> :
        <Navigate to="/user/dashboard" replace />;
    }
  }

  return <Login />;
};

// Component to handle signup route with return URL logic
const SignUpRoute = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (isAuthenticated()) {
    // Check for return URL in localStorage first, then navigation state
    const returnToFromStorage = localStorage.getItem('returnTo');
    const returnToFromState = location.state?.returnTo;
    const returnTo = returnToFromStorage || returnToFromState;

    if (returnTo) {
      // Clear the stored return URL and redirect to it
      localStorage.removeItem('returnTo');
      return <Navigate to={returnTo} replace />;
    } else {
      // Default redirect based on user role
      return user?.role === 'ADMIN' ?
        <Navigate to="/admin/dashboard" replace /> :
        <Navigate to="/user/dashboard" replace />;
    }
  }

  return <SignUp />;
};

// Component that handles initial routing based on auth state
const AppRoutes = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen={true}
        text="Initializing application..."
        size="large"
        variant="primary"
      />
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/signup" element={<SignUpRoute />} />
      <Route path="/forgot" element={<ForgotPassword />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Survey Form Route - Public/Anonymous access */}
      <Route path="/survey/:surveyId" element={<SurveyFormPage />} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute requiredRole="ADMIN">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/surveys/create" element={
        <ProtectedRoute requiredRole="ADMIN">
          <SurveyCreationPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/surveys/:surveyId/edit" element={
        <ProtectedRoute requiredRole="ADMIN">
          <EditSurveyPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/surveys/:surveyId" element={
        <ProtectedRoute requiredRole="ADMIN">
          <SurveyViewPage />
        </ProtectedRoute>
      } />

      {/* Legacy admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="ADMIN">
          <Navigate to="/admin/dashboard" replace />
        </ProtectedRoute>
      } />

      {/* User Routes */}
      <Route path="/user/dashboard" element={
        <ProtectedRoute requiredRole="USER">
          <UserDashboard />
        </ProtectedRoute>
      } />
      <Route path="/user/response/:surveyId" element={
        <ProtectedRoute requiredRole="USER">
          <UserResponseView />
        </ProtectedRoute>
      } />

      {/* Legacy dashboard route - redirect based on role */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          {user?.role === 'ADMIN' ? (
            <Navigate to="/admin/dashboard" replace />
          ) : (
            <Navigate to="/user/dashboard" replace />
          )}
        </ProtectedRoute>
      } />

      {/* Root redirect */}
      <Route path="/" element={<LandingPage />} />

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;