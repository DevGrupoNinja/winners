
import React, { useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Calendar, Clock, Plus, Filter, Users, ChevronDown, CheckCircle2, History, Play, StopCircle, ArrowLeft, Droplets, Trash2, Edit2, AlertTriangle, X, Check, Save, Copy, User, ChevronUp, AlertCircle, List, Eye, ChevronLeft, UserPlus, ChevronRight, Search, ChartBar, Layers, Settings } from 'lucide-react';
import { trainingService } from '@/services/trainingService';
import { athleteService } from '@/services/athleteService';
import { parseISOToLocalDate, getLocalTodayISO } from '@/lib/utils';
import { Workout, WorkoutBlock, WorkoutSubdivision, WorkoutSession, SessionEvaluation, Athlete } from '@/types';

type ViewMode = 'LIST' | 'BUILDER' | 'LIVE' | 'DETAILS';
type MainTab = 'PLANS' | 'HISTORY';

// --- Helper Components ---

const FilterChip: React.FC<{ label: string, active: boolean, onClick: () => void }> = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all tracking-widest border border-transparent whitespace-nowrap ${active ? 'bg-brand-orange text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
    >
        {label}
    </button>
);

const IndicatorBox = ({ label, value, alert = false }: { label: string, value: string | number, alert?: boolean }) => (
    <div className={`p-2 rounded-lg border flex-1 ${alert ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
        <div className="text-[10px] font-black text-gray-400 mb-0.5 tracking-widest">{label}</div>
        <div className={`text-lg font-bold leading-none ${alert ? 'text-red-500' : 'text-slate-700'}`}>{value}</div>
    </div>
);

const calculateBlockStats = (subdivisions: WorkoutSubdivision[]) => {
    const totalVolume = subdivisions.reduce((acc, sub) => acc + ((sub.distance || 0) * (sub.seriesOrder || 1)), 0);
    const ddrVolume = subdivisions.filter(s => s.type === 'DDR').reduce((acc, sub) => acc + ((sub.distance || 0) * (sub.seriesOrder || 1)), 0);
    const dcrVolume = subdivisions.filter(s => s.type === 'DCR').reduce((acc, sub) => acc + ((sub.distance || 0) * (sub.seriesOrder || 1)), 0);
    return { volume: totalVolume, ddr: ddrVolume, dcr: dcrVolume };
};

// --- Reusable Component: SessionEvaluationDrawer ---

interface SessionEvaluationDrawerProps {
    block: WorkoutBlock;
    presentAthletes: Athlete[];
    initialEvaluations: SessionEvaluation[];
    onSave: (evals: SessionEvaluation[]) => void;
    onClose: () => void;
}

const SessionEvaluationDrawer = ({ block, presentAthletes, initialEvaluations, onSave, onClose }: SessionEvaluationDrawerProps) => {
    const [checkedAthletes, setCheckedAthletes] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        initialEvaluations.forEach(e => initial[e.athleteId] = true);
        return initial;
    });

    const [localEvals, setLocalEvals] = useState<Record<string, { rpe: number, exhaustion: number, times: string }>>(() => {
        const initial: Record<string, { rpe: number, exhaustion: number, times: string }> = {};
        initialEvaluations.forEach(e => { initial[e.athleteId] = { rpe: e.rpe, exhaustion: e.exhaustion, times: e.times || '' }; });
        return initial;
    });

    const handleSaveClick = () => {
        const evalList: SessionEvaluation[] = Object.entries(checkedAthletes).filter(([_, checked]) => checked).map(([athleteId, _]) => ({
            athleteId,
            athleteName: presentAthletes.find(a => a.id === athleteId)?.name || 'Atleta',
            rpe: localEvals[athleteId]?.rpe || 5,
            exhaustion: localEvals[athleteId]?.exhaustion || 5,
            times: localEvals[athleteId]?.times || ''
        }));
        onSave(evalList);
    };

    return (
        <div className="bg-white w-full max-w-2xl h-[90%] rounded-t-3xl shadow-2xl p-6 flex flex-col animate-in slide-in-from-bottom-10" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-brand-slate">Avaliar série: {block.exerciseName}</h3>
                    <p className="text-sm text-gray-500">Marque o atleta para liberar os controles de percepção.</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-3 pr-2 pb-6">
                {presentAthletes.map(athlete => {
                    const isChecked = checkedAthletes[athlete.id];
                    const val = localEvals[athlete.id] || { rpe: 5, exhaustion: 5, times: '' };
                    return (
                        <div key={athlete.id} className={`border rounded-xl overflow-hidden transition-all ${isChecked ? 'border-brand-orange ring-1 ring-brand-orange/10' : 'border-gray-200 bg-white'}`}>
                            <div className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 ${isChecked ? 'bg-orange-50/50' : ''}`} onClick={() => { setCheckedAthletes(p => ({ ...p, [athlete.id]: !p[athlete.id] })); if (!localEvals[athlete.id]) setLocalEvals(p => ({ ...p, [athlete.id]: { rpe: 5, exhaustion: 5, times: '' } })); }}>
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-brand-orange border-brand-orange text-white' : 'border-gray-300 bg-white'}`}>{isChecked && <Check size={12} strokeWidth={4} />}</div>
                                <div className="flex flex-col"><span className="font-bold text-slate-700">{athlete.name}</span><span className="text-[10px] font-bold text-gray-400 uppercase">{athlete.category}</span></div>
                            </div>
                            {isChecked && (
                                <div className="p-4 bg-white border-t border-orange-100 space-y-6 animate-in fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div><div className="flex justify-between text-[10px] font-black text-gray-400 uppercase mb-2"><span>RPE</span><span className="text-brand-orange">{val.rpe}/10</span></div><input type="range" min="0" max="10" value={val.rpe} onChange={e => setLocalEvals(p => ({ ...p, [athlete.id]: { ...val, rpe: parseInt(e.target.value) } }))} className="w-full accent-brand-orange" /></div>
                                        <div><div className="flex justify-between text-[10px] font-black text-gray-400 uppercase mb-2"><span>Exaustão</span><span className="text-red-500">{val.exhaustion}/10</span></div><input type="range" min="0" max="10" value={val.exhaustion} onChange={e => setLocalEvals(p => ({ ...p, [athlete.id]: { ...val, exhaustion: parseInt(e.target.value) } }))} className="w-full accent-red-500" /></div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Tempos alcançados (Opcional)</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: 31.5, 32.1, 31.8..."
                                            value={val.times}
                                            onChange={e => setLocalEvals(p => ({ ...p, [athlete.id]: { ...val, times: e.target.value } }))}
                                            className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-brand-orange outline-none transition-colors font-mono"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="pt-4 border-t border-gray-100"><button onClick={handleSaveClick} className="w-full bg-brand-slate text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"><CheckCircle2 size={18} /> Salvar avaliações</button></div>
        </div>
    );
};

// --- Reusable Component: AddSeriesModal ---


const AddSeriesModal = ({ order, onSave, onClose, initialData }: { order: number, onSave: (b: WorkoutBlock) => void, onClose: () => void, initialData?: WorkoutBlock }) => {
    const [exName, setExName] = useState(initialData?.exerciseName || '');
    const [reps, setReps] = useState(initialData?.mainSet.split('x')[0] || '12');
    const [dist, setDist] = useState(initialData?.mainSet.split('x')[1]?.replace('m', '') || '100');
    const [rpeManual, setRpeManual] = useState(initialData?.rpe || 'Capacidade Anaeróbica');
    const [subdivisions, setSubdivisions] = useState<WorkoutSubdivision[]>(initialData?.subdivisions || []);
    const [observations, setObservations] = useState(initialData?.observations || '');

    const [subType, setSubType] = useState<'DDR' | 'DCR'>('DDR');
    const [subReps, setSubReps] = useState('');
    const [subMetros, setSubMetros] = useState('');
    const [subObs, setSubObs] = useState('');
    const [subExerc, setSubExerc] = useState('');
    const [subTempo, setSubTempo] = useState('');
    const [subPausa, setSubPausa] = useState('');
    const [subDare, setSubDare] = useState('');
    const [subDaer, setSubDaer] = useState('');
    const [subFunctionalBase, setSubFunctionalBase] = useState('Automático');
    const [ranges, setRanges] = useState<any[]>([]);

    React.useEffect(() => {
        const fetchRanges = async () => {
            try {
                const data = await trainingService.getFunctionalDirectionRanges();
                setRanges(data);
            } catch (err) {
                console.error("Failed to fetch ranges", err);
            }
        };
        fetchRanges();
    }, []);

    React.useEffect(() => {
        if (!subDare || !subDaer || ranges.length === 0) {
            setSubFunctionalBase('Automático');
            return;
        }

        const re = parseFloat(subDare);
        const er = parseFloat(subDaer);

        const match = ranges.find(r =>
            re >= r.re_min && re <= r.re_max &&
            er >= r.er_min && er <= r.er_max
        );

        if (match) {
            setSubFunctionalBase(match.direction);
        } else {
            setSubFunctionalBase('Fora da faixa');
        }
    }, [subDare, subDaer, ranges]);

    const handleAddSub = () => {
        if (!subReps || !subMetros) return;
        const newSub: WorkoutSubdivision = {
            id: Date.now().toString(),
            type: subType,
            seriesOrder: parseInt(subReps),
            distance: parseInt(subMetros),
            description: subObs,
            category: subExerc,
            interval: subTempo,
            pause: subPausa,
            totalDistance: parseInt(subReps) * parseInt(subMetros),
            daRe: subDare,
            daEr: subDaer,
            functionalBase: subFunctionalBase
        };
        setSubdivisions([...subdivisions, newSub]);
        setSubReps(''); setSubMetros(''); setSubObs(''); setSubExerc(''); setSubTempo(''); setSubPausa(''); setSubDare(''); setSubDaer('');
        setSubFunctionalBase('Automático');
    };

    const handleRemoveSub = (id: string) => setSubdivisions(subdivisions.filter(s => s.id !== id));
    const stats = calculateBlockStats(subdivisions);

    const handleFinalSave = () => {
        const block: WorkoutBlock = {
            id: initialData?.id || `b-${Date.now()}`,
            order,
            exerciseName: exName || `Série #${order}`,
            mainSet: `${reps}x${dist}m`,
            observations,
            volume: stats.volume,
            ddr: stats.ddr.toString(),
            dcr: stats.dcr.toString(),
            athleteCount: 0,
            rpe: rpeManual,
            exhaustion: '0',
            fatigue: '0',
            subdivisions
        };
        onSave(block);
    };

    return (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-7xl max-h-[95vh] shadow-2xl flex flex-col overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-2xl font-bold text-brand-slate">{initialData ? 'Editar série' : 'Adicionar série'}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={24} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        <div className="lg:col-span-8">
                            <div className="flex flex-col md:flex-row md:items-baseline gap-4 mb-6">
                                <div className="flex-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Título da série</label>
                                    <input type="text" value={exName} onChange={e => setExName(e.target.value)} placeholder="Ex: Principal A2" className="w-full text-3xl font-black text-brand-slate p-2 border-b-4 border-gray-100 outline-none focus:border-brand-orange transition-colors" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-center">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Reps</label>
                                        <input type="text" value={reps} onChange={e => setReps(e.target.value)} className="w-16 text-center text-3xl font-black p-2 border-2 border-gray-200 rounded-xl outline-none focus:border-brand-orange" />
                                    </div>
                                    <span className="text-3xl font-black text-gray-300 mt-5">X</span>
                                    <div className="flex flex-col items-center">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mts</label>
                                        <input type="text" value={dist} onChange={e => setDist(e.target.value)} className="w-24 text-center text-3xl font-black p-2 border-2 border-gray-200 rounded-xl outline-none focus:border-brand-orange" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-8 items-center bg-brand-slate/5 p-4 rounded-2xl border border-brand-slate/10">
                                <div className="flex flex-col"><span className="text-[10px] font-black text-gray-400 uppercase">Planejado</span><span className="text-2xl font-black text-slate-800">{parseInt(reps || '0') * parseInt(dist || '0')}m</span></div>
                                <div className="w-px h-10 bg-gray-200"></div>
                                <div className="flex flex-col"><span className="text-[10px] font-black text-gray-400 uppercase">Volume</span><span className={`text-2xl font-black ${stats.volume === parseInt(reps || '0') * parseInt(dist || '0') ? 'text-emerald-600' : 'text-red-500'}`}>{stats.volume}m</span></div>
                                <div className="w-px h-10 bg-gray-200"></div>
                                <div className="flex flex-col"><span className="text-[10px] font-black text-emerald-400 uppercase">DDR</span><span className="text-2xl font-black text-emerald-600">{stats.ddr}m</span></div>
                                <div className="w-px h-10 bg-gray-200"></div>
                                <div className="flex flex-col"><span className="text-[10px] font-black text-blue-400 uppercase">DCR</span><span className="text-2xl font-black text-blue-600">{stats.dcr}m</span></div>
                            </div>
                            <div className="mt-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Instrução geral</label>
                                <input type="text" value={observations} onChange={e => setObservations(e.target.value)} placeholder="Ex: Intervalo de 1:30" className="w-full p-2.5 border border-gray-300 rounded-xl text-sm bg-gray-50 focus:bg-white focus:border-brand-orange outline-none" />
                            </div>
                        </div>
                        <div className="lg:col-span-4 bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col gap-4">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 block">RPE (Esforço percebido)</label>
                            <select value={rpeManual} onChange={e => setRpeManual(e.target.value)} className="w-full p-4 bg-white border border-gray-200 rounded-xl font-bold shadow-sm outline-none focus:ring-2 focus:ring-brand-orange appearance-none pr-10 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[length:1.25em_1.25em] bg-[right_1rem_center]"><option>Capacidade anaeróbica</option><option>Aeróbico A1</option><option>Aeróbico A2</option><option>Limiar anaeróbico</option><option>VO2 Max</option></select>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <h4 className="text-2xl font-bold text-brand-slate">Subdivisões:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-3 items-end">
                            <div className="col-span-1"><label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">Tipo</label><select value={subType} onChange={e => setSubType(e.target.value as any)} className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold h-11 appearance-none pr-8 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[length:1em_1em] bg-[right_0.5rem_center]"><option>DDR</option><option>DCR</option></select></div>
                            <div className="col-span-1"><label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">Série</label><input type="text" value={subReps} onChange={e => setSubReps(e.target.value)} placeholder="Qt" className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold h-11 text-center" /></div>
                            <div className="col-span-1"><label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">Mts</label><input type="text" value={subMetros} onChange={e => setSubMetros(e.target.value)} placeholder="Dist" className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold h-11 text-center" /></div>
                            <div className="lg:col-span-2"><label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">Observações</label><input type="text" value={subObs} onChange={e => setSubObs(e.target.value)} placeholder="Ex: Progressivo" className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs h-11" /></div>
                            <div className="lg:col-span-1.5"><label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">Exercício</label><select value={subExerc} onChange={e => setSubExerc(e.target.value)} className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold h-11 appearance-none pr-8 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[length:1em_1em] bg-[right_0.5rem_center]"><option value="">Selecione...</option><option>Nadando</option><option>Perna</option><option>Braço</option><option>Técnico</option></select></div>
                            <div className="col-span-1"><label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">Tempo</label><input type="text" value={subTempo} onChange={e => setSubTempo(e.target.value)} placeholder="Seg" className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs h-11 text-center" /></div>
                            <div className="col-span-1"><label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">Pausa</label><input type="text" value={subPausa} onChange={e => setSubPausa(e.target.value)} placeholder="Seg" className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs h-11 text-center" /></div>
                            <div className="col-span-1"><label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">DA-RE</label><input type="text" value={subDare} onChange={e => setSubDare(e.target.value)} placeholder="0.0" className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs h-11 text-center font-bold text-brand-orange" /></div>
                            <div className="col-span-1"><label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">DA-ER</label><input type="text" value={subDaer} onChange={e => setSubDaer(e.target.value)} placeholder="0.0" className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs h-11 text-center font-bold" /></div>
                            <div className="lg:col-span-2"><label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">Base funcional</label><input type="text" readOnly value={subFunctionalBase} className={`w-full p-2 border rounded-lg text-[10px] h-11 transition-colors font-bold ${subFunctionalBase === 'Automático' ? 'bg-gray-50 border-gray-200 text-gray-400 italic' : 'bg-brand-orange/10 border-brand-orange text-brand-orange'}`} /></div>
                        </div>
                        <div className="flex justify-end"><button onClick={handleAddSub} className="bg-slate-700 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-slate-800">Salvar subdivisão</button></div>
                        <div className="overflow-x-auto rounded-2xl border border-gray-200 mt-4 shadow-sm">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-brand-slate text-white font-bold uppercase tracking-widest text-[9px]"><tr><th className="px-4 py-4 text-center">TIPO</th><th className="px-4 py-4 text-center">Série</th><th className="px-4 py-4 text-center">x</th><th className="px-4 py-4 text-center">Mts</th><th className="px-4 py-4">Observações</th><th className="px-4 py-4 text-center">TEMPO</th><th className="px-4 py-4 text-center">PAUSA</th><th className="px-4 py-4 text-center">TOTAL</th><th className="px-4 py-4 text-center">DA-RE</th><th className="px-4 py-4 text-center">DA-ER</th><th className="px-4 py-4 text-center">BASE</th><th className="px-4 py-4 text-center">AÇÃO</th></tr></thead>
                                <tbody className="divide-y divide-gray-100 font-bold">
                                    {subdivisions.map(sub => (
                                        <tr key={sub.id} className={`${sub.type === 'DDR' ? 'bg-[#FFFACD]' : 'bg-[#E0F2FF]'} hover:opacity-90`}>
                                            <td className="px-4 py-3 text-center">{sub.type}</td><td className="px-4 py-3 text-center">{sub.seriesOrder}</td><td className="px-4 py-3 text-center text-gray-400">x</td><td className="px-4 py-3 text-center">{sub.distance}</td><td className="px-4 py-3">{sub.description || '-'}</td><td className="px-4 py-3 text-center">{sub.interval || '-'}</td><td className="px-4 py-3 text-center">{sub.pause || '-'}</td><td className="px-4 py-3 text-center">{sub.totalDistance}</td><td className="px-4 py-3 text-center text-brand-orange">{sub.daRe}</td><td className="px-4 py-3 text-center">{sub.daEr}</td><td className="px-4 py-3 text-center text-brand-orange">{sub.functionalBase}</td><td className="px-4 py-3 text-center"><button onClick={() => handleRemoveSub(sub.id)} className="p-1 text-gray-500 hover:text-red-500"><Trash2 size={14} /></button></td>
                                        </tr>
                                    ))}
                                    {subdivisions.length === 0 && <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-400 italic">Nenhuma subdivisão.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="px-6 py-4 text-gray-500 font-bold">Cancelar</button>
                        {stats.volume !== parseInt(reps || '0') * parseInt(dist || '0') && subdivisions.length > 0 && (
                            <span className="text-red-500 text-sm font-bold flex items-center gap-2">
                                <AlertCircle size={16} />
                                Volume ({stats.volume}m) ≠ Planejado ({parseInt(reps || '0') * parseInt(dist || '0')}m)
                            </span>
                        )}
                    </div>
                    <button onClick={handleFinalSave} disabled={subdivisions.length === 0 || stats.volume !== parseInt(reps || '0') * parseInt(dist || '0')} className="px-10 py-4 bg-brand-orange text-white rounded-2xl font-black uppercase text-sm disabled:bg-gray-200 disabled:cursor-not-allowed">Concluir</button>
                </div>
            </div>
        </div>
    );
};

// --- Main Module ---

export default function TrainingPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const [viewMode, setViewMode] = useState<ViewMode>('LIST');
    const [mainTab, setMainTab] = useState<MainTab>('PLANS');
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [athletes, setAthletes] = useState<Athlete[]>([]);
    const [categories, setCategories] = useState<string[]>(['Todos', 'Geral', 'Infantil', 'Petiz']);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Data Fetch
    React.useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [workoutsData, athletesData, categoriesData] = await Promise.all([
                    trainingService.getAll(),
                    athleteService.getAll(),
                    athleteService.getCategories().catch(() => [])
                ]);
                setWorkouts(workoutsData);
                setAthletes(athletesData);
                if (categoriesData.length > 0) {
                    setCategories(['Todos', ...categoriesData.map((c: any) => c.name)]);
                }
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    // URL Sync Effect - restore state from URL
    React.useEffect(() => {
        if (!isLoading && workouts.length > 0 && id) {
            const workout = workouts.find(w => String(w.id) === id);
            if (workout) {
                if (location.pathname.includes('/session')) {
                    // 1. Is the URL ID pointing directly to an Active session?
                    if (workout.status === 'Active') {
                        setLiveWorkout(workout);
                        setViewMode('LIVE');
                    } else {
                        // 2. Or is it pointing to the Parent Plan? Check if it has an active child.
                        const activeChild = workouts.find(w =>
                            String(w.parent_session_id) === id && w.status === 'Active'
                        );
                        if (activeChild) {
                            // Redirect to the explicit session URL
                            navigate(`/training/${activeChild.id}/session`, { replace: true });
                        } else {
                            // No active session found, fallback to details
                            navigate(`/training/${id}`, { replace: true });
                            setCurrentWorkout(workout);
                            setViewMode('DETAILS');
                        }
                    }
                } else {
                    // Details mode
                    setCurrentWorkout(workout);
                    setViewMode('DETAILS');
                }
            }
        } else if (!id && viewMode !== 'BUILDER') {
            // No ID in URL, reset to list (unless in builder)
            if (viewMode === 'DETAILS' || viewMode === 'LIVE') {
                setViewMode('LIST');
                setCurrentWorkout(null);
                setLiveWorkout(null);
            }
        }
    }, [id, isLoading, workouts, location.pathname]);

    const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
    const [liveWorkout, setLiveWorkout] = useState<Workout | null>(null);

    const [attendance, setAttendance] = useState<Record<string, boolean>>({});
    const [attendanceSearch, setAttendanceSearch] = useState('');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const [showEvalDrawer, setShowEvalDrawer] = useState(false);
    const [selectedBlockEval, setSelectedBlockEval] = useState<WorkoutBlock | null>(null);
    const [sessionEvaluations, setSessionEvaluations] = useState<Record<string, SessionEvaluation[]>>({});

    const [showAddSeriesModal, setShowAddSeriesModal] = useState(false);
    const [editingBlock, setEditingBlock] = useState<WorkoutBlock | null>(null);
    const [showFinishConfirm, setShowFinishConfirm] = useState(false);
    const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null);

    const [filterCategory, setFilterCategory] = useState<string>('Todos');
    const [filterProfile, setFilterProfile] = useState<string>('Todos');
    const [startDate, setStartDate] = useState(getLocalTodayISO());
    const [endDate, setEndDate] = useState(getLocalTodayISO());
    const [dateShortcut, setDateShortcut] = useState<'yesterday' | 'today' | 'tomorrow'>('today');
    const [showFilters, setShowFilters] = useState(false);

    const [historyCategory, setHistoryCategory] = useState<string>('Todos');
    const [historyProfile, setHistoryProfile] = useState<string>('Todos');
    const [historyStartDate, setHistoryStartDate] = useState(getLocalTodayISO());
    const [historyEndDate, setHistoryEndDate] = useState(getLocalTodayISO());
    const [historyDateShortcut, setHistoryDateShortcut] = useState<'yesterday' | 'today' | 'tomorrow'>('today');
    const [showHistoryFilters, setShowHistoryFilters] = useState(false);

    const [showStartModal, setShowStartModal] = useState(false);
    const [startWorkoutRef, setStartWorkoutRef] = useState<Workout | null>(null);
    const [sessionStartTime, setSessionStartTime] = useState('');
    const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
    const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);

    // Builder States
    const [builderId, setBuilderId] = useState<string | null>(null);
    const [builderTitle, setBuilderTitle] = useState('');
    const [builderDate, setBuilderDate] = useState(getLocalTodayISO());
    const [builderTime, setBuilderTime] = useState('00:00');
    const [builderProfile, setBuilderProfile] = useState<'Fundo' | 'Velocidade' | 'Meio Fundo' | 'Técnica'>('Fundo');
    const [builderCategory, setBuilderCategory] = useState('Geral');
    const [builderBlocks, setBuilderBlocks] = useState<WorkoutBlock[]>([]);

    // Details Tab State
    const [detailsTab, setDetailsTab] = useState<'TECHNICAL' | 'HISTORY'>('TECHNICAL');

    const handleCreateNew = () => {
        setBuilderId(null);
        setBuilderTitle('');
        setBuilderDate(getLocalTodayISO());
        setBuilderBlocks([]);
        setViewMode('BUILDER');
    };

    const handleEditWorkout = (workout: Workout) => {
        setBuilderId(workout.id);
        setBuilderTitle(workout.title);
        setBuilderDate(workout.date);
        setBuilderProfile(workout.profile);
        setBuilderCategory(workout.category);
        setBuilderBlocks(workout.blocks);
        setViewMode('BUILDER');
    };

    const handleDeleteRequest = (id: string) => {
        setWorkoutToDelete(id);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteWorkout = async () => {
        if (workoutToDelete) {
            try {
                await trainingService.delete(workoutToDelete);
                setWorkouts(workouts.filter(w => w.id !== workoutToDelete));
                setWorkoutToDelete(null);
                setShowDeleteConfirm(false);
            } catch (error) {
                console.error("Error deleting workout:", error);
                alert("Erro ao excluir treino.");
            }
        }
    };

    const handleSaveWorkoutPlan = async () => {
        try {
            if (builderId) {
                // Updating existing
                const updatedWorkout = await trainingService.update(builderId, {
                    title: builderTitle || 'Novo treino',
                    date: builderDate,
                    profile: builderProfile,
                    category: builderCategory,
                    status: 'Planned',
                    blocks: builderBlocks // Sending blocks to update series
                });
                setWorkouts(workouts.map(w => w.id === builderId ? updatedWorkout : w));
                // Navigate to details
                navigate(`/training/${builderId}`);
            } else {
                // Creating new
                const newWorkout = await trainingService.create({
                    title: builderTitle || 'Novo treino',
                    date: builderDate,
                    profile: builderProfile,
                    category: builderCategory,
                    blocks: builderBlocks
                });
                // Check if it was a duplication (we can assume yes if we are in builder mode but it's new)
                // Actually simple append is enough
                setWorkouts([newWorkout, ...workouts]);
                // Navigate to details
                navigate(`/training/${newWorkout.id}`);
            }
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar treino");
        }
    };

    const handleDuplicateWorkout = (workout: Workout) => {
        setBuilderTitle(`${workout.title} (Cópia)`);
        setBuilderDate(getLocalTodayISO());
        setBuilderTime(workout.time);
        setBuilderProfile(workout.profile);
        setBuilderCategory(workout.category);
        // Deep copy of blocks with new IDs to avoid reference issues
        const newBlocks = workout.blocks.map(b => ({
            ...b,
            id: Date.now().toString() + Math.random().toString(),
            subdivisions: b.subdivisions.map(s => ({ ...s, id: Date.now().toString() + Math.random().toString() }))
        }));
        setBuilderBlocks(newBlocks);
        setBuilderId(null); // Ensure it saves as new
        setViewMode('BUILDER');
    };

    const handleStartRequest = (workout: Workout) => {
        setStartWorkoutRef(workout);
        const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        setSessionStartTime(currentTime);
        setShowStartModal(true);
    };

    const confirmStartSession = async () => {
        if (startWorkoutRef) {
            try {
                // 1. Clone the plan into a new session
                const newSession = await trainingService.startSession(startWorkoutRef.id);

                // 2. Update the new session with the chosen time
                // The backend clone status is already 'Active'
                const updatedSession = await trainingService.update(newSession.id, {
                    time: sessionStartTime
                });

                // 3. Set as live workout
                setLiveWorkout(updatedSession);

                setSessionEvaluations({});
                setIsSidebarCollapsed(false);
                setShowStartModal(false);
                setStartWorkoutRef(null);
                setViewMode('LIVE');

                // Navigate to session URL for persistence
                navigate(`/training/${updatedSession.id}/session`);
            } catch (err) {
                console.error("Error starting session:", err);
                alert("Erro ao iniciar sessão.");
            }
        }
    };

    const handleAddSeriesToView = async (newBlock: WorkoutBlock) => {
        if (viewMode === 'LIVE' && liveWorkout) {
            try {
                await trainingService.addSeries(liveWorkout.id, newBlock);
                setLiveWorkout(prev => prev ? { ...prev, blocks: [...prev.blocks, newBlock] } : null);
            } catch (err) {
                console.error("Error adding series:", err);
                alert("Erro ao adicionar série.");
            }
        } else if (viewMode === 'BUILDER') {
            setBuilderBlocks(prev => {
                const exists = prev.find(b => b.id === newBlock.id);
                if (exists) {
                    return prev.map(b => b.id === newBlock.id ? newBlock : b);
                }
                return [...prev, newBlock];
            });
        }
        setShowAddSeriesModal(false);
        setEditingBlock(null);
    };

    const handleSaveEvaluations = (blockId: string, evalList: SessionEvaluation[]) => {
        setSessionEvaluations(prev => ({ ...prev, [blockId]: evalList }));
        setShowEvalDrawer(false);
        setSelectedBlockEval(null);
    };

    const handleFinishWorkout = async () => {
        if (!liveWorkout) return;

        try {
            // Save feedbacks per series for each athlete
            const presentAthleteIds = Object.keys(attendance).filter(id => attendance[id]);

            // For each block (series), save feedback for athletes that were evaluated
            for (const block of liveWorkout.blocks) {
                const blockEvals = sessionEvaluations[block.id] || [];

                // Find the real series_id from the backend data
                // The block.id might be a frontend ID, but we need the backend series ID
                // In liveWorkout.blocks, the id should correspond to the backend series id
                const seriesId = parseInt(block.id);

                for (const athleteEval of blockEvals) {
                    await trainingService.createFeedback(liveWorkout.id, {
                        session_id: parseInt(liveWorkout.id),
                        series_id: isNaN(seriesId) ? null : seriesId,
                        athlete_id: parseInt(athleteEval.athleteId),
                        rpe_real: athleteEval.rpe,
                        exhaustion_level: athleteEval.exhaustion.toString(),
                        notes: athleteEval.times || '',
                        attendance: 'Present'
                    });
                }
            }

            // For present athletes that weren't evaluated in any series, 
            // still save an attendance record (without series_id, just session-level)
            const evaluatedAthleteIds = new Set<string>();
            for (const blockId in sessionEvaluations) {
                for (const eval_ of sessionEvaluations[blockId]) {
                    evaluatedAthleteIds.add(eval_.athleteId);
                }
            }

            for (const athleteId of presentAthleteIds) {
                if (!evaluatedAthleteIds.has(athleteId)) {
                    // Create attendance-only record (no evaluation)
                    await trainingService.createFeedback(liveWorkout.id, {
                        session_id: parseInt(liveWorkout.id),
                        series_id: null,
                        athlete_id: parseInt(athleteId),
                        rpe_real: null,
                        exhaustion_level: null,
                        notes: '',
                        attendance: 'Present'
                    });
                }
            }

            // Capture parent ID before clearing state
            const parentId = liveWorkout.parentSessionId;
            await trainingService.update(liveWorkout.id, { status: 'Completed' });

            setShowFinishConfirm(false);
            setShowSuccessFeedback(true);
            setTimeout(async () => {
                const workoutsData = await trainingService.getAll();

                // Navigate first to clear URL dependency
                navigate('/training', { replace: true });
                setViewMode('LIST');
                setMainTab('HISTORY');
                setShowSuccessFeedback(false);
                setLiveWorkout(null);

                // Delay state update to prevent useEffect race condition
                setTimeout(() => {
                    setWorkouts(workoutsData);
                }, 100);
            }, 2000);
        } catch (error) {
            console.error(error);
            alert("Erro ao finalizar treino");
        }
    };

    // --- Render Functions to fix focus bug ---

    const allHistory = useMemo(() => {
        return workouts
            .filter(w => {
                if (w.status !== 'Completed') return false;

                const matchesCategory = historyCategory === 'Todos' || w.category === historyCategory;
                const matchesProfile = historyProfile === 'Todos' || w.profile === historyProfile;
                const matchesStart = !historyStartDate || w.date >= historyStartDate;
                const matchesEnd = !historyEndDate || w.date <= historyEndDate;

                return matchesCategory && matchesProfile && matchesStart && matchesEnd;
            })
            .map(w => {
                // Map feedbacks to attendees (unique athletes) and evaluations
                const attendees = w.feedbacks
                    ? Array.from(new Set(
                        w.feedbacks
                            .filter(f => f.attendance === 'Present')
                            .map(f => f.athlete_id.toString())
                    ))
                    : [];

                const blockEvaluations: Record<string, SessionEvaluation[]> = {};
                // Map feedbacks to their respective blocks using series_id
                if (w.feedbacks && w.blocks) {
                    w.blocks.forEach(block => {
                        const blockSeriesId = parseInt(block.id);
                        blockEvaluations[block.id] = w.feedbacks!
                            .filter(f =>
                                f.attendance === 'Present' &&
                                f.rpe_real !== null &&
                                // Match by series_id if available, or include legacy feedbacks without series_id
                                (f.series_id === blockSeriesId || (f.series_id === null && !isNaN(blockSeriesId)))
                            )
                            // For legacy data (no series_id), only include if this is the first block
                            .filter((f, idx, arr) => {
                                if (f.series_id !== null) return true;
                                // For legacy feedbacks without series_id, only show in first block
                                return block.order === 1 || block.order === w.blocks[0]?.order;
                            })
                            .map(f => ({
                                athleteId: f.athlete_id.toString(),
                                athleteName: athletes.find(a => String(a.id) === String(f.athlete_id))?.name || 'Atleta',
                                rpe: f.rpe_real || 0,
                                exhaustion: parseFloat(f.exhaustion_level || '0'),
                                times: ''
                            }));
                    });
                }

                // Calculate Adherence
                const potentialAthletes = athletes.filter(a =>
                    a.status === 'Active' &&
                    (w.category === 'Geral' || w.category === 'Todos' || a.category === w.category)
                );
                const adherence = potentialAthletes.length > 0
                    ? Math.round((attendees.length / potentialAthletes.length) * 100)
                    : 0;

                return {
                    id: w.id,
                    date: w.date,
                    startTime: w.time,
                    endTime: w.time,
                    attendanceCount: attendees.length,
                    attendees: attendees,
                    blockEvaluations: blockEvaluations,
                    adherence: adherence,
                    workout: w
                };
            }).sort((a, b) => parseISOToLocalDate(b.date).getTime() - parseISOToLocalDate(a.date).getTime());
    }, [workouts, historyCategory, historyProfile, historyStartDate, historyEndDate, athletes]);

    const renderListView = () => {
        const filteredWorkouts = workouts.filter(w => {
            if (w.status !== 'Planned') return false;
            const matchesCategory = filterCategory === 'Todos' || w.category === filterCategory;
            const matchesProfile = filterProfile === 'Todos' || w.profile === filterProfile;
            const matchesStart = !startDate || w.date >= startDate;
            const matchesEnd = !endDate || w.date <= endDate;
            return matchesCategory && matchesProfile && matchesStart && matchesEnd;
        });


        return (
            <div className="space-y-6 animate-in fade-in relative">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-black text-brand-slate tracking-tight">Treinos de natação</h2>
                            <button
                                onClick={() => navigate('/training/settings')}
                                className="p-1.5 text-slate-300 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition-colors"
                                title="Configurações"
                            >
                                <Settings size={16} />
                            </button>
                        </div>
                        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-100 self-start shadow-sm">
                            <button
                                onClick={() => setMainTab('PLANS')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all tracking-widest ${mainTab === 'PLANS' ? 'bg-brand-slate text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'}`}
                            >
                                <List size={14} />
                                Treinos planejados
                            </button>
                            <button
                                onClick={() => setMainTab('HISTORY')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all tracking-widest ${mainTab === 'HISTORY' ? 'bg-brand-slate text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'}`}
                            >
                                <History size={14} />
                                Histórico geral
                            </button>
                        </div>
                    </div>
                    {mainTab === 'PLANS' && (
                        <button onClick={handleCreateNew} className="bg-brand-orange hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg font-medium">
                            <Plus size={20} /> Novo treino
                        </button>
                    )}
                </header>

                {mainTab === 'PLANS' && (
                    <>
                        <div className="bg-white p-4 md:p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col gap-4 md:gap-6">
                            <div className="flex items-center justify-between md:hidden">
                                <div className="flex items-center gap-2">
                                    <Filter size={16} className="text-brand-orange" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtros</span>
                                </div>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-brand-orange transition-all"
                                >
                                    {showFilters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                            </div>

                            <div className={`${showFilters ? 'flex' : 'hidden md:flex'} flex-col gap-6 animate-in slide-in-from-top-2`}>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Period Filter */}
                                    <div className="flex flex-col gap-3">
                                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest pl-1">Período:</span>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 focus-within:border-brand-orange focus-within:bg-white transition-all">
                                                <input
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) => { setStartDate(e.target.value); setDateShortcut(undefined as any); }}
                                                    className="bg-transparent text-xs font-bold outline-none text-slate-700"
                                                />
                                                <span className="text-slate-300 font-bold">-</span>
                                                <input
                                                    type="date"
                                                    value={endDate}
                                                    onChange={(e) => { setEndDate(e.target.value); setDateShortcut(undefined as any); }}
                                                    className="bg-transparent text-xs font-bold outline-none text-slate-700"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {[{ key: 'yesterday', label: 'Ontem' }, { key: 'today', label: 'Hoje' }, { key: 'tomorrow', label: 'Amanhã' }].map(opt => {
                                                    const getDateForShortcut = (k: string) => {
                                                        const d = new Date();
                                                        if (k === 'yesterday') d.setDate(d.getDate() - 1);
                                                        if (k === 'tomorrow') d.setDate(d.getDate() + 1);
                                                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                                    };
                                                    return (
                                                        <button
                                                            key={opt.key}
                                                            onClick={() => { const d = getDateForShortcut(opt.key); setStartDate(d); setEndDate(d); setDateShortcut(opt.key as any); }}
                                                            className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all tracking-widest border border-transparent ${dateShortcut === opt.key ? 'bg-brand-orange text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Category Filter */}
                                    <div className="flex flex-col gap-3">
                                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest pl-1">Categoria:</span>
                                        <div className="flex flex-wrap items-center gap-1">
                                            {categories.map(c => (
                                                <FilterChip key={c} label={c} active={filterCategory === c} onClick={() => setFilterCategory(c)} />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Profile Filter */}
                                <div className="flex flex-col gap-3 border-t border-slate-100 pt-6">
                                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest pl-1">Perfil:</span>
                                    <div className="flex flex-wrap items-center gap-1">
                                        {['Todos', 'Velocidade', 'Fundo', 'Meio Fundo', 'Técnica'].map(p => (
                                            <FilterChip key={p} label={p} active={filterProfile === p} onClick={() => setFilterProfile(p)} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredWorkouts.map(w => (
                                <div key={w.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all group relative">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] font-bold bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded uppercase">{w.profile}</span>
                                                <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase">{w.category}</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-brand-slate leading-tight">{w.title}</h3>
                                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Calendar size={12} /> {w.date}</p>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleDuplicateWorkout(w)} className="p-2 text-gray-400 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition-colors" title="Duplicar"><Copy size={16} /></button>
                                            <button onClick={() => handleEditWorkout(w)} className="p-2 text-gray-400 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDeleteRequest(w.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-4 py-4 border-t border-b border-gray-50">
                                        <div className="flex flex-col"><span className="text-[10px] text-gray-400 uppercase font-bold">Volume</span><span className="text-lg font-bold text-brand-slate flex items-center gap-1"><Droplets size={14} className="text-sky-500" /> {w.totalVolume}m</span></div>
                                        <div className="flex flex-col"><span className="text-[10px] text-gray-400 uppercase font-bold">Execuções</span><span className="text-sm font-semibold text-gray-700 flex items-center gap-1"><History size={14} className="text-brand-orange" /> {w.history?.length || 0}</span></div>
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                        <button onClick={() => navigate(`/training/${w.id}`)} className="text-sm font-medium text-gray-500 hover:text-brand-slate flex items-center gap-1"><Eye size={16} /> Detalhes</button>
                                        <button onClick={() => handleStartRequest(w)} className="bg-brand-slate hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md"><Play size={14} fill="white" /> Iniciar treino</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {mainTab === 'HISTORY' && (
                    <div className="space-y-6 animate-in fade-in">
                        {/* History Filters */}
                        <div className="bg-white p-4 md:p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col gap-4 md:gap-6">
                            <div className="flex items-center justify-between md:hidden">
                                <div className="flex items-center gap-2">
                                    <Filter size={16} className="text-brand-orange" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtros</span>
                                </div>
                                <button
                                    onClick={() => setShowHistoryFilters(!showHistoryFilters)}
                                    className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-brand-orange transition-all"
                                >
                                    {showHistoryFilters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                            </div>

                            <div className={`${showHistoryFilters ? 'flex' : 'hidden md:flex'} flex-col gap-6 animate-in slide-in-from-top-2`}>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Period Filter */}
                                    <div className="flex flex-col gap-3">
                                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest pl-1">Período:</span>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 focus-within:border-brand-orange focus-within:bg-white transition-all">
                                                <input
                                                    type="date"
                                                    value={historyStartDate}
                                                    onChange={(e) => { setHistoryStartDate(e.target.value); setHistoryDateShortcut(undefined as any); }}
                                                    className="bg-transparent text-xs font-bold outline-none text-slate-700"
                                                />
                                                <span className="text-slate-300 font-bold">-</span>
                                                <input
                                                    type="date"
                                                    value={historyEndDate}
                                                    onChange={(e) => { setHistoryEndDate(e.target.value); setHistoryDateShortcut(undefined as any); }}
                                                    className="bg-transparent text-xs font-bold outline-none text-slate-700"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {[{ key: 'yesterday', label: 'Ontem' }, { key: 'today', label: 'Hoje' }, { key: 'tomorrow', label: 'Amanhã' }].map(opt => {
                                                    const getDateForShortcut = (k: string) => {
                                                        const d = new Date();
                                                        if (k === 'yesterday') d.setDate(d.getDate() - 1);
                                                        if (k === 'tomorrow') d.setDate(d.getDate() + 1);
                                                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                                    };
                                                    return (
                                                        <button
                                                            key={opt.key}
                                                            onClick={() => { const d = getDateForShortcut(opt.key); setHistoryStartDate(d); setHistoryEndDate(d); setHistoryDateShortcut(opt.key as any); }}
                                                            className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all tracking-widest border border-transparent ${historyDateShortcut === opt.key ? 'bg-brand-orange text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Category Filter */}
                                    <div className="flex flex-col gap-3">
                                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest pl-1">Categoria:</span>
                                        <div className="flex flex-wrap items-center gap-1">
                                            {categories.map(c => (
                                                <FilterChip key={c} label={c} active={historyCategory === c} onClick={() => setHistoryCategory(c)} />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Profile Filter */}
                                <div className="flex flex-col gap-3 border-t border-slate-100 pt-6">
                                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest pl-1">Perfil do Treino:</span>
                                    <div className="flex flex-wrap items-center gap-1">
                                        {['Todos', 'Velocidade', 'Fundo', 'Meio Fundo', 'Técnica'].map(p => (
                                            <FilterChip key={p} label={p} active={historyProfile === p} onClick={() => setHistoryProfile(p)} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sessões finalizadas ({allHistory.length})</span>
                        </div>

                        <div className="space-y-4">
                            {allHistory.map((session) => {
                                const isExpanded = expandedHistoryId === session.id;
                                const sessionDate = parseISOToLocalDate(session.date);
                                const day = sessionDate.getDate().toString().padStart(2, '0');
                                const month = (sessionDate.getMonth() + 1).toString().padStart(2, '0');

                                return (
                                    <div key={session.id} className={`bg-white rounded-[32px] border transition-all duration-300 ${isExpanded ? 'border-brand-orange shadow-lg ring-4 ring-brand-orange/5' : 'border-gray-200 shadow-sm hover:shadow-md'}`}>
                                        {/* Card Content - Compact */}
                                        <div
                                            onClick={() => setExpandedHistoryId(isExpanded ? null : session.id)}
                                            className="p-6 cursor-pointer flex flex-col lg:flex-row items-start lg:items-center gap-6"
                                        >
                                            {/* Date Block */}
                                            <div className="flex flex-col items-center justify-center w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 shrink-0">
                                                <span className="text-xl font-black text-gray-400 leading-none">{day}</span>
                                                <span className="text-xs font-bold text-gray-300">{month}</span>
                                            </div>

                                            {/* Info Block */}
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="text-xl font-black text-brand-slate uppercase tracking-tight">{session.workout.title}</h4>
                                                    <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-widest">Finalizado</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                                                    <span className="flex items-center gap-1"><Clock size={14} className="text-gray-300" /> {session.startTime}</span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                    <span className="flex items-center gap-1"><Droplets size={14} className="text-sky-400" /> {session.workout.totalVolume}m Total</span>
                                                </div>
                                            </div>

                                            {/* Right Side Actions */}
                                            <div className="flex items-center gap-6 self-end lg:self-center w-full lg:w-auto justify-between lg:justify-end">
                                                <div className="text-right">
                                                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Atletas</div>
                                                    <div className="text-lg font-black text-brand-slate">{session.attendanceCount} Atletas</div>
                                                </div>
                                                <button
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-brand-orange text-white rotate-180' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                                                >
                                                    <ChevronDown size={20} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded Content */}
                                        {isExpanded && (
                                            <div className="p-8 pt-2 border-t border-gray-100 animate-in slide-in-from-top-4 fade-in duration-300">
                                                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 mt-6">

                                                    {/* Left Col: Execution & Performance */}
                                                    <div className="xl:col-span-8 space-y-6">
                                                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Execução & Performance</h5>

                                                        {session.workout.blocks.map((block, idx) => {
                                                            const evals = session.blockEvaluations[block.id] || [];
                                                            return (
                                                                <div key={block.id} className="bg-white rounded-3xl border border-gray-100 p-6 flex flex-col gap-4 shadow-sm hover:border-gray-200 transition-colors">
                                                                    <div className="flex justify-between items-start">
                                                                        <div className="space-y-1">
                                                                            <span className="text-[9px] font-black text-brand-orange uppercase tracking-widest mb-1 block">Série #{block.order}</span>
                                                                            <h6 className="text-xl font-black text-brand-slate leading-none">{block.exerciseName}</h6>
                                                                            <div className="flex items-center gap-3 mt-2">
                                                                                <span className="text-base font-bold text-slate-700">{block.mainSet}</span>
                                                                                {block.rpe && (
                                                                                    <span className="text-[10px] font-black uppercase text-gray-400 bg-white border border-gray-200 px-2 py-1 rounded-lg tracking-wide shadow-sm">
                                                                                        {block.rpe}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        {evals.length > 0 && (
                                                                            <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded border border-emerald-100 uppercase tracking-widest">{evals.length} Avaliados</span>
                                                                        )}
                                                                    </div>

                                                                    {/* Evaluated Athletes Feedback Grid */}
                                                                    {evals.length > 0 ? (
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                                                            {evals.map(ev => (
                                                                                <div key={ev.athleteId} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                                                                    <span className="text-xs font-bold text-slate-700">{ev.athleteName}</span>
                                                                                    <div className="flex gap-2 text-[9px] font-black uppercase">
                                                                                        <span className="text-gray-400">RPE <b className="text-brand-slate">{ev.rpe}</b></span>
                                                                                        <span className="text-gray-400">EXH <b className="text-brand-slate">{ev.exhaustion}</b></span>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
                                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nenhuma avaliação registrada</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Right Col: Cast (Elenco) */}
                                                    <div className="xl:col-span-4 space-y-6">
                                                        <div>
                                                            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Atletas</h5>
                                                            <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm">
                                                                <div className="flex flex-wrap gap-2 mb-6">
                                                                    {session.attendees.map(id => (
                                                                        <div key={id} className="bg-white px-3 py-2 rounded-xl border border-gray-200 text-[10px] font-black text-slate-600 shadow-sm">
                                                                            {athletes.find(a => String(a.id) === String(id))?.name || 'Atleta'}
                                                                        </div>
                                                                    ))}
                                                                    {session.attendees.length === 0 && (
                                                                        <span className="text-xs text-slate-400 italic font-medium w-full text-center py-4">Nenhum atleta presente</span>
                                                                    )}
                                                                </div>


                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {allHistory.length === 0 && (
                                <div className="py-20 text-center flex flex-col items-center justify-center space-y-4 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-gray-300 shadow-sm border border-gray-100">
                                        <History size={24} />
                                    </div>
                                    <p className="text-gray-400 font-bold text-xs tracking-widest uppercase">Nenhum treino finalizado encontrado.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )
                }
            </div >
        );
    };

    const renderBuilderView = () => (
        <div className="h-full flex flex-col animate-in slide-in-from-right-4 space-y-8 pb-20">
            <header className="flex items-center justify-between bg-white p-6 rounded-3xl border border-gray-200 shadow-sm sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => setViewMode('LIST')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"><ArrowLeft size={24} /></button>
                    <h2 className="text-2xl font-bold text-brand-slate">{builderId ? 'Editar treino planejado' : 'Novo treino planejado'}</h2>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setViewMode('LIST')} className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-50 rounded-xl border border-transparent">Cancelar</button>
                    <button onClick={handleSaveWorkoutPlan} className="bg-brand-orange text-white px-8 py-2.5 rounded-xl font-black shadow-xl hover:scale-105 transition-all uppercase text-xs tracking-widest">Salvar treino</button>
                </div>
            </header>

            <div className="space-y-8 flex-1 overflow-y-auto pr-2">
                <section className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-8">
                    <div>
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Título do treino</label>
                        <input
                            type="text"
                            value={builderTitle}
                            onChange={e => setBuilderTitle(e.target.value)}
                            placeholder="Ex: Treino de resistência aeróbica A2"
                            className="w-full text-4xl font-black text-brand-slate border-b-4 border-gray-50 focus:border-brand-orange bg-transparent outline-none transition-all pb-2"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <label className="text-[11px] font-bold text-gray-400 uppercase mb-2 block">Data da sessão</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                <input type="date" value={builderDate} onChange={e => setBuilderDate(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-lg font-bold focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-all" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-gray-400 uppercase mb-2 block">Categoria</label>
                            <select value={builderCategory} onChange={e => setBuilderCategory(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-lg font-bold focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-all appearance-none pr-12 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[length:1.5em_1.5em] bg-[right_1.5rem_center]">{categories.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c}</option>)}</select>
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-gray-400 uppercase mb-2 block">Perfil</label>
                            <select value={builderProfile} onChange={e => setBuilderProfile(e.target.value as any)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-lg font-bold focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-all appearance-none pr-12 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[length:1.5em_1.5em] bg-[right_1.5rem_center]"><option>Fundo</option><option>Velocidade</option><option>Meio Fundo</option><option>Técnica</option></select>
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Séries planejadas ({builderBlocks.length})</h3>
                        <button onClick={() => { setEditingBlock(null); setShowAddSeriesModal(true); }} className="bg-brand-slate text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-700 transition-all shadow-md">
                            <Plus size={14} /> Adicionar série
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {builderBlocks.map((block, idx) => (
                            <div key={block.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex items-center justify-between group hover:border-brand-orange/30 transition-all">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-orange-50 text-brand-orange rounded-2xl flex items-center justify-center font-black text-xl border border-orange-100">{idx + 1}</div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Série #{block.order}</span>
                                            <span className="text-[10px] font-black bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded uppercase tracking-tighter">{block.rpe}</span>
                                        </div>
                                        <h4 className="font-bold text-xl text-slate-800 leading-none">{block.exerciseName}</h4>
                                        <div className="flex gap-4 text-sm font-bold text-gray-400 mt-3">
                                            <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded border border-gray-100 font-mono text-gray-600">{block.mainSet}</span>
                                            <span className="flex items-center gap-1.5"><Droplets size={14} className="text-sky-500" /> {block.volume}m</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => { setEditingBlock(block); setShowAddSeriesModal(true); }} className="p-3 text-gray-400 hover:text-brand-orange hover:bg-orange-50 rounded-xl transition-all">
                                        <Edit2 size={20} />
                                    </button>
                                    <button onClick={() => setBuilderBlocks(builderBlocks.filter(b => b.id !== block.id))} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={() => { setEditingBlock(null); setShowAddSeriesModal(true); }}
                            className="w-full py-10 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-4 text-gray-400 hover:text-brand-orange hover:border-brand-orange hover:bg-orange-50/20 transition-all duration-300 group"
                        >
                            <div className="p-4 bg-gray-50 rounded-full group-hover:bg-brand-orange/10 transition-colors">
                                <Plus size={32} />
                            </div>
                            <div className="text-center">
                                <span className="font-black uppercase text-xs tracking-widest block mb-1">Nova série</span>
                                <span className="text-xs text-gray-400">Clique para adicionar uma nova série ao plano</span>
                            </div>
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );

    const renderLiveView = () => {
        if (!liveWorkout) return null;
        const presentAthletes = athletes.filter(a => attendance[a.id]);
        const presentCount = Object.values(attendance).filter(Boolean).length;


        return (
            <div className="h-full flex flex-col animate-in slide-in-from-right-4 relative">
                <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex-shrink-0">
                    <div className="flex items-center gap-4"><button onClick={() => navigate('/training')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ChevronLeft size={24} /></button><div><div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span><h2 className="text-xl font-bold text-brand-slate">{liveWorkout.title}</h2></div><div className="text-xs text-gray-500 font-mono">Início: {liveWorkout.time} • {liveWorkout.blocks.length} Séries</div></div></div>
                    <div className="flex gap-3"><button onClick={() => { setEditingBlock(null); setShowAddSeriesModal(true); }} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold border border-blue-100 flex items-center gap-2"><UserPlus size={16} /> Adicionar série</button><button onClick={() => setShowFinishConfirm(true)} className="bg-brand-orange text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-orange-600">Finalizar treino</button></div>
                </div>
                <div className="flex gap-6 h-full overflow-hidden">
                    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-72'}`}>
                        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col gap-2"><div className="flex justify-between items-center">{!isSidebarCollapsed && <h3 className="font-bold text-gray-700">Presentes ({presentCount})</h3>}<button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="text-gray-400 hover:text-brand-orange">{isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}</button></div>{!isSidebarCollapsed && <div className="relative"><Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" /><input type="text" placeholder="Atleta..." value={attendanceSearch} onChange={e => setAttendanceSearch(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 pl-8 text-sm" /></div>}</div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-1">
                            {athletes.filter(a => (liveWorkout.category === 'Geral' || a.category === liveWorkout.category) && a.name.toLowerCase().includes(attendanceSearch.toLowerCase())).map(athlete => (
                                <div key={athlete.id} className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 ${attendance[athlete.id] ? 'bg-orange-50/50' : ''}`}>
                                    <div
                                        onClick={() => setAttendance({ ...attendance, [athlete.id]: !attendance[athlete.id] })}
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${attendance[athlete.id] ? 'bg-brand-orange border-brand-orange text-white' : 'border-gray-300 bg-white'}`}
                                    >
                                        {attendance[athlete.id] && <Check size={12} strokeWidth={4} />}
                                    </div>
                                    {!isSidebarCollapsed && <span className={`flex-1 text-sm font-medium cursor-pointer ${attendance[athlete.id] ? 'text-brand-slate font-bold' : 'text-gray-400'}`} onClick={() => setAttendance({ ...attendance, [athlete.id]: !attendance[athlete.id] })}>{athlete.name}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6 overflow-y-auto pb-20 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-100 pb-8"><IndicatorBox label="Vol acumulado" value={`${calculateBlockStats(liveWorkout.blocks.flatMap(b => b.subdivisions)).volume}m`} /><IndicatorBox label="DDR média" value={calculateBlockStats(liveWorkout.blocks.flatMap(b => b.subdivisions)).ddr} /><IndicatorBox label="DCR média" value={calculateBlockStats(liveWorkout.blocks.flatMap(b => b.subdivisions)).dcr} /></div>
                        <div className="space-y-4">
                            {liveWorkout.blocks.map(block => {
                                const evals = sessionEvaluations[block.id]?.length || 0;
                                const isExpanded = expandedBlockId === block.id;
                                const blockStats = calculateBlockStats(block.subdivisions);
                                return (
                                    <div key={block.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all">
                                        {/* Header */}
                                        <div
                                            className="p-6 cursor-pointer hover:bg-gray-50/50 transition-all"
                                            onClick={() => setExpandedBlockId(isExpanded ? null : block.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 bg-gray-100 text-brand-slate rounded-full flex items-center justify-center font-black text-xl border-2 border-gray-200">{block.order}</div>
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h4 className="font-black text-xl text-brand-slate tracking-tight leading-none">{block.exerciseName}</h4>
                                                            <span className="text-[10px] font-black bg-orange-100 text-brand-orange px-2 py-0.5 rounded uppercase tracking-wide">{block.rpe}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-400 font-medium">{block.mainSet} {block.observations && `— ${block.observations}`}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="text-right hidden xl:block">
                                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Volume</div>
                                                        <div className="text-2xl font-black text-brand-slate">{block.volume}m</div>
                                                    </div>
                                                    <div className="text-right hidden xl:block">
                                                        <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">DDR</div>
                                                        <div className="text-2xl font-black text-emerald-600">{blockStats.ddr}m</div>
                                                    </div>
                                                    <div className="text-right hidden xl:block">
                                                        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">DCR</div>
                                                        <div className="text-2xl font-black text-blue-600">{blockStats.dcr}m</div>
                                                    </div>

                                                    <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelectedBlockEval(block); setShowEvalDrawer(true); }}
                                                            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-sm uppercase tracking-wider ${evals > 0 ? 'bg-white border border-gray-200 text-brand-success' : 'bg-brand-slate text-white hover:bg-slate-700'}`}
                                                        >
                                                            {evals > 0 ? <Check size={14} /> : <ChartBar size={14} />}
                                                            {evals > 0 ? `${evals} Avaliados` : 'Avaliar'}
                                                        </button>
                                                        <div className="text-gray-400 ml-2">
                                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Content */}
                                        {isExpanded && (
                                            <div className="border-t border-gray-100">
                                                {block.subdivisions.length > 0 ? (
                                                    <div className="px-6 py-4">
                                                        <div className="grid grid-cols-6 gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-3 border-b border-gray-100">
                                                            <div>Tipo</div>
                                                            <div>Série x Mts</div>
                                                            <div>Observações</div>
                                                            <div className="text-center">Tempo / Pausa</div>
                                                            <div className="text-center">DA-RE / DA-ER</div>
                                                            <div className="text-right">Base Funcional</div>
                                                        </div>
                                                        {block.subdivisions.map(sub => (
                                                            <div key={sub.id} className="grid grid-cols-6 gap-4 py-4 border-b border-gray-50 last:border-0 items-center hover:bg-gray-50/50 transition-colors rounded-lg px-2 -mx-2">
                                                                <div className={`font-black text-sm ${sub.type === 'DDR' ? 'text-emerald-600' : 'text-blue-600'}`}>{sub.type}</div>
                                                                <div className="font-bold text-brand-slate">{sub.seriesOrder}×{sub.distance}m</div>
                                                                <div className="text-gray-500 italic text-sm">{sub.description || '-'}</div>
                                                                <div className="text-center font-medium text-gray-600">{sub.interval || '-'}s / {sub.pause || '-'}s</div>
                                                                <div className="text-center">
                                                                    <span className="text-brand-orange font-bold">{sub.daRe || '-'}</span>
                                                                    <span className="text-gray-300 mx-1">/</span>
                                                                    <span className="text-gray-500">{sub.daEr || '-'}</span>
                                                                </div>
                                                                <div className="text-right font-bold text-brand-orange uppercase text-xs">{sub.functionalBase || '-'}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="px-6 py-8 text-center text-gray-400 italic">Nenhuma subdivisão cadastrada.</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            <button onClick={() => { setEditingBlock(null); setShowAddSeriesModal(true); }} className="w-full py-6 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-brand-orange hover:border-brand-orange hover:bg-orange-50/30 transition-all"><Plus size={32} /><span className="font-bold uppercase text-xs tracking-widest">Adicionar série</span></button>
                        </div>
                    </div>
                </div>
                {showEvalDrawer && selectedBlockEval && <div className="fixed inset-0 z-[160] bg-black/40 backdrop-blur-sm flex items-end justify-center" onClick={() => setShowEvalDrawer(false)}><SessionEvaluationDrawer block={selectedBlockEval} presentAthletes={presentAthletes} initialEvaluations={sessionEvaluations[selectedBlockEval.id] || []} onSave={(evals) => { handleSaveEvaluations(selectedBlockEval.id, evals); setShowEvalDrawer(false); }} onClose={() => setShowEvalDrawer(false)} /></div>}
            </div>
        );
    };

    return (
        <div className="h-full">
            {viewMode === 'LIST' && renderListView()}
            {viewMode === 'LIVE' && renderLiveView()}
            {viewMode === 'BUILDER' && renderBuilderView()}

            {viewMode === 'DETAILS' && (
                <div className="h-full flex flex-col animate-in slide-in-from-right-4">
                    {/* Header with Actions */}
                    <header className="flex flex-col gap-6 mb-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button onClick={() => navigate('/training')} className="p-2 hover:bg-white rounded-full text-gray-500 hover:text-brand-slate transition-colors">
                                    <ArrowLeft size={24} />
                                </button>
                                <div>
                                    <span className="text-[10px] bg-brand-orange/10 text-brand-orange uppercase font-black px-2 py-1 rounded mb-1 inline-block tracking-widest">Visualizando Treino</span>
                                    <h2 className="text-3xl font-black text-brand-slate uppercase tracking-tight leading-none">{currentWorkout?.title}</h2>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm mr-2">
                                    <button onClick={() => currentWorkout && handleEditWorkout(currentWorkout)} className="p-2 text-gray-400 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition-colors" title="Editar"><Edit2 size={18} /></button>
                                    <button onClick={() => currentWorkout && handleDuplicateWorkout(currentWorkout)} className="p-2 text-gray-400 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition-colors" title="Duplicar"><Copy size={18} /></button>
                                    <button onClick={() => currentWorkout && handleDeleteRequest(currentWorkout.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={18} /></button>
                                </div>
                                <button onClick={() => currentWorkout && handleStartRequest(currentWorkout)} className="bg-brand-slate text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs shadow-xl hover:bg-slate-700 transition-all flex items-center gap-2">
                                    <Play size={14} fill="white" /> Iniciar Agora
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-100 self-start shadow-sm">
                            <button
                                onClick={() => setDetailsTab('TECHNICAL')}
                                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${detailsTab === 'TECHNICAL' ? 'bg-brand-slate text-white shadow-md' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                            >
                                Detalhamento Técnico
                            </button>
                            <button
                                onClick={() => setDetailsTab('HISTORY')}
                                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${detailsTab === 'HISTORY' ? 'bg-brand-slate text-white shadow-md' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                            >
                                Histórico de Execuções
                            </button>
                        </div>
                    </header>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                        {detailsTab === 'TECHNICAL' ? (
                            <div className="space-y-8 pb-8">
                                {/* Summary Card */}
                                <div className="bg-white rounded-[32px] border border-gray-200 p-8 shadow-sm flex flex-wrap gap-12 items-center justify-between">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Volume Total</span>
                                        <span className="text-4xl font-black text-brand-slate">{currentWorkout?.totalVolume}m</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Perfil</span>
                                        <span className="text-2xl font-bold text-brand-slate uppercase">{currentWorkout?.profile}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Categoria</span>
                                        <span className="text-2xl font-bold text-brand-slate uppercase">{currentWorkout?.category}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Planejado para</span>
                                        <span className="text-2xl font-bold text-brand-slate flex items-center gap-2"><Calendar size={20} className="text-brand-orange" /> {currentWorkout?.date}</span>
                                    </div>
                                </div>

                                {/* Blocks List */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Séries do treino ({currentWorkout?.blocks.length})</h4>
                                    {currentWorkout?.blocks.map((block, index) => (
                                        <div key={block.id} className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                                            <div className="flex items-start gap-6 border-b border-gray-50 pb-6 mb-6">
                                                <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange font-black text-xl">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h5 className="text-2xl font-black text-brand-slate uppercase">{block.exerciseName}</h5>
                                                        {block.rpe && <span className="text-[10px] bg-brand-orange/10 text-brand-orange px-2 py-1 rounded font-black uppercase tracking-wide">{block.rpe}</span>}
                                                    </div>
                                                    <p className="text-gray-400 font-medium">{block.mainSet} — {block.observations || 'Sem observações'}</p>
                                                </div>
                                                <div className="text-right flex gap-8">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[9px] font-bold text-gray-300 uppercase">Volume</span>
                                                        <span className="text-xl font-black text-brand-slate">{block.volume}m</span>
                                                    </div>
                                                    {(() => {
                                                        const stats = calculateBlockStats(block.subdivisions);
                                                        return (
                                                            <>
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-[9px] font-bold text-gray-300 uppercase">DDR</span>
                                                                    <span className="text-xl font-black text-emerald-500">{stats.ddr}m</span>
                                                                </div>
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-[9px] font-bold text-gray-300 uppercase">DCR</span>
                                                                    <span className="text-xl font-black text-blue-500">{stats.dcr}m</span>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Subdivisions Table */}
                                            <div className="w-full">
                                                <div className="grid grid-cols-12 gap-4 text-[9px] font-black text-gray-300 uppercase tracking-widest mb-4 px-4">
                                                    <div className="col-span-1">Tipo</div>
                                                    <div className="col-span-2">Série x Mts</div>
                                                    <div className="col-span-4">Observações</div>
                                                    <div className="col-span-2 text-center">Tempo / Pausa</div>
                                                    <div className="col-span-1 text-center">Da-Re / Da-Er</div>
                                                    <div className="col-span-2 text-right">Base Funcional</div>
                                                </div>
                                                <div className="space-y-2">
                                                    {block.subdivisions.map((sub) => (
                                                        <div key={sub.id} className="grid grid-cols-12 gap-4 items-center bg-gray-50/50 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                                            <div className="col-span-1 font-bold text-slate-700">{sub.type}</div>
                                                            <div className="col-span-2 font-black text-brand-slate">{sub.seriesOrder}x{sub.distance}m</div>
                                                            <div className="col-span-4 text-xs font-medium text-gray-500 italic">{sub.description || '-'}</div>
                                                            <div className="col-span-2 text-center text-xs font-bold text-slate-600">{sub.interval || '-'} / {sub.pause || '-'}</div>
                                                            <div className="col-span-1 text-center text-brand-orange font-bold text-xs">{sub.daRe || '-'} <span className="text-gray-300">/</span> <span className="text-blue-400">{sub.daEr || '-'}</span></div>
                                                            <div className="col-span-2 text-right text-[10px] font-bold text-gray-400 uppercase">{sub.functionalBase || '-'}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            // History Tab - Using same layout as General History
                            <div className="space-y-4 pb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <History size={16} className="text-brand-orange" />
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        Histórico de Execuções ({allHistory.filter(h => String((h.workout as any).parent_session_id || h.workout.parentSessionId) === String(currentWorkout?.id)).length})
                                    </span>
                                </div>

                                {allHistory.filter(h => String((h.workout as any).parent_session_id || h.workout.parentSessionId) === String(currentWorkout?.id)).length === 0 ? (
                                    <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                        <History size={48} className="text-gray-200 mx-auto mb-4" />
                                        <p className="text-gray-400 font-bold">Nenhuma execução registrada para este plano.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {allHistory
                                            .filter(h => String((h.workout as any).parent_session_id || h.workout.parentSessionId) === String(currentWorkout?.id))
                                            .map(session => {
                                                const isExpanded = expandedHistoryId === session.id;
                                                const sessionDate = parseISOToLocalDate(session.date);
                                                const day = sessionDate.getDate().toString().padStart(2, '0');
                                                const month = (sessionDate.getMonth() + 1).toString().padStart(2, '0');
                                                const year = sessionDate.getFullYear();

                                                return (
                                                    <div key={session.id} className={`bg-white rounded-[32px] border transition-all duration-300 ${isExpanded ? 'border-brand-orange shadow-lg ring-4 ring-brand-orange/5' : 'border-gray-200 shadow-sm hover:shadow-md'}`}>
                                                        {/* Card Header */}
                                                        <div
                                                            onClick={() => setExpandedHistoryId(isExpanded ? null : session.id)}
                                                            className="p-6 cursor-pointer flex flex-col lg:flex-row items-start lg:items-center gap-6"
                                                        >
                                                            {/* Date Block */}
                                                            <div className="flex flex-col items-center justify-center w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 shrink-0">
                                                                <span className="text-xl font-black text-gray-400 leading-none">{day}</span>
                                                                <span className="text-xs font-bold text-gray-300">{month}</span>
                                                            </div>

                                                            {/* Info Block */}
                                                            <div className="flex-1 space-y-2">
                                                                <div className="flex items-center gap-3">
                                                                    <h4 className="text-lg font-black text-brand-slate">Sessão em {day}/{month}/{year}</h4>
                                                                </div>
                                                                <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                                                                    <span className="flex items-center gap-1"><Clock size={14} className="text-gray-300" /> {session.startTime}</span>
                                                                </div>
                                                            </div>

                                                            {/* Right Side */}
                                                            <div className="flex items-center gap-6 self-end lg:self-center">
                                                                <span className="text-[9px] font-black bg-brand-orange/10 text-brand-orange px-3 py-1.5 rounded-full uppercase tracking-widest border border-brand-orange/20">
                                                                    {session.attendanceCount} Atletas na água
                                                                </span>
                                                                <button className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-brand-orange text-white rotate-180' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                                                                    <ChevronDown size={20} strokeWidth={3} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Expanded Content */}
                                                        {isExpanded && (
                                                            <div className="p-8 pt-2 border-t border-gray-100 animate-in slide-in-from-top-4 fade-in duration-300">
                                                                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 mt-6">
                                                                    {/* Left Col: Séries Executadas */}
                                                                    <div className="xl:col-span-7 space-y-6">
                                                                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                                            <Layers size={12} /> Séries Executadas
                                                                        </h5>

                                                                        {session.workout.blocks.map((block) => {
                                                                            const evals = session.blockEvaluations[block.id] || [];
                                                                            return (
                                                                                <div key={block.id} className="bg-white rounded-3xl border border-gray-100 p-6 flex flex-col gap-4 shadow-sm">
                                                                                    <div className="flex justify-between items-start">
                                                                                        <div className="space-y-1">
                                                                                            <span className="text-[9px] font-black text-brand-orange uppercase tracking-widest">Série #{block.order}</span>
                                                                                            <h6 className="text-xl font-black text-brand-slate leading-none">{block.exerciseName}</h6>
                                                                                            <span className="text-base font-bold text-slate-700">{block.mainSet}</span>
                                                                                        </div>
                                                                                        {evals.length > 0 && (
                                                                                            <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded border border-emerald-100 uppercase tracking-widest">
                                                                                                {evals.length} Atletas
                                                                                            </span>
                                                                                        )}
                                                                                    </div>

                                                                                    {/* Evaluated Athletes */}
                                                                                    {evals.length > 0 ? (
                                                                                        <div className="space-y-2 mt-2">
                                                                                            {evals.map(ev => (
                                                                                                <div key={ev.athleteId} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                                                                                    <span className="text-xs font-bold text-slate-700">{ev.athleteName}</span>
                                                                                                    <div className="flex gap-3 text-[9px] font-black uppercase">
                                                                                                        <span className="text-gray-400">RPE <b className="text-brand-orange">{ev.rpe}</b></span>
                                                                                                        <span className="text-gray-300">|</span>
                                                                                                        <span className="text-gray-400">EXH <b className="text-brand-orange">{ev.exhaustion}</b></span>
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
                                                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nenhuma avaliação registrada</p>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>

                                                                    {/* Right Col: Elenco */}
                                                                    <div className="xl:col-span-5 space-y-6">
                                                                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                                            <Users size={12} /> Atletas da Sessão
                                                                        </h5>
                                                                        <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm">
                                                                            <div className="flex flex-wrap gap-2 mb-6">
                                                                                {session.attendees.map(id => (
                                                                                    <div key={id} className="bg-white px-3 py-2 rounded-xl border border-gray-200 text-[10px] font-black text-slate-600 shadow-sm">
                                                                                        {athletes.find(a => String(a.id) === String(id))?.name || 'Atleta'}
                                                                                    </div>
                                                                                ))}
                                                                                {session.attendees.length === 0 && (
                                                                                    <span className="text-xs text-slate-400 italic font-medium w-full text-center py-4">Nenhum atleta presente</span>
                                                                                )}
                                                                            </div>


                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showAddSeriesModal && <AddSeriesModal initialData={editingBlock || undefined} order={editingBlock ? editingBlock.order : (viewMode === 'LIVE' ? (liveWorkout?.blocks.length || 0) + 1 : builderBlocks.length + 1)} onSave={handleAddSeriesToView} onClose={() => { setShowAddSeriesModal(false); setEditingBlock(null); }} />}

            {showStartModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-100">
                        <h3 className="text-xl font-bold text-brand-slate mb-2">Iniciar sessão</h3>
                        <p className="text-xs text-gray-400 mb-6 font-medium">Confirme o horário de início oficial para o registro histórico.</p>
                        <div className="mb-8 text-center"><label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Relógio de início</label><input type="time" value={sessionStartTime} onChange={e => setSessionStartTime(e.target.value)} className="w-full text-4xl font-black text-brand-slate bg-gray-50 p-4 border border-gray-200 rounded-2xl outline-none text-center focus:border-brand-orange transition-all" /></div>
                        <div className="flex gap-3"><button onClick={() => setShowStartModal(false)} className="flex-1 py-4 text-gray-600 font-bold hover:bg-gray-50 rounded-2xl">Cancelar</button><button onClick={confirmStartSession} className="flex-1 py-4 bg-brand-orange text-white font-bold rounded-2xl hover:bg-orange-600 shadow-xl shadow-orange-200">Começar</button></div>
                    </div>
                </div>
            )}

            {showFinishConfirm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center"><CheckCircle2 size={48} className="text-brand-orange mx-auto mb-4" /><h3 className="text-2xl font-bold text-brand-slate mb-2">Finalizar treino?</h3><p className="text-gray-500 mb-8">Todos os dados coletados serão integrados ao histórico de performance.</p><div className="flex gap-3"><button onClick={() => setShowFinishConfirm(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl">Revisar</button><button onClick={handleFinishWorkout} className="flex-1 py-3 bg-brand-orange text-white font-bold rounded-xl hover:bg-orange-600 shadow-lg">Confirmar</button></div></div>
                </div>
            )}

            {showSuccessFeedback && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-brand-slate/90 backdrop-blur-md p-4"><div className="text-center space-y-6 animate-in fade-in zoom-in duration-300"><div className="w-24 h-24 bg-brand-orange rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-orange-500/50"><CheckCircle2 size={48} className="text-white" /></div><h2 className="text-3xl font-black text-white tracking-tight">Treino finalizado!</h2><p className="text-gray-400 max-w-xs mx-auto">Dados processados e já disponíveis no histórico.</p></div></div>
            )}

            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} className="text-red-500" /></div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Excluir treino?</h3>
                        <p className="text-sm text-gray-400 mb-6">Esta ação removerá permanentemente o treino planejado. Não é possível desfazer.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl">Cancelar</button>
                            <button onClick={confirmDeleteWorkout} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg">Excluir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
