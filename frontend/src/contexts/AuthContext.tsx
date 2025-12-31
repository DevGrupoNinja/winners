import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User } from '@/services/authService';
import api from '@/services/api';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Verify if token is valid by fetching me
                    const userData = await authService.getMe();
                    setUser(userData);
                } catch (error) {
                    console.error('Initial token validation failed:', error);
                    localStorage.removeItem('token');
                }
            }
            setIsLoading(false);
        };

        loadUser();
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const { access_token } = await authService.login(email, password);
            localStorage.setItem('token', access_token);

            // Fetch user data immediately
            const userData = await authService.getMe();
            setUser(userData);
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
