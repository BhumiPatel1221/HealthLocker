import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'patient';
    isEmailVerified: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (userData: any) => Promise<{ email: string; message: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                try {
                    const res = await api.get('/auth/me');
                    setUser(res.data.data.user);
                } catch (err) {
                    console.error('Failed to load user', err);
                    logout();
                }
            }
            setLoading(false);
        };
        loadUser();
    }, [token]);

    const login = async (email: string, password: string) => {
        const res = await api.post('/auth/login', { email, password });
        const { token, user } = res.data.data;
        localStorage.setItem('token', token);
        setToken(token);
        setUser(user);
    };

    const register = async (userData: any): Promise<{ email: string; message: string }> => {
        const res = await api.post('/auth/register', userData);
        // Account is now created but NOT activated. The user must verify their email.
        // Do NOT set token/user here — they need to verify first.
        return {
            email: res.data.data?.email ?? userData.email,
            message: res.data.message ?? 'Check your email to verify your account.',
        };
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
