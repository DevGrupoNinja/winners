
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Award, MapPin, Calendar, Timer, Medal, Plus, ChevronLeft, Users, Trophy, Save, Trash2, X, Search, ChevronDown, Check, AlertTriangle, Info, Target, Layers, Edit2, Play, ArrowRight, UserCheck, RefreshCcw, ArrowLeft, MoreHorizontal, CheckCircle2, ChevronRight, Activity, Layout, Clock, User, Filter, List, History, ShieldCheck, ShieldAlert, FileUp, Loader2, FileText, CheckCircle, Flag, Sparkles, UserMinus, UserPlus } from 'lucide-react';
import { MOCK_COMPETITIONS, MOCK_ATHLETES } from '../constants';
import { Competition, CompetitionEvent, Athlete, CompetitionEventHeat, HeatEntry, LiveEntryTiming, SplitTime, CompetitionResultEntry } from '../types';
import { GoogleGenAI } from "@google/genai";

type ViewMode = 'LIST' | 'DETAILS' | 'LIVE_TIMING' | 'FORM';
type DetailsTab = 'RESUMO' | 'PROVAS';
type FormTab = 'INFO' | 'ATHLETES' | 'EVENTS';
type MainTab = 'COMPETITIONS' | 'EVENTS' | 'RESULTS';

const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hundredths = Math.floor((ms % 1000) / 10);
  return `${minutes > 0 ? minutes + ':' : ''}${seconds.toString().padStart(2, '0')},${hundredths.toString().padStart(2, '0')}s`;
};

