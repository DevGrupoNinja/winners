import api from './api';
import { GymTemplate, GymWorkout, GymExercise } from '@/types';

// Mappers

const mapExerciseToBackend = (ex: GymExercise): any => ({
    name: ex.name,
    muscle_group: ex.physicalMotorCapacity,
    physicalMotorCapacity: ex.physicalMotorCapacity,  // Also send as separate field for DDR/DCR calculation
    sets: ex.sets,
    reps: ex.reps,
    rest_time: ex.restInterval,
    observation: ex.observation,
    relative_load_meta: ex.targetLoads || []
});

const mapExerciseFromBackend = (data: any, index: number): GymExercise => ({
    id: data.id ? data.id.toString() : `generated-${Date.now()}-${index}`,
    name: data.name,
    executionMode: 'Normal', // Default
    physicalMotorCapacity: data.physicalMotorCapacity || data.muscle_group || 'Força Máxima',
    sets: data.sets,
    reps: data.reps,
    restInterval: data.rest_time || '',
    observation: data.observation || '',
    targetLoads: data.relative_load_meta || [], // List<float> -> number[]
});

const mapTemplate = (data: any): GymTemplate => ({
    id: data.id.toString(),
    title: data.title,
    category: data.category || 'Geral',
    author: 'Coach', // Backend doesn't store author yet? assumed
    lastUpdated: new Date().toISOString().split('T')[0], // Backend doesn't return update date yet
    exercises: (data.exercises || []).map(mapExerciseFromBackend),
    observations: ''
});

const mapSession = (data: any): GymWorkout => ({
    id: data.id.toString(),
    title: data.title,
    category: data.category || 'Geral',
    date: data.date, // Format is YYYY-MM-DD
    time: data.time ? data.time.substring(0, 5) : '',
    sourceTemplateName: data.template_snapshot?.title,
    // Safely assume parent_session_id exists in response now
    parent_session_id: data.parent_session_id,
    // Backend returns 'exercises' via Pydantic model (populated from exercises_snapshot property)
    // But check both just in case legacy or raw dicts are returned
    exercises: (data.exercises || data.exercises_snapshot || []).map(mapExerciseFromBackend),
    history: [], // Backend Session doesn't hold history
    status: data.status || 'Planned',
    feedbacks: data.feedbacks || [],
});

export const gymService = {
    // --- Templates ---
    getAllTemplates: async () => {
        const response = await api.get<any[]>('/gym/templates/');
        return response.data.map(mapTemplate);
    },

    createTemplate: async (template: GymTemplate) => {
        const payload = {
            title: template.title,
            category: template.category,
            exercises: template.exercises.map(mapExerciseToBackend)
        };
        const response = await api.post<any>('/gym/templates/', payload);
        return mapTemplate(response.data);
    },

    updateTemplate: async (template: GymTemplate) => {
        const payload = {
            title: template.title,
            category: template.category,
            exercises: template.exercises.map(mapExerciseToBackend)
        };
        const response = await api.put<any>(`/gym/templates/${template.id}`, payload);
        return mapTemplate(response.data);
    },

    deleteTemplate: async (id: string) => {
        await api.delete(`/gym/templates/${id}`);
    },

    // --- Sessions (Workouts) ---
    getAllSessions: async () => {
        const response = await api.get<any[]>('/gym/sessions/');
        return response.data.map(mapSession);
    },

    createSession: async (workout: GymWorkout, templateId?: string) => {
        const payload = {
            date: workout.date,
            time: workout.time,
            title: workout.title,
            category: workout.category,
            template_snapshot_id: templateId ? parseInt(templateId) : null,
            status: 'Planned',
            exercises: workout.exercises.map(mapExerciseToBackend)
        };
        const response = await api.post<any>('/gym/sessions/', payload);
        return mapSession(response.data);
    },

    deleteSession: async (id: string) => {
        await api.delete(`/gym/sessions/${id}`);
    },

    startSession: async (workoutId: string, time?: string) => {
        // time should be "HH:MM" or similar valid time string
        const response = await api.post<any>(`/gym/sessions/${workoutId}/start`, { time: time || null });
        return mapSession(response.data);
    },

    updateSession: async (session: GymWorkout) => {
        const payload = {
            date: session.date,
            time: session.time,
            title: session.title,
            category: session.category,
            status: session.status,
            exercises: session.exercises.map(mapExerciseToBackend)
        };
        const response = await api.put<any>(`/gym/sessions/${session.id}`, payload);
        return mapSession(response.data);
    },

    createFeedback: async (sessionId: string, evaluation: any) => {
        // evaluation: { athleteId, performedLoads, attendance, notes }
        const payload = {
            athlete_id: evaluation.athleteId,
            performed_loads: evaluation.performedLoads, // Dict[str, List[float]]
            attendance: evaluation.attendance ? 'Present' : 'Absent',
            notes: evaluation.notes
        };
        const response = await api.post<any>(`/gym/sessions/${sessionId}/feedback`, payload);
        return response.data;
    }
};
