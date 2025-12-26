
import React from 'react';
import {
    Users,
    Calendar,
    Droplets,
    Dumbbell,
    Trophy,
    TrendingUp,
    AlertTriangle,
    ChevronRight,
    Zap,
    Clock,
    Activity,
    ArrowUpRight
} from 'lucide-react';
import { MOCK_ATHLETES, MOCK_MACRO, MOCK_COMPETITIONS } from '@/constants';

import { useNavigate } from 'react-router-dom';

const MapPin = ({ size, className }: { size: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size} height={size}
        viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className={className}
    >
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
    </svg>
);

export default function HomePage() {
    const navigate = useNavigate();
    const activeAthletes = MOCK_ATHLETES.filter(a => a.status === 'Active').length;
    const currentMacro = MOCK_MACRO[0];
    const currentMeso = currentMacro?.mesos[0];
    const currentMicro = currentMeso?.micros[1]; // Micro 2 - Carga
    const nextComp = MOCK_COMPETITIONS[0];

    return (
        <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-700 overflow-y-auto custom-scrollbar pb-12 pr-2">

            {/* Welcome Hero */}
            <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-1">
                <div>
                    <h1 className="text-4xl font-black text-brand-slate tracking-tighter leading-none mb-3">
                        Bom dia, <span className="text-brand-orange">Coach Carlos</span>
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
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => navigate('/athletes')}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-100 group-hover:scale-110 transition-transform">
                            <Users size={24} />
                        </div>
                        <ArrowUpRight size={16} className="text-slate-300 group-hover:text-blue-500" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Atletas Ativos</p>
                    <p className="text-3xl font-black text-brand-slate tracking-tighter">{activeAthletes}</p>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => navigate('/cycles')}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-orange-50 text-brand-orange rounded-2xl flex items-center justify-center border border-orange-100 group-hover:scale-110 transition-transform">
                            <Zap size={24} />
                        </div>
                        <ArrowUpRight size={16} className="text-slate-300 group-hover:text-brand-orange" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Microciclo Atual</p>
                    <p className="text-3xl font-black text-brand-slate tracking-tighter">#{currentMicro?.id.replace('mic', '')}</p>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => navigate('/training')}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center border border-sky-100 group-hover:scale-110 transition-transform">
                            <Droplets size={24} />
                        </div>
                        <ArrowUpRight size={16} className="text-slate-300 group-hover:text-sky-500" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Volume da Semana</p>
                    <p className="text-3xl font-black text-brand-slate tracking-tighter">{(currentMicro?.volume || 0) / 1000}k <span className="text-sm">m</span></p>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => navigate('/competitions')}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center border border-amber-100 group-hover:scale-110 transition-transform">
                            <Trophy size={24} />
                        </div>
                        <ArrowUpRight size={16} className="text-slate-300 group-hover:text-amber-500" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Próxima Prova</p>
                    <p className="text-xl font-black text-brand-slate truncate leading-tight mt-1">{nextComp?.name.split(' ')[0]}...</p>
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
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{currentMeso?.name}</p>
                                </div>
                            </div>
                            <button onClick={() => navigate('/cycles')} className="text-xs font-black text-brand-orange uppercase tracking-widest hover:underline flex items-center gap-1">Plano Completo <ChevronRight size={14} /></button>
                        </header>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Intensidade Média</span>
                                            <span className="px-2.5 py-1 bg-orange-100 text-brand-orange rounded-lg text-[10px] font-black uppercase">{currentMicro?.intensity}</span>
                                        </div>
                                        <div className="flex items-end gap-2 mb-2">
                                            <span className="text-4xl font-black text-brand-slate tracking-tighter">75</span>
                                            <span className="text-lg font-black text-slate-300 mb-1">%</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-brand-orange w-3/4 rounded-full" />
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold mt-3 uppercase tracking-tight">Progresso do mesociclo atual</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                            <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">DDR (Aeróbico)</p>
                                            <p className="text-xl font-black text-emerald-700">62%</p>
                                        </div>
                                        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                            <p className="text-[9px] font-black text-blue-600 uppercase mb-1">DCR (Carga)</p>
                                            <p className="text-xl font-black text-blue-700">38%</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-xs font-black text-brand-slate uppercase tracking-widest border-b border-slate-100 pb-3">Foco do Microciclo</h4>
                                    <div className="space-y-3">
                                        {currentMicro?.focus.map((f, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-brand-orange shadow-sm shadow-orange-200" />
                                                <span className="text-sm font-bold text-slate-600">{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-8 p-5 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4">
                                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-amber-600 flex-shrink-0 shadow-sm"><AlertTriangle size={20} /></div>
                                        <div>
                                            <p className="text-xs font-black text-amber-800 uppercase tracking-tight mb-1">Aviso de Carga</p>
                                            <p className="text-[10px] text-amber-700 leading-relaxed">3 atletas apresentaram PSE acima de 8 na última sessão. Monitorar fadiga.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-lg p-8">
                        <h3 className="text-xl font-black text-brand-slate uppercase tracking-tight mb-6">Próxima Competição Alvo</h3>
                        <div className="bg-brand-slate rounded-[32px] p-8 text-white relative overflow-hidden group">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-orange rounded-full opacity-10 blur-3xl group-hover:scale-150 transition-transform duration-700" />
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-10">
                                    <div>
                                        <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-sm border border-white/10">{nextComp?.category}</span>
                                        <h4 className="text-2xl md:text-3xl font-black mt-4 leading-tight">{nextComp?.name}</h4>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[40px] font-black leading-none mb-1">12</p>
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Dias Restantes</p>
                                    </div>
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-6 border-t border-white/10">
                                    <div className="flex gap-8">
                                        <div className="flex items-center gap-2"><MapPin size={16} className="text-brand-orange" /><span className="text-sm font-bold">{nextComp?.location}</span></div>
                                        <div className="flex items-center gap-2"><Calendar size={16} className="text-brand-orange" /><span className="text-sm font-bold">{nextComp?.date}</span></div>
                                    </div>
                                    <button onClick={() => navigate('/competitions')} className="px-6 py-3 bg-white text-brand-slate rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-orange hover:text-white transition-all shadow-xl">Painel do Evento</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col: Immediate Agenda */}
                <div className="space-y-8">
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl p-8 flex flex-col h-full min-h-[500px]">
                        <h3 className="text-xl font-black text-brand-slate uppercase tracking-tight mb-8">Agenda Imediata</h3>

                        <div className="space-y-8 flex-1">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Clock size={14} className="text-brand-orange" /> Manhã (Piscina)</h4>
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-brand-orange/30 transition-all cursor-pointer" onClick={() => navigate('/training')}>
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded text-slate-400 border border-slate-200 uppercase">08:00</span>
                                        <Droplets size={16} className="text-sky-500" />
                                    </div>
                                    <h5 className="font-black text-brand-slate text-sm uppercase mb-2">Velocidade e Reação</h5>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Volume: 3.200m • Intensidade Alta</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Clock size={14} className="text-brand-orange" /> Tarde (Academia)</h4>
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-brand-orange/30 transition-all cursor-pointer" onClick={() => navigate('/gym')}>
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded text-slate-400 border border-slate-200 uppercase">16:30</span>
                                        <Dumbbell size={16} className="text-slate-700" />
                                    </div>
                                    <h5 className="font-black text-brand-slate text-sm uppercase mb-2">Potência Explosiva</h5>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Foco: Membros Inferiores</p>
                                </div>
                            </div>

                            <div className="mt-auto pt-8 border-t border-slate-50">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Lembretes IA</h4>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-1.5 flex-shrink-0" />
                                        <p className="text-[11px] font-bold text-slate-600 leading-relaxed">Revisar súmula de inscritos para o Finkel até sexta.</p>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                        <p className="text-[11px] font-bold text-slate-600 leading-relaxed">Novo teste de lactato agendado para Micro #25.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
