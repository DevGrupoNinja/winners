import api from './api';
import { Athlete } from '@/types';

// Helper to map Backend (snake_case) to Frontend (camelCase)
const mapAthlete = (data: any): Athlete => ({
    id: data.id.toString(),
    firstName: data.first_name,
    lastName: data.last_name,
    name: `${data.first_name} ${data.last_name}`,
    birthDate: data.birth_date,
    cpf: data.cpf,
    address: data.address,
    email: data.email,
    phone: data.phone,
    category: data.category,
    status: data.status,
    avatarUrl: data.avatar_url,
    recentLoad: data.recent_load,
    fatigueScore: data.fatigue_score,
    bodyWeight: data.body_weight,
});

export const athleteService = {
    getAll: async (params?: { search?: string; category?: string; status?: string }) => {
        const response = await api.get<any[]>('/athletes/', { params });
        return response.data.map(mapAthlete);
    },

    getById: async (id: string | number) => {
        const response = await api.get<any>(`/athletes/${id}`);
        return mapAthlete(response.data);
    },

    create: async (data: Partial<Athlete>) => {
        // Backend expects snake_case, but let's check if we configured Pydantic to accept camelCase or if we need to map.
        // Pydantic usually expects snake_case by default unless configured with AliasGenerator. 
        // My schemas in `schemas/athlete.py` use snake_case in `AthleteBase`? 
        // No, I defined them as `first_name`, `last_name`. 
        // The frontend uses `firstName`, `lastName`.
        // So I need to map here.

        const payload = {
            first_name: data.firstName,
            last_name: data.lastName,
            cpf: data.cpf,
            email: data.email,
            phone: data.phone,
            address: data.address,
            birth_date: data.birthDate,
            category: data.category,
            status: data.status,
            avatar_url: data.avatarUrl,
        };

        const response = await api.post<any>('/athletes/', payload);
        return mapAthlete(response.data);
    },

    update: async (id: string | number, data: Partial<Athlete>) => {
        const payload: any = {};
        if (data.firstName) payload.first_name = data.firstName;
        if (data.lastName) payload.last_name = data.lastName;
        if (data.cpf) payload.cpf = data.cpf;
        if (data.email) payload.email = data.email;
        if (data.phone) payload.phone = data.phone;
        if (data.address) payload.address = data.address;
        if (data.birthDate) payload.birth_date = data.birthDate;
        if (data.category) payload.category = data.category;
        if (data.status) payload.status = data.status;
        if (data.avatarUrl) payload.avatar_url = data.avatarUrl;

        const response = await api.put<any>(`/athletes/${id}`, payload);
        return mapAthlete(response.data);
    },

    delete: async (id: string | number) => {
        const response = await api.delete<any>(`/athletes/${id}`);
        return mapAthlete(response.data);
    },

    // --- Category Configuration ---
    getCategories: async () => {
        const response = await api.get<any[]>('/athletes/categories/');
        return response.data;
    },

    createCategory: async (data: { name: string }) => {
        const response = await api.post<any>('/athletes/categories/', data);
        return response.data;
    },

    updateCategory: async (id: number, data: { name: string }) => {
        const response = await api.put<any>(`/athletes/categories/${id}`, data);
        return response.data;
    },

    deleteCategory: async (id: number) => {
        await api.delete(`/athletes/categories/${id}`);
    }
};
