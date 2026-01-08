import api from './api';
import { UserProfile } from '@/types';

// Helper to map Backend (snake_case) to Frontend (camelCase)
const mapUser = (data: any): UserProfile => ({
    id: data.id.toString(),
    fullName: data.full_name || '',
    email: data.email,
    cpf: data.cpf,
    phone: data.phone,
    role: data.role,
    isActive: data.is_active,
    isSuperuser: data.is_superuser,
    avatarUrl: data.avatar_url,
});

export const userService = {
    getAll: async (params?: { search?: string; is_active?: boolean }) => {
        const response = await api.get<any[]>('/users/', { params });
        return response.data.map(mapUser);
    },

    getById: async (id: string | number) => {
        const response = await api.get<any>(`/users/${id}`);
        return mapUser(response.data);
    },

    create: async (data: {
        fullName: string;
        email: string;
        password: string;
        cpf?: string;
        phone?: string;
        role?: string;
        avatarUrl?: string;
    }) => {
        const payload = {
            full_name: data.fullName,
            email: data.email,
            password: data.password,
            cpf: data.cpf || null,
            phone: data.phone || null,
            role: data.role || 'COACH',
            avatar_url: data.avatarUrl || null,
            is_superuser: true, // Professors are admins
        };

        const response = await api.post<any>('/users/', payload);
        return mapUser(response.data);
    },

    update: async (id: string | number, data: Partial<{
        fullName: string;
        email: string;
        password: string;
        cpf: string;
        phone: string;
        isActive: boolean;
        avatarUrl: string;
    }>) => {
        const payload: any = {};
        if (data.fullName !== undefined) payload.full_name = data.fullName;
        if (data.email !== undefined) payload.email = data.email;
        if (data.password) payload.password = data.password;
        if (data.cpf !== undefined) payload.cpf = data.cpf || null;
        if (data.phone !== undefined) payload.phone = data.phone || null;
        if (data.isActive !== undefined) payload.is_active = data.isActive;
        if (data.avatarUrl !== undefined) payload.avatar_url = data.avatarUrl || null;

        const response = await api.put<any>(`/users/${id}`, payload);
        return mapUser(response.data);
    },

    delete: async (id: string | number) => {
        const response = await api.delete<any>(`/users/${id}`);
        return mapUser(response.data);
    },
};
