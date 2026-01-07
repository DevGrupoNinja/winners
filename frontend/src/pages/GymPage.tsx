
import React, { useState, useMemo, useEffect } from 'react';
import { Dumbbell, Calendar, Clock, ChevronRight, Save, Play, Copy, Edit2, Trash2, CheckCircle2, History, List, Users, Search, ChevronLeft, Layout, AlertTriangle, Filter, ArrowLeft, Eye, FileText, Plus, X, User, ChevronDown, ChevronUp, Scale, TrendingUp, Medal, Activity, Timer, Info, Target, Weight } from 'lucide-react';
import { MOCK_GYM_WORKOUTS, MOCK_GYM_TEMPLATES } from '@/constants';
import { GymWorkout, GymTemplate, WorkoutSession, GymExercise, Athlete, GymFeedback } from '@/types';
import { gymService } from '@/services/gymService';
import { athleteService } from '@/services/athleteService';
import { parseISOToLocalDate, getLocalTodayISO } from '@/lib/utils';

type GymTab = 'AGENDA' | 'LIBRARY' | 'HISTORY';
type ViewMode = 'LIST' | 'LIVE' | 'DETAILS' | 'TEMPLATE_DETAILS';
type LiveTab = 'EXECUTION' | 'SUMMARY';
type TemplateDetailsTab = 'DETAILS' | 'HISTORY';

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
  targetLoads: [0, 0, 0]  // Numeric percentages
};

