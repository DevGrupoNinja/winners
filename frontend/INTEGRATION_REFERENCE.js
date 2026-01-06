// Helper script to complete the integration
// This file documents the exact changes needed for MesoDetail and MacroDetail

/* 
MESO DETAIL - Add at start of component (line 269-270):

const MesoDetail = ({ meso, onEdit, onDelete }: { meso: MesoCycle, onEdit: () => void, onDelete: () => void }) => {
    const [dashboardData, setDashboardData] = useState<MesoDashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                setLoading(true);
                const data = await cyclesDashboardService.getMesoDashboard(meso.id);
                setDashboardData(data);
            } catch (error) {
                console.error('Failed to load meso dashboard:', error);
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, [meso.id]);

    if (loading) {
        return (
            <div className="flex flex-col h-full items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
                <p className="mt-4 text-slate-400">Carregando dashboard...</p>
            </div>
        );
    }

    const swimming = dashboardData?.swimming || { total_volume: 0, total_sessions: 0, average_per_session: 0, ddr_volume: 0, dcr_volume: 0 };
    const gym = dashboardData?.gym || { total_load: 0, total_sessions: 0, average_load: 0, ddr_explosive: 0, ddr_resistance: 0, ddr_fast: 0, dcr_max: 0, dcr_resistive: 0 };
    const athletes = dashboardData?.athletes || { improved_count: 0, declined_count: 0, average_attendance: 0, weight_gained_count: 0, weight_lost_count: 0 };
    const wellness = dashboardData?.wellness || { avg_sleep: null, avg_fatigue: null, avg_stress: null, avg_muscle_soreness: null };
    const funcDir = dashboardData?.functional_direction || { aero: 0, aero_ana: 0, vo2: 0, aa: 0, res_ana: 0, tol_ana: 0, pot_ana: 0, for_rap: 0, for_exp: 0, perna: 0, braco: 0, recup: 0 };

    return (
        // ... rest of component
*/

/*
MACRO DETAIL - Same pattern:

const MacroDetail = ({ macro, onEdit, onDelete }: { macro: MacroCycle, onEdit: () => void, onDelete: () => void }) => {
    const [dashboardData, setDashboardData] = useState<MacroDashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                setLoading(true);
                const data = await cyclesDashboardService.getMacroDashboard(macro.id);
                setDashboardData(data);
            } catch (error) {
                console.error('Failed to load macro dashboard:', error);
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, [macro.id]);

    if (loading) {
        return (
            <div className="flex flex-col h-full items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
                <p className="mt-4 text-slate-400">Carregando dashboard...</p>
            </div>
        );
    }

    const swimming = dashboardData?.swimming || { total_volume: 0, total_sessions: 0, average_per_session: 0, ddr_volume: 0, dcr_volume: 0 };
    const gym = dashboardData?.gym || { total_load: 0, total_sessions: 0, average_load: 0 };
    const athletes = dashboardData?.athletes || { improved_count: 0, declined_count: 0, average_attendance: 0 };
    const wellness = dashboardData?.wellness || { avg_sleep: null, avg_fatigue: null, avg_stress: null, avg_muscle_soreness: null };

    return (
        // ... rest of component
*/

/* 
VALUE REPLACEMENTS (apply to both components):

1. Swimming volumes:
   123.4 → {swimming.total_volume.toFixed(1)}
   67 → {swimming.total_sessions}
   2.733m → {swimming.average_per_session.toFixed(0)}m
   DDR/DCR percentages → calculated from actual volumes

2. Gym data:
   85.000 → {(gym.total_load / 1000).toFixed(1)}
   23 → {gym.total_sessions}
   820kg → {gym.average_load.toFixed(0)}kg

3. Wellness:
   7 → {wellness.avg_sleep || 0}
   8 → {wellness.avg_fatigue || 0}
   etc.

4. Athletes:
   15 → {athletes.improved_count}
   2 → {athletes.declined_count}
   95% → {athletes.average_attendance.toFixed(0)}%
   
5. Functional Direction (Meso only):
   val: 3 → val: funcDir.aero, funcDir.vo2, etc.
*/
