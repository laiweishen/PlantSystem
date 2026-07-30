import { useState, useEffect } from 'react';

export function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = () => {
        const token = sessionStorage.getItem('userToken');
        const userData = sessionStorage.getItem('user');

        if (token && userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setIsAuthenticated(true);
                setUser(parsedUser);
            } catch (error) {
                console.error('Error parsing user data:', error);
                setIsAuthenticated(false);
                setUser(null);
            }
        } else {
            setIsAuthenticated(false);
            setUser(null);
        }
        setLoading(false);
    };

    const logout = (navigate) => {
        sessionStorage.removeItem('userToken');
        sessionStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
        if (navigate) {
            navigate('/login', { replace: true });
        }
    };

    return { 
        isAuthenticated, 
        user, 
        loading, 
        checkAuth, 
        logout 
    };
}
