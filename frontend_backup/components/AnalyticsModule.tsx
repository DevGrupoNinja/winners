
import React, { useState, useMemo } from 'react';
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
import { MOCK_ASSESSMENT_HISTORY, MOCK_ATHLETES } from '../constants';
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
import { Athlete, AssessmentData } from '../types';

type AthleteGroup = 'Todos' | 'Geral' | 'Infantil' | 'Petiz';
type TechnicalCategory = 'all' | 'peso' | 'salto' | 'arremesso' | 'bem-estar';

export const AnalyticsModule: React.FC = () => {
  // Assessment History state
  const [history, setHistory] = useState<AssessmentData[]>(MOCK_ASSESSMENT_HISTORY);

  // Filters State
  const [selectedGroup, setSelectedGroup] = useState<AthleteGroup>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  
  // View State: LIST or DETAILS
  const [selectedAthleteIdForDetail, setSelectedAthleteIdForDetail] = useState<string | null>(null);

  // Secondary technical view filter (for charts)
  const [selectedTechnical, setSelectedTechnical] = useState<TechnicalCategory>('all');

  // Accordion State for List View
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Modal States (Register & Edit)
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerStep, setRegisterStep] = useState<'CATEGORY' | 'DATA'>('CATEGORY');
  const [regCategory, setRegCategory] = useState<TechnicalCategory | ''>('');
  const [regDate, setRegDate] = useState(new Date().toISOString().split('T')[0]);
  const [regSelectedAthleteIds, setRegSelectedAthleteIds] = useState<string[]>([]);
  const [regData, setRegData] = useState<Record<string, any>>({});
  const [regAthleteSearch, setRegAthleteSearch] = useState('');

  // Editing Entry state
  const [editingEntry, setEditingEntry] = useState<{athleteId: string, date: string} | null>(null);

  const technicalCategories = [
    { id: 'all', label: 'Dashboard Geral', icon: BarChart3 },
    { id: 'peso', label: 'Peso', icon: Weight, color: '#F97316', dataKey: 'weight', unit: 'kg' },
    { id: 'salto', label: 'Salto', icon: Zap, color: '#10B981', dataKey: 'jumpHeight', unit: 'cm' },
    { id: 'arremesso', label: 'Arremesso', icon: Target, color: '#3B82F6', dataKey: 'throwDistance', unit: 'm' },
    { id: 'bem-estar', label: 'Bem-estar', icon: Heart, color: '#EC4899', dataKey: 'wellnessScore', unit: '/10' },
  ];

  const filteredAthletes = useMemo(() => {
    return MOCK_ATHLETES.filter(a => {
      const matchGroup = selectedGroup === 'Todos' || a.category === selectedGroup;
      const matchSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchGroup && matchSearch;
    });
  }, [selectedGroup, searchTerm]);

  const getAthleteStats = (athleteId: string) => {
    let athleteHistory = history.filter(h => h.athleteId === athleteId).sort((a, b) => a.date.localeCompare(b.date));
    
    if (athleteHistory.length === 0) return null;
    
    const latest = athleteHistory[athleteHistory.length - 1];
    const previous = athleteHistory.length > 1 ? athleteHistory[athleteHistory.length - 2] : latest;

    const calcDiff = (curr: number = 0, prev: number = 0) => {
      const diff = curr - prev;
      return {
        val: diff.toFixed(1),
        isPositive: diff >= 0,
        pct: prev !== 0 ? ((diff / prev) * 100).toFixed(1) : '0'
      };
    };

    return {
      history: athleteHistory,
      latest,
      diffs: {
        weight: calcDiff(latest.weight, previous.weight),
        jump: calcDiff(latest.jumpHeight, previous.jumpHeight),
        throw: calcDiff(latest.throwDistance, previous.throwDistance),
        wellness: calcDiff(latest.wellnessScore, previous.wellnessScore),
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

  const handleSaveAssessments = () => {
    const newEntries: AssessmentData[] = regSelectedAthleteIds.map(athleteId => {
      const data = regData[athleteId] || {};
      const entry: AssessmentData = {
        athleteId,
        date: regDate,
      };

      if (regCategory === 'peso') entry.weight = parseFloat(data.weight) || 0;
      if (regCategory === 'salto') entry.jumpHeight = parseFloat(data.jumpHeight) || 0;
      if (regCategory === 'arremesso') entry.throwDistance = parseFloat(data.throwDistance) || 0;
      if (regCategory === 'bem-estar') {
        const sleep = parseInt(data.sleep) || 5;
        const fatigue = parseInt(data.fatigue) || 5;
        const pain = parseInt(data.pain) || 5;
        const stress = parseInt(data.stress) || 5;
        entry.wellnessScore = (sleep + fatigue + pain + stress) / 4;
        entry.wellnessDetails = { sleep, fatigue, pain, stress };
      }

      const lastEntry = history.filter(h => h.athleteId === athleteId).slice(-1)[0];
      if (lastEntry) {
        if (entry.weight === undefined) entry.weight = lastEntry.weight;
        if (entry.jumpHeight === undefined) entry.jumpHeight = lastEntry.jumpHeight;
        if (entry.throwDistance === undefined) entry.throwDistance = lastEntry.throwDistance;
        if (entry.wellnessScore === undefined) entry.wellnessScore = lastEntry.wellnessScore;
        if (entry.wellnessDetails === undefined) entry.wellnessDetails = lastEntry.wellnessDetails;
      }

      return entry;
    });

    setHistory(prev => [...prev, ...newEntries]);
    setShowRegisterModal(false);
  };

  const handleDeleteEntry = (athleteId: string, date: string) => {
    if (confirm('Tem certeza que deseja excluir este registro histórico?')) {
      setHistory(prev => prev.filter(h => !(h.athleteId === athleteId && h.date === date)));
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
              <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
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
    const athlete = MOCK_ATHLETES.find(a => a.id === selectedAthleteIdForDetail);
    const stats = getAthleteStats(selectedAthleteIdForDetail!);
    if (!athlete || !stats) return null;

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
             <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-brand-orange"><Weight size={20}/></div>
                  <span className={`text-[10px] font-black flex items-center gap-0.5 ${stats.diffs.weight.isPositive ? 'text-brand-success' : 'text-brand-error'}`}>
                    {stats.diffs.weight.isPositive ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>} {stats.diffs.weight.pct}%
                  </span>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Peso Corporal</span>
                <span className="text-2xl font-black text-brand-slate tracking-tighter">{stats.latest.weight}kg</span>
             </div>
             <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500"><Zap size={20}/></div>
                  <span className={`text-[10px] font-black flex items-center gap-0.5 ${stats.diffs.jump.isPositive ? 'text-brand-success' : 'text-brand-error'}`}>
                    {stats.diffs.jump.isPositive ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>} {stats.diffs.jump.pct}%
                  </span>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Salto Vertical</span>
                <span className="text-2xl font-black text-brand-slate tracking-tighter">{stats.latest.jumpHeight}cm</span>
             </div>
             <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500"><Target size={20}/></div>
                  <span className={`text-[10px] font-black flex items-center gap-0.5 ${stats.diffs.throw.isPositive ? 'text-brand-success' : 'text-brand-error'}`}>
                    {stats.diffs.throw.isPositive ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>} {stats.diffs.throw.pct}%
                  </span>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Arremesso</span>
                <span className="text-2xl font-black text-brand-slate tracking-tighter">{stats.latest.throwDistance}m</span>
             </div>
             <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-pink-500"><Heart size={20}/></div>
                  <span className={`text-[10px] font-black flex items-center gap-0.5 ${stats.diffs.wellness.isPositive ? 'text-brand-success' : 'text-brand-error'}`}>
                    {stats.diffs.wellness.isPositive ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>} {stats.diffs.wellness.pct}%
                  </span>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Bem-estar (Média)</span>
                <span className="text-2xl font-black text-brand-slate tracking-tighter">{stats.latest.wellnessScore?.toFixed(1)}/10</span>
             </div>
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
                        <td className="px-6 py-5"><span className="font-black text-brand-slate text-sm">{entry.weight}<span className="text-[10px] text-slate-300 ml-0.5">kg</span></span></td>
                        <td className="px-6 py-5"><span className="font-black text-brand-slate text-sm">{entry.jumpHeight}<span className="text-[10px] text-slate-300 ml-0.5">cm</span></span></td>
                        <td className="px-6 py-5"><span className="font-black text-brand-slate text-sm">{entry.throwDistance}<span className="text-[10px] text-slate-300 ml-0.5">m</span></span></td>
                        <td className="px-6 py-5">
                           <div className="flex flex-col gap-2">
                             <div className="flex items-center gap-2">
                               <div className="h-1.5 w-12 bg-slate-100 rounded-full overflow-hidden">
                                 <div className="h-full bg-brand-orange" style={{ width: `${(entry.wellnessScore || 0) * 10}%` }} />
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
                                setEditingEntry({athleteId: entry.athleteId, date: entry.date});
                                setRegData({[entry.athleteId]: {
                                  weight: entry.weight,
                                  jumpHeight: entry.jumpHeight,
                                  throwDistance: entry.throwDistance,
                                  sleep: entry.wellnessDetails?.sleep || 5,
                                  fatigue: entry.wellnessDetails?.fatigue || 5,
                                  pain: entry.wellnessDetails?.pain || 5,
                                  stress: entry.wellnessDetails?.stress || 5
                                }});
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
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest whitespace-nowrap ${
              selectedTechnical === cat.id 
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
                className={`px-6 py-2.5 rounded-full text-xs font-black transition-all border uppercase tracking-widest ${
                  selectedGroup === group 
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
            if (!stats) return null;
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
                          <CalendarDays size={12} className="text-slate-300"/> {stats.latest.date}
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
                    <div className={`p-4 rounded-[24px] border flex flex-col justify-between h-28 transition-colors ${selectedTechnical === 'peso' ? 'bg-orange-100 border-orange-200' : 'bg-orange-50/30 border-orange-100/50'}`}>
                      <div className="flex justify-between items-start">
                        <Weight size={18} className="text-brand-orange" />
                        <span className={`text-[9px] font-black flex items-center gap-0.5 ${stats.diffs.weight.isPositive ? 'text-brand-success' : 'text-brand-error'}`}>
                          {stats.diffs.weight.isPositive ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                          {stats.diffs.weight.pct}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Peso</span>
                        <span className="text-xl font-black text-brand-slate tracking-tighter">{stats.latest.weight}</span>
                        <span className="text-[10px] font-bold text-slate-400 ml-1">kg</span>
                      </div>
                    </div>

                    <div className={`p-4 rounded-[24px] border flex flex-col justify-between h-28 transition-colors ${selectedTechnical === 'salto' ? 'bg-emerald-100 border-emerald-200' : 'bg-emerald-50/30 border-emerald-100/50'}`}>
                      <div className="flex justify-between items-start">
                        <Zap size={18} className="text-emerald-500" />
                        <span className={`text-[9px] font-black flex items-center gap-0.5 ${stats.diffs.jump.isPositive ? 'text-brand-success' : 'text-brand-error'}`}>
                          {stats.diffs.jump.isPositive ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                          {stats.diffs.jump.pct}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Salto</span>
                        <span className="text-xl font-black text-brand-slate tracking-tighter">{stats.latest.jumpHeight}</span>
                        <span className="text-[10px] font-bold text-slate-400 ml-1">cm</span>
                      </div>
                    </div>

                    <div className={`p-4 rounded-[24px] border flex flex-col justify-between h-28 transition-colors ${selectedTechnical === 'arremesso' ? 'bg-blue-100 border-blue-200' : 'bg-blue-50/30 border-blue-100/50'}`}>
                      <div className="flex justify-between items-start">
                        <Target size={18} className="text-blue-500" />
                        <span className={`text-[9px] font-black flex items-center gap-0.5 ${stats.diffs.throw.isPositive ? 'text-brand-success' : 'text-brand-error'}`}>
                          {stats.diffs.throw.isPositive ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                          {stats.diffs.throw.pct}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Arremesso</span>
                        <span className="text-xl font-black text-brand-slate tracking-tighter">{stats.latest.throwDistance}</span>
                        <span className="text-[10px] font-bold text-slate-400 ml-1">m</span>
                      </div>
                    </div>

                    <div className={`p-4 rounded-[24px] border flex flex-col justify-between h-28 transition-colors ${selectedTechnical === 'bem-estar' ? 'bg-pink-100 border-pink-200' : 'bg-pink-50/30 border-pink-100/50'}`}>
                      <div className="flex justify-between items-start">
                        <Heart size={18} className="text-pink-500" />
                        <span className={`text-[9px] font-black flex items-center gap-0.5 ${stats.diffs.wellness.isPositive ? 'text-brand-success' : 'text-brand-error'}`}>
                          {stats.diffs.wellness.isPositive ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                          {stats.diffs.wellness.pct}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Wellness</span>
                        <span className="text-xl font-black text-brand-slate tracking-tighter">{stats.latest.wellnessScore?.toFixed(1)}</span>
                        <span className="text-[10px] font-bold text-slate-400 ml-1">/10</span>
                      </div>
                    </div>
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
                      <HistoryIcon size={14}/> Ver histórico completo de avaliações
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
    const athlete = MOCK_ATHLETES.find(a => a.id === editingEntry.athleteId);
    
    const handleSaveEdit = () => {
      const data = regData[editingEntry.athleteId];
      const entry: AssessmentData = {
        athleteId: editingEntry.athleteId,
        date: editingEntry.date,
        weight: parseFloat(data.weight),
        jumpHeight: parseFloat(data.jumpHeight),
        throwDistance: parseFloat(data.throwDistance),
        wellnessScore: (parseInt(data.sleep) + parseInt(data.fatigue) + parseInt(data.pain) + parseInt(data.stress)) / 4,
        wellnessDetails: {
          sleep: parseInt(data.sleep),
          fatigue: parseInt(data.fatigue),
          pain: parseInt(data.pain),
          stress: parseInt(data.stress)
        }
      };

      setHistory(prev => prev.map(h => (h.athleteId === entry.athleteId && h.date === entry.date) ? entry : h));
      setEditingEntry(null);
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
                          {MOCK_ATHLETES.filter(a => a.name.toLowerCase().includes(regAthleteSearch.toLowerCase())).map(a => (
                            <button
                              key={a.id}
                              onClick={() => {
                                if (!regSelectedAthleteIds.includes(a.id)) {
                                  setRegSelectedAthleteIds([...regSelectedAthleteIds, a.id]);
                                }
                                setRegAthleteSearch('');
                              }}
                              className="w-full text-left p-3 hover:bg-orange-50 rounded-xl flex items-center justify-between group transition-colors"
                            >
                              <span className="font-bold text-slate-700 text-sm">{a.name}</span>
                              <Check size={16} className={`text-brand-orange opacity-0 group-hover:opacity-100 ${regSelectedAthleteIds.includes(a.id) ? 'opacity-100' : ''}`} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {regSelectedAthleteIds.map(id => (
                      <div key={id} className="flex items-center gap-2 bg-orange-50 text-brand-orange px-4 py-2 rounded-full border border-orange-100 font-bold text-xs uppercase tracking-tight">
                        {MOCK_ATHLETES.find(a => a.id === id)?.name}
                        <button onClick={() => setRegSelectedAthleteIds(regSelectedAthleteIds.filter(i => i !== id))} className="hover:text-red-500 transition-colors">
                          <X size={14} strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    {regSelectedAthleteIds.map(athleteId => {
                      const athlete = MOCK_ATHLETES.find(a => a.id === athleteId);
                      return (
                        <div key={athleteId} className="bg-slate-50 border border-slate-100 rounded-3xl p-6 md:p-8 animate-in slide-in-from-left-4">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-slate shadow-sm border border-slate-100">
                              <User size={20} />
                            </div>
                            <span className="text-lg font-black text-brand-slate">{athlete?.name}</span>
                          </div>

                          {regCategory === 'peso' && (
                            <div className="flex items-center gap-6">
                              <div className="flex-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Peso corporal (kg)</label>
                                <input 
                                  type="number" step="0.1" placeholder="Ex: 72.5"
                                  value={regData[athleteId]?.weight || ''}
                                  onChange={(e) => updateRegData(athleteId, 'weight', e.target.value)}
                                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-xl text-brand-slate outline-none focus:border-brand-orange transition-all"
                                />
                              </div>
                            </div>
                          )}

                          {regCategory === 'salto' && (
                            <div className="flex items-center gap-6">
                              <div className="flex-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Altura do salto (cm)</label>
                                <input 
                                  type="number" placeholder="Ex: 45"
                                  value={regData[athleteId]?.jumpHeight || ''}
                                  onChange={(e) => updateRegData(athleteId, 'jumpHeight', e.target.value)}
                                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-xl text-brand-slate outline-none focus:border-brand-orange transition-all"
                                />
                              </div>
                            </div>
                          )}

                          {regCategory === 'arremesso' && (
                            <div className="flex items-center gap-6">
                              <div className="flex-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Distância do arremesso (m)</label>
                                <input 
                                  type="number" step="0.01" placeholder="Ex: 8.5"
                                  value={regData[athleteId]?.throwDistance || ''}
                                  onChange={(e) => updateRegData(athleteId, 'throwDistance', e.target.value)}
                                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-xl text-brand-slate outline-none focus:border-brand-orange transition-all"
                                />
                              </div>
                            </div>
                          )}

                          {regCategory === 'bem-estar' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                              {[
                                { id: 'sleep', label: 'Sono' },
                                { id: 'fatigue', label: 'Fadiga' },
                                { id: 'pain', label: 'Dor Muscular' },
                                { id: 'stress', label: 'Estresse' }
                              ].map(item => (
                                <div key={item.id}>
                                  <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-tight">{item.label} (1-10)</label>
                                  <input 
                                    type="number" min="1" max="10"
                                    value={regData[athleteId]?.[item.id] || ''}
                                    onChange={(e) => updateRegData(athleteId, item.id, e.target.value)}
                                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-lg text-brand-slate outline-none focus:border-brand-orange transition-all text-center"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <footer className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-between gap-4">
              <div className="flex gap-4">
                {registerStep === 'DATA' && (
                  <button 
                    onClick={() => setRegisterStep('CATEGORY')}
                    className="px-8 py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Voltar
                  </button>
                )}
              </div>
              {registerStep === 'DATA' && (
                <button 
                  onClick={handleSaveAssessments}
                  disabled={regSelectedAthleteIds.length === 0}
                  className="bg-brand-slate text-white px-10 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
                >
                  Salvar avaliações
                </button>
              )}
            </footer>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      {renderEditEntryModal()}
    </div>
  );
};