export default function GymPage() {
  const [activeTab, setActiveTab] = useState<GymTab>('AGENDA');
  const [workouts, setWorkouts] = useState<GymWorkout[]>([]);
  const [templates, setTemplates] = useState<GymTemplate[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
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
  const [filterProfile, setFilterProfile] = useState<string>('Todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedHistoryItems, setExpandedHistoryItems] = useState<Record<string, boolean>>({});
  const [libraryCategory, setLibraryCategory] = useState<string>('Todos');
  const [librarySearch, setLibrarySearch] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null);
  const [showCreateWorkoutModal, setShowCreateWorkoutModal] = useState(false);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successAction, setSuccessAction] = useState<(() => void) | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Geral');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formBaseTemplateId, setFormBaseTemplateId] = useState('');
  const [formExercises, setFormExercises] = useState<GymExercise[]>([]);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateDetailsTab, setTemplateDetailsTab] = useState<TemplateDetailsTab>('DETAILS');
  const [workoutDetailsTab, setWorkoutDetailsTab] = useState<'DETAILS' | 'HISTORY'>('DETAILS');
  const [showDeleteTemplateConfirm, setShowDeleteTemplateConfirm] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [showLiveAddModal, setShowLiveAddModal] = useState(false);
  const [liveAddForm, setLiveAddForm] = useState<GymExercise>({
    id: '',
    name: '',
    sets: 3,
    reps: '10',
    physicalMotorCapacity: 'Força Máxima',
    executionMode: 'Normal',
    restInterval: '60s',
    observation: '',
    targetLoads: [0, 0, 0]
  });

  const loadData = async () => {
    try {
      const [tpls, sess, aths] = await Promise.all([
        gymService.getAllTemplates(),
        gymService.getAllSessions(),
        athleteService.getAll()
      ]);
      setTemplates(tpls);
      setWorkouts(sess);
      setAthletes(aths);
    } catch (error) {
      console.error("Failed to load gym data", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDetails = (workout: GymWorkout) => { setCurrentWorkout(workout); setViewMode('DETAILS'); setWorkoutDetailsTab('DETAILS'); };
  const handleTemplateDetails = (template: GymTemplate) => { setCurrentTemplate(template); setViewMode('TEMPLATE_DETAILS'); };

  const handleStartRequest = (workout: GymWorkout) => {
    setStartWorkoutRef(workout);
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    setSessionStartTime(`${hours}:${minutes}`);
    setShowStartModal(true);
  };

  const confirmStartSession = async () => {
    if (startWorkoutRef) {
      try {
        // 1. Clone the workout plan into a new active session
        const clonedSession = await gymService.startSession(startWorkoutRef.id, sessionStartTime);

        // 2. Set the live workout and navigate
        // The backend now sets the time and status to Active
        const workingSession = clonedSession;

        const initialAtt: Record<string, boolean> = {};
        // Use athletes from state or service instead of mock if available
        // For now adhering to existing pattern if any

        setLiveWorkout(workingSession as GymWorkout);
        setAttendance(initialAtt);
        setAttendanceSearch('');
        setGymEvaluations({});
        setShowStartModal(false);
        setStartWorkoutRef(null);
        setViewMode('LIVE');
        setLiveTab('EXECUTION');
        loadData();
      } catch (error) {
        console.error("Failed to start gym session:", error);
      }
    }
  };


  const handleDeleteClick = (id: string) => { setWorkoutToDelete(id); setShowDeleteConfirm(true); };

  const confirmDelete = async () => {
    if (workoutToDelete) {
      try {
        await gymService.deleteSession(workoutToDelete);
        loadData();
        if (currentWorkout?.id === workoutToDelete) setViewMode('LIST');
        setWorkoutToDelete(null);
        setShowDeleteConfirm(false);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleAddLiveExercise = () => {
    if (!liveWorkout || !liveAddForm.name) return;

    const newExId = `temp-${Date.now()}`;
    const newEx: GymExercise = {
      ...liveAddForm,
      id: newExId
    };

    setLiveWorkout({
      ...liveWorkout,
      exercises: [...liveWorkout.exercises, newEx]
    });

    setGymEvaluations(prev => ({
      ...prev,
      [newExId]: {}
    }));

    setShowLiveAddModal(false);
    setLiveAddForm({ ...emptyExercise, sets: 3, reps: '10' });
  };

  const handleFinishSession = async () => {
    if (!liveWorkout) return;

    try {
      // 1. Create feedbacks for each athlete (BEFORE updating status)
      const attendees = Object.keys(attendance).filter(id => attendance[id]);

      // Group evaluations by athlete
      const athleteEvaluations: Record<string, any> = {};
      attendees.forEach(athleteId => {
        athleteEvaluations[athleteId] = {
          performedLoads: {},
          notes: ''
        };
      });

      // Fill performedLoads from gymEvaluations
      Object.keys(gymEvaluations).forEach(exerciseId => {
        const exerciseName = liveWorkout.exercises.find(e => e.id === exerciseId)?.name || exerciseId;
        const athEvals = gymEvaluations[exerciseId];
        if (athEvals) {
          Object.keys(athEvals).forEach(athleteId => {
            if (athleteEvaluations[athleteId]) {
              // Parse strings to numbers
              const loads = athEvals[athleteId].map(v => parseFloat(v) || 0);
              athleteEvaluations[athleteId].performedLoads[exerciseName] = loads;
            }
          });
        }
      });

      // Send Feedback for each attendee
      await Promise.all(attendees.map(athleteId => {
        const evalData = athleteEvaluations[athleteId];
        return gymService.createFeedback(liveWorkout.id, {
          athleteId: parseInt(athleteId),
          performedLoads: evalData.performedLoads,
          attendance: 'Present',
          notes: ''
        });
      }));

      // 2. Update session status to Completed
      await gymService.updateSession({ ...liveWorkout, status: 'Completed' });

      loadData();
      setShowFinishConfirm(false);
      setLiveWorkout(null);
      setViewMode('LIST');
      setActiveTab('HISTORY');
    } catch (error) {
      console.error("Error finishing session", error);
    }
  };

  const openEvalDrawer = (exercise: GymExercise) => {
    setCurrentEvalExercise(exercise);
    const firstPresent = athletes.find(a => attendance[a.id]);
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
    setEditingWorkoutId(null);
    setFormTitle('');
    setFormCategory('Geral');
    setFormDate(getLocalTodayISO());
    setFormTime(null as any); // Reset to null
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

  const saveNewWorkout = async () => {
    const workoutData: GymWorkout = {
      id: editingWorkoutId || Date.now().toString(),
      title: formTitle || 'Novo Treino',
      category: formCategory,
      date: formDate,
      sourceTemplateName: formBaseTemplateId ? templates.find(t => t.id === formBaseTemplateId)?.title : undefined,
      exercises: formExercises.filter(e => e.name.trim() !== ''),
      history: [],
      status: 'Planned',
      parent_session_id: undefined, // Reset parent session if editing
      time: null // Explicitly null for planned workouts
    };

    try {
      if (editingWorkoutId) {
        await gymService.updateSession(workoutData);
        setSuccessMessage('Treino atualizado com sucesso!');
        // Update currentWorkout if we are viewing it
        if (currentWorkout && currentWorkout.id === editingWorkoutId) {
          setCurrentWorkout(workoutData);
        }
      } else {
        const createdSession = await gymService.createSession(workoutData, formBaseTemplateId || undefined);
        setCurrentWorkout(createdSession);
        setSuccessMessage('Treino agendado com sucesso!');
        setActiveTab('AGENDA');
        setViewMode('DETAILS');
      }
      loadData();
      setShowCreateWorkoutModal(false);
      setEditingWorkoutId(null);
    } catch (error) {
      console.error(error);
    }
  };

  const openEditWorkoutModal = (workout: GymWorkout) => {
    setEditingWorkoutId(workout.id);
    setFormTitle(workout.title);
    setFormCategory(workout.category);
    setFormDate(workout.date.toString()); // Ensure string format
    setFormBaseTemplateId(''); // Can't easily link back to template ID if not stored, but sourceTemplateName exists
    // If sourceTemplateName matches a template, we could try to find it, but for now leave empty or try find
    const matchingTemplate = templates.find(t => t.title === workout.sourceTemplateName);
    if (matchingTemplate) setFormBaseTemplateId(matchingTemplate.id.toString());

    setFormExercises(workout.exercises.map(ex => ({ ...ex, id: ex.id || Date.now().toString() + Math.random() })));
    setShowCreateWorkoutModal(true);
  };

  const handleDuplicate = async (workout: GymWorkout) => {
    const duplicatedWorkout: GymWorkout = {
      ...workout,
      id: Date.now().toString(),
      title: `${workout.title} (Cópia)`,
      status: 'Planned',
      time: null, // Reset time for planned workout
      history: [],
      date: getLocalTodayISO(), // Default to today
      exercises: workout.exercises.map(ex => ({ ...ex, id: Date.now().toString() + Math.random() })) // New IDs for exercises
    };

    try {
      await gymService.createSession(duplicatedWorkout);
      setSuccessMessage('Treino duplicado com sucesso!');
      setShowSuccessModal(true);
      loadData();
    } catch (error) {
      console.error("Error duplicating workout", error);
    }
  };

  const openCreateTemplateModal = () => {
    setEditingTemplateId(null);
    setFormTitle('');
    setFormCategory('Geral');
    setFormExercises([{ ...emptyExercise, id: Date.now().toString() }]);
    setShowCreateTemplateModal(true);
  };

  const openEditTemplateModal = (template: GymTemplate) => {
    setEditingTemplateId(template.id);
    setFormTitle(template.title);
    setFormCategory(template.category);
    setFormExercises(template.exercises.map(ex => ({ ...ex, id: ex.id || Date.now().toString() + Math.random() })));
    setShowCreateTemplateModal(true);
  };

  const saveTemplate = async () => {
    const templateData: GymTemplate = {
      id: editingTemplateId || Date.now().toString(),
      title: formTitle || 'Novo Modelo',
      category: formCategory,
      exercises: formExercises.filter(e => e.name.trim() !== ''),
      author: 'Coach',
      lastUpdated: getLocalTodayISO()
    };

    try {
      let savedResult: GymTemplate;
      if (editingTemplateId) {
        savedResult = await gymService.updateTemplate(templateData);
        setSuccessMessage('Modelo atualizado com sucesso!');
      } else {
        savedResult = await gymService.createTemplate(templateData);
        setSuccessMessage('Modelo criado com sucesso!');
      }

      await loadData();

      // Update currentTemplate if we are viewing the one that was just edited
      if (savedResult && currentTemplate && currentTemplate.id === savedResult.id) {
        setCurrentTemplate(savedResult);
      }

      setShowCreateTemplateModal(false);
      setEditingTemplateId(null);
    } catch (error) {
      console.error(error);
    }
  };


  const handleDeleteTemplateClick = (id: string) => {
    setTemplateToDelete(id);
    setShowDeleteTemplateConfirm(true);
  };

  const confirmDeleteTemplate = async () => {
    if (templateToDelete) {
      try {
        await gymService.deleteTemplate(templateToDelete);
        loadData();
        if (currentTemplate?.id === templateToDelete) {
          setViewMode('LIST');
          setCurrentTemplate(null);
        }
        setTemplateToDelete(null);
        setShowDeleteTemplateConfirm(false);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleUseTemplate = (template: GymTemplate) => {
    setFormTitle(template.title);
    setFormCategory(template.category);
    setFormDate(getLocalTodayISO());
    setFormTime('');
    setFormBaseTemplateId(template.id);
    setFormExercises(template.exercises.map(ex => ({ ...ex, id: Date.now().toString() + Math.random() })));
    setShowCreateWorkoutModal(true);
  };

  const updateExercise = (id: string, field: keyof GymExercise, value: any) => {
    setFormExercises(formExercises.map(ex => {
      if (ex.id === id) {
        const updated = { ...ex, [field]: value };
        if (field === 'sets') {
          const numSets = Math.max(1, parseInt(value) || 0);
          const newTargetLoads = [...(ex.targetLoads || [])] as number[];
          while (newTargetLoads.length < numSets) newTargetLoads.push(0);
          updated.targetLoads = newTargetLoads.slice(0, numSets);
        }
        return updated;
      }
      return ex;
    }));
  };

  const updateTargetLoad = (exerciseId: string, setIndex: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormExercises(formExercises.map(ex => {
      if (ex.id === exerciseId) {
        const loads = [...(ex.targetLoads || [])] as number[];
        loads[setIndex] = numValue;
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
                <optgroup label="DDR - Desenvolvimento">
                  <option>Força Explosiva</option>
                  <option>Explosiva</option>
                  <option>Força Rápida</option>
                  <option>Resistência Força</option>
                </optgroup>
                <optgroup label="DCR - Capacidade">
                  <option>Força Máxima</option>
                  <option>Força Resistiva</option>
                </optgroup>
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
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="200"
                      step="5"
                      placeholder="0"
                      value={ex.targetLoads?.[sIdx] || ''}
                      onChange={(e) => updateTargetLoad(ex.id, sIdx, e.target.value)}
                      className="bg-white border border-gray-200 rounded-lg px-2 py-2 pr-6 text-xs text-center font-black text-brand-slate focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-all w-full"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">%</span>
                  </div>
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
    const today = getLocalTodayISO();
    const filtered = workouts.filter(w => {
      // Only show planned workouts (not active or completed sessions)
      const isPlanned = w.status === 'Planned' && !w.parent_session_id;
      const matchesCategory = filterCategory === 'Todos' || w.category === filterCategory;
      const matchesStart = !startDate || w.date >= startDate;
      const matchesEnd = !endDate || w.date <= endDate;
      return isPlanned && matchesCategory && matchesStart && matchesEnd;
    });
    const sorted = filtered.sort((a, b) => {
      const isTodayA = a.date === today; const isTodayB = b.date === today;
      if (isTodayA && !isTodayB) return -1; if (!isTodayA && isTodayB) return 1;
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
      const dateB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
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
                    <button onClick={() => openEditWorkoutModal(workout)} className="p-2 text-gray-400 hover:text-brand-slate hover:bg-gray-100 rounded-lg" title="Editar"><Edit2 size={16} /></button>
                    <button onClick={() => handleDuplicate(workout)} className="p-2 text-gray-400 hover:text-brand-slate hover:bg-gray-100 rounded-lg" title="Duplicar"><Copy size={16} /></button>
                    <button onClick={() => handleDeleteClick(workout.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Excluir"><Trash2 size={16} /></button>
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
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditTemplateModal(template)} className="p-2 text-gray-400 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Editar">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDeleteTemplateClick(template.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Excluir">
                    <Trash2 size={16} />
                  </button>
                  <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
                    <FileText size={20} />
                  </div>
                </div>
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

  const renderHistory = (filterByParentId?: string) => {
    const allHistory = workouts
      .filter(w => (w.status === 'Completed' || w.status === 'Realizado'))
      .filter(w => {
        if (filterByParentId) return w.parent_session_id === parseInt(filterByParentId);

        const matchesCategory = filterCategory === 'Todos' || w.category === filterCategory;
        const matchesStart = !startDate || w.date >= startDate;
        const matchesEnd = !endDate || w.date <= endDate;
        // Profile filter placeholder (physicalMotorCapacity of first exercise for now as backend doesn't have a session-level profile yet)
        // Adjusting later if session-level profile is added
        return matchesCategory && matchesStart && matchesEnd;
      })
      .sort((a, b) => parseISOToLocalDate(b.date).getTime() - parseISOToLocalDate(a.date).getTime());

    const toggleHistoryExpand = (id: string) => {
      setExpandedHistoryItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
      <div className="animate-in slide-in-from-bottom-4 space-y-6">
        {/* Advanced Filter Bar (only for general history) */}
        {!filterByParentId && (
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center gap-8">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Período</span>
                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-xs font-bold text-brand-slate outline-none p-1" />
                  <span className="text-gray-300">—</span>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-xs font-bold text-brand-slate outline-none p-1" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Categoria</span>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {['Todos', 'Geral', 'Infantil', 'Petiz'].map(c => (
                    <button
                      key={c}
                      onClick={() => setFilterCategory(c)}
                      className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all tracking-widest uppercase ${filterCategory === c ? 'bg-brand-slate text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-gray-50 pt-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Perfil do Treino</span>
              <div className="flex items-center gap-1.5">
                {['Todos', 'Velocidade', 'Fundo', 'Meio Fundo', 'Técnica'].map(p => (
                  <button
                    key={p}
                    onClick={() => setFilterProfile(p)}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all tracking-widest uppercase ${filterProfile === p ? 'bg-brand-slate text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">
          Sessões Finalizadas ({allHistory.length})
        </div>

        {allHistory.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[32px] border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <History size={40} className="text-gray-200" />
            </div>
            <h3 className="text-gray-900 text-lg font-black uppercase tracking-tight mb-2">Histórico Vazio</h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">Os treinos realizados e suas cargas aparecerão listados aqui.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allHistory.map((session) => {
              const isExpanded = !!expandedHistoryItems[session.id];
              const sessionDate = parseISOToLocalDate(session.date);
              const day = sessionDate.getDate();
              const month = sessionDate.toLocaleString('pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', '');
              const attendees = athletes.filter(a => session.feedbacks?.some(f => f.athlete_id === parseInt(a.id) && f.attendance === 'Present'));

              // Tonnage Calculation
              const sessionTonnage = (session.feedbacks || []).reduce((total, f) => {
                let fTotal = 0;
                Object.keys(f.performed_loads).forEach(exName => {
                  const loads = f.performed_loads[exName];
                  const ex = session.exercises.find(e => e.name === exName);
                  const reps = parseInt(ex?.reps || '10') || 1;
                  loads.forEach(w => { fTotal += (w * reps); });
                });
                return total + fTotal;
              }, 0);

              // Relative intensity label logic
              const getIntensityLabel = (tonnage: number) => {
                if (tonnage > 1000) return { label: 'Alta', color: 'blue', width: '85%' };
                if (tonnage > 500) return { label: 'Média', color: 'orange', width: '50%' };
                return { label: 'Baixa', color: 'green', width: '25%' };
              };
              const intensity = getIntensityLabel(sessionTonnage);

              return (
                <div key={session.id} className="bg-white rounded-[32px] border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-brand-orange/20">
                  {/* Header */}
                  <div className="p-4 md:p-6 flex items-center justify-between cursor-pointer group" onClick={() => toggleHistoryExpand(session.id)}>
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                      {/* Date Badge */}
                      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex flex-col items-center justify-center border border-gray-100 shrink-0 group-hover:bg-brand-orange/5 group-hover:border-brand-orange/20 transition-colors">
                        <span className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">{month}</span>
                        <span className="text-2xl font-black text-brand-slate leading-none">{day}</span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-black text-brand-slate uppercase tracking-tight truncate">{session.title}</h3>
                          <span className="bg-gray-100 text-[9px] font-black text-gray-400 px-2 py-0.5 rounded tracking-widest uppercase">Finalizado</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                          <span className="flex items-center gap-1.5"><Clock size={14} className="text-brand-orange" /> {session.time}</span>
                          <span className="flex items-center gap-1.5"><Dumbbell size={14} className="text-brand-orange" /> {session.exercises.length} Exercícios</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="hidden sm:block text-right">
                        <div className="text-xl font-black text-brand-slate">{attendees.length} Atletas</div>
                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Elenco</div>
                      </div>
                      <div className={`p-2 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-brand-orange group-hover:text-white transition-all transform ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={20} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-6 pb-8 animate-in slide-in-from-top-4 duration-300">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-gray-50 pt-8">
                        {/* Left Column: Execution & Loads */}
                        <div className="lg:col-span-2 space-y-6">
                          <div className="flex items-center justify-between pl-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Execução & Cargas Reais</span>
                          </div>

                          <div className="space-y-4">
                            {session.exercises.map((ex, exIdx) => {
                              // Find feedbacks that have this exercise recorded
                              const evaluationsForThisEx = (session.feedbacks || []).filter(f => f.performed_loads[ex.name]);

                              // De-duplicate by athlete_id as a safeguard against legacy or race-condition duplicates
                              const uniqueEvalsForThisEx = Array.from(
                                evaluationsForThisEx.reduce((map, f: GymFeedback) => {
                                  map.set(f.athlete_id, f);
                                  return map;
                                }, new Map<number, GymFeedback>()).values()
                              ) as GymFeedback[];

                              return (
                                <div key={ex.id} className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100">
                                  <div className="flex justify-between items-start mb-4">
                                    <div>
                                      <span className="text-[9px] font-black text-brand-orange uppercase mb-1 block">Série #{exIdx + 1}</span>
                                      <h4 className="text-lg font-black text-brand-slate uppercase">{ex.name}</h4>
                                      <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[10px] font-bold text-gray-500">{ex.sets} Séries x {ex.reps}</span>
                                        <span className="text-[10px] font-black bg-white border border-gray-200 text-gray-400 px-2 py-0.5 rounded uppercase">{ex.physicalMotorCapacity}</span>
                                      </div>
                                    </div>
                                    <span className="bg-green-50 text-green-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                      {uniqueEvalsForThisEx.length} Avaliados
                                    </span>
                                  </div>

                                  <div className="space-y-2">
                                    {uniqueEvalsForThisEx.map(f => {
                                      const athlete = athletes.find(a => a.id === f.athlete_id.toString());
                                      const loads = f.performed_loads[ex.name];
                                      return (
                                        <div key={f.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                                          <span className="text-xs font-black text-brand-slate">{athlete?.name}</span>
                                          <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Cargas:</span>
                                            <span className="text-xs font-black text-brand-orange">{loads.join(' - ')} <span className="text-[9px] text-gray-400">kg</span></span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                    {uniqueEvalsForThisEx.length === 0 && (
                                      <div className="text-center py-2 text-[10px] font-bold text-gray-300 uppercase italic">Nenhuma carga registrada</div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Right Column: Attendees & Stats */}
                        <div className="space-y-8">
                          {/* Attendees */}
                          <div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block pl-2">Elenco Participante</span>
                            <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 min-h-[120px] flex flex-wrap gap-2 content-start">
                              {attendees.map(a => (
                                <span key={a.id} className="bg-white border border-gray-200 px-3 py-2 rounded-xl text-xs font-black text-brand-slate shadow-sm">{a.name}</span>
                              ))}
                              {attendees.length === 0 && <span className="text-xs text-gray-300 italic">Nenhum atleta presente registrado.</span>}
                            </div>
                          </div>

                          {/* Tonnage Indicator */}
                          <div className={`bg-${intensity.color}-50/30 rounded-2xl p-5 border border-${intensity.color}-100/50`}>
                            <div className="flex justify-between items-end mb-3">
                              <span className="text-[10px] font-black text-brand-slate uppercase tracking-widest">Tonalagem Sessão</span>
                              <span className={`text-xs font-black text-${intensity.color}-600`}>{intensity.label}</span>
                            </div>
                            <div className={`h-2 w-full bg-${intensity.color}-100 rounded-full overflow-hidden`}>
                              <div className={`h-full bg-${intensity.color}-500 rounded-full shadow-sm shadow-${intensity.color}-500/20`} style={{ width: intensity.width }}></div>
                            </div>
                            <div className="mt-2 text-[9px] font-black text-gray-300 uppercase tracking-widest text-right">
                              {sessionTonnage.toLocaleString()} kg total
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
    );
  };

  const renderDetails = () => {
    if (!currentWorkout) return null;
    return (
      <div className="w-full animate-in slide-in-from-right-4 h-full flex flex-col">
        {/* Header with actions */}
        <div className="mb-8 pb-4 sticky top-0 bg-brand-bg z-10 pt-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setViewMode('LIST')} className="p-2 hover:bg-white rounded-full transition-colors text-gray-500"><ArrowLeft size={24} /></button>
              <div>
                <span className="inline-block bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase mb-2">
                  {currentWorkout.status === 'Planned' ? 'Treino Programado' : 'Sessão Realizada'}
                </span>
                <h2 className="text-3xl font-black text-brand-slate uppercase tracking-tight">{currentWorkout.title}</h2>
              </div>
            </div>

            {currentWorkout.status === 'Planned' && (
              <div className="flex items-center gap-2">
                <button onClick={() => openEditWorkoutModal(currentWorkout)} className="p-3 text-gray-400 hover:text-brand-slate hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-100" title="Editar">
                  <Edit2 size={20} />
                </button>
                <button onClick={() => handleDuplicate(currentWorkout)} className="p-3 text-gray-400 hover:text-brand-slate hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-100" title="Duplicar">
                  <Copy size={20} />
                </button>
                <button onClick={() => handleDeleteClick(currentWorkout.id)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-100" title="Excluir">
                  <Trash2 size={20} />
                </button>
                <button onClick={() => handleStartRequest(currentWorkout)} className="bg-brand-slate text-white px-6 py-3 rounded-xl font-black shadow-lg hover:bg-slate-700 hover:scale-[1.02] transition-all flex items-center gap-2 text-xs tracking-wider uppercase ml-4">
                  <Play size={16} fill="white" /> Iniciar Sessão
                </button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-6 mb-8">
            <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
              <button
                onClick={() => setWorkoutDetailsTab('DETAILS')}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all tracking-widest ${workoutDetailsTab === 'DETAILS' ? 'bg-brand-slate text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
              >
                Detalhamento Técnico
              </button>
              <button
                onClick={() => setWorkoutDetailsTab('HISTORY')}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all tracking-widest ${workoutDetailsTab === 'HISTORY' ? 'bg-brand-slate text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
              >
                Histórico de Execuções
              </button>
            </div>
          </div>

          {/* Summary Bar */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Categoria</span>
              <span className="text-3xl font-black text-brand-slate uppercase tracking-tight">{currentWorkout.category}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Data Programada</span>
              <span className="text-3xl font-black text-brand-slate uppercase tracking-tight flex items-center gap-2">
                {parseISOToLocalDate(currentWorkout.date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Origem</span>
              <div className="flex items-center gap-2">
                {currentWorkout.sourceTemplateName ? (
                  <>
                    <FileText size={18} className="text-brand-orange" />
                    <span className="text-xl font-bold text-brand-slate truncate">{currentWorkout.sourceTemplateName}</span>
                  </>
                ) : (
                  <span className="text-xl font-bold text-brand-slate text-gray-400">Manual</span>
                )}
              </div>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Exercícios</span>
              <span className="text-3xl font-black text-brand-slate tracking-tight">{currentWorkout.exercises.length}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        {
          workoutDetailsTab === 'DETAILS' ? (
            <div className="space-y-4 pb-20">
              <div className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2 mb-2">Cronograma de Exercícios</div>
              {currentWorkout.exercises.map((ex, idx) => (
                <div key={ex.id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl shadow-inner shadow-blue-100">{idx + 1}</div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-lg font-black text-brand-slate uppercase">{ex.name}</h3>
                        <span className="border border-gray-200 px-2 py-0.5 rounded-md text-[10px] font-bold text-gray-400 uppercase bg-gray-50">{ex.physicalMotorCapacity}</span>
                      </div>
                      <div className="text-sm font-medium text-gray-600">
                        <span className="font-bold text-brand-slate">{ex.sets} Séries</span> &times; <span className="font-bold text-brand-slate">{ex.reps}</span> <span className="text-gray-400 mx-2">—</span> Descanso: <span className="font-bold text-brand-slate">{ex.restInterval || 'N/A'}</span>
                      </div>
                      {ex.targetLoads && ex.targetLoads.length > 0 && ex.targetLoads.some(l => l > 0) && (
                        <div className="mt-2 text-xs flex items-center gap-2">
                          <span className="font-bold text-brand-orange uppercase">Cargas Alvo:</span>
                          <div className="flex gap-1">
                            {ex.targetLoads.map((l, i) => (
                              <span key={i} className="bg-orange-50 text-brand-orange px-1.5 py-0.5 rounded font-black">{l}%</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {ex.observation && (
                        <div className="mt-4 flex items-start gap-2 text-gray-500 italic text-sm bg-gray-50/50 p-3 rounded-xl border border-dashed border-gray-200">
                          <Info size={16} className="shrink-0 mt-0.5 text-gray-400" />
                          <span>{ex.observation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 pb-20">
              {renderHistory(currentWorkout.id)}
            </div>
          )
        }
      </div >
    );
  };

  const renderTemplateDetails = () => {
    if (!currentTemplate) return null;
    return (
      <div className="w-full animate-in slide-in-from-right-4 h-full flex flex-col">
        {/* Header with actions */}
        <div className="mb-8 pb-4 sticky top-0 bg-brand-bg z-10 pt-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button onClick={() => { setViewMode('LIST'); setTemplateDetailsTab('DETAILS'); }} className="p-2 hover:bg-white rounded-full transition-colors text-gray-500"><ArrowLeft size={24} /></button>
              <div>
                <span className="inline-block bg-orange-50 text-brand-orange px-2 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase mb-2">Visualizando Modelo</span>
                <h2 className="text-3xl font-black text-brand-slate uppercase tracking-tight">{currentTemplate.title}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openEditTemplateModal(currentTemplate)} className="p-3 text-gray-400 hover:text-brand-orange hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-100" title="Editar">
                <Edit2 size={20} />
              </button>
              <button onClick={() => handleDeleteTemplateClick(currentTemplate.id)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-100" title="Excluir">
                <Trash2 size={20} />
              </button>
              <button onClick={() => handleUseTemplate(currentTemplate)} className="bg-brand-slate text-white px-6 py-3 rounded-xl font-black shadow-lg hover:bg-slate-700 hover:scale-[1.02] transition-all flex items-center gap-2 text-xs tracking-wider uppercase ml-4">
                <Play size={16} fill="white" /> Utilizar Modelo
              </button>
            </div>
          </div>

          {/* Usage Tabs */}
          <div className="flex items-center gap-1 mt-6 mb-8">
            <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
              <button
                onClick={() => setTemplateDetailsTab('DETAILS')}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all tracking-widest ${templateDetailsTab === 'DETAILS' ? 'bg-brand-slate text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
              >
                Detalhamento Técnico
              </button>
              <button
                onClick={() => setTemplateDetailsTab('HISTORY')}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all tracking-widest ${templateDetailsTab === 'HISTORY' ? 'bg-brand-slate text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
              >
                Histórico de Execuções
              </button>
            </div>
          </div>

          {/* New Summary Bar */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Categoria</span>
              <span className="text-3xl font-black text-brand-slate uppercase tracking-tight">{currentTemplate.category}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Criado Por</span>
              <span className="text-3xl font-black text-brand-slate uppercase tracking-tight truncate">{currentTemplate.author || 'Coach'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Última Atualização</span>
              <span className="text-3xl font-black text-brand-slate flex items-center gap-3 tracking-tight">
                {parseISOToLocalDate(currentTemplate.lastUpdated || getLocalTodayISO()).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Exercícios</span>
              <span className="text-3xl font-black text-brand-slate tracking-tight">{currentTemplate.exercises.length}</span>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {templateDetailsTab === 'DETAILS' && (
          <div className="space-y-4 pb-20">
            <div className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2 mb-2">Exercícios da sessão ({currentTemplate.exercises.length})</div>
            {currentTemplate.exercises.map((ex, idx) => (
              <div key={ex.id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-brand-orange flex items-center justify-center font-black text-xl shadow-inner shadow-orange-100">{idx + 1}</div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-lg font-black text-brand-slate uppercase">{ex.name}</h3>
                      <span className="border border-gray-200 px-2 py-0.5 rounded-md text-[10px] font-bold text-gray-400 uppercase bg-gray-50">{ex.physicalMotorCapacity}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-600">
                      <span className="font-bold text-brand-slate">{ex.sets} Séries</span> &times; <span className="font-bold text-brand-slate">{ex.reps}</span> <span className="text-gray-400 mx-2">—</span> Descanso: <span className="font-bold text-brand-slate">{ex.restInterval || 'N/A'}</span>
                    </div>
                    {ex.targetLoads && ex.targetLoads.length > 0 && ex.targetLoads.some(l => l > 0) && (
                      <div className="mt-2 text-xs flex items-center gap-2">
                        <span className="font-bold text-brand-orange uppercase">Cargas Alvo:</span>
                        <div className="flex gap-1">
                          {ex.targetLoads.map((l, i) => (
                            <span key={i} className="bg-orange-50 text-brand-orange px-1.5 py-0.5 rounded font-black">{l}%</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {ex.observation && (
                      <div className="mt-4 flex items-start gap-2 text-gray-500 italic text-sm bg-gray-50/50 p-3 rounded-xl border border-dashed border-gray-200">
                        <Info size={16} className="shrink-0 mt-0.5 text-gray-400" />
                        <span>{ex.observation}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {templateDetailsTab === 'HISTORY' && (
          <div className="space-y-4 pb-10">
            {(() => {
              const templateHistory = workouts
                .filter(w => w.sourceTemplateName === currentTemplate.title && (w.status === 'Completed' || w.status === 'Realizado'))
                .sort((a, b) => parseISOToLocalDate(b.date).getTime() - parseISOToLocalDate(a.date).getTime());

              if (templateHistory.length === 0) {
                return (
                  <div className="py-20 text-center flex flex-col items-center justify-center space-y-4 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-gray-300 shadow-sm border border-gray-100">
                      <History size={24} />
                    </div>
                    <div>
                      <p className="text-gray-600 font-bold text-sm">Nenhum treino realizado com este modelo</p>
                      <p className="text-gray-400 text-xs mt-1">O histórico aparecerá aqui após a execução de sessões</p>
                    </div>
                  </div>
                );
              }

              return templateHistory.map((session) => (
                <div key={session.id} className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-brand-orange/30 transition-all hover:shadow-lg group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-brand-orange">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-brand-slate text-lg">{session.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1.5"><Calendar size={14} /> {parseISOToLocalDate(session.date).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1.5"><Clock size={14} /> {session.time}</span>
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">Realizado</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="text-xs font-bold text-gray-400 flex items-center gap-1"><Users size={12} /> {session.attendanceCount || 0} Atletas</div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDetails(session)}
                      className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-brand-orange transition-colors"
                    >
                      <Eye size={20} />
                    </button>
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>
    );
  };

  const renderLiveMode = () => {
    if (!liveWorkout) return null;
    const EvaluationDrawer = () => {
      if (!showEvalDrawer || !currentEvalExercise) return null;
      const presentAthletes = athletes.filter(a => attendance[a.id]);
      const currentAthlete = athletes.find(a => a.id === evalSelectedAthlete);

      return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowEvalDrawer(false)}>
          <div className="bg-white w-full max-w-xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <span className="text-[10px] font-black text-brand-orange uppercase tracking-widest mb-1 block">Avaliando Cargas</span>
                <h3 className="text-2xl font-black text-brand-slate uppercase">{currentEvalExercise.name}</h3>
              </div>
              <button onClick={() => setShowEvalDrawer(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
                <X size={24} />
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#CBD5E1 transparent'
              }}
            >
              <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background-color: #CBD5E1;
                  border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background-color: #94A3B8;
                }
              `}</style>
              {/* Atleta Selection */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Selecionar Atleta Presente</label>
                  {presentAthletes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <select
                          value={evalSelectedAthlete}
                          onChange={(e) => handleEvalAthleteChange(e.target.value)}
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-orange outline-none font-bold text-slate-700 transition-all appearance-none pr-10 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_1rem_center]"
                        >
                          <option value="" disabled>Escolha um atleta...</option>
                          {presentAthletes.map(a => (<option key={a.id} value={a.id}>{a.name}</option>))}
                        </select>
                      </div>

                      {currentAthlete && (
                        <div className="md:col-span-2 flex items-center justify-between bg-blue-50/50 border border-blue-100 p-3 rounded-xl animate-in fade-in">
                          <div className="flex items-center gap-2">
                            <Weight size={16} className="text-blue-500" />
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Peso Corporal</span>
                          </div>
                          <span className="text-sm font-black text-blue-600">{currentAthlete.bodyWeight} kg</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2 border border-red-100 uppercase tracking-tighter">
                      <AlertTriangle size={16} /> Marque a presença de um atleta primeiro
                    </div>
                  )}
                </div>
              </div>

              {/* Séries List */}
              {evalSelectedAthlete && currentAthlete && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Registro de Cargas</label>
                  <div className="grid grid-cols-1 gap-2">
                    {Array.from({ length: currentEvalExercise.sets }).map((_, idx) => {
                      const targetLoadRaw = currentEvalExercise.targetLoads?.[idx] || 0;
                      const targetPercent = typeof targetLoadRaw === 'string' ? parseInt(targetLoadRaw) : targetLoadRaw;
                      const expectedKg = currentAthlete.bodyWeight ? ((targetPercent / 100) * currentAthlete.bodyWeight).toFixed(1) : '--';

                      return (
                        <div key={idx} className="flex items-center gap-4 bg-gray-50/50 border border-gray-100 p-3 rounded-2xl hover:bg-white hover:border-brand-orange/20 transition-all group">
                          <div className="w-10 h-10 rounded-xl bg-brand-slate text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm">{idx + 1}</div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{idx + 1}ª Série</span>
                              <span className="text-[10px] font-black text-brand-orange bg-orange-50 px-2 py-0.5 rounded">
                                {targetPercent > 0 ? `Meta: ${targetPercent}% (${expectedKg}kg)` : 'Carga Livre'}
                              </span>
                            </div>
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="0.0"
                                value={evalLoads[idx] || ''}
                                onChange={(e) => handleLoadChange(idx, e.target.value)}
                                className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:border-brand-orange outline-none font-black text-lg text-brand-slate transition-all text-center"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300">KG</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <button
                onClick={saveEvaluation}
                disabled={!evalSelectedAthlete}
                className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all ${evalSelectedAthlete ? 'bg-brand-slate text-white hover:bg-slate-800 hover:scale-[1.01]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                Salvar Avaliação
              </button>
            </div>
          </div>
        </div>
      );
    };
    const presentCount = Object.values(attendance).filter(Boolean).length;
    const sortedAthletes = [...athletes.filter(a => a.name.toLowerCase().includes(attendanceSearch.toLowerCase()))].sort((a, b) => { const attA = attendance[a.id] ? 1 : 0; const attB = attendance[b.id] ? 1 : 0; if (attB !== attA) return attB - attA; return a.name.localeCompare(b.name); });
    return (
      <div className="h-full flex flex-col animate-in slide-in-from-right-4 relative">
        {EvaluationDrawer()}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm gap-4">
          <div className="flex items-center gap-4"><button onClick={() => setViewMode('LIST')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ChevronLeft size={24} /></button><div><div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span><h2 className="text-xl font-bold text-brand-slate">{liveWorkout.title}</h2></div><div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-3 items-center"><span className="flex items-center gap-1"><Calendar size={14} /> {liveWorkout.date}</span><span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-bold text-gray-600">{liveWorkout.category}</span></div></div></div>
          <div className="flex bg-gray-100 p-1 rounded-lg"><button onClick={() => setLiveTab('EXECUTION')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${liveTab === 'EXECUTION' ? 'bg-white text-brand-slate shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Execução</button><button onClick={() => setLiveTab('SUMMARY')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${liveTab === 'SUMMARY' ? 'bg-white text-brand-slate shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Resumo</button></div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowLiveAddModal(true)}
              className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold border border-blue-100 flex items-center gap-2 hover:bg-blue-100 transition-colors"
            >
              <Plus size={16} /> Adicionar Exercício
            </button>
            <button onClick={() => setShowFinishConfirm(true)} className="bg-brand-orange text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-orange-600">Finalizar</button>
          </div>
        </div>
        {liveTab === 'EXECUTION' && (
          <div className="flex gap-6 h-full overflow-hidden">
            <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-72'}`}>
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col gap-2"><div className="flex justify-between items-center">{!isSidebarCollapsed && <h3 className="font-bold text-gray-700">Presença ({presentCount})</h3>}<button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="text-gray-400 hover:text-brand-orange">{isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}</button></div>{!isSidebarCollapsed && (<div className="relative"><Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" /><input type="text" placeholder="Buscar..." value={attendanceSearch} onChange={(e) => setAttendanceSearch(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-8 pr-3 text-sm focus:outline-none focus:border-brand-orange" /></div>)}</div>
              <div className="overflow-y-auto flex-1 p-2 space-y-1">{sortedAthletes.map(athlete => (<div key={athlete.id} className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors ${attendance[athlete.id] ? 'bg-orange-50/50' : ''}`}><input type="checkbox" checked={!!attendance[athlete.id]} onChange={() => setAttendance({ ...attendance, [athlete.id]: !attendance[athlete.id] })} className="accent-brand-orange w-4 h-4 rounded border-gray-300 cursor-pointer" />{!isSidebarCollapsed && <span className={`flex-1 text-sm font-medium ${attendance[athlete.id] ? 'text-brand-slate' : 'text-gray-400'}`}>{athlete.name}</span>}</div>))}</div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pb-20">{liveWorkout.exercises.map((ex, idx) => (<div key={ex.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"><div className="flex flex-col md:flex-row justify-between items-start mb-4"><div className="flex-1"><div className="flex items-center gap-3 mb-2"><span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-orange text-white text-xs font-bold">{idx + 1}</span><h3 className="text-xl font-bold text-slate-800">{ex.name}</h3><span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-black">{ex.physicalMotorCapacity}</span></div><div className="flex flex-wrap gap-4 mt-3 ml-9"><div className="flex flex-col bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-center min-w-[80px]"><span className="text-[10px] text-gray-400 font-bold">Séries</span><span className="text-xl font-black text-brand-slate">{ex.sets}</span></div><div className="flex flex-col bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-center min-w-[80px]"><span className="text-[10px] text-gray-400 font-bold">Execuções</span><span className="text-xl font-black text-brand-slate">{ex.reps}</span></div><div className="flex flex-col bg-orange-50 border border-orange-100 rounded-lg px-3 py-1.5 text-center min-w-[120px]"><span className="text-[10px] text-brand-orange font-bold">Metas (% Peso)</span><span className="text-sm font-black text-brand-orange">{ex.targetLoads?.join(' | ')}</span></div></div></div><div className="mt-4 md:mt-0"><button onClick={() => openEvalDrawer(ex)} className="bg-brand-slate text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow hover:bg-slate-700 transition-colors flex items-center gap-2"><Scale size={16} /> Avaliar cargas</button></div></div><div className="ml-0 md:ml-9 border-t border-gray-100 pt-3"><button onClick={() => toggleExerciseExpand(ex.id)} className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-brand-orange transition-colors mb-2 w-full">{expandedExercises[ex.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}Previsto vs realizado ({Object.keys(gymEvaluations[ex.id] || {}).length})</button>{expandedExercises[ex.id] && (<div className="space-y-2 bg-gray-50 p-3 rounded-lg animate-in slide-in-from-top-2">{Object.keys(gymEvaluations[ex.id] || {}).length === 0 && <p className="text-xs text-gray-400 italic">Sem registros.</p>}{Object.entries(gymEvaluations[ex.id] || {}).map(([athleteId, loads]) => (<div key={athleteId} className="flex justify-between items-center text-sm border-b border-gray-200 last:border-0 pb-1"><span className="font-medium text-slate-700">{athletes.find(a => a.id === athleteId)?.name}</span><div className="flex gap-2 items-center"><span className="text-[9px] text-gray-400 font-black">Meta (%): {ex.targetLoads?.join(' | ')}</span><span className="font-mono font-bold text-brand-slate bg-white px-2 py-0.5 rounded border border-gray-200 text-xs">Real (kg): {(loads as string[]).join(' - ')}</span></div></div>))}</div>)}</div></div>))}</div>
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
              <h3 className="text-2xl font-bold text-brand-slate">{editingWorkoutId ? 'Editar Treino' : 'Programar Treino'}</h3>
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

      {showCreateTemplateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-brand-slate">{editingTemplateId ? 'Editar modelo' : 'Criar novo modelo'}</h3>
              <button onClick={() => { setShowCreateTemplateModal(false); setEditingTemplateId(null); }} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={24} /></button>
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
              <button onClick={() => { setShowCreateTemplateModal(false); setEditingTemplateId(null); }} className="px-6 py-2.5 text-gray-600 font-bold hover:bg-white rounded-xl transition-colors">Cancelar</button>
              <button onClick={saveTemplate} className="px-8 py-2.5 bg-brand-orange text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all">{editingTemplateId ? 'Salvar alterações' : 'Salvar modelo'}</button>
            </div>
          </div>
        </div>
      )}

      {showLiveAddModal && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <Plus size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-brand-slate uppercase tracking-tight">Novo Exercício</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Inclusão em Tempo Real</p>
                </div>
              </div>
              <button onClick={() => setShowLiveAddModal(false)} className="p-2 hover:bg-white rounded-full text-gray-400 transition-colors shadow-sm"><X size={24} /></button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
              {/* Nome */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nome do Exercício</label>
                <input
                  type="text"
                  value={liveAddForm.name}
                  onChange={(e) => setLiveAddForm({ ...liveAddForm, name: e.target.value })}
                  placeholder="Ex: Supino inclinado com halteres"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-brand-slate focus:bg-white outline-none font-bold text-brand-slate transition-all shadow-sm"
                  autoFocus
                />
              </div>

              {/* Grid Técnico */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 tracking-widest mb-2 block">C. Físico-Motriz</label>
                  <select
                    value={liveAddForm.physicalMotorCapacity}
                    onChange={(e) => setLiveAddForm({ ...liveAddForm, physicalMotorCapacity: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-brand-slate focus:border-brand-slate focus:bg-white outline-none transition-all shadow-sm"
                  >
                    <option>Força Máxima</option>
                    <option>Força Rápida</option>
                    <option>Força Explosiva</option>
                    <option>Força Resistência</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 tracking-widest mb-2 block">Séries</label>
                    <input
                      type="number"
                      min="1"
                      value={liveAddForm.sets}
                      onChange={(e) => {
                        const s = Math.max(1, parseInt(e.target.value) || 0);
                        const loads = [...liveAddForm.targetLoads];
                        while (loads.length < s) loads.push(0);
                        setLiveAddForm({ ...liveAddForm, sets: s, targetLoads: loads.slice(0, s) });
                      }}
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:border-brand-orange outline-none font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 tracking-widest mb-2 block">Reps</label>
                    <input
                      type="text"
                      value={liveAddForm.reps}
                      onChange={(e) => setLiveAddForm({ ...liveAddForm, reps: e.target.value })}
                      placeholder="10"
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:border-brand-orange outline-none font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 tracking-widest mb-2 block text-ellipsis overflow-hidden">Intervalo</label>
                    <input
                      type="text"
                      value={liveAddForm.restInterval}
                      onChange={(e) => setLiveAddForm({ ...liveAddForm, restInterval: e.target.value })}
                      placeholder="60s"
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:border-brand-orange outline-none font-bold text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Metas Gráficas */}
              <div className="bg-slate-50/50 p-6 rounded-3xl border border-gray-100">
                <label className="text-[10px] font-black text-brand-slate tracking-widest mb-4 block uppercase underline decoration-brand-orange/30 decoration-2">Meta Relativa por Série (% Peso Corp.)</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {Array.from({ length: liveAddForm.sets }).map((_, sIdx) => (
                    <div key={sIdx} className="flex flex-col">
                      <span className="text-[9px] text-gray-400 font-black mb-1.5 uppercase tracking-tighter">{sIdx + 1}ª Série</span>
                      <div className="relative group/input">
                        <input
                          type="number"
                          min="0"
                          max="200"
                          step="5"
                          placeholder="0"
                          value={liveAddForm.targetLoads[sIdx] || ''}
                          onChange={(e) => {
                            const newLoads = [...liveAddForm.targetLoads];
                            newLoads[sIdx] = parseFloat(e.target.value) || 0;
                            setLiveAddForm({ ...liveAddForm, targetLoads: newLoads });
                          }}
                          className="bg-white border border-gray-200 rounded-xl px-3 py-3 pr-8 text-xs text-center font-black text-brand-slate focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/5 outline-none transition-all w-full shadow-inner"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-300 font-black">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observação */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Observação / Instrução Técnica</label>
                <textarea
                  value={liveAddForm.observation}
                  onChange={(e) => setLiveAddForm({ ...liveAddForm, observation: e.target.value })}
                  placeholder="Ex: Focar na fase excêntrica; manter cotovelos fechados..."
                  rows={2}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-brand-slate focus:bg-white outline-none font-medium text-gray-600 transition-all shadow-sm resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4 rounded-b-3xl">
              <button
                onClick={() => setShowLiveAddModal(false)}
                className="flex-1 py-4 text-gray-500 font-black hover:bg-white hover:text-brand-slate rounded-2xl transition-all uppercase text-xs tracking-widest border border-transparent hover:border-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddLiveExercise}
                disabled={!liveAddForm.name}
                className={`flex-[2] py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${liveAddForm.name ? 'bg-brand-slate text-white hover:bg-black hover:scale-[1.02]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                <Dumbbell size={18} /> Adicionar ao Treino
              </button>
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

      {showDeleteTemplateConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-brand-slate mb-2">Excluir modelo?</h3>
            <p className="text-gray-500 mb-8">Esta ação não pode ser desfeita. O modelo será removido permanentemente da biblioteca.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteTemplateConfirm(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl">Cancelar</button>
              <button onClick={confirmDeleteTemplate} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg">Excluir</button>
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
