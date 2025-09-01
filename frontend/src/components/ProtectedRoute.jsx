import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, loading, isAuthenticated, hasRole } = useAuth();

    if (loading) {
        return (
            <LoadingSpinner
                fullScreen={true}
                text="Verifying authentication..."
                size="large"
                variant="primary"
            />
        );
    }

    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && !hasRole(requiredRole)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
                    <p className="text-gray-600">You don't have permission to access this page.</p>
                    <p className="text-sm text-gray-500 mt-2">Required role: {requiredRole}</p>
                    <p className="text-sm text-gray-500">Your role: {user?.role}</p>
                </div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;