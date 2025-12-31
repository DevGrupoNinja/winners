
import React, { useState, useMemo } from 'react';
import { Play, Copy, Edit2, Plus, Clock, Droplets, ArrowLeft, Check, Users, Trash2, Eye, Filter, X, Sliders, Layers, Calculator, GripVertical, AlertCircle, Calendar, Tag, BarChart3, Search, ChevronLeft, ChevronRight, History, CheckCircle2, List, AlertTriangle, UserPlus, ChartBar, UserCheck, Save, ArrowRight, ChevronDown, ChevronUp, Activity, Target } from 'lucide-react';
import { trainingService } from '@/services/trainingService';
import { athleteService } from '@/services/athleteService';
import { Workout, WorkoutBlock, WorkoutSubdivision, WorkoutSession, SessionEvaluation, Athlete } from '@/types';

type ViewMode = 'LIST' | 'BUILDER' | 'LIVE' | 'DETAILS';
type MainTab = 'PLANS' | 'HISTORY';

// --- Helper Components ---

const FilterChip: React.FC<{ label: string, active: boolean, onClick: () => void }> = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${active ? 'bg-brand-orange text-white border-brand-orange' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-orange'}`}
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
    const totalVolume = subdivisions.reduce((acc, sub) => acc + (sub.distance || 0), 0);
    const ddrVolume = subdivisions.filter(s => s.type === 'DDR').reduce((acc, sub) => acc + (sub.distance || 0), 0);
    const dcrVolume = subdivisions.filter(s => s.type === 'DCR').reduce((acc, sub) => acc + (sub.distance || 0), 0);
    return { volume: totalVolume, ddr: ddrVolume, dcr: dcrVolume };
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

    const handleAddSub = () => {
        if (!subReps || !subMetros) return;
        const newSub: WorkoutSubdivision = {
            id: Date.now().toString(),
            type: subType,
            seriesOrder: parseInt(subReps),
            distance: parseInt(subReps) * parseInt(subMetros),
            description: subObs,
            category: subExerc,
            interval: subTempo,
            pause: subPausa,
            totalDistance: parseInt(subReps) * parseInt(subMetros),
            daRe: subDare,
            daEr: subDaer,
            functionalBase: 'Automático'
        };
        setSubdivisions([...subdivisions, newSub]);
        setSubReps(''); setSubMetros(''); setSubObs(''); setSubExerc(''); setSubTempo(''); setSubPausa(''); setSubDare(''); setSubDaer('');
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
                                <div className="flex flex-col"><span className="text-[10px] font-black text-gray-400 uppercase">Volume</span><span className="text-2xl font-black text-slate-800">{stats.volume}m</span></div>
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
                            <div className="lg:col-span-2"><label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">Base funcional</label><input type="text" readOnly value="Automático" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-[9px] h-11 text-gray-500 italic" /></div>
                        </div>
                        <div className="flex justify-end"><button onClick={handleAddSub} className="bg-slate-700 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-slate-800">Salvar subdivisão</button></div>
                        <div className="overflow-x-auto rounded-2xl border border-gray-200 mt-4 shadow-sm">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-brand-slate text-white font-bold uppercase tracking-widest text-[9px]"><tr><th className="px-4 py-4 text-center">TIPO</th><th className="px-4 py-4 text-center">Série</th><th className="px-4 py-4 text-center">x</th><th className="px-4 py-4 text-center">Mts</th><th className="px-4 py-4">Observações</th><th className="px-4 py-4 text-center">TEMPO</th><th className="px-4 py-4 text-center">PAUSA</th><th className="px-4 py-4 text-center">TOTAL</th><th className="px-4 py-4 text-center">DA-RE</th><th className="px-4 py-4 text-center">DA-ER</th><th className="px-4 py-4 text-center">AÇÃO</th></tr></thead>
                                <tbody className="divide-y divide-gray-100 font-bold">
                                    {subdivisions.map(sub => (
                                        <tr key={sub.id} className={`${sub.type === 'DDR' ? 'bg-[#FFFACD]' : 'bg-[#E0F2FF]'} hover:opacity-90`}>
                                            <td className="px-4 py-3 text-center">{sub.type}</td><td className="px-4 py-3 text-center">{sub.seriesOrder}</td><td className="px-4 py-3 text-center text-gray-400">x</td><td className="px-4 py-3 text-center">{sub.distance / sub.seriesOrder}</td><td className="px-4 py-3">{sub.description || '-'}</td><td className="px-4 py-3 text-center">{sub.interval || '-'}</td><td className="px-4 py-3 text-center">{sub.pause || '-'}</td><td className="px-4 py-3 text-center">{sub.totalDistance}</td><td className="px-4 py-3 text-center text-brand-orange">{sub.daRe}</td><td className="px-4 py-3 text-center">{sub.daEr}</td><td className="px-4 py-3 text-center"><button onClick={() => handleRemoveSub(sub.id)} className="p-1 text-gray-500 hover:text-red-500"><Trash2 size={14} /></button></td>
                                        </tr>
                                    ))}
                                    {subdivisions.length === 0 && <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-400 italic">Nenhuma subdivisão.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                    <button onClick={onClose} className="px-6 py-4 text-gray-500 font-bold">Cancelar</button>
                    <button onClick={handleFinalSave} disabled={subdivisions.length === 0} className="px-10 py-4 bg-brand-orange text-white rounded-2xl font-black uppercase text-sm disabled:bg-gray-200">Concluir</button>
                </div>
            </div>
        </div>
    );
};

// --- Main Module ---

export default function TrainingPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('LIST');
    const [mainTab, setMainTab] = useState<MainTab>('PLANS');
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [athletes, setAthletes] = useState<Athlete[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Data Fetch
    React.useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [workoutsData, athletesData] = await Promise.all([
                    trainingService.getAll(),
                    athleteService.getAll()
                ]);
                setWorkouts(workoutsData);
                setAthletes(athletesData);
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

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
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [showStartModal, setShowStartModal] = useState(false);
    const [startWorkoutRef, setStartWorkoutRef] = useState<Workout | null>(null);
    const [sessionStartTime, setSessionStartTime] = useState('');
    const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

    // Builder States
    const [builderId, setBuilderId] = useState<string | null>(null);
    const [builderTitle, setBuilderTitle] = useState('');
    const [builderDate, setBuilderDate] = useState(new Date().toISOString().split('T')[0]);
    const [builderProfile, setBuilderProfile] = useState<'Fundo' | 'Velocidade' | 'Meio Fundo' | 'Técnica'>('Fundo');
    const [builderCategory, setBuilderCategory] = useState('Geral');
    const [builderBlocks, setBuilderBlocks] = useState<WorkoutBlock[]>([]);

    const handleCreateNew = () => {
        setBuilderId(null);
        setBuilderTitle('');
        setBuilderDate(new Date().toISOString().split('T')[0]);
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

    const confirmDeleteWorkout = () => {
        if (workoutToDelete) {
            setWorkouts(workouts.filter(w => w.id !== workoutToDelete));
            setWorkoutToDelete(null);
            setShowDeleteConfirm(false);
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
                    status: 'Planned', // Or preserve existing status
                });
                setWorkouts(workouts.map(w => w.id === builderId ? updatedWorkout : w));
            } else {
                // Creating new
                const newWorkout = await trainingService.create({
                    title: builderTitle || 'Novo treino',
                    date: builderDate,
                    time: '08:00', // Default, maybe add input
                    profile: builderProfile,
                    category: builderCategory,
                    blocks: builderBlocks
                });
                setWorkouts([newWorkout, ...workouts]);
            }
            setViewMode('LIST');
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar treino");
        }
    };

    const handleStartRequest = (workout: Workout) => {
        setStartWorkoutRef(workout);
        setSessionStartTime(workout.time);
        setShowStartModal(true);
    };

    const confirmStartSession = () => {
        if (startWorkoutRef) {
            setLiveWorkout({ ...startWorkoutRef, time: sessionStartTime });
            const initialAtt: Record<string, boolean> = {};
            athletes.forEach(a => initialAtt[a.id] = true);
            setAttendance(initialAtt);
            setSessionEvaluations({});
            setIsSidebarCollapsed(false);
            setShowStartModal(false);
            setStartWorkoutRef(null);
            setViewMode('LIVE');
        }
    };

    const handleAddSeriesToView = (newBlock: WorkoutBlock) => {
        if (viewMode === 'LIVE') {
            setLiveWorkout(prev => prev ? { ...prev, blocks: [...prev.blocks, newBlock] } : null);
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
            // Ideally backend would have a specific endpoint to finish a session.
            // For now, we update the status to 'Completed'.
            // In a real scenario, we would also POST the session executions/feedbacks.
            // Since our backend service 'update' is simple, let's just mark it completed.
            await trainingService.update(liveWorkout.id, { status: 'Completed' });

            // Reload to reflect changes (history relies on status='Completed' logic or separate history endpoint)
            // But wait, our 'renderListView' still looks at w.history. 
            // If backend doesn't populate 'history' inside the workout object, we rely on 'Completed' workouts acting as history.
            // Let's reload everything.
            const [workoutsData] = await Promise.all([trainingService.getAll()]);
            setWorkouts(workoutsData);

            setShowFinishConfirm(false);
            setShowSuccessFeedback(true);
            setTimeout(() => {
                setShowSuccessFeedback(false);
                setLiveWorkout(null);
                setViewMode('LIST');
                setMainTab('HISTORY');
            }, 2000);
        } catch (error) {
            console.error(error);
            alert("Erro ao finalizar treino");
        }
    };

    // --- Render Functions to fix focus bug ---

    const renderListView = () => {
        const filteredWorkouts = workouts.filter(w => {
            if (w.status === 'Completed') return false; // Hide completed from Plans tab
            const matchesCategory = filterCategory === 'Todos' || w.category === filterCategory;
            const matchesProfile = filterProfile === 'Todos' || w.profile === filterProfile;
            const matchesStart = !startDate || w.date >= startDate;
            const matchesEnd = !endDate || w.date <= endDate;
            return matchesCategory && matchesProfile && matchesStart && matchesEnd;
        });

        // Use 'Completed' workouts as history directly, assuming backend returns them as such.
        // Or if backend returns a list of sessions, map them here.
        // Current logic: workouts.filter(w => w.status === 'Completed')
        const allHistory = workouts.filter(w => w.status === 'Completed').map(w => ({
            id: w.id,
            date: w.date,
            startTime: w.time,
            endTime: w.time, // Should be real end time if backend stored it
            attendanceCount: 0, // Backend needs to populate this
            attendees: [],
            blockEvaluations: {},
            workout: w
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return (
            <div className="space-y-6 animate-in fade-in relative">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col gap-4">
                        <h2 className="text-2xl font-black text-brand-slate tracking-tight">Treinos de natação</h2>
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
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-6">
                            <div className="flex flex-col md:flex-row md:items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400 uppercase font-bold">Período:</span>
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-brand-orange" />
                                    <span className="text-gray-300">-</span>
                                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-brand-orange" />
                                </div>
                                <div className="flex items-center gap-2 overflow-x-auto">
                                    <span className="text-xs text-gray-400 uppercase font-bold whitespace-nowrap">Categoria:</span>
                                    {['Todos', 'Geral', 'Infantil', 'Petiz'].map(c => (
                                        <FilterChip key={c} label={c} active={filterCategory === c} onClick={() => setFilterCategory(c)} />
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 overflow-x-auto">
                                <span className="text-xs text-gray-400 uppercase font-bold whitespace-nowrap">Perfil:</span>
                                {['Todos', 'Velocidade', 'Fundo', 'Meio Fundo', 'Técnica'].map(p => (
                                    <FilterChip key={p} label={p} active={filterProfile === p} onClick={() => setFilterProfile(p)} />
                                ))}
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
                                            <button onClick={() => handleEditWorkout(w)} className="p-2 text-gray-400 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDeleteRequest(w.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-4 py-4 border-t border-b border-gray-50">
                                        <div className="flex flex-col"><span className="text-[10px] text-gray-400 uppercase font-bold">Volume</span><span className="text-lg font-bold text-brand-slate flex items-center gap-1"><Droplets size={14} className="text-sky-500" /> {w.totalVolume}m</span></div>
                                        <div className="flex flex-col"><span className="text-[10px] text-gray-400 uppercase font-bold">Execuções</span><span className="text-sm font-semibold text-gray-700 flex items-center gap-1"><History size={14} className="text-brand-orange" /> {w.history?.length || 0}</span></div>
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                        <button onClick={() => { setCurrentWorkout(w); setViewMode('DETAILS'); }} className="text-sm font-medium text-gray-500 hover:text-brand-slate flex items-center gap-1"><Eye size={16} /> Detalhes</button>
                                        <button onClick={() => handleStartRequest(w)} className="bg-brand-slate hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md"><Play size={14} fill="white" /> Iniciar treino</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {mainTab === 'HISTORY' && (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="bg-gray-50/50 p-6 border-b border-gray-100 flex justify-between items-center">
                                <div><h3 className="text-lg font-bold text-brand-slate">Relatório de sessões realizadas</h3><p className="text-xs text-gray-500">Visão detalhada de execuções passadas.</p></div>
                                <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-2 text-xs font-bold text-gray-600 shadow-sm"><Activity size={14} className="text-brand-orange" /> {allHistory.length} Treinos</div>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {allHistory.map((session) => {
                                    const isExpanded = expandedHistoryId === session.id;
                                    return (
                                        <div key={session.id} className={`${isExpanded ? 'bg-orange-50/10' : 'hover:bg-gray-50/30'}`}>
                                            <div onClick={() => setExpandedHistoryId(isExpanded ? null : session.id)} className="p-4 cursor-pointer flex items-center justify-between">
                                                <div className="flex items-center gap-4"><div className="bg-white p-2 rounded-xl border border-gray-200"><Calendar size={18} className="text-brand-orange" /></div><div><h4 className="font-bold text-slate-800">{session.workout.title}</h4><div className="flex gap-3 text-xs text-gray-400"><span>{session.date}</span><span>•</span><span className="font-mono">{session.startTime} - {session.endTime}</span></div></div></div>
                                                <div className="flex items-center gap-6"><div className="text-right"><div className="text-sm font-black text-brand-slate">{session.attendanceCount}</div><div className="text-[10px] font-bold text-gray-400 uppercase">Presenças</div></div><ChevronDown size={18} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} /></div>
                                            </div>
                                            {isExpanded && (
                                                <div className="p-6 pt-0 border-t border-gray-100 animate-in slide-in-from-top-2">
                                                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                        <div className="space-y-4">
                                                            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Layers size={14} className="text-brand-orange" /> Séries executadas</h5>
                                                            <div className="space-y-3">
                                                                {session.workout.blocks.map(block => {
                                                                    const evals = session.blockEvaluations[block.id] || [];
                                                                    return (
                                                                        <div key={block.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                                                            <div className="flex justify-between items-start border-b border-gray-50 pb-2 mb-2">
                                                                                <div><span className="text-[9px] font-black text-brand-orange uppercase">Série #{block.order}</span><h6 className="font-bold text-sm text-brand-slate">{block.exerciseName}</h6><span className="text-[10px] font-mono text-gray-400">{block.mainSet}</span></div>
                                                                                <div className="text-right text-xs font-black text-brand-success">{evals.length} Atletas</div>
                                                                            </div>
                                                                            <div className="space-y-1.5">
                                                                                {evals.map(e => (
                                                                                    <div key={e.athleteId} className="flex flex-col gap-1 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                                                        <div className="flex justify-between text-xs"><span className="font-bold text-slate-700">{e.athleteName}</span><div className="flex gap-3"><span className="text-gray-500">RPE: <b className="text-brand-orange">{e.rpe}</b></span><span className="text-gray-500">EXH: <b className="text-red-500">{e.exhaustion}</b></span></div></div>
                                                                                        {e.times && <div className="text-[10px] text-gray-400 font-mono">Tempos: {e.times}</div>}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Users size={14} className="text-brand-orange" /> Elenco da sessão</h5>
                                                            <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-2">
                                                                {session.attendees.map(id => <div key={id} className="bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 text-xs font-bold text-gray-600">{athletes.find(a => a.id === id)?.name}</div>)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
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
                            <select value={builderCategory} onChange={e => setBuilderCategory(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-lg font-bold focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-all appearance-none pr-12 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[length:1.5em_1.5em] bg-[right_1.5rem_center]"><option>Geral</option><option>Infantil</option><option>Petiz</option></select>
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

        const EvaluationDrawerContent = () => {
            if (!selectedBlockEval) return null;
            const [checkedAthletes, setCheckedAthletes] = useState<Record<string, boolean>>(() => {
                const initial: Record<string, boolean> = {};
                (sessionEvaluations[selectedBlockEval.id] || []).forEach(e => initial[e.athleteId] = true);
                return initial;
            });
            const [localEvals, setLocalEvals] = useState<Record<string, { rpe: number, exhaustion: number, times: string }>>(() => {
                const initial: Record<string, { rpe: number, exhaustion: number, times: string }> = {};
                (sessionEvaluations[selectedBlockEval.id] || []).forEach(e => { initial[e.athleteId] = { rpe: e.rpe, exhaustion: e.exhaustion, times: e.times || '' }; });
                return initial;
            });
            const handleSave = () => {
                const evalList: SessionEvaluation[] = Object.entries(checkedAthletes).filter(([_, checked]) => checked).map(([athleteId, _]) => ({
                    athleteId, athleteName: athletes.find(a => a.id === athleteId)?.name || 'Atleta',
                    rpe: localEvals[athleteId]?.rpe || 5,
                    exhaustion: localEvals[athleteId]?.exhaustion || 5,
                    times: localEvals[athleteId]?.times || ''
                }));
                handleSaveEvaluations(selectedBlockEval.id, evalList);
            };
            return (
                <div className="bg-white w-full max-w-2xl h-[90%] rounded-t-3xl shadow-2xl p-6 flex flex-col animate-in slide-in-from-bottom-10" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6"><div><h3 className="text-xl font-bold text-brand-slate">Avaliar série: {selectedBlockEval.exerciseName}</h3><p className="text-sm text-gray-500">Marque o atleta para liberar os controles de percepção.</p></div><button onClick={() => setShowEvalDrawer(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button></div>
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
                    <div className="pt-4 border-t border-gray-100"><button onClick={handleSave} className="w-full bg-brand-slate text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"><CheckCircle2 size={18} /> Salvar avaliações</button></div>
                </div>
            );
        };

        return (
            <div className="h-full flex flex-col animate-in slide-in-from-right-4 relative">
                <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex-shrink-0">
                    <div className="flex items-center gap-4"><button onClick={() => setViewMode('LIST')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ChevronLeft size={24} /></button><div><div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span><h2 className="text-xl font-bold text-brand-slate">{liveWorkout.title}</h2></div><div className="text-xs text-gray-500 font-mono">Início: {liveWorkout.time} • {liveWorkout.blocks.length} Séries</div></div></div>
                    <div className="flex gap-3"><button onClick={() => { setEditingBlock(null); setShowAddSeriesModal(true); }} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold border border-blue-100 flex items-center gap-2"><UserPlus size={16} /> Adicionar série</button><button onClick={() => setShowFinishConfirm(true)} className="bg-brand-orange text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-orange-600">Finalizar treino</button></div>
                </div>
                <div className="flex gap-6 h-full overflow-hidden">
                    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-72'}`}>
                        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col gap-2"><div className="flex justify-between items-center">{!isSidebarCollapsed && <h3 className="font-bold text-gray-700">Presentes ({presentCount})</h3>}<button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="text-gray-400 hover:text-brand-orange">{isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}</button></div>{!isSidebarCollapsed && <div className="relative"><Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" /><input type="text" placeholder="Atleta..." value={attendanceSearch} onChange={e => setAttendanceSearch(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 pl-8 text-sm" /></div>}</div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-1">
                            {athletes.filter(a => a.name.toLowerCase().includes(attendanceSearch.toLowerCase())).map(athlete => (
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
                                return (
                                    <div key={block.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row group hover:border-brand-orange/30 transition-all">
                                        <div className={`w-1.5 md:w-1.5 ${evals > 0 ? 'bg-brand-success' : 'bg-brand-slate'}`}></div>
                                        <div className="flex-1 p-5 flex justify-between items-center">
                                            <div><div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-black text-gray-400 uppercase">Série #{block.order}</span><span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase">{block.rpe}</span></div><h4 className="font-bold text-lg text-brand-slate">{block.exerciseName}</h4><div className="flex items-center gap-3 mt-2"><span className="text-xs font-mono font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded border">{block.mainSet}</span><span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><Droplets size={12} /> {block.volume}m</span></div></div>
                                            <div className="flex items-center gap-4">
                                                {evals > 0 && <div className="bg-green-50 text-brand-success px-2.5 py-1 rounded-full text-xs font-bold border border-green-100 flex items-center gap-1"><UserCheck size={14} /> {evals} Avaliados</div>}
                                                <button
                                                    onClick={() => { setSelectedBlockEval(block); setShowEvalDrawer(true); }}
                                                    className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${evals > 0 ? 'bg-gray-100 text-gray-600' : 'bg-brand-slate text-white hover:bg-slate-700'}`}
                                                >
                                                    {evals > 0 ? <Edit2 size={14} /> : <ChartBar size={14} />} {evals > 0 ? 'Ajustar' : 'Avaliar série'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <button onClick={() => { setEditingBlock(null); setShowAddSeriesModal(true); }} className="w-full py-6 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-brand-orange hover:border-brand-orange hover:bg-orange-50/30 transition-all"><Plus size={32} /><span className="font-bold uppercase text-xs tracking-widest">Adicionar série</span></button>
                        </div>
                    </div>
                </div>
                {showEvalDrawer && <div className="fixed inset-0 z-[160] bg-black/40 backdrop-blur-sm flex items-end justify-center" onClick={() => setShowEvalDrawer(false)}>{EvaluationDrawerContent()}</div>}
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
                    <header className="flex items-center gap-4 mb-8"><button onClick={() => setViewMode('LIST')} className="p-2 hover:bg-white rounded-full text-gray-500"><ArrowLeft size={24} /></button><h2 className="text-2xl font-bold text-brand-slate">Detalhamento do plano</h2></header>
                    <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden p-8 flex flex-col gap-8">
                        <div><h3 className="text-3xl font-black text-brand-slate mb-2">{currentWorkout?.title}</h3><div className="flex gap-4 text-sm font-bold text-gray-500 uppercase tracking-widest"><span>{currentWorkout?.date}</span><span>•</span><span className="text-brand-orange">{currentWorkout?.profile}</span></div></div>
                        <div className="space-y-4">{currentWorkout?.blocks.map(block => (<div key={block.id} className="border border-gray-100 rounded-2xl p-6 bg-gray-50/30 flex justify-between items-center"><div><h4 className="font-bold text-slate-800 text-lg">{block.exerciseName}</h4><p className="text-xs text-gray-400 mt-1">{block.mainSet} • {block.volume}m</p></div><span className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-black text-gray-400">{block.rpe}</span></div>))}</div>
                        <button onClick={() => currentWorkout && handleStartRequest(currentWorkout)} className="bg-brand-orange text-white w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-orange-100 mt-auto">Começar treino</button>
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
