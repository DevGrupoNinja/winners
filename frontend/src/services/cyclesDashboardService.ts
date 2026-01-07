import api from './api';

export interface SwimmingDashboard {
    total_volume: number;
    total_sessions: number;
    average_per_session: number;
    ddr_volume: number;
    dcr_volume: number;
}

export interface GymDashboard {
    total_load: number;
    total_sessions: number;
    average_load: number;
}

export interface GymDetailedDashboard extends GymDashboard {
    ddr_explosive: number;
    ddr_resistance: number;
    ddr_fast: number;
    dcr_max: number;
    dcr_resistive: number;
}

export interface AthletesDashboard {
    improved_count: number;
    declined_count: number;
    average_attendance: number;
    weight_gained_count?: number;
    weight_lost_count?: number;
}

export interface WellnessDashboard {
    avg_sleep: number | null;
    avg_fatigue: number | null;
    avg_stress: number | null;
    avg_muscle_soreness: number | null;
}

// Dynamic functional direction - keys come from system configuration
export type FunctionalDirection = Record<string, number>;

// Helper to get display label for a functional direction key
// The backend now returns original names from ConfigFunctionalDirectionRange
export const getFunctionalDirectionLabel = (key: string): string => {
    return key.toUpperCase();
};


export interface MacroDashboardData {
    swimming: SwimmingDashboard;
    gym: GymDashboard;
    athletes: AthletesDashboard;
    wellness: WellnessDashboard;
    results: any;
    relative_load: number | null;
}

export interface MesoDashboardData {
    swimming: SwimmingDashboard;
    gym: GymDetailedDashboard;
    athletes: AthletesDashboard;
    wellness: WellnessDashboard;
    functional_direction: FunctionalDirection;
    target_er: number | null;
    target_re: number | null;
    relative_load: number | null;
}

export interface MicroDashboardData {
    swimming: SwimmingDashboard;
    gym: GymDashboard;
    athletes: AthletesDashboard;
    wellness: WellnessDashboard;
    functional_direction: FunctionalDirection;
    relative_load: number | null;
}

export const cyclesDashboardService = {
    getMacroDashboard: async (id: string): Promise<MacroDashboardData> => {
        const response = await api.get<MacroDashboardData>(`/cycles/macros/${id}/dashboard`);
        return response.data;
    },

    getMesoDashboard: async (id: string): Promise<MesoDashboardData> => {
        const response = await api.get<MesoDashboardData>(`/cycles/mesos/${id}/dashboard`);
        return response.data;
    },

    getMicroDashboard: async (id: string, athleteId?: string): Promise<MicroDashboardData> => {
        const params = athleteId ? { athlete_id: athleteId } : {};
        const response = await api.get<MicroDashboardData>(`/cycles/micros/${id}/dashboard`, { params });
        return response.data;
    }
};
