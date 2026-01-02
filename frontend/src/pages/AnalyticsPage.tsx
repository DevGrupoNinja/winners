import React, { useState, useMemo, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { athleteService } from '@/services/athleteService';
import { analyticsService } from '@/services/analyticsService';
import {
    TrendingUp,
    Weight,
    Zap,
    Target,
    Heart,
    Search,
    ChevronRight,
    User,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
    CalendarDays,
    X,
    Check,
    ChevronDown,
    ChevronUp,
    ArrowLeft,
    Trash2,
    Edit2,
    MoreVertical,
    History as HistoryIcon,
    Moon,
    Wind,
    Activity as ActivityIcon,
    AlertCircle
} from 'lucide-react';
import { Athlete, AssessmentData } from '@/types';

type AthleteGroup = 'Todos' | 'Geral' | 'Infantil' | 'Petiz';
type TechnicalCategory = 'all' | 'peso' | 'salto' | 'arremesso' | 'bem-estar';

export default function AnalyticsPage() {
    // Data State
    const [athletes, setAthletes] = useState<Athlete[]>([]);
    const [history, setHistory] = useState<AssessmentData[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters State
    const [selectedGroup, setSelectedGroup] = useState<AthleteGroup>('Todos');
    const [searchTerm, setSearchTerm] = useState('');

    // View State: LIST or DETAILS
    const [selectedAthleteIdForDetail, setSelectedAthleteIdForDetail] = useState<string | null>(null);

    // Secondary technical view filter (for charts)
    const [selectedTechnical, setSelectedTechnical] = useState<TechnicalCategory>('all');

    // Accordion State for List View
    const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

    const loadData = React.useCallback(async () => {
        try {
            setLoading(true);
            const [athletesData, assessmentsData, wellnessData] = await Promise.all([
                athleteService.getAll(),
                analyticsService.getAssessments(),
                analyticsService.getWellness()
            ]);

            setAthletes(athletesData);

            // Step 1: Merge all assessments for the same athlete+date into a single record
            const assessmentMap = new Map<string, AssessmentData>();
            assessmentsData.forEach(a => {
                const key = `${a.athleteId}-${a.date}`;
                const existing = assessmentMap.get(key);
                if (existing) {
                    // Merge: take non-null/non-zero values from both
                    if (a.weight && a.weight > 0) existing.weight = a.weight;
                    if (a.jumpHeight && a.jumpHeight > 0) existing.jumpHeight = a.jumpHeight;
                    if (a.throwDistance && a.throwDistance > 0) existing.throwDistance = a.throwDistance;
                    if (a.observation) existing.observation = a.observation;
                    // Keep the first ID encountered or the most recent
                    if (!existing.id) existing.id = a.id;
                } else {
                    assessmentMap.set(key, { ...a });
                }
            });

            // Step 2: Merge wellness data into combined records (same logic - only overwrite with valid values)
            wellnessData.forEach(w => {
                const key = `${w.athleteId}-${w.date}`;
                const existing = assessmentMap.get(key);
                if (existing) {
                    // Only overwrite wellness fields if new values are valid
                    if (w.wellnessScore != null && w.wellnessScore > 0) existing.wellnessScore = w.wellnessScore;
                    if (w.wellnessDetails) {
                        // Merge wellness details, preserving existing valid values
                        if (!existing.wellnessDetails) {
                            existing.wellnessDetails = { sleep: 5, fatigue: 5, pain: 5, stress: 5 };
                        }
                        if (w.wellnessDetails.sleep != null) existing.wellnessDetails.sleep = w.wellnessDetails.sleep;
                        if (w.wellnessDetails.fatigue != null) existing.wellnessDetails.fatigue = w.wellnessDetails.fatigue;
                        if (w.wellnessDetails.pain != null) existing.wellnessDetails.pain = w.wellnessDetails.pain;
                        if (w.wellnessDetails.stress != null) existing.wellnessDetails.stress = w.wellnessDetails.stress;
                    }
                    if (w.wellnessId && !existing.wellnessId) existing.wellnessId = w.wellnessId;
                } else {
                    assessmentMap.set(key, { ...w });
                }
            });

            const combined = Array.from(assessmentMap.values());
            setHistory(combined.sort((a, b) => a.date.localeCompare(b.date)));
        } catch (error) {
            console.error("Failed to load analytics data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Modal States (Register & Edit)
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [registerStep, setRegisterStep] = useState<'CATEGORY' | 'DATA'>('CATEGORY');
    const [regCategory, setRegCategory] = useState<TechnicalCategory | ''>('');
    const [regDate, setRegDate] = useState(new Date().toISOString().split('T')[0]);
    const [regSelectedAthleteIds, setRegSelectedAthleteIds] = useState<string[]>([]);
    const [regData, setRegData] = useState<Record<string, any>>({});
    const [regAthleteSearch, setRegAthleteSearch] = useState('');

    // Editing Entry state
    const [editingEntry, setEditingEntry] = useState<{ athleteId: string, date: string } | null>(null);

    const technicalCategories = [
        { id: 'all', label: 'Dashboard Geral', icon: BarChart3 },
        { id: 'peso', label: 'Peso', icon: Weight, color: '#F97316', dataKey: 'weight', unit: 'kg' },
        { id: 'salto', label: 'Salto', icon: Zap, color: '#10B981', dataKey: 'jumpHeight', unit: 'cm' },
        { id: 'arremesso', label: 'Arremesso', icon: Target, color: '#3B82F6', dataKey: 'throwDistance', unit: 'm' },
        { id: 'bem-estar', label: 'Bem-estar', icon: Heart, color: '#EC4899', dataKey: 'wellnessScore', unit: '/10' },
    ];

    const filteredAthletes = useMemo(() => {
        return athletes.filter(a => {
            const matchGroup = selectedGroup === 'Todos' || a.category === selectedGroup;
            const matchSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchGroup && matchSearch;
        });
    }, [athletes, selectedGroup, searchTerm]);

    const getAthleteStats = (athleteId: string) => {
        let athleteHistory = history.filter(h => h.athleteId === athleteId).sort((a, b) => a.date.localeCompare(b.date));

        const calcMetricStats = (currentVal: any, previousVal: any, allVals: any[]) => {
            const current = parseFloat(currentVal) || 0;
            const previous = previousVal !== null ? (parseFloat(previousVal) || 0) : null;
            const validHistory = allVals.map(v => parseFloat(v) || 0).filter(v => v > 0);

            const bestAllTime = validHistory.length > 0 ? Math.max(...validHistory) : 0;

            const hasHistory = previous !== null && previous > 0 && current > 0;
            const evolution = hasHistory ? ((current - previous) / previous) * 100 : 0;

            const isPB = current > 0 && current >= bestAllTime;
            const hasBest = !isPB && bestAllTime > 0 && current > 0;
            const vsBest = hasBest ? ((current - bestAllTime) / bestAllTime) * 100 : 0;

            return {
                evolution: {
                    val: Math.abs(evolution).toFixed(1),
                    isPositive: evolution >= 0,
                    show: hasHistory
                },
                vsBest: {
                    val: Math.abs(vsBest).toFixed(1),
                    isPositive: vsBest >= 0,
                    isPB,
                    show: hasBest || isPB
                }
            };
        };

        if (athleteHistory.length === 0) {
            const emptyStat = { evolution: { val: '0', isPositive: true, show: false }, vsBest: { val: '0', isPositive: true, isPB: false, show: false } };
            return {
                history: [],
                latest: { date: 'Sem dados', weight: 0, jumpHeight: 0, throwDistance: 0, wellnessScore: 0 },
                stats: {
                    weight: emptyStat,
                    jump: emptyStat,
                    throw: emptyStat,
                    wellness: emptyStat,
                }
            };
        }

        const latest = athleteHistory[athleteHistory.length - 1];
        const previous = athleteHistory.length > 1 ? athleteHistory[athleteHistory.length - 2] : null;

        const allWeights = athleteHistory.map(h => h.weight || 0);
        const allJumps = athleteHistory.map(h => h.jumpHeight || 0);
        const allThrows = athleteHistory.map(h => h.throwDistance || 0);
        const allWellness = athleteHistory.map(h => h.wellnessScore || 0);

        return {
            history: athleteHistory,
            latest,
            stats: {
                weight: calcMetricStats(latest.weight, previous ? previous.weight : null, allWeights),
                jump: calcMetricStats(latest.jumpHeight, previous ? previous.jumpHeight : null, allJumps),
                throw: calcMetricStats(latest.throwDistance, previous ? previous.throwDistance : null, allThrows),
                wellness: calcMetricStats(latest.wellnessScore, previous ? previous.wellnessScore : null, allWellness),
            }
        };
    };

    const toggleCard = (athleteId: string) => {
        setExpandedCards(prev => ({
            ...prev,
            [athleteId]: !prev[athleteId]
        }));
    };

    const handleOpenRegister = () => {
        setRegCategory('');
        setRegisterStep('CATEGORY');
        setRegSelectedAthleteIds([]);
        setRegData({});
        setRegDate(new Date().toISOString().split('T')[0]);
        setShowRegisterModal(true);
    };

    const handleSaveAssessments = async () => {
        try {
            const entriesToSave = regSelectedAthleteIds.map(athleteId => {
                const data = regData[athleteId] || {};
                const entry: any = {
                    athleteId,
                    date: regDate,
                };

                if (regCategory === 'peso') entry.weight = parseFloat(data.weight) || 0;
                if (regCategory === 'salto') entry.jumpHeight = parseFloat(data.jumpHeight) || 0;
                if (regCategory === 'arremesso') entry.throwDistance = parseFloat(data.throwDistance) || 0;
                if (regCategory === 'bem-estar') {
                    entry.wellnessDetails = {
                        sleep: parseInt(data.sleep) || 5,
                        fatigue: parseInt(data.fatigue) || 5,
                        pain: parseInt(data.pain) || 5,
                        stress: parseInt(data.stress) || 5
                    };
                }
                return entry;
            });

            if (regCategory === 'bem-estar') {
                await analyticsService.createWellnessBulk(entriesToSave);
            } else {
                await analyticsService.createAssessmentsBulk(entriesToSave);
            }

            // Reload data
            await loadData();

            setShowRegisterModal(false);
            setRegSelectedAthleteIds([]);
            setRegData({});
        } catch (error) {
            console.error("Failed to save assessments", error);
            alert("Erro ao salvar avaliações");
        }
    };

    const handleDeleteEntry = async (athleteId: string, date: string) => {
        if (confirm('Tem certeza que deseja excluir este registro histórico?')) {
            try {
                const entry = history.find(h => h.athleteId === athleteId && h.date === date);
                if (!entry) return;

                const deletePromises = [];
                if (entry.id) deletePromises.push(analyticsService.deleteAssessment(entry.id));
                if (entry.wellnessId) deletePromises.push(analyticsService.deleteWellness(entry.wellnessId));

                await Promise.all(deletePromises);

                // Refetch data
                await loadData();
            } catch (error) {
                console.error("Failed to delete entry", error);
                alert("Erro ao excluir registro");
            }
        }
    };

    const updateRegData = (athleteId: string, field: string, value: any) => {
        setRegData(prev => ({
            ...prev,
            [athleteId]: {
                ...(prev[athleteId] || {}),
                [field]: value
            }
        }));
    };

    const renderEvolutionChart = (data: any[], dataKey: string, color: string, title: string, unit: string) => (
        <div className="h-44 w-full mt-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{title}</p>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }}
                        formatter={(value: any) => [`${value}${unit}`, '']}
                    />
                    <Area
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        strokeWidth={3}
                        fillOpacity={1}
                        fill={`url(#color-${dataKey})`}
                        dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#fff' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );

    const renderAthleteDetails = () => {
        const athlete = athletes.find(a => a.id === selectedAthleteIdForDetail);
        const stats = getAthleteStats(selectedAthleteIdForDetail!);
        if (!athlete) return null;

        return (
            <div className="h-full flex flex-col space-y-8 animate-in slide-in-from-right-4 duration-500 overflow-hidden pb-10">
                <header className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setSelectedAthleteIdForDetail(null)}
                            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-brand-orange hover:border-brand-orange transition-all shadow-sm"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-black text-brand-slate tracking-tighter leading-none">{athlete.name}</h2>
                                <span className="px-3 py-1 bg-orange-50 text-brand-orange text-[10px] font-black rounded-lg uppercase tracking-wider">{athlete.category}</span>
                            </div>
                            <p className="text-slate-400 font-bold text-[10px] tracking-widest mt-2 uppercase">Detalhamento e histórico de evolução</p>
                        </div>
                    </div>
                    <button
                        onClick={handleOpenRegister}
                        className="bg-brand-orange text-white px-8 py-3 rounded-2xl font-black text-xs shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        Nova avaliação
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8 pb-10">
                    {/* Summary Indicators */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { label: 'Peso Corporal', icon: Weight, iconColor: 'text-brand-orange', bgColor: 'bg-orange-50', unit: 'kg', stats: stats.stats.weight, value: stats.latest.weight },
                            { label: 'Salto Vertical', icon: Zap, iconColor: 'text-emerald-500', bgColor: 'bg-emerald-50', unit: 'cm', stats: stats.stats.jump, value: stats.latest.jumpHeight },
                            { label: 'Arremesso', icon: Target, iconColor: 'text-blue-500', bgColor: 'bg-blue-50', unit: 'm', stats: stats.stats.throw, value: stats.latest.throwDistance },
                            { label: 'Bem-estar', icon: Heart, iconColor: 'text-pink-500', bgColor: 'bg-pink-50', unit: '/10', stats: stats.stats.wellness, value: stats.latest.wellnessScore?.toFixed(1) }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`w-12 h-12 ${item.bgColor} ${item.iconColor} rounded-2xl flex items-center justify-center`}>
                                        <item.icon size={24} />
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        {item.stats.evolution.show && (
                                            <div className={`flex items-center gap-1 text-[10px] font-black ${item.stats.evolution.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {item.stats.evolution.isPositive ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                {item.stats.evolution.val}% EVOLUÇÃO
                                            </div>
                                        )}
                                        {item.stats.vsBest.show && (
                                            <div className={`flex items-center gap-1.5 text-[10px] font-black ${item.stats.vsBest.isPB ? 'text-brand-orange' : 'text-slate-400'}`}>
                                                <span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] ${item.stats.vsBest.isPB ? 'bg-brand-orange text-white' : 'bg-slate-100 text-slate-400'}`}>PB</span>
                                                {item.stats.vsBest.isPB ? 'PB ALCANÇADO' : `${item.stats.vsBest.val}% VS MELHOR`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{item.label}</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-brand-slate tracking-tighter">{item.value}</span>
                                        <span className="text-xs font-bold text-slate-300 uppercase">{item.unit}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Charts Grid */}
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-brand-slate tracking-tighter uppercase">Gráficos de evolução</h3>
                            <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
                                {technicalCategories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedTechnical(cat.id as TechnicalCategory)}
                                        className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all uppercase tracking-widest ${selectedTechnical === cat.id ? 'bg-brand-slate text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {(selectedTechnical === 'all' || selectedTechnical === 'peso') && renderEvolutionChart(stats.history, 'weight', '#F97316', 'Evolução de Peso', 'kg')}
                            {(selectedTechnical === 'all' || selectedTechnical === 'salto') && renderEvolutionChart(stats.history, 'jumpHeight', '#10B981', 'Evolução de Salto', 'cm')}
                            {(selectedTechnical === 'all' || selectedTechnical === 'arremesso') && renderEvolutionChart(stats.history, 'throwDistance', '#3B82F6', 'Evolução de Arremesso', 'm')}
                            {(selectedTechnical === 'all' || selectedTechnical === 'bem-estar') && renderEvolutionChart(stats.history, 'wellnessScore', '#EC4899', 'Evolução Bem-estar', '/10')}
                        </div>
                    </div>

                    {/* Historical Table */}
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
                        <header className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-2xl text-brand-orange border border-slate-100 shadow-sm"><HistoryIcon size={24} /></div>
                                <div>
                                    <h3 className="text-xl font-black text-brand-slate uppercase tracking-tighter">Histórico de registros</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Lista cronológica de todas as avaliações</p>
                                </div>
                            </div>
                        </header>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-10 py-5">Data</th>
                                        <th className="px-6 py-5">Peso</th>
                                        <th className="px-6 py-5">Salto</th>
                                        <th className="px-6 py-5">Arremesso</th>
                                        <th className="px-6 py-5">Bem-estar</th>
                                        <th className="px-10 py-5 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {stats.history.slice().reverse().map((entry, idx) => (
                                        <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-10 py-5">
                                                <div className="flex items-center gap-3">
                                                    <Calendar size={14} className="text-slate-300" />
                                                    <span className="font-bold text-slate-700 text-sm">{entry.date}</span>
                                                </div>
                                            </td>
                                            {(() => {
                                                // Calculate evolution and PB for each metric in this row
                                                const historyArr = stats.history;
                                                const currentIdx = historyArr.length - 1 - idx; // since we reversed
                                                const prevEntry = currentIdx > 0 ? historyArr[currentIdx - 1] : null;

                                                const calcEvoPb = (current: number | undefined, prev: number | undefined, allVals: (number | undefined)[]) => {
                                                    const curr = current || 0;
                                                    const prevVal = prev || 0;
                                                    const valid = allVals.filter(v => v && v > 0) as number[];
                                                    const best = valid.length > 0 ? Math.max(...valid) : 0;

                                                    const hasEvo = prevVal > 0 && curr > 0;
                                                    const evo = hasEvo ? ((curr - prevVal) / prevVal) * 100 : 0;
                                                    const isPB = curr > 0 && curr >= best;
                                                    const vsBest = !isPB && best > 0 && curr > 0 ? ((curr - best) / best) * 100 : 0;

                                                    return { evo, isPB, vsBest, hasEvo, hasBest: !isPB && best > 0 && curr > 0 };
                                                };

                                                const weightStats = calcEvoPb(entry.weight, prevEntry?.weight, historyArr.map(h => h.weight));
                                                const jumpStats = calcEvoPb(entry.jumpHeight, prevEntry?.jumpHeight, historyArr.map(h => h.jumpHeight));
                                                const throwStats = calcEvoPb(entry.throwDistance, prevEntry?.throwDistance, historyArr.map(h => h.throwDistance));

                                                const renderMetricCell = (val: number | undefined, unit: string, metricStats: typeof weightStats) => (
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-black text-brand-slate text-sm">
                                                            {val || '-'}<span className="text-[10px] text-slate-300 ml-0.5">{unit}</span>
                                                        </span>
                                                        {val && val > 0 && (
                                                            <div className="flex flex-col">
                                                                {metricStats.hasEvo && (
                                                                    <span className={`text-[9px] font-bold ${metricStats.evo >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                        {metricStats.evo >= 0 ? '+' : ''}{metricStats.evo.toFixed(1)}% EVOL.
                                                                    </span>
                                                                )}
                                                                {metricStats.isPB ? (
                                                                    <span className="text-[9px] font-bold text-brand-orange">PB ALCANÇADO</span>
                                                                ) : metricStats.hasBest && (
                                                                    <span className="text-[9px] font-bold text-slate-400">({metricStats.vsBest.toFixed(1)}% PB)</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );

                                                return (
                                                    <>
                                                        <td className="px-6 py-5">{renderMetricCell(entry.weight, 'kg', weightStats)}</td>
                                                        <td className="px-6 py-5">{renderMetricCell(entry.jumpHeight, 'cm', jumpStats)}</td>
                                                        <td className="px-6 py-5">{renderMetricCell(entry.throwDistance, 'm', throwStats)}</td>
                                                    </>
                                                );
                                            })()}
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1.5 w-12 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-gradient-to-r from-rose-400 to-brand-orange" style={{ width: `${(entry.wellnessScore || 0) * 10}%` }} />
                                                        </div>
                                                        <span className="font-black text-brand-slate text-sm">{entry.wellnessScore?.toFixed(1)}</span>
                                                    </div>
                                                    {entry.wellnessDetails && (
                                                        <div className="flex flex-wrap gap-2">
                                                            <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100" title="Sono">
                                                                <Moon size={8} className="text-blue-400" />
                                                                <span className="text-[8px] font-black text-slate-500">{entry.wellnessDetails.sleep}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100" title="Fadiga">
                                                                <Wind size={8} className="text-orange-400" />
                                                                <span className="text-[8px] font-black text-slate-500">{entry.wellnessDetails.fatigue}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100" title="Dor Muscular">
                                                                <ActivityIcon size={8} className="text-rose-400" />
                                                                <span className="text-[8px] font-black text-slate-500">{entry.wellnessDetails.pain}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100" title="Estresse">
                                                                <AlertCircle size={8} className="text-amber-400" />
                                                                <span className="text-[8px] font-black text-slate-500">{entry.wellnessDetails.stress}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-10 py-5 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            setEditingEntry({ athleteId: entry.athleteId, date: entry.date });
                                                            setRegData({
                                                                [entry.athleteId]: {
                                                                    weight: entry.weight,
                                                                    jumpHeight: entry.jumpHeight,
                                                                    throwDistance: entry.throwDistance,
                                                                    sleep: entry.wellnessDetails?.sleep || 5,
                                                                    fatigue: entry.wellnessDetails?.fatigue || 5,
                                                                    pain: entry.wellnessDetails?.pain || 5,
                                                                    stress: entry.wellnessDetails?.stress || 5
                                                                }
                                                            });
                                                        }}
                                                        className="p-2 text-slate-300 hover:text-brand-orange hover:bg-white rounded-xl border border-transparent hover:border-slate-100 shadow-sm transition-all"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteEntry(entry.athleteId, entry.date)}
                                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 shadow-sm transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderListView = () => (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 overflow-hidden pb-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-1">
                <div>
                    <h2 className="text-3xl font-black text-brand-slate tracking-tighter leading-none">Avaliações físicas</h2>
                    <p className="text-slate-500 font-medium mt-2">Indicadores de performance e bem-estar do elenco</p>
                </div>
                <button
                    onClick={handleOpenRegister}
                    className="bg-brand-orange text-white px-7 py-3 rounded-2xl font-black text-xs shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                    Nova avaliação
                </button>
            </header>

            {/* Primary Selection: Technical Assessment Category */}
            <div className="flex items-center gap-2 bg-white/50 p-1 rounded-2xl border border-slate-100 self-start animate-in slide-in-from-top-2 overflow-x-auto max-w-full no-scrollbar">
                {technicalCategories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedTechnical(cat.id as TechnicalCategory)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest whitespace-nowrap ${selectedTechnical === cat.id
                            ? 'bg-brand-slate text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                            }`}
                    >
                        <cat.icon size={14} />
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Filter Bar (Athlete Category and Search) */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-3 md:p-4 flex flex-wrap items-center gap-8 md:gap-12 animate-in slide-in-from-top-4">
                <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Categoria:</span>
                    <div className="flex items-center gap-2">
                        {(['Todos', 'Geral', 'Infantil', 'Petiz'] as AthleteGroup[]).map((group) => (
                            <button
                                key={group}
                                onClick={() => setSelectedGroup(group)}
                                className={`px-6 py-2.5 rounded-full text-xs font-black transition-all border uppercase tracking-widest ${selectedGroup === group
                                    ? 'bg-brand-orange text-white border-brand-orange shadow-lg shadow-orange-500/20'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                {group}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 min-w-[200px]">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-orange transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome do atleta..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:border-brand-orange focus:bg-white outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Athlete Cards Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {filteredAthletes.map(athlete => {
                        const stats = getAthleteStats(athlete.id);
                        const isExpanded = expandedCards[athlete.id] || false;

                        return (
                            <div
                                key={athlete.id}
                                className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500"
                            >
                                <header className="p-8 bg-slate-50/30 border-b border-slate-50 flex justify-between items-center">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-brand-orange shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-500">
                                            <User size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-brand-slate tracking-tight">{athlete.name}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="px-2 py-0.5 bg-orange-50 text-brand-orange text-[9px] font-black rounded uppercase tracking-wider">{athlete.category}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5">
                                                    <CalendarDays size={12} className="text-slate-300" /> {stats.latest.date}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => toggleCard(athlete.id)}
                                            className={`p-3 rounded-2xl border transition-all ${isExpanded ? 'bg-orange-50 text-brand-orange border-orange-100' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}
                                            title={isExpanded ? "Recolher gráficos" : "Ver gráficos rápidos"}
                                        >
                                            {isExpanded ? <ChevronUp size={24} /> : <TrendingUp size={24} />}
                                        </button>
                                        <button
                                            onClick={() => setSelectedAthleteIdForDetail(athlete.id)}
                                            className="p-3 bg-white hover:bg-brand-orange hover:text-white rounded-2xl border border-slate-100 text-slate-400 shadow-sm transition-all"
                                            title="Ver histórico detalhado"
                                        >
                                            <ChevronRight size={24} />
                                        </button>
                                    </div>
                                </header>

                                <div className="p-8">
                                    {/* Indicators Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { id: 'peso', label: 'Peso', icon: Weight, color: '#F97316', unit: 'KG', dataKey: 'weight', stats: stats.stats.weight, value: stats.latest.weight },
                                            { id: 'salto', label: 'Salto', icon: Zap, color: '#10B981', unit: 'CM', dataKey: 'jumpHeight', stats: stats.stats.jump, value: stats.latest.jumpHeight },
                                            { id: 'arremesso', label: 'Arremesso', icon: Target, color: '#3B82F6', unit: 'M', dataKey: 'throwDistance', stats: stats.stats.throw, value: stats.latest.throwDistance },
                                            { id: 'bem-estar', label: 'Wellness', icon: Heart, color: '#EC4899', unit: '/10', dataKey: 'wellnessScore', stats: stats.stats.wellness, value: stats.latest.wellnessScore?.toFixed(1) }
                                        ].map(item => (
                                            <div
                                                key={item.id}
                                                className={`p-5 rounded-[32px] border flex flex-col justify-between transition-all duration-300 ${selectedTechnical === item.id ? 'bg-white border-brand-orange shadow-lg shadow-orange-500/10 scale-[1.02]' : 'bg-slate-50/50 border-slate-100'}`}
                                            >
                                                <div>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">{item.label}</span>
                                                    <div className="space-y-1">
                                                        {item.stats.evolution.show && (
                                                            <div className={`flex items-center gap-1 text-[9px] font-black ${item.stats.evolution.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                {item.stats.evolution.isPositive ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                                                {item.stats.evolution.val}% EVOLUÇÃO
                                                            </div>
                                                        )}
                                                        {item.stats.vsBest.show && (
                                                            <div className={`flex items-center gap-1.5 text-[9px] font-black ${item.stats.vsBest.isPB ? 'text-brand-orange' : 'text-slate-400'}`}>
                                                                <span className={`px-1 py-0.5 rounded-[4px] text-[7px] ${item.stats.vsBest.isPB ? 'bg-brand-orange text-white' : 'bg-slate-200 text-slate-500'}`}>PB</span>
                                                                {item.stats.vsBest.isPB ? 'PB ALCANÇADO' : `${item.stats.vsBest.val}% VS MELHOR`}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex items-baseline gap-1">
                                                    <span className="text-2xl font-black text-brand-slate tracking-tighter" style={{ color: selectedTechnical === item.id ? item.color : undefined }}>{item.value}</span>
                                                    <span className="text-[10px] font-bold text-slate-300 uppercase">{item.unit}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Collapsible Section: Charts */}
                                    <div className={`mt-6 overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[800px] opacity-100 border-t border-slate-50 pt-6' : 'max-h-0 opacity-0'}`}>
                                        <div className={`grid gap-8 ${selectedTechnical === 'all' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                                            {(selectedTechnical === 'all' || selectedTechnical === 'peso') && renderEvolutionChart(stats.history, 'weight', '#F97316', 'Evolução de peso', 'kg')}
                                            {(selectedTechnical === 'all' || selectedTechnical === 'salto') && renderEvolutionChart(stats.history, 'jumpHeight', '#10B981', 'Evolução de salto', 'cm')}
                                            {(selectedTechnical === 'all' || selectedTechnical === 'arremesso') && renderEvolutionChart(stats.history, 'throwDistance', '#3B82F6', 'Evolução de arremesso', 'm')}
                                            {(selectedTechnical === 'all' || selectedTechnical === 'bem-estar') && renderEvolutionChart(stats.history, 'wellnessScore', '#EC4899', 'Evolução bem-estar', '/10')}
                                        </div>
                                    </div>

                                    {!isExpanded && (
                                        <button
                                            onClick={() => setSelectedAthleteIdForDetail(athlete.id)}
                                            className="w-full mt-4 py-2 text-[10px] font-black uppercase text-slate-300 hover:text-brand-orange transition-colors flex items-center justify-center gap-2"
                                        >
                                            <HistoryIcon size={14} /> Ver histórico completo de avaliações
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    const renderEditEntryModal = () => {
        if (!editingEntry) return null;
        const athlete = athletes.find(a => a.id === editingEntry.athleteId);

        const handleSaveEdit = async () => {
            try {
                const data = regData[editingEntry.athleteId];
                const existingEntry = history.find(h => h.athleteId === editingEntry.athleteId && h.date === editingEntry.date);
                if (!existingEntry) return;

                const updatePromises = [];

                // Update Assessment if either it existed or new values were provided
                const assessmentData = {
                    date: editingEntry.date,
                    weight: parseFloat(data.weight) || 0,
                    jumpHeight: parseFloat(data.jumpHeight) || 0,
                    throwDistance: parseFloat(data.throwDistance) || 0,
                };

                if (existingEntry.id) {
                    updatePromises.push(analyticsService.updateAssessment(existingEntry.id, assessmentData));
                } else if (assessmentData.weight || assessmentData.jumpHeight || assessmentData.throwDistance) {
                    // If it didn't exist but we added some data, maybe we should create it?
                    // For now let's assume update only if existed, or use bulk create for one item.
                    updatePromises.push(analyticsService.createAssessmentsBulk([{ ...assessmentData, athleteId: editingEntry.athleteId }]));
                }

                // Update Wellness
                const wellnessData = {
                    date: editingEntry.date,
                    wellnessDetails: {
                        sleep: parseInt(data.sleep) || 5,
                        fatigue: parseInt(data.fatigue) || 5,
                        pain: parseInt(data.pain) || 5,
                        stress: parseInt(data.stress) || 5
                    }
                };

                if (existingEntry.wellnessId) {
                    updatePromises.push(analyticsService.updateWellness(existingEntry.wellnessId, wellnessData));
                } else {
                    updatePromises.push(analyticsService.createWellnessBulk([{ ...wellnessData, athleteId: editingEntry.athleteId }]));
                }

                await Promise.all(updatePromises);

                // Reload data
                await loadData();

                setEditingEntry(null);
            } catch (error) {
                console.error("Failed to update entry", error);
                alert("Erro ao atualizar registro");
            }
        };

        return (
            <div className="fixed inset-0 z-[100] bg-brand-slate/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                    <header className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h3 className="text-2xl font-black text-brand-slate uppercase tracking-tight">Editar registro</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{athlete?.name} • {editingEntry.date}</p>
                        </div>
                        <button onClick={() => setEditingEntry(null)} className="p-3 hover:bg-white rounded-2xl transition-all text-slate-300 hover:text-red-500 shadow-sm border border-transparent hover:border-slate-100">
                            <X size={24} />
                        </button>
                    </header>

                    <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Peso (kg)</label>
                                <input
                                    type="number" step="0.1"
                                    value={regData[editingEntry.athleteId]?.weight || ''}
                                    onChange={(e) => updateRegData(editingEntry.athleteId, 'weight', e.target.value)}
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-lg text-brand-slate outline-none focus:bg-white focus:border-brand-orange transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Salto (cm)</label>
                                <input
                                    type="number"
                                    value={regData[editingEntry.athleteId]?.jumpHeight || ''}
                                    onChange={(e) => updateRegData(editingEntry.athleteId, 'jumpHeight', e.target.value)}
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-lg text-brand-slate outline-none focus:bg-white focus:border-brand-orange transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Arremesso (m)</label>
                                <input
                                    type="number" step="0.01"
                                    value={regData[editingEntry.athleteId]?.throwDistance || ''}
                                    onChange={(e) => updateRegData(editingEntry.athleteId, 'throwDistance', e.target.value)}
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-lg text-brand-slate outline-none focus:bg-white focus:border-brand-orange transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Heart size={16} /> Bem-estar (1 a 10)
                            </h4>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { id: 'sleep', label: 'Sono' },
                                    { id: 'fatigue', label: 'Fadiga' },
                                    { id: 'pain', label: 'Dor Muscular' },
                                    { id: 'stress', label: 'Estresse' }
                                ].map(item => (
                                    <div key={item.id}>
                                        <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-tight">{item.label}</label>
                                        <input
                                            type="number" min="1" max="10"
                                            value={regData[editingEntry.athleteId]?.[item.id] || ''}
                                            onChange={(e) => updateRegData(editingEntry.athleteId, item.id, e.target.value)}
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-lg text-brand-slate outline-none focus:bg-white focus:border-brand-orange transition-all text-center"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <footer className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4">
                        <button onClick={() => setEditingEntry(null)} className="px-8 py-3 text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
                        <button onClick={handleSaveEdit} className="bg-brand-slate text-white px-10 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all hover:scale-105">Salvar alterações</button>
                    </footer>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full">
            {selectedAthleteIdForDetail ? renderAthleteDetails() : renderListView()}

            {/* Register Modal */}
            {showRegisterModal && (
                <div className="fixed inset-0 z-[100] bg-brand-slate/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
                        <header className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-brand-slate uppercase tracking-tight">Nova avaliação</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                                    {registerStep === 'CATEGORY' ? 'Selecione a categoria' : `Registro de ${technicalCategories.find(c => c.id === regCategory)?.label}`}
                                </p>
                            </div>
                            <button onClick={() => setShowRegisterModal(false)} className="p-3 hover:bg-white rounded-2xl transition-all text-slate-300 hover:text-red-500 shadow-sm border border-transparent hover:border-slate-100">
                                <X size={24} />
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            {registerStep === 'CATEGORY' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {technicalCategories.filter(c => c.id !== 'all').map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => {
                                                setRegCategory(cat.id as TechnicalCategory);
                                                setRegisterStep('DATA');
                                            }}
                                            className="group flex flex-col items-center justify-center p-10 bg-slate-50 rounded-[32px] border border-slate-100 transition-all hover:bg-white hover:border-brand-orange hover:shadow-xl hover:shadow-orange-500/10"
                                        >
                                            <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center text-brand-orange shadow-md border border-slate-100 group-hover:scale-110 transition-transform mb-6">
                                                <cat.icon size={40} />
                                            </div>
                                            <span className="text-sm font-black text-brand-slate uppercase tracking-widest">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-10">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data da avaliação</label>
                                            <div className="relative">
                                                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                <input
                                                    type="date"
                                                    value={regDate}
                                                    onChange={(e) => setRegDate(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:bg-white focus:border-brand-orange outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selecionar atletas</label>
                                            <div className="relative group">
                                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar atleta..."
                                                    value={regAthleteSearch}
                                                    onChange={(e) => setRegAthleteSearch(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:bg-white focus:border-brand-orange outline-none transition-all"
                                                />
                                            </div>
                                            {regAthleteSearch && (
                                                <div className="absolute z-10 w-full md:w-[350px] mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto p-2">
                                                    {athletes.filter(a => a.name.toLowerCase().includes(regAthleteSearch.toLowerCase())).map(a => (
                                                        <button
                                                            key={a.id}
                                                            onClick={() => {
                                                                if (!regSelectedAthleteIds.includes(a.id)) {
                                                                    setRegSelectedAthleteIds(prev => [...prev, a.id]);
                                                                }
                                                                setRegAthleteSearch('');
                                                            }}
                                                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 text-sm font-bold text-slate-600 transition-colors"
                                                        >
                                                            {a.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="flex flex-wrap gap-2 mt-4">
                                                {regSelectedAthleteIds.map(id => {
                                                    const a = athletes.find(m => m.id === id);
                                                    return (
                                                        <div key={id} className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-brand-orange rounded-xl text-xs font-black">
                                                            {a?.name}
                                                            <button onClick={() => setRegSelectedAthleteIds(prev => prev.filter(x => x !== id))}><X size={12} /></button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {regSelectedAthleteIds.length > 0 && (
                                        <div className="space-y-6 border-t border-slate-100 pt-8">
                                            {regSelectedAthleteIds.map(id => {
                                                const a = athletes.find(m => m.id === id);
                                                return (
                                                    <div key={id} className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                                                        <h4 className="text-sm font-black text-brand-slate mb-6 flex items-center gap-2"><User size={16} className="text-brand-orange" /> {a?.name}</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                            {regCategory === 'peso' && (
                                                                <div>
                                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Peso (kg)</label>
                                                                    <input
                                                                        type="number" step="0.1"
                                                                        onChange={(e) => updateRegData(id, 'weight', e.target.value)}
                                                                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-lg text-brand-slate outline-none focus:border-brand-orange transition-all"
                                                                    />
                                                                </div>
                                                            )}
                                                            {regCategory === 'salto' && (
                                                                <div>
                                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Salto (cm)</label>
                                                                    <input
                                                                        type="number"
                                                                        onChange={(e) => updateRegData(id, 'jumpHeight', e.target.value)}
                                                                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-lg text-brand-slate outline-none focus:border-brand-orange transition-all"
                                                                    />
                                                                </div>
                                                            )}
                                                            {regCategory === 'arremesso' && (
                                                                <div>
                                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Arremesso (m)</label>
                                                                    <input
                                                                        type="number" step="0.01"
                                                                        onChange={(e) => updateRegData(id, 'throwDistance', e.target.value)}
                                                                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-lg text-brand-slate outline-none focus:border-brand-orange transition-all"
                                                                    />
                                                                </div>
                                                            )}
                                                            {regCategory === 'bem-estar' && (
                                                                <>
                                                                    {['sleep', 'fatigue', 'pain', 'stress'].map(metric => (
                                                                        <div key={metric}>
                                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">{metric === 'sleep' ? 'Sono' : metric === 'fatigue' ? 'Fadiga' : metric === 'pain' ? 'Dor' : 'Estresse'}</label>
                                                                            <input
                                                                                type="number" min="1" max="10"
                                                                                placeholder="1-10"
                                                                                onChange={(e) => updateRegData(id, metric, e.target.value)}
                                                                                className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-lg text-brand-slate outline-none focus:border-brand-orange transition-all text-center"
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <footer className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4">
                            {registerStep === 'DATA' && (
                                <button onClick={() => setRegisterStep('CATEGORY')} className="px-8 py-3 text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Voltar</button>
                            )}
                            {registerStep === 'DATA' && regSelectedAthleteIds.length > 0 ? (
                                <button onClick={handleSaveAssessments} className="bg-brand-slate text-white px-10 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all hover:scale-105">Salvar Registros</button>
                            ) : (
                                <button onClick={() => setShowRegisterModal(false)} className="px-8 py-3 text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
                            )}
                        </footer>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {renderEditEntryModal()}
        </div>
    );
};
