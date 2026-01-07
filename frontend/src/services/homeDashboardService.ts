import api from './api';

export interface MicroInfo {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
}

export interface MesoInfo {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
}

export interface SessionSummary {
    id: number;
    title: string;
    time: string | null;
    status: string;
    type: 'pool' | 'gym';
}

export interface HomeDashboardData {
    active_athletes_count: number;
    current_micro: MicroInfo | null;
    week_volume: number;
    current_meso: MesoInfo | null;
    meso_progress: number;
    ddr_percentage: number;
    dcr_percentage: number;
    todays_pool_sessions: SessionSummary[];
    todays_gym_sessions: SessionSummary[];
}

export const homeDashboardService = {
    getDashboard: async (): Promise<HomeDashboardData> => {
        const response = await api.get<HomeDashboardData>('/home/dashboard');
        return response.data;
    }
};
