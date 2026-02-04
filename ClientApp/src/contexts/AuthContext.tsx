import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface AuthContextType
{
    isAuthenticated: boolean;
    username: string | null;
    token: string | null;
    sessionExpiresAt: number | null;
    login: (username: string, token: string, expiresIn: number) => void;
    logout: () => void;
    getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode })
{
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    {
        const expiresAt = sessionStorage.getItem('sessionExpiresAt');
        if (expiresAt && Date.now() > parseInt(expiresAt))
        {
            // Session expired, clear storage
            sessionStorage.removeItem('isAuthenticated');
            sessionStorage.removeItem('username');
            sessionStorage.removeItem('accessToken');
            sessionStorage.removeItem('sessionExpiresAt');
            return false;
        }
        return sessionStorage.getItem('isAuthenticated') === 'true';
    });
    const [username, setUsername] = useState<string | null>(() =>
    {
        return sessionStorage.getItem('username');
    });
    const [token, setToken] = useState<string | null>(() =>
    {
        return sessionStorage.getItem('accessToken');
    });
    const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(() =>
    {
        const stored = sessionStorage.getItem('sessionExpiresAt');
        return stored ? parseInt(stored) : null;
    });

    const login = useCallback((user: string, accessToken: string, expiresIn: number) =>
    {
        const expiresAt = Date.now() + expiresIn * 1000;

        setIsAuthenticated(true);
        setUsername(user);
        setToken(accessToken);
        setSessionExpiresAt(expiresAt);

        sessionStorage.setItem('isAuthenticated', 'true');
        sessionStorage.setItem('username', user);
        sessionStorage.setItem('accessToken', accessToken);
        sessionStorage.setItem('sessionExpiresAt', expiresAt.toString());
    }, []);

    const logout = useCallback(() =>
    {
        setIsAuthenticated(false);
        setUsername(null);
        setToken(null);
        setSessionExpiresAt(null);

        sessionStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('sessionExpiresAt');
    }, []);

    const getToken = useCallback(() =>
    {
        return sessionStorage.getItem('accessToken');
    }, []);

    // Auto-logout when session expires
    useEffect(() =>
    {
        if (!sessionExpiresAt) return;

        const checkExpiry = () =>
        {
            if (Date.now() >= sessionExpiresAt)
            {
                logout();
            }
        };

        const interval = setInterval(checkExpiry, 1000);
        return () => clearInterval(interval);
    }, [sessionExpiresAt, logout]);

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            username,
            token,
            sessionExpiresAt,
            login,
            logout,
            getToken
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth()
{
    const context = useContext(AuthContext);
    if (context === undefined)
    {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
