import api from './api';
import { MacroCycle, MesoCycle, MicroCycle } from '@/types';

// Mappers
const mapMicro = (data: any): MicroCycle => ({
    id: data.id,
    name: data.name,
    startDate: data.start_date,
    endDate: data.end_date,
    focus: data.focus ? data.focus.split(',') : [], // Backend might store as string or List. Check model.
    volume: data.volume,
    intensity: data.intensity,
});

const mapMeso = (data: any): MesoCycle => ({
    id: data.id,
    name: data.name,
    startDate: data.start_date,
    endDate: data.end_date,
    micros: data.micros ? data.micros.map(mapMicro) : [],
    isExpanded: true // Default to expanded or handle UI state separately
});

const mapMacro = (data: any): MacroCycle => ({
    id: data.id,
    name: data.name,
    season: data.season,
    startDate: data.start_date,
    endDate: data.end_date,
    model: data.model,
    architecture: data.architecture,
    mesos: data.mesos ? data.mesos.map(mapMeso) : [], // Nested
    isExpanded: true
});

export const cyclesService = {
    getAll: async () => {
        const response = await api.get<any[]>('/cycles/macros/');
        return response.data.map(mapMacro);
    },

    createMacro: async (data: any) => {
        const payload = {
            name: data.name,
            season: data.season,
            start_date: data.startDate,
            end_date: data.endDate,
            model: data.model,
            architecture: data.architecture
        };
        const response = await api.post<any>('/cycles/macros/', payload);
        return mapMacro(response.data);
    },

    updateMacro: async (id: string, data: any) => {
        // similar mapping for update
        const payload: any = {};
        if (data.name) payload.name = data.name;
        if (data.startDate) payload.start_date = data.startDate;
        if (data.endDate) payload.end_date = data.endDate;
        // ...
        const response = await api.put<any>(`/cycles/macros/${id}`, payload);
        return mapMacro(response.data);
    },

    deleteMacro: async (id: string) => {
        await api.delete(`/cycles/macros/${id}`);
    },

    // Meso
    createMeso: async (macroId: string, data: any) => {
        const payload = {
            macro_id: macroId,
            name: data.name,
            start_date: data.startDate,
            end_date: data.endDate
        };
        const response = await api.post<any>('/cycles/mesos/', payload);
        return mapMeso(response.data);
    },

    updateMeso: async (id: string, data: any) => {
        const payload: any = {};
        if (data.name) payload.name = data.name;
        if (data.startDate) payload.start_date = data.startDate;
        if (data.endDate) payload.end_date = data.endDate;
        const response = await api.put<any>(`/cycles/mesos/${id}`, payload);
        return mapMeso(response.data);
    },

    deleteMeso: async (id: string) => {
        await api.delete(`/cycles/mesos/${id}`);
    },

    // Micro
    createMicro: async (mesoId: string, data: any) => {
        const payload = {
            meso_id: mesoId,
            name: data.name,
            start_date: data.startDate,
            end_date: data.endDate,
            volume: 0,
            intensity: 'Medium',
            focus: "Geral"
        };
        const response = await api.post<any>('/cycles/micros/', payload);
        return mapMicro(response.data);
    },

    updateMicro: async (id: string, data: any) => {
        const payload: any = {};
        if (data.name) payload.name = data.name;
        if (data.startDate) payload.start_date = data.startDate;
        if (data.endDate) payload.end_date = data.endDate;
        const response = await api.put<any>(`/cycles/micros/${id}`, payload);
        return mapMicro(response.data);
    },

    deleteMicro: async (id: string) => {
        await api.delete(`/cycles/micros/${id}`);
    }
};
