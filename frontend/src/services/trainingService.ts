import api from './api';
import { Workout, WorkoutBlock, WorkoutSubdivision } from '@/types';

// Mappers
const mapSubdivision = (data: any): WorkoutSubdivision => ({
    id: data.id,
    type: data.type || 'DDR',
    seriesOrder: data.reps || data.order || 0,
    distance: data.distance || 0,
    description: data.observation || '',
    category: data.style || '',
    interval: data.interval_time || '',
    pause: data.pause_time || '',
    targetLoads: [],
    totalDistance: data.distance || 0,  // distance already contains the total
    daRe: data.da_re ? data.da_re.toString() : '',
    daEr: data.da_er ? data.da_er.toString() : '',
    functionalBase: data.functional_base || ''
});

const mapBlock = (data: any): WorkoutBlock => ({
    id: data.id,
    order: data.order || 0,
    exerciseName: data.name || '',
    mainSet: data.reps || '',
    observations: data.instructions || '',
    volume: data.total_distance || 0,
    ddr: '',
    dcr: '',
    athleteCount: 0,
    rpe: data.rpe_description || '',
    exhaustion: '',
    fatigue: '',
    subdivisions: data.subdivisions ? data.subdivisions.map(mapSubdivision) : []
});

const mapWorkout = (data: any): Workout => {
    const blocks = data.series ? data.series.map(mapBlock) : [];

    // Calculate totalVolume dynamically from subdivisions
    const totalVolume = blocks.reduce((acc: number, block: WorkoutBlock) => {
        return acc + block.subdivisions.reduce((subAcc: number, sub: WorkoutSubdivision) => {
            return subAcc + (sub.totalDistance || 0);
        }, 0);
    }, 0);

    return {
        id: data.id,
        title: data.description || `Treino ${data.date}`,
        date: data.date,
        time: data.time || '00:00',
        profile: data.profile || 'Técnica',
        category: data.category || '',
        tags: [],
        totalVolume,
        status: data.status || 'Planned',
        ddr: 0,
        dcr: 0,
        density: 0,
        functionalBase: '',
        parentSessionId: data.parent_session_id,
        blocks,
        history: [],
        feedbacks: data.feedbacks || []
    };
};

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
        const payload: any = {
            date: data.date,
            profile: data.profile,
            category: data.category,
            description: data.title,
            series: data.blocks.map((b: any, index: number) => ({
                order: index + 1,
                name: b.exerciseName,
                reps: b.mainSet || '1x',
                rpe_target: null,
                rpe_description: b.rpe || null,
                instructions: b.observations,
                total_distance: b.volume || 0,
                subdivisions: b.subdivisions.map((s: any, sIndex: number) => ({
                    order: sIndex + 1,
                    type: s.type,
                    distance: s.distance,
                    reps: s.seriesOrder || 1,
                    style: s.category || '',
                    interval_time: s.interval,
                    pause_time: s.pause,
                    observation: s.description,
                    da_re: s.daRe ? parseFloat(s.daRe) : null,
                    da_er: s.daEr ? parseFloat(s.daEr) : null,
                    functional_base: s.functionalBase !== 'Automático' ? s.functionalBase : null
                }))
            }))
        };
        if (data.time) payload.time = data.time;

        console.log("DEBUG: Sending payload", payload);
        const response = await api.post<any>('/training/', payload);
        return mapWorkout(response.data);
    },

    update: async (id: string, data: any) => {
        const payload: any = {
            status: data.status,
            description: data.title,
            date: data.date,
            time: data.time,
            profile: data.profile,
            category: data.category,
        };

        if (data.blocks) {
            payload.series = data.blocks.map((b: any, index: number) => ({
                order: index + 1,
                name: b.exerciseName,
                reps: b.mainSet || '1x',
                rpe_target: null,
                rpe_description: b.rpe || null,
                instructions: b.observations,
                total_distance: b.volume || 0,
                subdivisions: b.subdivisions.map((s: any, sIndex: number) => ({
                    order: sIndex + 1,
                    type: s.type,
                    distance: s.distance,
                    reps: s.seriesOrder || 1,
                    style: s.category || '',
                    interval_time: s.interval,
                    pause_time: s.pause,
                    observation: s.description,
                    da_re: s.daRe ? parseFloat(s.daRe) : null,
                    da_er: s.daEr ? parseFloat(s.daEr) : null,
                    functional_base: s.functionalBase !== 'Automático' ? s.functionalBase : null
                }))
            }));
        }

        const response = await api.put<any>(`/training/${id}`, payload);
        return mapWorkout(response.data);
    },

    startSession: async (id: string) => {
        const response = await api.post<any>(`/training/${id}/start`);
        return mapWorkout(response.data);
    },

    addSeries: async (sessionId: string, block: any) => {
        const payload = {
            order: block.order,
            name: block.exerciseName,
            reps: block.mainSet || '1x',
            rpe_target: null,
            rpe_description: block.rpe || null,
            instructions: block.observations,
            total_distance: block.volume || 0,
            subdivisions: block.subdivisions.map((s: any, sIndex: number) => ({
                order: sIndex + 1,
                type: s.type,
                distance: s.distance,
                reps: s.seriesOrder || 1,
                style: s.category || '',
                interval_time: s.interval,
                pause_time: s.pause,
                observation: s.description,
                da_re: s.daRe ? parseFloat(s.daRe) : null,
                da_er: s.daEr ? parseFloat(s.daEr) : null,
                functional_base: s.functionalBase !== 'Automático' ? s.functionalBase : null
            }))
        };
        const response = await api.post<any>(`/training/${sessionId}/series`, payload);
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/training/${id}`);
    },

    getFunctionalDirectionRanges: async () => {
        const response = await api.get<any[]>('/training/functional-direction-ranges');
        return response.data;
    },

    createFeedback: async (sessionId: string, data: any) => {
        const response = await api.post<any>(`/training/${sessionId}/feedback`, data);
        return response.data;
    }
};
