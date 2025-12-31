import api from './api';
import { Workout, WorkoutBlock, WorkoutSubdivision } from '@/types';

// Mappers
const mapSubdivision = (data: any): WorkoutSubdivision => ({
    id: data.id,
    type: data.type || 'DDR',
    seriesOrder: data.order || 0,
    distance: data.distance || 0,
    description: data.observation || '',
    category: data.style || '',
    interval: data.interval_time || '',
    pause: data.pause_time || '',
    targetLoads: [],
    totalDistance: (data.distance || 0) * (data.reps || 1),
    daRe: data.da_re || '',
    daEr: data.da_er || '',
    functionalBase: ''
});

const mapBlock = (data: any): WorkoutBlock => ({
    id: data.id,
    order: data.order || 0,
    exerciseName: data.name || '',
    mainSet: '',
    observations: data.instructions || '',
    volume: data.total_distance || 0,
    ddr: '',
    dcr: '',
    athleteCount: 0,
    rpe: data.rpe_target ? data.rpe_target.toString() : '',
    exhaustion: '',
    fatigue: '',
    subdivisions: data.subdivisions ? data.subdivisions.map(mapSubdivision) : []
});

const mapWorkout = (data: any): Workout => ({
    id: data.id,
    title: data.description || `Treino ${data.date}`,
    date: data.date,
    time: data.time || '00:00',
    profile: 'Técnica',
    category: data.category || '',
    tags: [],
    totalVolume: data.total_volume || 0,
    status: data.status || 'Planned',
    ddr: 0,
    dcr: 0,
    density: 0,
    functionalBase: '',
    blocks: data.series ? data.series.map(mapBlock) : [],
    history: []
});

export const trainingService = {
    getAll: async () => {
        const response = await api.get<any[]>('/training/');
        return response.data.map(mapWorkout);
    },

    getById: async (id: string) => {
        const response = await api.get<any>(`/training/${id}`);
        return mapWorkout(response.data);
    },

    create: async (data: any) => {
        const payload = {
            date: data.date,
            time: data.time || "08:00",
            category: data.category,
            description: data.title,
            series: data.blocks.map((b: any, index: number) => ({
                order: index + 1,
                name: b.exerciseName,
                instructions: b.observations,
                subdivisions: b.subdivisions.map((s: any, sIndex: number) => ({
                    order: sIndex + 1,
                    type: s.type,
                    distance: s.distance,
                    reps: 1,
                    style: s.category,
                    interval_time: s.interval,
                    pause_time: s.pause,
                    observation: s.description
                }))
            }))
        };
        const response = await api.post<any>('/training/', payload);
        return mapWorkout(response.data);
    },

    update: async (id: string, data: any) => {
        // Assume simplified update for now (mostly status or basic fields)
        // If updating nested structure, backend needs to handle it (PUT might replace series)
        const payload: any = {};
        if (data.status) payload.status = data.status;
        if (data.title) payload.description = data.title;
        if (data.date) payload.date = data.date;
        // Full update to be implemented if needed, relying on partial or full payload logic in backend
        const response = await api.put<any>(`/training/${id}`, payload);
        return mapWorkout(response.data);
    },

    delete: async (id: string) => {
        await api.delete(`/training/${id}`);
    }
};
