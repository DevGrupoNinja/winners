
import React, { useState, useMemo } from 'react';
import { Dumbbell, Calendar, Clock, ChevronRight, Save, Play, Copy, Edit2, Trash2, CheckCircle2, History, List, Users, Search, ChevronLeft, Layout, AlertTriangle, Filter, ArrowLeft, Eye, FileText, Plus, X, User, ChevronDown, ChevronUp, Scale, TrendingUp, Medal, Activity, Timer, Info, Target, Weight } from 'lucide-react';
import { MOCK_ATHLETES, MOCK_GYM_WORKOUTS, MOCK_GYM_TEMPLATES } from '@/constants';
import { GymWorkout, GymTemplate, WorkoutSession, GymExercise, Athlete } from '@/types';

type GymTab = 'AGENDA' | 'LIBRARY' | 'HISTORY';
type ViewMode = 'LIST' | 'LIVE' | 'DETAILS' | 'TEMPLATE_DETAILS';
type LiveTab = 'EXECUTION' | 'SUMMARY';

const FilterChip: React.FC<{ label: string, active: boolean, onClick: () => void }> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${active ? 'bg-brand-orange text-white border-brand-orange' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-orange'}`}
  >
    {label}
  </button>
);

const emptyExercise: GymExercise = {
  id: '',
  name: '',
  executionMode: 'Normal',
  physicalMotorCapacity: 'Força Máxima',
  sets: 3,
  reps: '',
  restInterval: '',
  observation: '',
  targetLoads: ['', '', '']
};

