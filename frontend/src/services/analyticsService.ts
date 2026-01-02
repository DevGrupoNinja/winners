import api from './api';
import { AssessmentData } from '@/types';

// Helper to map backend Assessment to Frontend AssessmentData
const mapAssessment = (data: any): AssessmentData => ({
    id: data.id,
    athleteId: data.athlete_id.toString(),
    date: data.date,
    weight: data.weight,
    jumpHeight: data.jump_height,
    throwDistance: data.throw_distance,
    observation: data.observation,
});

// Helper to map backend Wellness to Frontend AssessmentData
const mapWellness = (data: any): AssessmentData => ({
    wellnessId: data.id,
    athleteId: data.athlete_id.toString(),
    date: data.date,
    wellnessScore: data.overall_score,
    wellnessDetails: {
        sleep: data.sleep_quality,
        fatigue: data.fatigue_level,
        pain: data.muscle_soreness,
        stress: data.stress_level,
    },
    observation: data.notes,
});

export const analyticsService = {
    getAssessments: async (params?: { athlete_id?: string | number }) => {
        const response = await api.get<any[]>('/analytics/assessments/', { params });
        return response.data.map(mapAssessment);
    },

    getWellness: async (params?: { athlete_id?: string | number }) => {
        const response = await api.get<any[]>('/analytics/wellness/', { params });
        return response.data.map(mapWellness);
    },

    createAssessmentsBulk: async (assessments: any[]) => {
        const payload = {
            assessments: assessments.map(a => ({
                athlete_id: parseInt(a.athleteId),
                date: a.date,
                weight: a.weight,
                jump_height: a.jumpHeight,
                throw_distance: a.throwDistance,
                observation: a.observation,
            }))
        };
        const response = await api.post<any[]>('/analytics/assessments/bulk', payload);
        return response.data.map(mapAssessment);
    },

    createWellnessBulk: async (wellnessRecords: any[]) => {
        const payload = {
            wellness_records: wellnessRecords.map(w => ({
                athlete_id: parseInt(w.athleteId),
                date: w.date,
                sleep_quality: w.wellnessDetails.sleep,
                fatigue_level: w.wellnessDetails.fatigue,
                muscle_soreness: w.wellnessDetails.pain,
                stress_level: w.wellnessDetails.stress,
                notes: w.observation,
            }))
        };
        const response = await api.post<any[]>('/analytics/wellness/bulk', payload);
        return response.data.map(mapWellness);
    },

    deleteAssessment: async (id: string | number) => {
        await api.delete(`/analytics/assessments/${id}`);
    },

    deleteWellness: async (id: string | number) => {
        await api.delete(`/analytics/wellness/${id}`);
    },

    updateAssessment: async (id: string | number, data: any) => {
        const payload = {
            date: data.date,
            weight: data.weight,
            jump_height: data.jumpHeight,
            throw_distance: data.throwDistance,
            observation: data.observation,
        };
        const response = await api.put(`/analytics/assessments/${id}`, payload);
        return mapAssessment(response.data);
    },

    updateWellness: async (id: string | number, data: any) => {
        const payload = {
            date: data.date,
            sleep_quality: data.wellnessDetails?.sleep,
            fatigue_level: data.wellnessDetails?.fatigue,
            muscle_soreness: data.wellnessDetails?.pain,
            stress_level: data.wellnessDetails?.stress,
            notes: data.observation,
        };
        const response = await api.put(`/analytics/wellness/${id}`, payload);
        return mapWellness(response.data);
    }
};
