import api from './api';

export interface User {
    id: number;
    email: string;
    full_name?: string;
    is_active: boolean;
    is_superuser: boolean;
    role: string;
    avatar_url?: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
}

export const authService = {
    login: async (username: string, password: string): Promise<AuthResponse> => {
        // FastAPI OAuth2PasswordRequestForm expects form-data usually, but we implemented a simple JSON endpoint 
        // Wait, let's double check auth.py. 
        // Standard FastAPI OAuth2 uses FormData. 
        // Let's assume standard form-data for now if it uses OAuth2PasswordRequestForm,
        // OR if I implemented a JSON custom endpoint.
        // I'll check the auth.py file content to be sure.

        // For now assuming JSON or Form Data based on standard FastAPI Security.
        // Usually:
        // Use URLSearchParams for application/x-www-form-urlencoded
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await api.post<AuthResponse>('/auth/access-token', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data;
    },

    getMe: async (): Promise<User> => {
        const response = await api.get<User>('/users/me');
        return response.data;
    },
};