export default function GymPage() {
  const [activeTab, setActiveTab] = useState<GymTab>('AGENDA');
  const [workouts, setWorkouts] = useState<GymWorkout[]>(MOCK_GYM_WORKOUTS);
  const [templates, setTemplates] = useState<GymTemplate[]>(MOCK_GYM_TEMPLATES);
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [currentWorkout, setCurrentWorkout] = useState<GymWorkout | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<GymTemplate | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [startWorkoutRef, setStartWorkoutRef] = useState<GymWorkout | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState('');
  const [liveWorkout, setLiveWorkout] = useState<GymWorkout | null>(null);
  const [liveTab, setLiveTab] = useState<LiveTab>('EXECUTION');
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [gymEvaluations, setGymEvaluations] = useState<Record<string, Record<string, string[]>>>({});
  const [showEvalDrawer, setShowEvalDrawer] = useState(false);
  const [currentEvalExercise, setCurrentEvalExercise] = useState<GymExercise | null>(null);
  const [evalSelectedAthlete, setEvalSelectedAthlete] = useState<string>('');
  const [evalLoads, setEvalLoads] = useState<string[]>([]);
  const [expandedExercises, setExpandedExercises] = useState<Record<string, boolean>>({});
  const [filterCategory, setFilterCategory] = useState<string>('Todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [libraryCategory, setLibraryCategory] = useState<string>('Todos');
  const [librarySearch, setLibrarySearch] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null);
  const [showCreateWorkoutModal, setShowCreateWorkoutModal] = useState(false);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [showUseTemplateModal, setShowUseTemplateModal] = useState(false);
  const [selectedTemplateToUse, setSelectedTemplateToUse] = useState<GymTemplate | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successAction, setSuccessAction] = useState<(() => void) | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Geral');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formBaseTemplateId, setFormBaseTemplateId] = useState('');
  const [formExercises, setFormExercises] = useState<GymExercise[]>([]);

  const handleDetails = (workout: GymWorkout) => { setCurrentWorkout(workout); setViewMode('DETAILS'); };
  const handleTemplateDetails = (template: GymTemplate) => { setCurrentTemplate(template); setViewMode('TEMPLATE_DETAILS'); };

  const handleStartRequest = (workout: GymWorkout) => {
    setStartWorkoutRef(workout);
    setSessionStartTime(workout.time || '08:00');
    setShowStartModal(true);
  };

  const confirmStartSession = () => {
    if (startWorkoutRef) {
      const initialAtt: Record<string, boolean> = {};
      MOCK_ATHLETES.forEach(a => initialAtt[a.id] = true);
      setLiveWorkout({ ...startWorkoutRef, time: sessionStartTime });
      setAttendance(initialAtt);
      setAttendanceSearch('');
      setGymEvaluations({});
      setShowStartModal(false);
      setStartWorkoutRef(null);
      setViewMode('LIVE');
      setLiveTab('EXECUTION');
    }
  };

  const handleDuplicate = (workout: GymWorkout) => {
    const copy: GymWorkout = { ...workout, id: Date.now().toString(), title: `${workout.title} (Cópia)`, history: [] };
    setWorkouts([...workouts, copy]);
  };

  const handleDeleteClick = (id: string) => { setWorkoutToDelete(id); setShowDeleteConfirm(true); };

  const confirmDelete = () => {
    if (workoutToDelete) {
      setWorkouts(workouts.filter(w => w.id !== workoutToDelete));
      if (currentWorkout?.id === workoutToDelete) setViewMode('LIST');
      setWorkoutToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleFinishSession = () => {
    if (!liveWorkout) return;
    const attendees = Object.keys(attendance).filter(id => attendance[id]);
    const newSession: WorkoutSession = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      startTime: sessionStartTime,
      endTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attendanceCount: attendees.length,
      attendees: attendees,
      blockEvaluations: {},
      gymEvaluations: gymEvaluations
    };
    const updatedWorkouts = workouts.map(w => w.id === liveWorkout.id ? { ...w, history: [newSession, ...w.history] } : w);
    setWorkouts(updatedWorkouts);
    setShowFinishConfirm(false);
    setLiveWorkout(null);
    setViewMode('LIST');
    setActiveTab('HISTORY');
  };

  const openEvalDrawer = (exercise: GymExercise) => {
    setCurrentEvalExercise(exercise);
    const firstPresent = MOCK_ATHLETES.find(a => attendance[a.id]);
    if (firstPresent) {
      setEvalSelectedAthlete(firstPresent.id);
      const existing = gymEvaluations[exercise.id]?.[firstPresent.id] || Array(exercise.sets).fill('');
      setEvalLoads(existing);
    } else {
      setEvalSelectedAthlete('');
      setEvalLoads(Array(exercise.sets).fill(''));
    }
    setShowEvalDrawer(true);
  };

  const handleEvalAthleteChange = (athleteId: string) => {
    setEvalSelectedAthlete(athleteId);
    if (currentEvalExercise) {
      const existing = gymEvaluations[currentEvalExercise.id]?.[athleteId] || Array(currentEvalExercise.sets).fill('');
      setEvalLoads(existing);
    }
  };

  const handleLoadChange = (index: number, value: string) => {
    const newLoads = [...evalLoads];
    newLoads[index] = value;
    setEvalLoads(newLoads);
  };

  const saveEvaluation = () => {
    if (currentEvalExercise && evalSelectedAthlete) {
      setGymEvaluations(prev => ({
        ...prev,
        [currentEvalExercise.id]: {
          ...(prev[currentEvalExercise.id] || {}),
          [evalSelectedAthlete]: evalLoads
        }
      }));
      setShowEvalDrawer(false);
    }
  };

  const toggleExerciseExpand = (id: string) => { setExpandedExercises(prev => ({ ...prev, [id]: !prev[id] })); };

  const openCreateWorkoutModal = () => {
    setFormTitle('');
    setFormCategory('Geral');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTime('08:00');
    setFormBaseTemplateId('');
    setFormExercises([{ ...emptyExercise, id: Date.now().toString() }]);
    setShowCreateWorkoutModal(true);
  };

  const handleBaseTemplateChange = (templateId: string) => {
    setFormBaseTemplateId(templateId);
    const t = templates.find(temp => temp.id === templateId);
    if (t) {
      setFormExercises(t.exercises.map(ex => ({ ...ex, id: Date.now().toString() + Math.random() })));
      setFormCategory(t.category);
      if (!formTitle) setFormTitle(t.title);
    }
  };

  const saveNewWorkout = () => {
    const newWorkout: GymWorkout = {
      id: Date.now().toString(),
      title: formTitle || 'Novo Treino',
      category: formCategory,
      date: formDate,
      time: formTime,
      sourceTemplateName: templates.find(t => t.id === formBaseTemplateId)?.title,
      exercises: formExercises.filter(e => e.name.trim() !== ''),
      history: []
    };
    setWorkouts([newWorkout, ...workouts]);
    setShowCreateWorkoutModal(false);
  };

  const openCreateTemplateModal = () => {
    setFormTitle('');
    setFormCategory('Geral');
    setFormExercises([{ ...emptyExercise, id: Date.now().toString() }]);
    setShowCreateTemplateModal(true);
  };

  const saveNewTemplate = () => {
    const newTemplate: GymTemplate = {
      id: Date.now().toString(),
      title: formTitle || 'Novo Modelo',
      category: formCategory,
      author: 'Coach Carlos',
      lastUpdated: new Date().toISOString().split('T')[0],
      exercises: formExercises.filter(e => e.name.trim() !== ''),
      observations: ''
    };
    setTemplates([...templates, newTemplate]);
    setShowCreateTemplateModal(false);
  };

  const handleUseTemplate = (template: GymTemplate) => {
    setSelectedTemplateToUse(template);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTime('08:00');
    setShowUseTemplateModal(true);
  };

  const confirmUseTemplate = () => {
    if (selectedTemplateToUse) {
      const newWorkout: GymWorkout = {
        id: Date.now().toString(),
        title: selectedTemplateToUse.title,
        category: selectedTemplateToUse.category,
        sourceTemplateName: selectedTemplateToUse.title,
        date: formDate,
        time: formTime,
        exercises: selectedTemplateToUse.exercises.map(ex => ({ ...ex })),
        history: []
      };
      setWorkouts([newWorkout, ...workouts]);
      setShowUseTemplateModal(false);
      setSuccessMessage('Preparação física programada com sucesso!');
      setSuccessAction(() => { setCurrentWorkout(newWorkout); setActiveTab('AGENDA'); setViewMode('DETAILS'); setShowSuccessModal(false); });
      setShowSuccessModal(true);
    }
  };

  const updateExercise = (id: string, field: keyof GymExercise, value: any) => {
    setFormExercises(formExercises.map(ex => {
      if (ex.id === id) {
        const updated = { ...ex, [field]: value };
        if (field === 'sets') {
          const numSets = Math.max(1, parseInt(value) || 0);
          const newTargetLoads = [...(ex.targetLoads || [])];
          while (newTargetLoads.length < numSets) newTargetLoads.push('');
          updated.targetLoads = newTargetLoads.slice(0, numSets);
        }
        return updated;
      }
      return ex;
    }));
  };

  const updateTargetLoad = (exerciseId: string, setIndex: number, value: string) => {
    setFormExercises(formExercises.map(ex => {
      if (ex.id === exerciseId) {
        const loads = [...(ex.targetLoads || [])];
        loads[setIndex] = value;
        return { ...ex, targetLoads: loads };
      }
      return ex;
    }));
  };

  const addExerciseRow = () => { setFormExercises([...formExercises, { ...emptyExercise, id: Date.now().toString() }]); };
  const removeExerciseRow = (id: string) => { setFormExercises(formExercises.filter(ex => ex.id !== id)); };

  const ExerciseFormList = () => (
    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
      {formExercises.map((ex, idx) => (
        <div key={ex.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative group hover:border-brand-slate/20 transition-all">
          <button onClick={() => removeExerciseRow(ex.id)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={18} /></button>

          <div className="mb-5">
            <label className="text-[10px] font-black text-gray-400 tracking-widest mb-1.5 block">Exercício</label>
            <input type="text" value={ex.name} onChange={(e) => updateExercise(ex.id, 'name', e.target.value)} placeholder="Nome do exercício" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-brand-slate focus:border-brand-slate focus:bg-white outline-none transition-all shadow-sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
            <div>
              <label className="text-[10px] font-black text-gray-400 tracking-widest mb-1.5 block whitespace-nowrap overflow-hidden text-ellipsis">C. Físico-Motriz</label>
              <select value={ex.physicalMotorCapacity} onChange={(e) => updateExercise(ex.id, 'physicalMotorCapacity', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-xs font-bold text-brand-slate focus:border-brand-slate focus:bg-white outline-none transition-all shadow-sm">
                <option>Força Máxima</option>
                <option>Força Rápida</option>
                <option>Força Explosiva</option>
                <option>Força Resistência</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 tracking-widest mb-1.5 block">Séries</label>
              <input type="number" min="1" value={ex.sets} onChange={(e) => updateExercise(ex.id, 'sets', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-brand-slate focus:border-brand-slate focus:bg-white outline-none transition-all shadow-sm" />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 tracking-widest mb-1.5 block">Execuções</label>
              <input type="text" value={ex.reps} onChange={(e) => updateExercise(ex.id, 'reps', e.target.value)} placeholder="Ex: 12 ou 30s" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-brand-slate focus:border-brand-slate focus:bg-white outline-none transition-all shadow-sm" />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 tracking-widest mb-1.5 block">Intervalo</label>
              <input type="text" value={ex.restInterval} onChange={(e) => updateExercise(ex.id, 'restInterval', e.target.value)} placeholder="Ex: 60s" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-brand-slate focus:border-brand-slate focus:bg-white outline-none transition-all shadow-sm" />
            </div>
          </div>

          <div className="mb-5 bg-slate-50/50 p-4 rounded-xl border border-gray-100">
            <label className="text-[10px] font-black text-brand-slate tracking-widest mb-3 block">Meta Relativa por Série (% Peso Corp.)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Array.from({ length: ex.sets }).map((_, sIdx) => (
                <div key={sIdx} className="flex flex-col">
                  <span className="text-[9px] text-gray-400 font-black mb-1">{sIdx + 1}ª Série</span>
                  <input
                    type="text"
                    placeholder="Ex: 85%"
                    value={ex.targetLoads?.[sIdx] || ''}
                    onChange={(e) => updateTargetLoad(ex.id, sIdx, e.target.value)}
                    className="bg-white border border-gray-200 rounded-lg px-2 py-2 text-xs text-center font-black text-brand-slate focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-all"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 tracking-widest mb-1.5 block">Observação</label>
            <input type="text" value={ex.observation} onChange={(e) => updateExercise(ex.id, 'observation', e.target.value)} placeholder="Detalhes técnicos, cadência, etc." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 focus:border-brand-slate focus:bg-white outline-none transition-all shadow-sm" />
          </div>
        </div>
      ))}
      <button onClick={addExerciseRow} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-black tracking-widest text-[11px] hover:border-brand-orange hover:text-brand-orange hover:bg-orange-50/20 transition-all flex items-center justify-center gap-3">
        <div className="p-1 bg-gray-100 rounded-full transition-colors group-hover:bg-brand-orange/10"><Plus size={18} /></div>
        Adicionar Exercício
      </button>
    </div>
  );

  const renderAgendaList = () => {
    const today = new Date().toISOString().split('T')[0];
    const filtered = workouts.filter(w => {
      const matchesCategory = filterCategory === 'Todos' || w.category === filterCategory;
      const matchesStart = !startDate || w.date >= startDate;
      const matchesEnd = !endDate || w.date <= endDate;
      return matchesCategory && matchesStart && matchesEnd;
    });
    const sorted = filtered.sort((a, b) => {
      const isTodayA = a.date === today; const isTodayB = b.date === today;
      if (isTodayA && !isTodayB) return -1; if (!isTodayA && isTodayB) return 1;
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`).getTime(); const dateB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
      const now = new Date().getTime();
      if (isTodayA && isTodayB) return dateA - dateB;
      const isFutureA = dateA > now; const isFutureB = dateB > now;
      if (isFutureA && !isFutureB) return -1; if (!isFutureA && isFutureB) return 1;
      if (isFutureA && isFutureB) return dateA - dateB;
      return dateB - dateA;
    });

    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-bold">Período:</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1 focus:border-brand-orange outline-none" />
            <span className="text-gray-300">-</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1 focus:border-brand-orange outline-none" />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-gray-400 font-bold whitespace-nowrap">Categoria:</span>
            {['Todos', 'Geral', 'Infantil', 'Petiz'].map(c => <FilterChip key={c} label={c} active={filterCategory === c} onClick={() => setFilterCategory(c)} />)}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map(workout => {
            const isToday = workout.date === today;
            return (
              <div key={workout.id} className={`bg-white rounded-2xl shadow-sm border p-6 transition-all group relative flex flex-col h-full ${isToday ? 'border-brand-orange ring-1 ring-brand-orange/10' : 'border-gray-200 hover:shadow-md'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      {isToday && <span className="text-[10px] font-black bg-brand-orange text-white px-2.5 py-1 rounded tracking-widest">Hoje</span>}
                      <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2.5 py-1 rounded tracking-widest">{workout.category}</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 leading-tight group-hover:text-brand-orange transition-colors">{workout.title}</h3>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleDuplicate(workout)} className="p-2 text-gray-400 hover:text-brand-slate hover:bg-gray-100 rounded-lg"><Copy size={16} /></button>
                    <button onClick={() => handleDeleteClick(workout.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-slate-500">
                  <div className="flex items-center gap-2"><Calendar size={16} className="text-gray-400" /><span className="text-sm font-bold font-mono tracking-tight">{workout.date}</span></div>
                  {workout.time && (<div className="flex items-center gap-2"><Clock size={16} className="text-gray-400" /><span className="text-sm font-bold font-mono tracking-tight">{workout.time}</span></div>)}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50 flex-1">
                  {workout.sourceTemplateName && (<div className="flex items-start gap-2 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100"><FileText size={14} className="text-slate-400 mt-0.5 flex-shrink-0" /><div><span className="text-[10px] font-bold text-slate-400 block leading-none mb-1">Base</span><span className="text-xs font-bold text-slate-600">{workout.sourceTemplateName}</span></div></div>)}
                  <div className="space-y-2.5">
                    {workout.exercises.slice(0, 3).map(ex => (
                      <div key={ex.id} className="flex justify-between items-center bg-gray-50/50 p-2 rounded-lg border border-transparent">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 truncate text-sm">{ex.name}</span>
                          <span className="text-[9px] text-gray-400 font-bold">{ex.physicalMotorCapacity}</span>
                        </div>
                        <span className="font-mono font-bold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-100 text-[11px]">{ex.sets}x{ex.reps}</span>
                      </div>
                    ))}
                    {workout.exercises.length > 3 && (<div className="text-center"><span className="text-[10px] font-bold text-gray-400 tracking-widest">+ {workout.exercises.length - 3} exercícios no plano</span></div>)}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                  <button onClick={() => handleDetails(workout)} className="text-sm font-bold text-slate-400 hover:text-brand-slate flex items-center gap-2 transition-colors"><Eye size={18} /> Ver Detalhes</button>
                  <button onClick={() => handleStartRequest(workout)} className="bg-brand-slate hover:bg-slate-700 text-white px-5 py-2 rounded-xl text-sm font-black flex items-center gap-2 transition-all shadow-lg hover:translate-y-[-2px]"><Play size={16} fill="white" /> Iniciar</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLibrary = () => {
    const filtered = templates.filter(t => {
      const matchesCategory = libraryCategory === 'Todos' || t.category === libraryCategory;
      const matchesSearch = t.title.toLowerCase().includes(librarySearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar modelos..."
              value={librarySearch}
              onChange={(e) => setLibrarySearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-brand-orange outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-bold">Categoria:</span>
            {['Todos', 'Geral', 'Infantil', 'Petiz'].map(c => (
              <FilterChip key={c} label={c} active={libraryCategory === c} onClick={() => setLibraryCategory(c)} />
            ))}
          </div>
          <button onClick={openCreateTemplateModal} className="bg-brand-orange text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus size={16} /> Novo Modelo</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(template => (
            <div key={template.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-all group flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded tracking-widest">{template.category}</span>
                  <h3 className="text-xl font-bold text-slate-800 mt-2">{template.title}</h3>
                </div>
                <div className="p-2 bg-blue-50 text-blue-500 rounded-xl"><FileText size={20} /></div>
              </div>
              <p className="text-xs text-slate-400 mb-4 flex items-center gap-1"><User size={12} /> {template.author} • Atualizado em {template.lastUpdated}</p>
              <div className="space-y-2 flex-1">
                {template.exercises.slice(0, 3).map(ex => (
                  <div key={ex.id} className="text-xs font-medium text-slate-600 flex justify-between">
                    <span>{ex.name}</span>
                    <span className="text-slate-400">{ex.sets}x{ex.reps}</span>
                  </div>
                ))}
                {template.exercises.length > 3 && <p className="text-[10px] text-slate-400 italic">+{template.exercises.length - 3} exercícios</p>}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                <button onClick={() => handleTemplateDetails(template)} className="text-xs font-bold text-slate-400 hover:text-brand-slate flex items-center gap-1"><Eye size={14} /> Detalhes</button>
                <button onClick={() => handleUseTemplate(template)} className="bg-brand-slate text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-700">Usar Modelo</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    const allHistory = workouts.flatMap(w => (w.history || []).map(s => ({ ...s, workout: w })))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <div className="space-y-4 animate-in fade-in">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-gray-50/50 p-6 border-b border-gray-100 flex justify-between items-center">
            <div><h3 className="text-lg font-bold text-brand-slate">Histórico de Sessões</h3><p className="text-xs text-gray-500">Acompanhamento das cargas e presenças.</p></div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-2 text-xs font-bold text-gray-600 shadow-sm"><Activity size={14} className="text-brand-orange" /> {allHistory.length} Sessões</div>
          </div>
          <div className="divide-y divide-gray-100">
            {allHistory.map((session) => (
              <div key={session.id} className="p-4 hover:bg-gray-50/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-2 rounded-xl border border-gray-200"><Dumbbell size={18} className="text-brand-orange" /></div>
                    <div>
                      <h4 className="font-bold text-slate-800">{session.workout.title}</h4>
                      <div className="flex gap-3 text-xs text-gray-400"><span>{session.date}</span><span>•</span><span className="font-mono">{session.startTime} - {session.endTime}</span></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right"><div className="text-sm font-black text-brand-slate">{session.attendanceCount}</div><div className="text-[10px] font-bold text-gray-400">Atletas</div></div>
                    <button className="p-2 text-gray-400 hover:text-brand-orange"><Eye size={18} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDetails = () => {
    if (!currentWorkout) return null;
    return (
      <div className="max-w-4xl mx-auto animate-in slide-in-from-right-4 h-full flex flex-col">
        <div className="mb-6 border-b border-gray-200 pb-2 sticky top-0 bg-brand-bg z-10 pt-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setViewMode('LIST')} className="p-2 hover:bg-white rounded-full transition-colors text-gray-500"><ArrowLeft size={24} /></button>
              <div>
                <div className="flex items-center gap-2 mb-1"><h2 className="text-2xl font-bold text-brand-slate">{currentWorkout.title}</h2><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-orange/10 text-brand-orange">{currentWorkout.category}</span></div>
                <div className="flex items-center gap-4 text-sm text-gray-500"><span className="flex items-center gap-1 font-mono tracking-tight"><Calendar size={14} /> {currentWorkout.date}</span>{currentWorkout.sourceTemplateName && <span className="flex items-center gap-1 text-gray-400 font-bold text-[10px]"><FileText size={14} /> Base: {currentWorkout.sourceTemplateName}</span>}</div>
              </div>
            </div>
            <button onClick={() => handleStartRequest(currentWorkout)} className="bg-brand-slate hover:bg-slate-700 text-white px-5 py-2 rounded-lg font-bold shadow-md flex items-center gap-2 ml-4"><Play size={16} fill="white" /> Iniciar Sessão</button>
          </div>
        </div>
        <div className="space-y-4 pb-10">
          {currentWorkout.exercises.map((ex, idx) => (
            <div key={ex.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div><h3 className="text-lg font-bold text-slate-800 flex items-center gap-3"><span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-orange text-white text-xs">{idx + 1}</span>{ex.name}</h3>{ex.observation && <p className="text-sm text-gray-500 mt-1 ml-9 italic">"{ex.observation}"</p>}</div>
                <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-bold">{ex.physicalMotorCapacity}</div>
              </div>
              <div className="grid grid-cols-4 gap-4 ml-9">
                <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-100"><span className="block text-[10px] text-gray-400 font-bold">Séries</span><span className="text-lg font-bold text-slate-700">{ex.sets}</span></div>
                <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-100"><span className="block text-[10px] text-gray-400 font-bold">Execuções</span><span className="text-lg font-bold text-slate-700">{ex.reps}</span></div>
                <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-100"><span className="block text-[10px] text-gray-400 font-bold">Intervalo</span><span className="text-lg font-bold text-slate-700">{ex.restInterval || '-'}</span></div>
                <div className="bg-orange-50 rounded-lg p-2 text-center border border-orange-100"><span className="block text-[10px] text-brand-orange font-bold">Metas (% Peso)</span><span className="text-xs font-bold text-brand-orange">{ex.targetLoads?.join(' | ') || '-'}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTemplateDetails = () => {
    if (!currentTemplate) return null;
    return (
      <div className="max-w-4xl mx-auto animate-in slide-in-from-right-4 h-full flex flex-col">
        <div className="mb-6 border-b border-gray-200 pb-4 sticky top-0 bg-brand-bg z-10 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setViewMode('LIST')} className="p-2 hover:bg-white rounded-full transition-colors text-gray-500"><ArrowLeft size={24} /></button>
              <div>
                <h2 className="text-2xl font-bold text-brand-slate">{currentTemplate.title}</h2>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span className="bg-slate-100 px-2 py-0.5 rounded font-bold">{currentTemplate.category}</span>
                  <span>Autor: {currentTemplate.author}</span>
                </div>
              </div>
            </div>
            <button onClick={() => handleUseTemplate(currentTemplate)} className="bg-brand-orange text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:bg-orange-600">Agendar este Treino</button>
          </div>
        </div>
        <div className="space-y-4 pb-10">
          {currentTemplate.exercises.map((ex, idx) => (
            <div key={ex.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3"><span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">{idx + 1}</span>{ex.name}</h3>
                <span className="text-[10px] font-black bg-slate-50 text-slate-400 px-2 py-1 rounded">{ex.physicalMotorCapacity}</span>
              </div>
              <div className="grid grid-cols-4 gap-4 ml-9">
                <div className="bg-gray-50 rounded-lg p-2 text-center"><span className="block text-[9px] text-gray-400 font-bold">Séries</span><span className="text-base font-bold text-slate-700">{ex.sets}</span></div>
                <div className="bg-gray-50 rounded-lg p-2 text-center"><span className="block text-[9px] text-gray-400 font-bold">Reps</span><span className="text-base font-bold text-slate-700">{ex.reps}</span></div>
                <div className="bg-gray-50 rounded-lg p-2 text-center"><span className="block text-[9px] text-gray-400 font-bold">Descanso</span><span className="text-base font-bold text-slate-700">{ex.restInterval}</span></div>
                <div className="bg-gray-50 rounded-lg p-2 text-center"><span className="block text-[9px] text-gray-400 font-bold">Metas (% Peso)</span><span className="text-base font-bold text-slate-700">{ex.targetLoads?.join('/') || '-'}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLiveMode = () => {
    if (!liveWorkout) return null;
    const EvaluationDrawer = () => {
      if (!showEvalDrawer || !currentEvalExercise) return null;
      const presentAthletes = MOCK_ATHLETES.filter(a => attendance[a.id]);
      const currentAthlete = MOCK_ATHLETES.find(a => a.id === evalSelectedAthlete);

      return (
        <div className="absolute inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center pointer-events-auto" onClick={() => setShowEvalDrawer(false)}>
          <div className="bg-white w-full max-w-lg h-[85%] sm:h-auto sm:max-h-[90%] rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 flex flex-col animate-in slide-in-from-bottom-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <span className="text-[10px] font-black text-gray-400 tracking-widest">Avaliando Série</span>
                <h3 className="text-2xl font-black text-brand-slate">{currentEvalExercise.name}</h3>
              </div>
              <button onClick={() => setShowEvalDrawer(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-8 pr-1 custom-scrollbar">
              <div>
                <label className="text-[10px] font-black text-gray-500 tracking-widest mb-2 block">Selecionar Atleta</label>
                {presentAthletes.length > 0 ? (
                  <div className="space-y-3">
                    <select
                      value={evalSelectedAthlete}
                      onChange={(e) => handleEvalAthleteChange(e.target.value)}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none font-bold text-slate-700 transition-all appearance-none pr-10 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[length:1.25em_1.25em] bg-[right_1rem_center]"
                    >
                      <option value="" disabled>Escolha um atleta...</option>
                      {presentAthletes.map(a => (<option key={a.id} value={a.id}>{a.name}</option>))}
                    </select>

                    {currentAthlete && (
                      <div className="flex items-center gap-3 bg-blue-50/50 border border-blue-100 p-3 rounded-xl animate-in fade-in zoom-in-95">
                        <Weight size={18} className="text-blue-500" />
                        <div>
                          <span className="text-[10px] font-black text-blue-400 tracking-tighter block leading-none mb-1">Peso Corporal Atual</span>
                          <span className="text-sm font-black text-blue-600">{currentAthlete.bodyWeight} kg</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2 border border-red-100">
                    <AlertTriangle size={18} /> Nenhum atleta presente marcado na lista.
                  </div>
                )}
              </div>

              {evalSelectedAthlete && currentAthlete && (
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 tracking-widest mb-1 block">Registro de Cargas por Série</label>
                  <div className="space-y-4">
                    {Array.from({ length: currentEvalExercise.sets }).map((_, idx) => {
                      const targetLoadRaw = currentEvalExercise.targetLoads?.[idx] || '0%';
                      const targetPercent = parseInt(targetLoadRaw) || 0;
                      const expectedKg = currentAthlete.bodyWeight ? ((targetPercent / 100) * currentAthlete.bodyWeight).toFixed(1) : '--';

                      return (
                        <div key={idx} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 shadow-sm group hover:border-brand-orange/20 transition-all">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-brand-slate text-white flex items-center justify-center text-xs font-black">{idx + 1}</div>
                              <span className="text-[11px] font-black text-brand-slate tracking-widest">{idx + 1}ª Série</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] font-black text-gray-400 block tracking-tighter">Meta Esperada</span>
                              <span className="text-xs font-black text-brand-orange">
                                {targetPercent > 0 ? `${targetPercent}% (${expectedKg}kg)` : 'Carga Livre'}
                              </span>
                            </div>
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Peso realizado (kg)"
                              value={evalLoads[idx] || ''}
                              onChange={(e) => handleLoadChange(idx, e.target.value)}
                              className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:border-brand-orange outline-none font-black text-2xl text-brand-slate transition-all shadow-inner placeholder-gray-300"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 font-bold text-xs uppercase">kg</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={saveEvaluation}
                disabled={!evalSelectedAthlete}
                className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all ${evalSelectedAthlete ? 'bg-brand-slate text-white hover:bg-slate-800 hover:scale-[1.02]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                Salvar Avaliação
              </button>
            </div>
          </div>
        </div>
      );
    };
    const presentCount = Object.values(attendance).filter(Boolean).length;
    const sortedAthletes = [...MOCK_ATHLETES.filter(a => a.name.toLowerCase().includes(attendanceSearch.toLowerCase()))].sort((a, b) => { const attA = attendance[a.id] ? 1 : 0; const attB = attendance[b.id] ? 1 : 0; if (attB !== attA) return attB - attA; return a.name.localeCompare(b.name); });
    return (
      <div className="h-full flex flex-col animate-in slide-in-from-right-4 relative">
        {EvaluationDrawer()}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm gap-4">
          <div className="flex items-center gap-4"><button onClick={() => setViewMode('LIST')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ChevronLeft size={24} /></button><div><div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span><h2 className="text-xl font-bold text-brand-slate">{liveWorkout.title}</h2></div><div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-3 items-center"><span className="flex items-center gap-1"><Calendar size={14} /> {liveWorkout.date}</span><span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-bold text-gray-600">{liveWorkout.category}</span></div></div></div>
          <div className="flex bg-gray-100 p-1 rounded-lg"><button onClick={() => setLiveTab('EXECUTION')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${liveTab === 'EXECUTION' ? 'bg-white text-brand-slate shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Execução</button><button onClick={() => setLiveTab('SUMMARY')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${liveTab === 'SUMMARY' ? 'bg-white text-brand-slate shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Resumo</button></div>
          <button onClick={() => setShowFinishConfirm(true)} className="bg-brand-orange text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-orange-600">Finalizar</button>
        </div>
        {liveTab === 'EXECUTION' && (
          <div className="flex gap-6 h-full overflow-hidden">
            <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-72'}`}>
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col gap-2"><div className="flex justify-between items-center">{!isSidebarCollapsed && <h3 className="font-bold text-gray-700">Presença ({presentCount})</h3>}<button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="text-gray-400 hover:text-brand-orange">{isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}</button></div>{!isSidebarCollapsed && (<div className="relative"><Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" /><input type="text" placeholder="Buscar..." value={attendanceSearch} onChange={(e) => setAttendanceSearch(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-8 pr-3 text-sm focus:outline-none focus:border-brand-orange" /></div>)}</div>
              <div className="overflow-y-auto flex-1 p-2 space-y-1">{sortedAthletes.map(athlete => (<div key={athlete.id} className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors ${attendance[athlete.id] ? 'bg-orange-50/50' : ''}`}><input type="checkbox" checked={!!attendance[athlete.id]} onChange={() => setAttendance({ ...attendance, [athlete.id]: !attendance[athlete.id] })} className="accent-brand-orange w-4 h-4 rounded border-gray-300 cursor-pointer" />{!isSidebarCollapsed && <span className={`flex-1 text-sm font-medium ${attendance[athlete.id] ? 'text-brand-slate' : 'text-gray-400'}`}>{athlete.name}</span>}</div>))}</div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pb-20">{liveWorkout.exercises.map((ex, idx) => (<div key={ex.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"><div className="flex flex-col md:flex-row justify-between items-start mb-4"><div className="flex-1"><div className="flex items-center gap-3 mb-2"><span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-orange text-white text-xs font-bold">{idx + 1}</span><h3 className="text-xl font-bold text-slate-800">{ex.name}</h3><span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-black">{ex.physicalMotorCapacity}</span></div><div className="flex flex-wrap gap-4 mt-3 ml-9"><div className="flex flex-col bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-center min-w-[80px]"><span className="text-[10px] text-gray-400 font-bold">Séries</span><span className="text-xl font-black text-brand-slate">{ex.sets}</span></div><div className="flex flex-col bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-center min-w-[80px]"><span className="text-[10px] text-gray-400 font-bold">Execuções</span><span className="text-xl font-black text-brand-slate">{ex.reps}</span></div><div className="flex flex-col bg-orange-50 border border-orange-100 rounded-lg px-3 py-1.5 text-center min-w-[120px]"><span className="text-[10px] text-brand-orange font-bold">Metas (% Peso)</span><span className="text-sm font-black text-brand-orange">{ex.targetLoads?.join(' | ')}</span></div></div></div><div className="mt-4 md:mt-0"><button onClick={() => openEvalDrawer(ex)} className="bg-brand-slate text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow hover:bg-slate-700 transition-colors flex items-center gap-2"><Scale size={16} /> Avaliar cargas</button></div></div><div className="ml-0 md:ml-9 border-t border-gray-100 pt-3"><button onClick={() => toggleExerciseExpand(ex.id)} className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-brand-orange transition-colors mb-2 w-full">{expandedExercises[ex.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}Previsto vs realizado ({Object.keys(gymEvaluations[ex.id] || {}).length})</button>{expandedExercises[ex.id] && (<div className="space-y-2 bg-gray-50 p-3 rounded-lg animate-in slide-in-from-top-2">{Object.keys(gymEvaluations[ex.id] || {}).length === 0 && <p className="text-xs text-gray-400 italic">Sem registros.</p>}{Object.entries(gymEvaluations[ex.id] || {}).map(([athleteId, loads]) => (<div key={athleteId} className="flex justify-between items-center text-sm border-b border-gray-200 last:border-0 pb-1"><span className="font-medium text-slate-700">{MOCK_ATHLETES.find(a => a.id === athleteId)?.name}</span><div className="flex gap-2 items-center"><span className="text-[9px] text-gray-400 font-black">Meta (%): {ex.targetLoads?.join(' | ')}</span><span className="font-mono font-bold text-brand-slate bg-white px-2 py-0.5 rounded border border-gray-200 text-xs">Real (kg): {(loads as string[]).join(' - ')}</span></div></div>))}</div>)}</div></div>))}</div>
          </div>
        )}
        {liveTab === 'SUMMARY' && (<div className="h-full overflow-y-auto space-y-6"><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm"><span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mb-1"><Users size={12} /> Presentes</span><span className="text-3xl font-black text-brand-slate">{presentCount}</span></div><div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm"><span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mb-1"><TrendingUp size={12} /> Evolução semanal</span><span className="text-3xl font-black text-green-500">12%</span></div><div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm"><span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mb-1"><Weight size={12} /> Tonelagem total</span><span className="text-3xl font-black text-brand-orange">1.2k</span></div><div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm"><span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mb-1"><Medal size={12} /> Performance geral</span><span className="text-3xl font-black text-brand-slate">Alto</span></div></div><div className="bg-white rounded-xl border border-gray-200 p-8 text-center"><Activity size={48} className="mx-auto text-gray-200 mb-4" /><h3 className="text-lg font-bold text-gray-600">Resumo da força</h3><p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">Comparativo de performance em relação ao peso corporal dos atletas.</p></div></div>)}
        {showFinishConfirm && (<div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"><div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center"><div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={32} className="text-brand-orange" /></div><h3 className="text-2xl font-bold text-brand-slate mb-2">Salvar treino?</h3><p className="text-gray-500 mb-8">Todos os dados e cargas previstas vs realizadas serão consolidados.</p><div className="flex gap-3"><button onClick={() => setShowFinishConfirm(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl">Cancelar</button><button onClick={handleFinishSession} className="flex-1 py-3 bg-brand-orange text-white font-bold rounded-xl hover:bg-orange-600 shadow-lg">Confirmar</button></div></div></div>)}
      </div>
    );
  };

  const activeTabClass = "bg-brand-slate text-white shadow-md";
  const inactiveTabClass = "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50";

  return (
    <div className="h-full flex flex-col space-y-6 relative">
      {viewMode === 'LIST' && (
        <>
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-gray-200 pb-6 gap-6">
            <div>
              <h2 className="text-2xl font-bold text-brand-slate mb-2">Preparação Física</h2>
              <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-100 self-start shadow-sm">
                <button
                  onClick={() => setActiveTab('AGENDA')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all tracking-widest ${activeTab === 'AGENDA' ? activeTabClass : inactiveTabClass}`}
                >
                  <List size={14} />
                  Agenda de treinos
                </button>
                <button
                  onClick={() => setActiveTab('LIBRARY')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all tracking-widest ${activeTab === 'LIBRARY' ? activeTabClass : inactiveTabClass}`}
                >
                  <Layout size={14} />
                  Biblioteca base
                </button>
                <button
                  onClick={() => setActiveTab('HISTORY')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all tracking-widest ${activeTab === 'HISTORY' ? activeTabClass : inactiveTabClass}`}
                >
                  <History size={14} />
                  Histórico
                </button>
              </div>
            </div>
            <button onClick={openCreateWorkoutModal} className="bg-brand-orange text-white px-5 py-3 rounded-2xl text-xs flex items-center gap-2 font-black tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 active:scale-95">
              <Plus size={18} />
              Programar Treino
            </button>
          </header>
          <div className="flex-1 overflow-y-auto">{activeTab === 'AGENDA' && renderAgendaList()}{activeTab === 'HISTORY' && renderHistory()}{activeTab === 'LIBRARY' && renderLibrary()}</div>
        </>
      )}
      {viewMode === 'DETAILS' && renderDetails()}
      {viewMode === 'TEMPLATE_DETAILS' && renderTemplateDetails()}
      {viewMode === 'LIVE' && renderLiveMode()}
      {showStartModal && (<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in"><div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"><h3 className="text-xl font-bold text-brand-slate mb-2">Iniciar sessão de força</h3><p className="text-sm text-gray-500 mb-6">Confirme o horário de início da atividade física.</p><div className="mb-6"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Horário</label><input type="time" value={sessionStartTime} onChange={(e) => setSessionStartTime(e.target.value)} className="w-full text-2xl font-mono font-bold p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none text-center" /></div><div className="flex gap-3"><button onClick={() => setShowStartModal(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl">Cancelar</button><button onClick={confirmStartSession} className="flex-1 py-3 bg-brand-orange text-white font-bold rounded-xl hover:bg-orange-600 shadow-lg">Confirmar</button></div></div></div>)}
      {showCreateWorkoutModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-brand-slate">Programar treino</h3>
              <button onClick={() => setShowCreateWorkoutModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={24} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Nome do treino</label>
                  <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-brand-orange outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Categoria</label>
                  <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-brand-orange outline-none">
                    <option>Geral</option>
                    <option>Infantil</option>
                    <option>Petiz</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Data</label>
                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-brand-orange outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Modelo (opcional)</label>
                <select value={formBaseTemplateId} onChange={(e) => handleBaseTemplateChange(e.target.value)} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:border-brand-orange outline-none text-brand-slate">
                  <option value="">Sem modelo...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div className="border-t border-gray-100 pt-6">
                <h4 className="text-sm font-black text-brand-slate mb-5 tracking-widest flex items-center gap-2"><Dumbbell size={18} /> Exercícios</h4>
                {ExerciseFormList()}
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              <button onClick={() => setShowCreateWorkoutModal(false)} className="px-6 py-2.5 text-gray-600 font-bold hover:bg-white rounded-xl transition-colors">Cancelar</button>
              <button onClick={saveNewWorkout} className="px-8 py-2.5 bg-brand-orange text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all">Salvar treino</button>
            </div>
          </div>
        </div>
      )}
      {showUseTemplateModal && (<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in"><div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6"><h3 className="text-xl font-bold text-brand-slate mb-4">Agendar treino de base</h3><div className="space-y-4"><div className="p-3 bg-gray-50 rounded-xl border border-gray-100"><span className="text-[10px] font-bold text-gray-400">Modelo selecionado</span><h4 className="font-bold text-brand-slate">{selectedTemplateToUse?.title}</h4></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-500 mb-1 block">Data</label><input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm" /></div><div><label className="text-xs font-bold text-gray-500 mb-1 block">Horário</label><input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm" /></div></div></div><div className="flex gap-3 mt-8"><button onClick={() => setShowUseTemplateModal(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl">Cancelar</button><button onClick={confirmUseTemplate} className="flex-1 py-3 bg-brand-orange text-white font-bold rounded-xl shadow-lg">Agendar</button></div></div></div>)}

      {showCreateTemplateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-brand-slate">Criar novo modelo</h3>
              <button onClick={() => setShowCreateTemplateModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={24} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Nome do modelo</label>
                  <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ex: Hipertrofia A" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-brand-orange outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Categoria</label>
                  <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-brand-orange outline-none text-brand-slate">
                    <option>Geral</option>
                    <option>Infantil</option>
                    <option>Petiz</option>
                  </select>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-6">
                <h4 className="text-sm font-black text-brand-slate mb-5 tracking-widest flex items-center gap-2"><Dumbbell size={18} /> Exercícios</h4>
                {ExerciseFormList()}
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              <button onClick={() => setShowCreateTemplateModal(false)} className="px-6 py-2.5 text-gray-600 font-bold hover:bg-white rounded-xl transition-colors">Cancelar</button>
              <button onClick={saveNewTemplate} className="px-8 py-2.5 bg-brand-orange text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all">Salvar modelo</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-brand-slate mb-2">Excluir treino?</h3>
            <p className="text-gray-500 mb-8">Esta ação não pode ser desfeita. O registro do treino será removido permanentemente.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-brand-slate mb-2">Sucesso!</h3>
            <p className="text-gray-500 mb-8">{successMessage}</p>
            <button
              onClick={() => {
                if (successAction) successAction();
                setShowSuccessModal(false);
              }}
              className="w-full py-3 bg-brand-slate text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg"
            >
              Ok, entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
