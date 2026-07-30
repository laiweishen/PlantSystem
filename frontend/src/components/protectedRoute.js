// File: src/components/ProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/apiConfig';

// Protected Route - requires login (for all users)
export function ProtectedRoute({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = sessionStorage.getItem('userToken');
        
        if (!token) {
            setIsAuthenticated(false);
            setLoading(false);
            return;
        }

        try {
            // Verify token with backend
            const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setIsAuthenticated(true);
            } else {
                sessionStorage.removeItem('userToken');
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            fontSize: '1.2rem',
            color: '#6b7280'
        }}>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

// Admin-only Protected Route
export function AdminRoute({ children }) {
    const [isAdmin, setIsAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAdminAuth();
    }, []);

    const checkAdminAuth = async () => {
        const token = sessionStorage.getItem('userToken');
        
        if (!token) {
            setIsAdmin(false);
            setLoading(false);
            return;
        }

        try {
            // Verify admin token with backend
            const response = await fetch(`${API_BASE_URL}/api/auth/verify-admin`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();
            if (response.ok && result.isAdmin) {
                setIsAdmin(true);
            } else {
                sessionStorage.removeItem('userToken');
                setIsAdmin(false);
            }
        } catch (error) {
            console.error('Admin auth check failed:', error);
            setIsAdmin(false);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            fontSize: '1.2rem',
            color: '#6b7280'
        }}>Verifying admin access...</div>;
    }

    if (!isAdmin) {
        return <Navigate to="/login" replace />;
    }

    return children;
}