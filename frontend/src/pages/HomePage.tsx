
import React, { useState, useEffect } from 'react';
import {
    Users,
    Calendar,
    Droplets,
    Dumbbell,
    TrendingUp,
    ChevronRight,
    Zap,
    Activity,
    ArrowUpRight
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { homeDashboardService, HomeDashboardData } from '@/services/homeDashboardService';

export default function HomePage() {
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState<HomeDashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                setLoading(true);
                const data = await homeDashboardService.getDashboard();
                setDashboardData(data);
            } catch (error) {
                console.error('Failed to load home dashboard:', error);
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, []);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
            </div>
        );
    }

    const data = dashboardData || {
        active_athletes_count: 0,
        current_micro: null,
        week_volume: 0,
        current_meso: null,
        meso_progress: 0,
        ddr_percentage: 0,
        dcr_percentage: 0,
        todays_pool_sessions: [],
        todays_gym_sessions: []
    };

    return (
        <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-700 overflow-y-auto custom-scrollbar pb-12 pr-2">

            {/* Welcome Hero */}
            <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-1">
                <div>
                    <h1 className="text-4xl font-black text-brand-slate tracking-tighter leading-none mb-3">
                        Bom dia, <span className="text-brand-orange">Coach</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                        <Calendar size={16} className="text-slate-400" />
                        Hoje é {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                        <Activity size={20} className="animate-pulse" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status do Elenco</p>
                        <p className="text-sm font-black text-emerald-600">Alta Performance</p>
                    </div>
                </div>
            </section>

            {/* Summary Row */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => navigate('/athletes')}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-100 group-hover:scale-110 transition-transform">
                            <Users size={24} />
                        </div>
                        <ArrowUpRight size={16} className="text-slate-300 group-hover:text-blue-500" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Atletas Ativos</p>
                    <p className="text-3xl font-black text-brand-slate tracking-tighter">{data.active_athletes_count}</p>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => navigate('/cycles')}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-orange-50 text-brand-orange rounded-2xl flex items-center justify-center border border-orange-100 group-hover:scale-110 transition-transform">
                            <Zap size={24} />
                        </div>
                        <ArrowUpRight size={16} className="text-slate-300 group-hover:text-brand-orange" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Microciclo Atual</p>
                    <p className="text-xl font-black text-brand-slate tracking-tighter truncate">{data.current_micro?.name || 'Nenhum'}</p>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => navigate('/training')}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center border border-sky-100 group-hover:scale-110 transition-transform">
                            <Droplets size={24} />
                        </div>
                        <ArrowUpRight size={16} className="text-slate-300 group-hover:text-sky-500" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Volume da Semana</p>
                    <p className="text-3xl font-black text-brand-slate tracking-tighter">{(data.week_volume / 1000).toFixed(1)}k <span className="text-sm">m</span></p>
                </div>
            </section>

            {/* Main Dashboard Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Col: Cycle Detail */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
                        <header className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-brand-orange shadow-sm">
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-brand-slate uppercase tracking-tight">Visão de Planificação</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{data.current_meso?.name || 'Sem mesociclo ativo'}</p>
                                </div>
                            </div>
                            <button onClick={() => navigate('/cycles')} className="text-xs font-black text-brand-orange uppercase tracking-widest hover:underline flex items-center gap-1">Plano Completo <ChevronRight size={14} /></button>
                        </header>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progresso do Mesociclo</span>
                                            <span className="px-2.5 py-1 bg-orange-100 text-brand-orange rounded-lg text-[10px] font-black uppercase">{data.meso_progress.toFixed(0)}%</span>
                                        </div>
                                        <div className="flex items-end gap-2 mb-2">
                                            <span className="text-4xl font-black text-brand-slate tracking-tighter">{data.meso_progress.toFixed(0)}</span>
                                            <span className="text-lg font-black text-slate-300 mb-1">%</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-brand-orange rounded-full" style={{ width: `${data.meso_progress}%` }} />
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold mt-3 uppercase tracking-tight">Progresso do mesociclo atual</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                            <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">DDR (Aeróbico)</p>
                                            <p className="text-xl font-black text-emerald-700">{data.ddr_percentage.toFixed(0)}%</p>
                                        </div>
                                        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                            <p className="text-[9px] font-black text-blue-600 uppercase mb-1">DCR (Carga)</p>
                                            <p className="text-xl font-black text-blue-700">{data.dcr_percentage.toFixed(0)}%</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-xs font-black text-brand-slate uppercase tracking-widest border-b border-slate-100 pb-3">Microciclo Atual</h4>
                                    {data.current_micro ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-brand-orange shadow-sm shadow-orange-200" />
                                                <span className="text-sm font-bold text-slate-600">{data.current_micro.name}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400">Nenhum microciclo ativo</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col: Immediate Agenda */}
                <div className="space-y-8">
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl p-8 flex flex-col h-full min-h-[400px]">
                        <h3 className="text-xl font-black text-brand-slate uppercase tracking-tight mb-8">Agenda do Dia</h3>

                        <div className="space-y-8 flex-1">
                            {/* Piscina */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Droplets size={14} className="text-sky-500" /> Piscina
                                </h4>
                                {data.todays_pool_sessions.length > 0 ? (
                                    data.todays_pool_sessions.map(session => (
                                        <div key={session.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-brand-orange/30 transition-all cursor-pointer" onClick={() => navigate('/training')}>
                                            <div className="flex justify-between items-start mb-3">
                                                {session.time && <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded text-slate-400 border border-slate-200 uppercase">{session.time}</span>}
                                                <Droplets size={16} className="text-sky-500" />
                                            </div>
                                            <h5 className="font-black text-brand-slate text-sm uppercase mb-2">{session.title}</h5>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{session.status}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-400 italic">Sem treinos de piscina hoje</p>
                                )}
                            </div>

                            {/* Academia */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Dumbbell size={14} className="text-slate-700" /> Academia
                                </h4>
                                {data.todays_gym_sessions.length > 0 ? (
                                    data.todays_gym_sessions.map(session => (
                                        <div key={session.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-brand-orange/30 transition-all cursor-pointer" onClick={() => navigate('/gym')}>
                                            <div className="flex justify-between items-start mb-3">
                                                {session.time && <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded text-slate-400 border border-slate-200 uppercase">{session.time}</span>}
                                                <Dumbbell size={16} className="text-slate-700" />
                                            </div>
                                            <h5 className="font-black text-brand-slate text-sm uppercase mb-2">{session.title}</h5>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{session.status}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-400 italic">Sem treinos de academia hoje</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