export const CompetitionModule: React.FC = () => {
  const [competitions, setCompetitions] = useState<Competition[]>(MOCK_COMPETITIONS);
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('COMPETITIONS');
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null);
  const [detailsTab, setDetailsTab] = useState<DetailsTab>('RESUMO');

  // AI Import States
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState<'SELECT' | 'UPLOAD' | 'PROCESSING' | 'SUCCESS'>('SELECT');
  const [selectedCompForImport, setSelectedCompForImport] = useState<string>('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState('');

  // Manual Result State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    compId: '',
    eventId: '',
    heatId: '',
    results: [] as any[]
  });

  // Athlete Management State
  const [showAddAthleteModal, setShowAddAthleteModal] = useState(false);
  const [athleteSearch, setAthleteSearch] = useState('');

  // Filters State
  const [filterName, setFilterName] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  // Live Timing States
  const [activeEvent, setActiveEvent] = useState<CompetitionEvent | null>(null);
  const [activeHeat, setActiveHeat] = useState<CompetitionEventHeat | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const [liveEntries, setLiveEntries] = useState<LiveEntryTiming[]>([]);

  // Modals
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteAction, setDeleteAction] = useState<{ label: string, onConfirm: () => void } | null>(null);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  // --- Timer Logic ---
  useEffect(() => {
    if (isTimerRunning) {
      startTimeRef.current = Date.now() - elapsedTime;
      const tick = () => {
        setElapsedTime(Date.now() - startTimeRef.current);
        timerRef.current = requestAnimationFrame(tick);
      };
      timerRef.current = requestAnimationFrame(tick);
    } else {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    }
    return () => { if (timerRef.current) cancelAnimationFrame(timerRef.current); };
  }, [isTimerRunning]);

  // --- Data Helpers ---
  const filteredCompetitions = useMemo(() => {
    return competitions.filter(c => {
      const matchName = c.name.toLowerCase().includes(filterName.toLowerCase());
      const matchCategory = !filterCategory || c.category === filterCategory;
      const matchLocation = !filterLocation || c.location === filterLocation;
      const matchPeriod = !filterPeriod || c.date.includes(filterPeriod) || (c.endDate && c.endDate.includes(filterPeriod));
      return matchName && matchCategory && matchLocation && matchPeriod;
    });
  }, [competitions, filterName, filterCategory, filterLocation, filterPeriod]);

  const resultsGroupedByComp = useMemo(() => {
    return filteredCompetitions.map(comp => {
      const allResults = comp.events.flatMap(ev => ev.results.map(r => ({ ...r, eventName: ev.name })));
      const official = allResults.filter(r => r.isOfficial).sort((a, b) => a.timeMs - b.timeMs);
      const unofficial = allResults.filter(r => !r.isOfficial).sort((a, b) => a.timeMs - b.timeMs);
      const summary = {
        gold: allResults.filter(r => r.medal === 'GOLD').length,
        silver: allResults.filter(r => r.medal === 'SILVER').length,
        bronze: allResults.filter(r => r.medal === 'BRONZE').length,
        trophies: allResults.filter(r => !!r.trophy).length
      };
      return { competition: comp, official, unofficial, summary };
    }).filter(item => item.official.length > 0 || item.unofficial.length > 0);
  }, [filteredCompetitions]);

  // --- Handlers ---
  const handleStartCompetition = () => {
    if (!selectedComp) return;
    const updated = { ...selectedComp, isActive: true, status: 'Upcoming' as const };
    setCompetitions(competitions.map(c => c.id === selectedComp.id ? updated : c));
    setSelectedComp(updated);
  };

  const handleFinishCompetition = () => {
    if (!selectedComp) return;
    const updated = { ...selectedComp, isActive: false, status: 'Past' as const };
    setCompetitions(competitions.map(c => c.id === selectedComp.id ? updated : c));
    setSelectedComp(updated);
  };

  const handleRemoveAthlete = (athleteId: string) => {
    if (!selectedComp) return;
    const updatedRegistered = selectedComp.registeredAthletes.filter(id => id !== athleteId);
    const updatedComp = { ...selectedComp, registeredAthletes: updatedRegistered };
    setCompetitions(competitions.map(c => c.id === selectedComp.id ? updatedComp : c));
    setSelectedComp(updatedComp);
  };

  const handleAddAthlete = (athleteId: string) => {
    if (!selectedComp || selectedComp.registeredAthletes.includes(athleteId)) return;
    const updatedRegistered = [...selectedComp.registeredAthletes, athleteId];
    const updatedComp = { ...selectedComp, registeredAthletes: updatedRegistered };
    setCompetitions(competitions.map(c => c.id === selectedComp.id ? updatedComp : c));
    setSelectedComp(updatedComp);
  };

  const handleOpenLiveTiming = (event: CompetitionEvent, heat: CompetitionEventHeat) => {
    setActiveEvent(event);
    setActiveHeat(heat);
    setElapsedTime(0);
    setIsTimerRunning(false);
    setLiveEntries(heat.entries.map(e => ({
      athleteId: e.athleteId || 'RELAY',
      lane: e.lane,
      splits: [],
      finished: false
    })));
    setViewMode('LIVE_TIMING');
  };

  const handleSaveLiveResults = () => {
    if (!activeEvent || !activeHeat || !selectedComp) return;
    const newResults: CompetitionResultEntry[] = liveEntries.filter(e => e.finished).map(e => ({
      athleteId: e.athleteId,
      athleteName: MOCK_ATHLETES.find(a => a.id === e.athleteId)?.name || `Raia ${e.lane}`,
      time: formatTime(e.finalTime || 0),
      timeMs: e.finalTime || 0,
      splits: e.splits,
      isOfficial: false
    }));

    const updatedEvents = selectedComp.events.map(ev => {
      if (ev.id === activeEvent.id) {
        return { ...ev, results: [...ev.results, ...newResults] };
      }
      return ev;
    });

    const updatedComp = { ...selectedComp, events: updatedEvents };
    setCompetitions(competitions.map(c => c.id === selectedComp.id ? updatedComp : c));
    setSelectedComp(updatedComp);
    setShowFinishConfirm(false);
    setViewMode('DETAILS');
    setDetailsTab('PROVAS');
  };

  const handleEditResult = (compId: string, res: CompetitionResultEntry) => {
    const event = competitions.find(c => c.id === compId)?.events.find(e => e.results.some(r => r.athleteId === res.athleteId));
    setManualForm({
      compId,
      eventId: event?.id || '',
      heatId: '', 
      results: [{
        athleteId: res.athleteId,
        athleteName: res.athleteName,
        time: res.time,
        rank: res.rank?.toString() || '',
        medal: res.medal || '',
        trophy: res.trophy || ''
      }]
    });
    setShowManualModal(true);
  };

  const saveManualResults = () => {
    const { compId, eventId, results } = manualForm;
    if (!compId || !eventId) return;

    setCompetitions(prev => prev.map(c => {
      if (c.id !== compId) return c;
      return {
        ...c,
        events: c.events.map(ev => {
          if (ev.id !== eventId) return ev;
          const updatedResults = [...ev.results];
          results.forEach(manualRes => {
            const index = updatedResults.findIndex(r => r.athleteId === manualRes.athleteId);
            const entry: CompetitionResultEntry = {
              athleteId: manualRes.athleteId,
              athleteName: manualRes.athleteName,
              time: manualRes.time,
              timeMs: 0,
              rank: parseInt(manualRes.rank) || undefined,
              medal: (manualRes.medal as any) || null,
              trophy: manualRes.trophy || null,
              isOfficial: false
            };
            if (index >= 0) updatedResults[index] = entry;
            else updatedResults.push(entry);
          });
          return { ...ev, results: updatedResults };
        })
      };
    }));
    setShowManualModal(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImportFile(file);
  };

  const processWithAI = async () => {
    if (!importFile || !selectedCompForImport) return;
    setImportStep('PROCESSING');
    setImportProgress('Preparando arquivo para análise...');
    try {
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(importFile);
      });
      setImportProgress('Extraindo dados com Gemini...');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{
            parts: [
              { inlineData: { mimeType: 'application/pdf', data: base64Data } },
              { text: "Analise esta súmula de natação e extraia todos os resultados. Para cada resultado retorne: nome da prova (eventName), nome do atleta (athleteName), tempo (time - formato mm:ss,cc), posição (rank - número) e medalha (medal - GOLD, SILVER ou BRONZE se aplicável). Retorne estritamente um array JSON válido." }
            ]
        }],
        config: { responseMimeType: "application/json" }
      });
      const extractedResults = JSON.parse(response.text || '[]');
      setImportProgress('Integrando resultados ao sistema...');
      setCompetitions(prev => prev.map(c => {
        if (c.id !== selectedCompForImport) return c;
        return {
          ...c,
          events: c.events.map(ev => {
            const matches = extractedResults.filter((r: any) => r.eventName?.toLowerCase().includes(ev.name.toLowerCase()));
            if (matches.length === 0) return ev;
            const newResults: CompetitionResultEntry[] = matches.map((m: any) => ({
              athleteId: MOCK_ATHLETES.find(a => a.name.toLowerCase() === m.athleteName?.toLowerCase())?.id || `ai-${Math.random()}`,
              athleteName: m.athleteName || 'Atleta Desconhecido',
              time: m.time || '00:00,00',
              timeMs: 0,
              rank: m.rank,
              medal: m.medal,
              isOfficial: true
            }));
            return { ...ev, results: [...ev.results, ...newResults] };
          })
        };
      }));
      setImportStep('SUCCESS');
    } catch (err) {
      setImportStep('UPLOAD');
    }
  };

  // --- Views ---
  const FilterBar = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="relative"><input type="text" placeholder="Nome" value={filterName} onChange={e => setFilterName(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-brand-orange outline-none shadow-sm"/><Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" /></div>
      <div className="relative"><input type="text" placeholder="Período" value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-brand-orange outline-none shadow-sm"/><Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" /></div>
      <div className="relative"><select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-brand-orange outline-none appearance-none shadow-sm pr-10"><option value="">Categoria</option>{Array.from(new Set(competitions.map(c => c.category))).map(c => <option key={c} value={c}>{c}</option>)}</select><ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" /></div>
      <div className="relative"><select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-brand-orange outline-none appearance-none shadow-sm pr-10"><option value="">Localização</option>{Array.from(new Set(competitions.map(c => c.location))).map(l => <option key={l} value={l}>{l}</option>)}</select><ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" /></div>
    </div>
  );

  // Fix for error in CompetitionModule.tsx: renderCompetitionsTab was missing
  const renderCompetitionsTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
      {filteredCompetitions.map(comp => (
        <div key={comp.id} className="bg-white rounded-[32px] border border-slate-200 p-6 hover:shadow-lg transition-all group">
          <div className="flex justify-between items-start mb-4">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${comp.status === 'Upcoming' ? 'bg-orange-50 text-brand-orange' : 'bg-slate-50 text-slate-400'}`}>
              {comp.status === 'Upcoming' ? 'Futura' : 'Passada'}
            </span>
            {comp.isActive && <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase rounded-lg border border-emerald-100"><Activity size={10} className="animate-pulse" /> Ao vivo</span>}
          </div>
          <h3 className="text-xl font-black text-brand-slate uppercase leading-tight group-hover:text-brand-orange transition-colors mb-2">{comp.name}</h3>
          <div className="flex flex-col gap-2 mb-6">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase"><MapPin size={14} /> {comp.location}</div>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase"><Calendar size={14} /> {comp.date}</div>
          </div>
          <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50 mb-6">
            <div><span className="text-[10px] font-black text-slate-300 uppercase block">Atletas</span><span className="text-lg font-black text-brand-slate">{comp.registeredAthletes.length}</span></div>
            <div><span className="text-[10px] font-black text-slate-300 uppercase block">Provas</span><span className="text-lg font-black text-brand-slate">{comp.events.length}</span></div>
          </div>
          <div className="flex items-center justify-between">
            <button onClick={() => { setSelectedComp(comp); setViewMode('DETAILS'); }} className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-brand-orange transition-colors flex items-center gap-2">Detalhes <ChevronRight size={14} /></button>
            <button onClick={() => { setShowImportModal(true); setImportStep('SELECT'); setSelectedCompForImport(comp.id); }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded-xl transition-all border border-transparent hover:border-orange-100"><FileUp size={18} /></button>
          </div>
        </div>
      ))}
    </div>
  );

  // Fix for error in CompetitionModule.tsx: renderResultsTab was missing
  const renderResultsTab = () => (
    <div className="space-y-10 pb-10">
      {resultsGroupedByComp.map(({ competition, official, unofficial, summary }) => (
        <div key={competition.id} className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
          <header className="p-8 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-6">
            <div>
              <h3 className="text-2xl font-black text-brand-slate uppercase tracking-tight">{competition.name}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{competition.location} • {competition.date}</p>
            </div>
            <div className="flex gap-4">
               <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 text-center min-w-[70px]"><span className="text-[8px] font-black text-yellow-500 uppercase block">Ouro</span><span className="text-lg font-black text-brand-slate">{summary.gold}</span></div>
               <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 text-center min-w-[70px]"><span className="text-[8px] font-black text-slate-400 uppercase block">Prata</span><span className="text-lg font-black text-brand-slate">{summary.silver}</span></div>
               <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 text-center min-w-[70px]"><span className="text-[8px] font-black text-orange-500 uppercase block">Bronze</span><span className="text-lg font-black text-brand-slate">{summary.bronze}</span></div>
            </div>
          </header>
          <div className="p-8 space-y-8">
            {official.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2"><ShieldCheck size={14} className="text-blue-500" /> Resultados Oficiais</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {official.map((res, idx) => (
                    <div key={idx} className="bg-slate-50/50 border border-slate-100 p-5 rounded-3xl flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 ${res.medal === 'GOLD' ? 'bg-yellow-50 border-yellow-200 text-yellow-600' : res.medal === 'SILVER' ? 'bg-slate-50 border-slate-200 text-slate-400' : res.medal === 'BRONZE' ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-slate-100 text-slate-300'}`}>
                          {res.rank ? <span className="font-black text-lg">{res.rank}º</span> : <Trophy size={20} />}
                        </div>
                        <div><p className="font-black text-brand-slate text-sm uppercase leading-none mb-1">{res.athleteName}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{res.eventName}</p></div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black font-mono text-brand-slate leading-none">{res.time}</p>
                        <button onClick={() => handleEditResult(competition.id, res)} className="text-[8px] font-black text-brand-orange uppercase opacity-0 group-hover:opacity-100 transition-opacity">Editar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {unofficial.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2"><Activity size={14} className="text-emerald-500" /> Tomadas de Tempo</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {unofficial.map((res, idx) => (
                    <div key={idx} className="bg-white border border-slate-100 p-5 rounded-3xl flex items-center justify-between group hover:border-brand-orange/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300"><Clock size={20} /></div>
                        <div><p className="font-black text-brand-slate text-sm uppercase leading-none mb-1">{res.athleteName}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{res.eventName}</p></div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black font-mono text-brand-slate leading-none">{res.time}</p>
                        <button onClick={() => handleEditResult(competition.id, res)} className="text-[8px] font-black text-brand-orange uppercase opacity-0 group-hover:opacity-100 transition-opacity">Editar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderDetails = () => {
    if (!selectedComp) return null;
    const individualCount = selectedComp.events.filter(e => e.type === 'Individual').length;
    const relayCount = selectedComp.events.filter(e => e.type === 'Relay').length;

    return (
      <div className="h-full flex flex-col animate-in slide-in-from-right-4 bg-brand-bg pb-20 overflow-hidden">
        <header className="mb-6 flex-shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-2">
            <div className="flex items-center gap-4">
              <button onClick={() => setViewMode('LIST')} className="p-3 hover:bg-white rounded-2xl transition-all text-slate-400 border border-transparent hover:border-slate-100"><ChevronLeft size={24}/></button>
              <h2 className="text-2xl font-black text-brand-slate tracking-tighter uppercase">{selectedComp.name}</h2>
            </div>
            <div className="flex gap-3">
              {!selectedComp.isActive && selectedComp.status === 'Upcoming' ? (
                <button onClick={handleStartCompetition} className="bg-brand-orange hover:bg-orange-600 text-white px-8 py-3 rounded-2xl flex items-center gap-3 shadow-xl font-bold text-sm active:scale-95 transition-all"><Play size={18} fill="white" /> Iniciar campeonato</button>
              ) : selectedComp.isActive ? (
                <div className="flex gap-3">
                  <div className="flex items-center gap-3 bg-emerald-50 px-5 py-2.5 rounded-2xl border border-emerald-100 text-emerald-600 font-black text-xs uppercase tracking-widest"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span> Em execução</div>
                  <button onClick={handleFinishCompetition} className="bg-brand-slate hover:bg-slate-900 text-white px-8 py-3 rounded-2xl flex items-center gap-3 shadow-xl font-bold text-sm active:scale-95 transition-all"><Flag size={18} /> Concluir campeonato</button>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-slate-100 px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-widest">Realizado</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-8 border-b border-slate-200 px-6">
            <button onClick={() => setDetailsTab('RESUMO')} className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${detailsTab === 'RESUMO' ? 'text-brand-orange' : 'text-slate-400 hover:text-slate-600'}`}>Resumo{detailsTab === 'RESUMO' && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-orange rounded-full" />}</button>
            <button onClick={() => setDetailsTab('PROVAS')} className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${detailsTab === 'PROVAS' ? 'text-brand-orange' : 'text-slate-400 hover:text-slate-600'}`}>Provas{detailsTab === 'PROVAS' && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-orange rounded-full" />}</button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-6 custom-scrollbar">
          {detailsTab === 'RESUMO' && (
            <div className="space-y-10 animate-in fade-in pb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-100"><Users size={24} /></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Atletas</p><p className="text-2xl font-black text-brand-slate">{selectedComp.registeredAthletes.length}</p></div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 text-brand-orange rounded-2xl flex items-center justify-center border border-orange-100"><Layers size={24} /></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Provas</p><p className="text-2xl font-black text-brand-slate">{selectedComp.events.length}</p></div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-100"><Activity size={24} /></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Individuais</p><p className="text-2xl font-black text-brand-slate">{individualCount}</p></div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center border border-indigo-100"><Users size={24} /></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Revezamentos</p><p className="text-2xl font-black text-brand-slate">{relayCount}</p></div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4 xl:col-span-1 md:col-span-2">
                  <div className="w-12 h-12 bg-slate-50 text-slate-500 rounded-2xl flex items-center justify-center border border-slate-100"><MapPin size={24} /></div>
                  <div className="min-w-0"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Sede</p><p className="text-sm font-black text-brand-slate truncate">{selectedComp.location}</p></div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-brand-orange shadow-inner"><Calendar size={24} /></div>
                    <div>
                      <h3 className="text-xl font-black text-brand-slate uppercase tracking-tight">Período da Competição</h3>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{selectedComp.date} {selectedComp.endDate ? `a ${selectedComp.endDate}` : ''}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
                <header className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-brand-slate uppercase tracking-tighter">Atletas Convocados</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gerencie o elenco escalado</p>
                  </div>
                  <button onClick={() => setShowAddAthleteModal(true)} className="px-6 py-2.5 bg-brand-slate text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all"><UserPlus size={16} /> Adicionar Atleta</button>
                </header>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] font-black tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-10 py-5">Atleta</th>
                        <th className="px-10 py-5">Categoria</th>
                        <th className="px-10 py-5 text-center">Status</th>
                        <th className="px-10 py-5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {selectedComp.registeredAthletes.length === 0 ? (
                        <tr><td colSpan={4} className="px-10 py-20 text-center text-slate-300 font-medium italic">Nenhum atleta cadastrado nesta competição.</td></tr>
                      ) : selectedComp.registeredAthletes.map(id => {
                        const a = MOCK_ATHLETES.find(at => at.id === id);
                        return (
                          <tr key={id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-10 py-4 font-black text-slate-700 text-sm uppercase">{a?.name}</td>
                            <td className="px-10 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">{a?.category}</td>
                            <td className="px-10 py-4 text-center"><div className="w-2 h-2 bg-emerald-500 rounded-full mx-auto shadow-lg shadow-emerald-500/30"></div></td>
                            <td className="px-10 py-4 text-right">
                              <button onClick={() => handleRemoveAthlete(id)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><UserMinus size={18} /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {detailsTab === 'PROVAS' && (
            <div className="space-y-6 animate-in fade-in pb-10">
              <div className="grid grid-cols-1 gap-6">
                {selectedComp.events.map((ev, evIdx) => (
                  <div key={ev.id} className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <div className="p-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3"><h3 className="text-2xl font-black text-brand-slate uppercase tracking-tight leading-none">{ev.name}</h3><span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${ev.type === 'Relay' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{ev.type === 'Relay' ? 'Revezamento' : 'Individual'}</span></div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{ev.stage} • {ev.heats.length} séries</p>
                      </div>
                      <button onClick={() => { const updated = selectedComp.events.map(e => e.id === ev.id ? { ...e, isExpanded: !e.isExpanded } : e); setSelectedComp({ ...selectedComp, events: updated }); }} className={`p-3 rounded-xl transition-all ${ev.isExpanded ? 'bg-brand-orange text-white shadow-lg' : 'bg-slate-50 text-slate-600'}`}><ChevronDown size={24} className={`transition-transform duration-300 ${ev.isExpanded ? 'rotate-180' : ''}`}/></button>
                    </div>
                    {ev.isExpanded && (
                      <div className="px-8 pb-8 space-y-6 animate-in slide-in-from-top-4 duration-300">
                        {ev.heats.map(heat => {
                          const resultsForHeat = ev.results.filter(r => heat.entries.some(ent => ent.athleteId === r.athleteId));
                          const heatFinished = resultsForHeat.length > 0;
                          return (
                            <div key={heat.id} className={`border-2 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${heatFinished ? 'border-brand-orange bg-orange-50/5' : 'border-slate-50 bg-slate-50/30'}`}>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                  <span className="w-8 h-8 bg-brand-slate text-white rounded-lg flex items-center justify-center text-xs font-black">{heat.number}º</span>
                                  <h5 className="text-sm font-black text-brand-slate uppercase">Série {heat.number}</h5>
                                  {heatFinished && <span className="flex items-center gap-1.5 px-3 py-1 bg-brand-orange/10 text-brand-orange text-[9px] font-black uppercase rounded-lg shadow-sm border border-brand-orange/20 animate-in zoom-in-95"><CheckCircle2 size={12} /> Concluída</span>}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {heat.entries.map(entry => {
                                    const athlete = MOCK_ATHLETES.find(a => a.id === entry.athleteId);
                                    const result = ev.results.find(r => r.athleteId === entry.athleteId);
                                    return (
                                      <div key={entry.lane} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                                        <div className="flex justify-between items-start mb-2">
                                          <span className="font-black text-brand-orange text-[10px] uppercase">Raia {entry.lane}</span>
                                          {result && <span className="text-xs font-black font-mono text-brand-slate px-2 py-0.5 bg-orange-50 rounded border border-orange-100">{result.time}</span>}
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 truncate block mb-1">{athlete?.name || 'Vazia'}</span>
                                        {result?.splits && result.splits.length > 0 && (
                                          <div className="flex gap-1 overflow-x-auto no-scrollbar pt-2 border-t border-slate-50 mt-1">
                                            {result.splits.map((s, si) => (
                                              <div key={si} className="bg-slate-50 px-1.5 py-0.5 rounded text-[8px] flex flex-col items-center border border-slate-100 flex-shrink-0">
                                                <span className="font-black text-slate-300 uppercase">{s.distance}</span>
                                                <span className="font-mono text-slate-600">{formatTime(s.time)}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              {selectedComp.isActive && (
                                <button onClick={() => handleOpenLiveTiming(ev, heat)} className="w-12 h-12 bg-brand-orange text-white rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all"><Play size={20} fill="white" /></button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal: Adicionar Atleta */}
        {showAddAthleteModal && (
          <div className="fixed inset-0 z-[300] bg-brand-slate/90 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
              <header className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
                <div>
                  <h3 className="text-xl font-black text-brand-slate uppercase">Convocar Atleta</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Selecione para adicionar à competição</p>
                </div>
                <button onClick={() => setShowAddAthleteModal(false)} className="p-2 hover:bg-white rounded-xl text-slate-300 hover:text-red-500 transition-colors"><X size={24} /></button>
              </header>
              <div className="p-8 flex-1 flex flex-col space-y-6">
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input type="text" placeholder="Buscar atleta por nome..." value={athleteSearch} onChange={e => setAthleteSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-orange outline-none transition-all font-medium text-sm"/>
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2 space-y-2">
                  {MOCK_ATHLETES.filter(a => !selectedComp.registeredAthletes.includes(a.id) && a.name.toLowerCase().includes(athleteSearch.toLowerCase())).map(a => (
                    <button key={a.id} onClick={() => { handleAddAthlete(a.id); setShowAddAthleteModal(false); }} className="w-full p-4 bg-white border border-slate-100 rounded-2xl hover:border-brand-orange flex justify-between items-center transition-all group">
                      <div className="text-left">
                        <p className="font-black text-slate-700 text-sm uppercase">{a.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{a.category}</p>
                      </div>
                      <Plus size={18} className="text-slate-200 group-hover:text-brand-orange transition-colors" />
                    </button>
                  ))}
                  {MOCK_ATHLETES.filter(a => !selectedComp.registeredAthletes.includes(a.id) && a.name.toLowerCase().includes(athleteSearch.toLowerCase())).length === 0 && (
                    <div className="py-10 text-center text-slate-400 font-medium italic text-sm">Nenhum atleta disponível encontrado.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLiveTiming = () => {
    if (!activeEvent || !activeHeat || !selectedComp) return null;
    return (
      <div className="h-full flex flex-col animate-in fade-in duration-500 overflow-hidden bg-brand-bg">
        <header className="p-8 bg-white border-b border-slate-100 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-6">
            <button onClick={() => setViewMode('DETAILS')} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-white hover:shadow-md transition-all"><ArrowLeft size={24}/></button>
            <div><h2 className="text-xl font-black text-brand-slate uppercase tracking-tight">{activeEvent.name}</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{selectedComp.name} • {activeHeat.number}ª Série</p></div>
          </div>
          <div className="flex items-center gap-6 bg-slate-50/50 p-3 rounded-[28px] border border-slate-100">
            <div className="px-6 border-r border-slate-100 text-center"><span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-1">Cronômetro</span><span className={`text-3xl font-mono font-black ${isTimerRunning ? 'text-brand-orange animate-pulse' : 'text-brand-slate'}`}>{formatTime(elapsedTime)}</span></div>
            <div className="flex gap-2">
              <button onClick={() => { setIsTimerRunning(false); setElapsedTime(0); }} className="p-3 bg-white text-slate-400 hover:text-red-500 rounded-xl border border-slate-100 transition-all"><RefreshCcw size={18}/></button>
              <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg ${isTimerRunning ? 'bg-amber-100 text-amber-600' : 'bg-brand-orange text-white'}`}>{isTimerRunning ? 'Pausar' : 'Iniciar'}</button>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
          {liveEntries.map(entry => {
            const athlete = MOCK_ATHLETES.find(a => a.id === entry.athleteId);
            return (
              <div key={entry.lane} className={`bg-white rounded-[32px] border-2 p-6 flex flex-col md:flex-row items-center justify-between gap-8 transition-all duration-300 ${entry.finished ? 'border-emerald-500/30 bg-emerald-50/10' : 'border-slate-50'}`}>
                <div className="flex items-center gap-6 min-w-[250px]">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl ${entry.finished ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white'}`}>{entry.lane}</div>
                  <div><h4 className="text-xl font-black text-brand-slate uppercase truncate max-w-[180px]">{athlete?.name || 'Revezamento'}</h4><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Raia {entry.lane}</p></div>
                </div>
                <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-3">
                  {entry.splits.map((s, i) => (<div key={i} className="bg-slate-50 px-3 py-1.5 rounded-lg text-center border border-slate-100 flex-shrink-0"><span className="text-[8px] font-black text-slate-300 uppercase block">{s.distance}</span><span className="text-xs font-mono font-bold text-slate-600">{formatTime(s.time)}</span></div>))}
                </div>
                {entry.finished ? (
                  <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center gap-4 shadow-xl animate-in zoom-in-95"><div><span className="block text-[8px] font-black text-emerald-400 uppercase tracking-widest">Final</span><span className="text-2xl font-black font-mono tracking-tighter">{formatTime(entry.finalTime || 0)}</span></div><CheckCircle2 size={24} className="text-emerald-500"/></div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => { if(!isTimerRunning) return; const distance = `${(entry.splits.length + 1) * 50}m`; setLiveEntries(prev => prev.map(e => e.lane === entry.lane ? { ...e, splits: [...e.splits, { distance, time: elapsedTime }] } : e)); }} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[9px] font-black uppercase">Parcial</button>
                    <button onClick={() => setLiveEntries(prev => prev.map(e => e.lane === entry.lane ? { ...e, finished: true, finalTime: elapsedTime } : e))} className="px-6 py-2.5 bg-red-500 text-white rounded-xl text-[9px] font-black uppercase shadow-xl shadow-red-500/20 active:scale-95 transition-all">Parar</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <footer className="p-8 bg-white border-t border-slate-100 flex justify-end px-10">
          <button onClick={() => setShowFinishConfirm(true)} className="bg-brand-slate text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl transition-all flex items-center gap-3"><Save size={20}/> Salvar resultados</button>
        </footer>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col space-y-6 bg-brand-bg relative overflow-hidden">
      {viewMode === 'LIST' && (
        <>
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center px-1 gap-6 flex-shrink-0">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-brand-slate tracking-tighter leading-tight">Central de competições</h2>
              <p className="text-slate-400 font-medium text-sm mt-0.5">Gestão de provas e resultados oficiais</p>
            </div>
            <button className="bg-brand-orange hover:bg-orange-600 text-white px-7 py-3.5 rounded-[22px] flex items-center gap-2.5 shadow-xl shadow-orange-500/20 font-bold text-sm transition-all hover:scale-105 active:scale-95"><Plus size={20} strokeWidth={3} /> Nova competição</button>
          </header>
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex items-center gap-10 border-b border-slate-200 w-full mb-10 flex-shrink-0 px-2 overflow-x-auto no-scrollbar">
              <button onClick={() => setActiveMainTab('COMPETITIONS')} className={`pb-5 flex items-center gap-2.5 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeMainTab === 'COMPETITIONS' ? 'text-brand-orange' : 'text-slate-400 hover:text-slate-600'}`}>
                <Trophy size={18} /> Competições {activeMainTab === 'COMPETITIONS' && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-orange rounded-full"></div>}
              </button>
              <button onClick={() => setActiveMainTab('RESULTS')} className={`pb-5 flex items-center gap-2.5 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeMainTab === 'RESULTS' ? 'text-brand-orange' : 'text-slate-400 hover:text-slate-600'}`}>
                <History size={18} /> Resultados {activeMainTab === 'RESULTS' && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-orange rounded-full"></div>}
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              {activeMainTab !== 'RESULTS' && <FilterBar />}
              {activeMainTab === 'COMPETITIONS' && renderCompetitionsTab()}
              {activeMainTab === 'RESULTS' && renderResultsTab()}
            </div>
          </div>
        </>
      )}
      {viewMode === 'DETAILS' && renderDetails()}
      {viewMode === 'LIVE_TIMING' && renderLiveTiming()}

      {showFinishConfirm && (
        <div className="fixed inset-0 z-[250] bg-brand-slate/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl text-center flex flex-col items-center animate-in zoom-in-95">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6 border border-orange-100"><CheckCircle2 size={48} className="text-brand-orange" /></div>
            <h3 className="text-3xl font-black text-brand-slate mb-3 tracking-tighter leading-none">Concluir série?</h3>
            <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">Os tempos e parciais registrados serão exibidos na listagem de provas e na aba de resultados.</p>
            <div className="flex gap-4 w-full">
              <button onClick={() => setShowFinishConfirm(false)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">Revisar</button>
              <button onClick={handleSaveLiveResults} className="flex-1 py-4 bg-brand-orange text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl hover:scale-105 transition-all">Salvar tudo</button>
            </div>
          </div>
        </div>
      )}

      {showManualModal && (
        <div className="fixed inset-0 z-[300] bg-brand-slate/95 backdrop-blur-2xl flex items-center justify-center p-6">
          <div className="bg-white rounded-[48px] w-full max-w-5xl max-h-[90vh] shadow-[0_32px_100px_rgba(0,0,0,0.6)] animate-in zoom-in-95 overflow-hidden flex flex-col">
            <header className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/20 relative">
              <div className="relative z-10">
                <h3 className="text-2xl font-black text-brand-slate tracking-tight uppercase">Editar resultado</h3>
                <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Correção manual de registros</p>
              </div>
              <button onClick={() => setShowManualModal(false)} className="p-4 hover:bg-white rounded-2xl text-slate-300 hover:text-red-500 transition-all"><X size={28} /></button>
            </header>
            <div className="p-10 flex-1 overflow-y-auto custom-scrollbar space-y-10">
              <div className="grid grid-cols-1 gap-6">
                {manualForm.results.map((res, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-3xl p-8 space-y-8 border border-slate-100">
                    <div className="flex items-center gap-4"><User className="text-brand-orange"/><h4 className="text-xl font-black text-brand-slate">{res.athleteName}</h4></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tempo realizado</label><input type="text" value={res.time} onChange={e => { const r = [...manualForm.results]; r[idx].time = e.target.value; setManualForm({...manualForm, results: r}); }} className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-mono text-xl font-black text-brand-orange outline-none focus:border-brand-orange shadow-sm" /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Colocação</label><input type="number" value={res.rank} onChange={e => { const r = [...manualForm.results]; r[idx].rank = e.target.value; setManualForm({...manualForm, results: r}); }} className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-700 outline-none focus:border-brand-orange shadow-sm" /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Medalha</label><select value={res.medal} onChange={e => { const r = [...manualForm.results]; r[idx].medal = e.target.value as any; setManualForm({...manualForm, results: r}); }} className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:border-brand-orange shadow-sm appearance-none"><option value="">Nenhuma</option><option value="GOLD">Ouro</option><option value="SILVER">Prata</option><option value="BRONZE">Bronze</option></select></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Destaque / Troféu</label><input type="text" value={res.trophy} onChange={e => { const r = [...manualForm.results]; r[idx].trophy = e.target.value; setManualForm({...manualForm, results: r}); }} className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-medium text-sm outline-none focus:border-brand-orange shadow-sm" /></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <footer className="p-10 border-t border-slate-50 bg-slate-50/30 flex justify-end gap-4">
              <button onClick={() => setShowManualModal(false)} className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white rounded-xl">Cancelar</button>
              <button onClick={saveManualResults} className="bg-brand-orange text-white px-10 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all">Salvar alterações</button>
            </footer>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-[300] bg-brand-slate/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white rounded-[48px] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 overflow-hidden flex flex-col">
            <header className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/10">
              <div><h3 className="text-2xl font-black text-brand-slate tracking-tight">Importação Gemini IA</h3><p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Súmulas oficiais PDF</p></div>
              <button onClick={() => setShowImportModal(false)} className="p-3 hover:bg-slate-50 rounded-full text-slate-400"><X size={24} /></button>
            </header>
            <div className="p-10 flex-1 flex flex-col items-center justify-center space-y-10">
              {importStep === 'SELECT' && (
                <div className="w-full space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    {competitions.map(c => (
                      <button key={c.id} onClick={() => setSelectedCompForImport(c.id)} className={`p-6 rounded-3xl border-2 text-left transition-all flex items-center justify-between ${selectedCompForImport === c.id ? 'border-brand-orange bg-orange-50 shadow-md' : 'border-slate-100 bg-slate-50'}`}>
                        <div><p className={`font-black text-sm uppercase ${selectedCompForImport === c.id ? 'text-brand-orange' : 'text-slate-700'}`}>{c.name}</p></div>
                        {selectedCompForImport === c.id && <CheckCircle2 size={24} className="text-brand-orange" />}
                      </button>
                    ))}
                  </div>
                  <button disabled={!selectedCompForImport} onClick={() => setImportStep('UPLOAD')} className="w-full py-5 bg-brand-slate text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl disabled:opacity-30">Prosseguir</button>
                </div>
              )}
              {importStep === 'UPLOAD' && (
                <div className="text-center w-full space-y-8">
                  <label className="relative group cursor-pointer block">
                    <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
                    <div className="border-4 border-dashed border-slate-100 rounded-[40px] p-16 group-hover:border-brand-orange/30 group-hover:bg-orange-50/20 transition-all flex flex-col items-center gap-6">
                      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:text-brand-orange transition-all"><FileText size={48} /></div>
                      <p className="text-xl font-black text-brand-slate">Arraste seu PDF aqui</p>
                    </div>
                  </label>
                  {importFile && <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-emerald-600 text-sm font-bold">{importFile.name}</div>}
                  <button disabled={!importFile} onClick={processWithAI} className="w-full py-5 bg-brand-orange text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl disabled:opacity-30">Começar Análise</button>
                </div>
              )}
              {importStep === 'PROCESSING' && (
                <div className="flex flex-col items-center justify-center space-y-10 py-10">
                  <div className="relative"><div className="w-24 h-24 border-4 border-slate-100 rounded-full"></div><div className="absolute inset-0 w-24 h-24 border-4 border-brand-orange rounded-full border-t-transparent animate-spin"></div><div className="absolute inset-0 flex items-center justify-center text-brand-orange"><Activity size={32} className="animate-pulse" /></div></div>
                  <div className="text-center"><h4 className="text-xl font-black text-brand-slate uppercase tracking-widest mb-2">Processando...</h4><p className="text-sm text-slate-400 font-medium">{importProgress}</p></div>
                </div>
              )}
              {importStep === 'SUCCESS' && (
                <div className="text-center space-y-8 py-10 animate-in zoom-in-95">
                  <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto shadow-xl"><CheckCircle size={48} strokeWidth={3} /></div>
                  <div><h4 className="text-3xl font-black text-brand-slate tracking-tight mb-2">Importação Concluída!</h4><p className="text-slate-500 font-medium">Os resultados oficiais foram vinculados aos atletas com sucesso.</p></div>
                  <button onClick={() => { setShowImportModal(false); setImportStep('SELECT'); setActiveMainTab('RESULTS'); }} className="w-full py-5 bg-brand-slate text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Ver Resultados</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
