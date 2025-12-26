
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Calendar, Activity, Zap, TrendingUp, Award, Droplets, Dumbbell, Heart, Trophy, Edit2, Trash2, X, AlertTriangle, Clock, Scale, Thermometer, UserCheck, BarChart3, Users, Layout, Target, Info, Timer, Weight, ChevronLeft } from 'lucide-react';
import { MOCK_MACRO, MOCK_ATHLETES } from '../constants';
import { MacroCycle, MicroCycle, MesoCycle } from '../types';

// Função auxiliar para formatar datas incluindo o ano (DD/MM/YYYY)
const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  } catch (e) {
    return dateString;
  }
};

// --- Sub-components para o Design System Winners ---

const DateTag = ({ start, end, className = "" }: { start?: string, end?: string, className?: string }) => {
  if (!start && !end) return null;
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-600 ${className}`}>
      <Calendar size={14} className="text-brand-orange" />
      <span className="text-[10px] font-bold tracking-tight whitespace-nowrap text-slate-700">
        {formatDate(start)} <span className="text-slate-300 mx-0.5">—</span> {formatDate(end)}
      </span>
    </div>
  );
};

const CardHeader = ({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle?: string }) => (
  <div className="flex items-center gap-4 mb-6">
    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-brand-orange flex-shrink-0">
      <Icon size={24} strokeWidth={2} />
    </div>
    <div>
      <h4 className="text-lg font-black text-brand-slate leading-none tracking-tight">{title}</h4>
      {subtitle && <p className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-widest leading-none">{subtitle}</p>}
    </div>
  </div>
);

const ProgressBar = ({ label, value, max, colorClass = "bg-brand-orange", subValue }: { label: string, value: number, max: number, colorClass?: string, subValue?: string }) => {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-1.5">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{label}</span>
        <span className="text-[11px] font-black text-slate-700">{subValue}</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colorClass} transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

// --- Componentes de Detalhes ---

const MicroDetail = ({ micro, onEdit, onDelete }: { micro: MicroCycle, onEdit: () => void, onDelete: () => void }) => {
  return (
    <div className="flex flex-col h-full min-h-0 animate-in fade-in duration-500 bg-slate-50/30">
      {/* Header unificado com Macrociclo */}
      <div className="p-6 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 flex-shrink-0">
        <div className="space-y-4 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-md text-[10px] font-black bg-slate-100 text-slate-500 uppercase tracking-widest">Microciclo</span>
            <span className="px-3 py-1 rounded-md text-[10px] font-black bg-orange-50 text-brand-orange uppercase tracking-widest">Em Andamento</span>
          </div>
          <div className="flex items-center gap-4">
            <h3 className="text-2xl md:text-4xl font-black text-brand-slate tracking-tighter leading-tight">
              {micro.name} - Intensificação
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={onEdit} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-brand-orange hover:border-brand-orange transition-all shadow-sm" title="Editar">
                <Edit2 size={18} />
              </button>
              <button onClick={onDelete} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-500 hover:border-red-200 transition-all shadow-sm" title="Excluir">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-bold text-slate-400">Temporada {new Date().getFullYear()}</span>
            <DateTag start={micro.startDate} end={micro.endDate} />
          </div>
        </div>
        <div className="hidden lg:block">
            <span className="text-7xl font-black text-slate-100 select-none tracking-tighter">#23</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 md:px-10 pb-12 space-y-8 custom-scrollbar">
        {/* Grid Principal de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card: Natação */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col">
            <CardHeader icon={Droplets} title="Natação" subtitle="Volume & Intensidade" />
            <div className="flex justify-between items-end mb-8">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Volume Total</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl md:text-3xl font-black text-brand-slate tracking-tighter">123.4</span>
                  <span className="text-sm md:text-base font-black text-slate-400 uppercase">km</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Treinos</span>
                <span className="text-xl md:text-2xl font-black text-brand-slate">67</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
              <ProgressBar label="DDR" value={61.5} max={100} colorClass="bg-emerald-500" subValue="61.5km" />
              <ProgressBar label="DCR" value={39.2} max={100} colorClass="bg-blue-500" subValue="39.2km" />
            </div>
            <div className="mt-auto bg-slate-50 px-6 py-4 rounded-2xl flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Média / Treino</span>
              <span className="text-base font-black text-brand-slate">1.850m</span>
            </div>
          </div>

          {/* Card: Preparação Física */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col">
            <CardHeader icon={Dumbbell} title="Preparação Física" subtitle="Força & Potência" />
            <div className="flex justify-between items-end mb-8">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Carga</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl md:text-3xl font-black text-brand-slate tracking-tighter">85</span>
                  <span className="text-sm md:text-base font-black text-slate-400 uppercase">ton</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Sessões</span>
                <span className="text-xl md:text-2xl font-black text-brand-slate">23</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
              <ProgressBar label="DDR" value={38.9} max={100} colorClass="bg-emerald-500" subValue="38.9t" />
              <ProgressBar label="DCR" value={61.5} max={100} colorClass="bg-blue-500" subValue="61.5t" />
            </div>
            <div className="mt-auto bg-slate-50 px-6 py-4 rounded-2xl flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peso Médio</span>
              <span className="text-base font-black text-brand-slate">820kg</span>
            </div>
          </div>

          {/* Card: Bem Estar */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <CardHeader icon={Heart} title="Bem Estar" subtitle="Média do Ciclo (1-10)" />
            <div className="space-y-6 mt-4">
              <ProgressBar label="Qualidade Sono" value={7.2} max={10} colorClass="bg-sky-400" subValue="7.2 / 10" />
              <ProgressBar label="Fadiga (PSE)" value={8.0} max={10} colorClass="bg-orange-400" subValue="8.0 / 10" />
              <ProgressBar label="Nível de Estresse" value={4.5} max={10} colorClass="bg-yellow-400" subValue="4.5 / 10" />
              <ProgressBar label="Dor Muscular" value={6.1} max={10} colorClass="bg-rose-400" subValue="6.1 / 10" />
            </div>
          </div>

          {/* Card: Atletas */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group">
            <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6 border border-orange-100 shadow-sm">
                <Activity size={40} className="text-brand-orange" />
            </div>
            <h4 className="text-lg font-black text-brand-slate mb-1 uppercase tracking-tight">Atletas</h4>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Frequência & Evolução</p>
            <div className="flex gap-4 w-full">
              <div className="flex-1 bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                <span className="block text-2xl font-black text-emerald-600 leading-none">15</span>
                <span className="text-[8px] font-black text-emerald-700 uppercase mt-2 block tracking-tight">Melhoraram</span>
              </div>
              <div className="flex-1 bg-rose-50 rounded-2xl p-4 border border-rose-100">
                <span className="block text-2xl font-black text-rose-600 leading-none">2</span>
                <span className="text-[8px] font-black text-rose-700 uppercase mt-2 block tracking-tight">Pioraram</span>
              </div>
            </div>
            <div className="w-full mt-6 pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
              <span>Presença Total</span>
              <span className="text-brand-slate">95%</span>
            </div>
          </div>
        </div>

        {/* Tabelas de Dados Técnicos */}
        <div className="space-y-6">
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="bg-brand-orange p-4 text-center">
                    <h4 className="text-xs font-black text-brand-slate uppercase tracking-widest">Resumo Capacidades Físico Motriz / Direção Funcional</h4>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 divide-x divide-slate-100 min-w-[800px] lg:min-w-0">
                        {[
                        { label: 'AERO', val: 3 }, { label: 'AERO ANA', val: 3 }, { label: 'VO2', val: 3 }, 
                        { label: 'AA', val: 3 }, { label: 'RES ANA', val: 3 }, { label: 'TOL ANA', val: 3 }, 
                        { label: 'POT ANA', val: 3 }, { label: 'FOR RÁP', val: 3 }, { label: 'FOR EXP', val: 3 }, 
                        { label: 'PERNA', val: 3 }, { label: 'BRAÇO', val: 3 }, { label: 'RECUP', val: 3 }
                        ].map((cap, i) => (
                        <div key={i} className="p-4 text-center hover:bg-slate-50 transition-colors border-b lg:border-b-0 border-slate-100">
                            <div className="h-8 flex items-center justify-center mb-2">
                                <span className="text-[8px] font-black text-slate-400 uppercase leading-tight text-center">{cap.label}</span>
                            </div>
                            <span className="text-2xl font-black text-brand-slate">{cap.val}</span>
                        </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                <h4 className="text-sm font-black text-brand-slate uppercase tracking-widest mb-8 flex items-center gap-2">
                    <Timer size={18} className="text-brand-orange" /> Preparo Físico Detalhado
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                   <div className="space-y-6">
                      <div className="bg-yellow-300 text-slate-900 text-[10px] font-black p-4 rounded-xl flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-2 uppercase tracking-wider">DDR TOTAL</div>
                        <span className="text-base font-black">2.487 kg</span>
                        <span className="bg-white/30 px-2 py-0.5 rounded">72,15%</span>
                      </div>
                      <div className="space-y-1 rounded-2xl overflow-hidden border border-slate-50">
                         {[
                           { label: 'Força Explosiva', val: 672, pct: 27.02, color: 'bg-brand-orange' },
                           { label: 'Res. Força', val: 288, pct: 11.58, color: 'bg-brand-orange' },
                           { label: 'Explosiva', val: 672, pct: 27.02, color: 'bg-brand-orange' },
                           { label: 'Força Rápida', val: 855, pct: 34.38, color: 'bg-brand-orange' },
                         ].map((item, idx) => (
                           <div key={idx} className="flex items-center gap-4 bg-gray-50/30 p-3 hover:bg-orange-50/50 transition-colors">
                             <div className="w-24 md:w-32 text-[9px] font-black text-slate-500 uppercase truncate tracking-tight">{item.label}</div>
                             <div className="flex-1 flex items-center gap-4">
                               <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full ${item.color}`} style={{ width: `${item.pct}%` }}></div>
                               </div>
                               <span className="text-[11px] font-black text-brand-slate w-10 md:w-12 text-right">{item.val}</span>
                               <span className="text-[10px] font-bold text-slate-400 w-10 md:w-12 text-right">{item.pct.toFixed(2)}%</span>
                             </div>
                           </div>
                         ))}
                      </div>
                   </div>
                   <div className="space-y-6">
                      <div className="bg-yellow-300 text-slate-900 text-[10px] font-black p-4 rounded-xl flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-2 uppercase tracking-wider">DCR TOTAL</div>
                        <span className="text-base font-black">960 kg</span>
                        <span className="bg-white/30 px-2 py-0.5 rounded">27,85%</span>
                      </div>
                      <div className="space-y-1 rounded-2xl overflow-hidden border border-slate-50">
                         {[
                           { label: 'Força Máxima', val: 672, pct: 70.0, color: 'bg-blue-500' },
                           { label: 'Força Resistiva', val: 288, pct: 30.0, color: 'bg-blue-500' },
                         ].map((item, idx) => (
                           <div key={idx} className="flex items-center gap-4 bg-gray-50/30 p-3 hover:bg-blue-50/10 transition-colors">
                             <div className="w-24 md:w-32 text-[9px] font-black text-slate-500 uppercase truncate tracking-tight">{item.label}</div>
                             <div className="flex-1 flex items-center gap-4">
                               <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full ${item.color}`} style={{ width: `${item.pct}%` }}></div>
                               </div>
                               <span className="text-[11px] font-black text-brand-slate w-10 md:w-12 text-right">{item.val}</span>
                               <span className="text-[10px] font-bold text-slate-400 w-10 md:w-12 text-right">{item.pct.toFixed(1)}%</span>
                             </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const MesoDetail = ({ meso, onEdit, onDelete }: { meso: MesoCycle, onEdit: () => void, onDelete: () => void }) => {
  return (
    <div className="flex flex-col h-full min-h-0 animate-in fade-in duration-500">
      {/* Header Clean */}
      <div className="p-6 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 flex-shrink-0">
        <div className="space-y-4 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-md text-[10px] font-black bg-slate-100 text-slate-500 uppercase tracking-widest">Mesociclo</span>
            <span className="px-3 py-1 rounded-md text-[10px] font-black bg-orange-50 text-brand-orange uppercase tracking-widest">Em Andamento</span>
          </div>
          <div className="flex items-center gap-4">
            <h3 className="text-2xl md:text-4xl font-black text-brand-slate tracking-tighter leading-tight">
              {meso.name}
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={onEdit} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-brand-orange hover:border-brand-orange transition-all shadow-sm" title="Editar">
                <Edit2 size={18} />
              </button>
              <button onClick={onDelete} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-500 hover:border-red-200 transition-all shadow-sm" title="Excluir">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-bold text-slate-400">Temporada {new Date().getFullYear()}</span>
            <DateTag start={meso.startDate} end={meso.endDate} />
          </div>
        </div>
        <div className="hidden lg:block">
          <span className="text-7xl font-black text-slate-100 select-none tracking-tighter">#23</span>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 md:px-10 pb-8 space-y-6 custom-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          
          {/* Card: Natação - Full Width */}
          <div className="bg-white p-4 md:p-6 rounded-[40px] border border-slate-100 shadow-sm col-span-1 lg:col-span-2">
            <CardHeader icon={Droplets} title="Natação" subtitle="Consolidado do Mesociclo" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Volume Consolidado</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-brand-slate tracking-tighter">123.4</span>
                      <span className="text-lg font-black text-slate-400 uppercase">km</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex flex-col mb-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total de Treinos</span>
                      <span className="text-xl font-black text-brand-slate">67</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Metragem / Treino</span>
                      <span className="text-xl font-black text-brand-slate">2.733m</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <ProgressBar label="DDR (Volume Resistivo)" value={58.09} max={100} colorClass="bg-emerald-500" subValue="61.975m (58%)" />
                  <ProgressBar label="DCR (Volume de Carga)" value={41.91} max={100} colorClass="bg-blue-500" subValue="61.425m (42%)" />
                </div>
              </div>
              <div className="bg-slate-50 p-4 md:p-5 rounded-2xl space-y-4">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Faixas de Direção Alvo</h5>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="p-3 md:p-4 bg-white rounded-xl border border-slate-100 text-center">
                    <span className="block text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider">ER</span>
                    <span className="text-xl md:text-2xl font-black text-brand-orange">0.4</span>
                  </div>
                  <div className="p-3 md:p-4 bg-white rounded-xl border border-slate-100 text-center">
                    <span className="block text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider">RE</span>
                    <span className="text-xl md:text-2xl font-black text-brand-orange">0.4</span>
                  </div>
                </div>
                <p className="text-[9px] md:text-[10px] text-slate-400 italic leading-snug pt-2 border-t border-slate-100">
                  Valores normalizados baseados na carga interna média do grupo.
                </p>
              </div>
            </div>
          </div>

          {/* Card: Capacidades Motrizes - Full Width */}
          <div className="bg-white p-4 md:p-6 rounded-[40px] border border-slate-100 shadow-sm col-span-1 lg:col-span-2 overflow-hidden">
             <CardHeader icon={Zap} title="Direção Funcional" subtitle="Resumo das Capacidades Físico Motrizes" />
             <div className="overflow-x-auto custom-scrollbar">
                <div className="flex border border-slate-100 rounded-xl divide-x divide-slate-100 min-w-[800px] lg:min-w-0">
                    {[
                    { label: 'AERO', val: 3 }, { label: 'AERO ANA', val: 3 }, { label: 'VO2', val: 3 }, 
                    { label: 'AA', val: 3 }, { label: 'RES ANA', val: 3 }, { label: 'TOL ANA', val: 3 }, 
                    { label: 'POT ANA', val: 3 }, { label: 'FOR RÁP', val: 3 }, { label: 'FOR EXP', val: 3 }, 
                    { label: 'PERNA', val: 3 }, { label: 'BRAÇO', val: 3 }, { label: 'RECUP', val: 3 }
                    ].map((cap, i) => (
                    <div key={i} className="flex-1 p-3 md:p-4 text-center group hover:bg-orange-50/30 transition-colors">
                        <span className="block text-[8px] md:text-[10px] font-black text-slate-400 group-hover:text-brand-orange transition-colors uppercase mb-2 h-6 flex items-center justify-center leading-tight">{cap.label}</span>
                        <span className="text-lg md:text-xl font-black text-slate-700">{cap.val}</span>
                    </div>
                    ))}
                </div>
             </div>
          </div>

          {/* Card: Preparo Físico (Academia) - Full Width */}
          <div className="bg-white p-4 md:p-6 rounded-[40px] border border-slate-100 shadow-sm col-span-1 lg:col-span-2">
            <CardHeader icon={Dumbbell} title="Preparo Físico" subtitle="Métricas de Força" />
            <div className="flex flex-wrap justify-between items-end mb-6 md:mb-8 pb-6 border-b border-slate-50 gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Carga Consolidada</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-brand-slate tracking-tighter">85.000</span>
                  <span className="text-lg font-black text-slate-400 uppercase">kg</span>
                </div>
              </div>
              <div className="text-right flex gap-8">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Sessões</span>
                  <span className="text-xl font-black text-brand-slate">23</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Peso Médio</span>
                  <span className="text-xl font-black text-brand-slate">820kg</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              <div className="space-y-4">
                 <div className="flex justify-between items-center bg-yellow-400/10 px-3 py-1.5 rounded-lg border border-yellow-400/20">
                    <span className="text-[10px] md:text-xs font-bold text-amber-700 uppercase">DDR Total</span>
                    <span className="text-[10px] md:text-xs font-black text-amber-800 whitespace-nowrap">2.487 kg (72.1%)</span>
                 </div>
                 <div className="space-y-3 pl-2">
                    <ProgressBar label="Força Explosiva" value={27.02} max={100} colorClass="bg-brand-orange" subValue="672 kg (27%)" />
                    <ProgressBar label="Resistência Força" value={11.58} max={100} colorClass="bg-brand-orange" subValue="288 kg (11%)" />
                    <ProgressBar label="Força Rápida" value={34.38} max={100} colorClass="bg-brand-orange" subValue="855 kg (34%)" />
                 </div>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between items-center bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100">
                    <span className="text-[10px] md:text-xs font-bold text-sky-700 uppercase">DCR Total</span>
                    <span className="text-[10px] md:text-xs font-black text-sky-800 whitespace-nowrap">960 kg (27.8%)</span>
                 </div>
                 <div className="space-y-3 pl-2">
                    <ProgressBar label="Força Máxima" value={70.0} max={100} colorClass="bg-blue-600" subValue="672 kg (70%)" />
                    <ProgressBar label="Força Resistiva" value={30.0} max={100} colorClass="bg-blue-600" subValue="288 kg (30%)" />
                 </div>
              </div>
            </div>
          </div>

          {/* Row: Bem Estar & Atletas - Shared Width */}
          <div className="bg-white p-4 md:p-6 rounded-[40px] border border-slate-100 shadow-sm col-span-1">
            <CardHeader icon={Heart} title="Bem Estar" subtitle="Média dos Atletas (1-10)" />
            <div className="space-y-5">
              <ProgressBar label="Qualidade Sono" value={7} max={10} colorClass="bg-sky-500" />
              <ProgressBar label="Fadiga Acumulada" value={8} max={10} colorClass="bg-orange-500" />
              <ProgressBar label="Nível de Estresse" value={4} max={10} colorClass="bg-yellow-400" />
              <ProgressBar label="Dor Muscular" value={6} max={10} colorClass="bg-rose-500" />
            </div>
            <div className="mt-8 pt-4 md:pt-6 border-t border-slate-100">
               <div className="flex items-center gap-2 text-[10px] md:text-xs text-amber-600 bg-amber-50 p-2 rounded-lg font-medium">
                  <AlertTriangle size={14} className="flex-shrink-0" /> <span className="truncate">Fadiga alta detectada no ciclo.</span>
               </div>
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-[40px] border border-slate-100 shadow-sm col-span-1">
            <CardHeader icon={Users} title="Atletas" subtitle="Frequência & Evolução" />
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                 <div className="p-3 md:p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                    <span className="block text-2xl md:text-3xl font-black text-emerald-600 leading-none">15</span>
                    <span className="text-[8px] md:text-[10px] font-bold text-emerald-700 uppercase tracking-wide mt-2 block">Evoluíram</span>
                 </div>
                 <div className="p-3 md:p-4 bg-rose-50 rounded-2xl border border-rose-100 text-center">
                    <span className="block text-2xl md:text-3xl font-black text-rose-600 leading-none">2</span>
                    <span className="text-[8px] md:text-[10px] font-bold text-rose-700 uppercase tracking-wide mt-2 block">Pioraram</span>
                 </div>
              </div>
              
              <div className="space-y-4 py-4 border-y border-slate-50">
                 <div className="flex justify-between items-center text-[10px] md:text-xs">
                    <span className="text-slate-500 font-medium uppercase">Presenças Médias</span>
                    <span className="font-black text-slate-800">5 / atleta</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px] md:text-xs">
                    <span className="text-slate-500 font-medium uppercase">Média de Faltas</span>
                    <span className="font-black text-slate-800">2 / atleta</span>
                 </div>
              </div>

              <div className="space-y-3">
                 <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peso Corporal</h5>
                 <div className="flex items-center justify-between text-[10px] md:text-xs">
                    <span className="text-emerald-600 font-bold flex items-center gap-1"><TrendingUp size={12} className="flex-shrink-0"/> <span className="truncate">Ganharam Peso</span></span>
                    <span className="font-black text-slate-700 whitespace-nowrap">10 Atletas</span>
                 </div>
                 <div className="flex items-center justify-between text-[10px] md:text-xs">
                    <span className="text-rose-600 font-bold flex items-center gap-1"><TrendingUp size={12} className="rotate-180 flex-shrink-0" /> <span className="truncate">Perderam Peso</span></span>
                    <span className="font-black text-slate-700 whitespace-nowrap">32 Atletas</span>
                 </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const MacroDetail = ({ macro, onEdit, onDelete }: { macro: MacroCycle, onEdit: () => void, onDelete: () => void }) => {
  return (
  <div className="flex flex-col h-full min-h-0 animate-in fade-in duration-500">
    {/* Header Clean */}
    <div className="p-6 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 flex-shrink-0">
      <div className="space-y-4 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-md text-[10px] font-black bg-slate-100 text-slate-500 uppercase tracking-widest">Macrociclo</span>
          <span className="px-3 py-1 rounded-md text-[10px] font-black bg-orange-50 text-brand-orange uppercase tracking-widest">Em Andamento</span>
        </div>
        <div className="flex items-center gap-4">
          <h3 className="text-2xl md:text-4xl font-black text-brand-slate tracking-tighter leading-tight">
            {macro.name}
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-brand-orange hover:border-brand-orange transition-all shadow-sm" title="Editar">
              <Edit2 size={18} />
            </button>
            <button onClick={onDelete} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-500 hover:border-red-200 transition-all shadow-sm" title="Excluir">
              <Trash2 size={18} />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-bold text-slate-400">{macro.season}</span>
          <DateTag start={macro.startDate} end={macro.endDate} />
        </div>
      </div>
      <div className="hidden lg:block">
        <span className="text-7xl font-black text-slate-100 select-none tracking-tighter">#{macro.id.replace(/\D/g, '') || '01'}</span>
      </div>
    </div>

    {/* Scroll Area */}
    <div className="flex-1 min-h-0 overflow-y-auto px-6 md:px-10 pb-8 space-y-6 custom-scrollbar">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Card: Natação */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col">
          <CardHeader icon={Droplets} title="Natação" subtitle="Volume & Intensidade" />
          <div className="flex justify-between items-end mb-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Volume Total</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-brand-slate tracking-tighter">123.4</span>
                <span className="text-lg font-black text-slate-400 uppercase">km</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Treinos</span>
              <span className="text-3xl font-black text-brand-slate">67</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
            <ProgressBar label="DDR" value={61.5} max={100} colorClass="bg-emerald-500" subValue="61.5km" />
            <ProgressBar label="DCR" value={39.2} max={100} colorClass="bg-blue-500" subValue="39.2km" />
          </div>
          <div className="mt-auto bg-slate-50 px-6 py-4 rounded-2xl flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Média / Treino</span>
            <span className="text-base font-black text-brand-slate">1.850m</span>
          </div>
        </div>

        {/* Card: Preparação Física */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col">
          <CardHeader icon={Dumbbell} title="Preparação Física" subtitle="Força & Potência" />
          <div className="flex justify-between items-end mb-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Carga Tonelagem</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-brand-slate tracking-tighter">85</span>
                <span className="text-lg font-black text-slate-400 uppercase">ton</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Sessões</span>
              <span className="text-3xl font-black text-brand-slate">23</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
            <ProgressBar label="DDR" value={45.8} max={100} colorClass="bg-emerald-500" subValue="38.9t" />
            <ProgressBar label="DCR" value={72.4} max={100} colorClass="bg-blue-500" subValue="61.5t" />
          </div>
          <div className="mt-auto bg-slate-50 px-6 py-4 rounded-2xl flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peso Médio</span>
            <span className="text-base font-black text-brand-slate">820kg</span>
          </div>
        </div>

        {/* Card: Bem Estar */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <CardHeader icon={Heart} title="Bem Estar" subtitle="Média do Ciclo (1-10)" />
          <div className="space-y-6 mt-4">
             <ProgressBar label="Qualidade Sono" value={7.2} max={10} colorClass="bg-sky-500" subValue="7.2 / 10" />
             <ProgressBar label="Fadiga (PSE)" value={8.0} max={10} colorClass="bg-orange-500" subValue="8.0 / 10" />
             <ProgressBar label="Nível de Estresse" value={4.5} max={10} colorClass="bg-yellow-400" subValue="4.5 / 10" />
             <ProgressBar label="Dor Muscular" value={6.1} max={10} colorClass="bg-rose-500" subValue="6.1 / 10" />
          </div>
        </div>

        {/* Card: Atletas */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group">
          <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6 border border-orange-100 shadow-sm">
              <Activity size={40} className="text-brand-orange" />
          </div>
          <h4 className="text-lg font-black text-brand-slate mb-1 uppercase tracking-tight">Atletas</h4>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Frequência & Evolução</p>
          <div className="flex gap-4 w-full">
            <div className="flex-1 bg-emerald-50 rounded-2xl p-4 border border-emerald-100 text-center">
              <span className="block text-2xl font-black text-emerald-600 leading-none">15</span>
              <span className="text-[8px] font-black text-emerald-700 uppercase mt-2 block tracking-tight">Melhoraram</span>
            </div>
            <div className="flex-1 bg-rose-50 rounded-2xl p-4 border border-rose-100 text-center">
              <span className="block text-2xl font-black text-rose-600 leading-none">2</span>
              <span className="text-[8px] font-black text-rose-700 uppercase mt-2 block tracking-tight">Pioraram</span>
            </div>
          </div>
          <div className="w-full mt-6 pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
             <span>Presença Média</span>
             <span className="text-brand-slate font-bold">5.2 treinos/sem</span>
          </div>
        </div>

        {/* Card: Medalhas */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col lg:col-span-2 xl:col-span-1">
          <CardHeader icon={Award} title="Resultados" subtitle="Quadro de Medalhas" />
          
          <div className="space-y-8 flex-1">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Federado</p>
              <div className="flex gap-2">
                 <div className="flex-1 bg-yellow-50 text-yellow-700 border border-yellow-100 p-3 rounded-2xl text-center">
                    <span className="block text-xl font-black leading-none">3</span>
                    <span className="text-[8px] uppercase font-black tracking-tight mt-1 opacity-70 block">Ouro</span>
                 </div>
                 <div className="flex-1 bg-slate-50 text-slate-600 border border-slate-200 p-3 rounded-2xl text-center">
                    <span className="block text-xl font-black leading-none">18</span>
                    <span className="text-[8px] uppercase font-black tracking-tight mt-1 opacity-70 block">Prata</span>
                 </div>
                 <div className="flex-1 bg-orange-50 text-orange-800 border border-orange-100 p-3 rounded-2xl text-center">
                    <span className="block text-xl font-black leading-none">50</span>
                    <span className="text-[8px] uppercase font-black tracking-tight mt-1 opacity-70 block">Bronze</span>
                 </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-dashed border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Master</p>
              <div className="flex gap-2">
                 <div className="flex-1 bg-yellow-50 text-yellow-700 border border-yellow-100 p-3 rounded-2xl text-center">
                    <span className="block text-xl font-black leading-none">32</span>
                    <span className="text-[8px] uppercase font-black tracking-tight mt-1 opacity-70 block">Ouro</span>
                 </div>
                 <div className="flex-1 bg-slate-50 text-slate-600 border border-slate-200 p-3 rounded-2xl text-center">
                    <span className="block text-xl font-black leading-none">60</span>
                    <span className="text-[8px] uppercase font-black tracking-tight mt-1 opacity-70 block">Prata</span>
                 </div>
                 <div className="flex-1 bg-orange-50 text-orange-800 border border-orange-100 p-3 rounded-2xl text-center">
                    <span className="block text-xl font-black leading-none">125</span>
                    <span className="text-[8px] uppercase font-black tracking-tight mt-1 opacity-70 block">Bronze</span>
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

// --- Componente Principal ---

export const CyclesModule: React.FC = () => {
  const [macros, setMacros] = useState<MacroCycle[]>(MOCK_MACRO);
  const [selectedMicro, setSelectedMicro] = useState<MicroCycle | null>(null);
  const [selectedMacro, setSelectedMacro] = useState<MacroCycle | null>(null);
  const [selectedMeso, setSelectedMeso] = useState<MesoCycle | null>(null);

  const [modalType, setModalType] = useState<'NONE' | 'MACRO' | 'MESO' | 'MICRO'>('NONE');
  const [targetParentId, setTargetParentId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{id: string, type: 'MACRO' | 'MESO' | 'MICRO'} | null>(null);

  const [formName, setFormName] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formArchitecture, setFormArchitecture] = useState('');

  const handleMacroClick = (id: string) => {
    setMacros(macros.map(m => m.id === id ? { ...m, isExpanded: !m.isExpanded } : m));
    const macro = macros.find(m => m.id === id);
    if (macro) {
        setSelectedMacro(macro);
        setSelectedMicro(null);
        setSelectedMeso(null);
    }
  };

  const handleMesoClick = (macroId: string, meso: MesoCycle, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMeso(meso);
    setSelectedMacro(null);
    setSelectedMicro(null);
  };

  const toggleMeso = (macroId: string, mesoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMacros(macros.map(m => {
      if (m.id !== macroId) return m;
      return {
        ...m,
        mesos: m.mesos.map(meso => meso.id === mesoId ? { ...meso, isExpanded: !meso.isExpanded } : meso)
      };
    }));
  };

  const handleMicroClick = (micro: MicroCycle, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedMicro(micro);
      setSelectedMacro(null);
      setSelectedMeso(null);
  }

  const resetForm = () => {
      setFormName('');
      setFormStartDate('');
      setFormEndDate('');
      setFormModel('');
      setFormArchitecture('');
      setEditingId(null);
  };

  const openMacroModal = () => {
      resetForm();
      setModalType('MACRO');
  };

  const openMesoModal = (e: React.MouseEvent | null, macroId: string) => {
      if (e) e.stopPropagation();
      resetForm();
      setTargetParentId(macroId);
      setModalType('MESO');
  };

  const openMicroModal = (e: React.MouseEvent | null, mesoId: string) => {
      if (e) e.stopPropagation();
      resetForm();
      setTargetParentId(mesoId);
      setModalType('MICRO');
  };

  const closeModal = () => {
      setModalType('NONE');
      setTargetParentId(null);
      setEditingId(null);
  };
  
  const handleEdit = (id: string, type: 'MACRO' | 'MESO' | 'MICRO') => {
      setEditingId(id);
      
      if (type === 'MACRO') {
          const macro = macros.find(m => m.id === id);
          if (macro) {
              setFormName(macro.name);
              setFormStartDate(macro.startDate || '');
              setFormEndDate(macro.endDate || '');
              setFormModel(macro.model || '');
              setFormArchitecture(macro.architecture || '');
              setModalType('MACRO');
          }
      } else if (type === 'MESO') {
          for (const m of macros) {
              const meso = m.mesos.find(me => me.id === id);
              if (meso) {
                  setFormName(meso.name);
                  setFormStartDate(meso.startDate || '');
                  setFormEndDate(meso.endDate || '');
                  setModalType('MESO');
                  setTargetParentId(m.id); 
                  break;
              }
          }
      } else if (type === 'MICRO') {
          for (const m of macros) {
              for (const me of m.mesos) {
                  const micro = me.micros.find(mi => mi.id === id);
                  if (micro) {
                      setFormName(micro.name);
                      setFormStartDate(micro.startDate || '');
                      setFormEndDate(micro.endDate || '');
                      setModalType('MICRO');
                      setTargetParentId(me.id);
                      break;
                  }
              }
          }
      }
  };

  const handleDelete = (id: string, type: 'MACRO' | 'MESO' | 'MICRO') => {
      setDeleteTarget({ id, type });
      setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
      if (!deleteTarget) return;
      const { id, type } = deleteTarget;

      if (type === 'MACRO') {
          setMacros(macros.filter(m => m.id !== id));
          if (selectedMacro?.id === id) setSelectedMacro(null);
      } else if (type === 'MESO') {
          setMacros(macros.map(m => ({
              ...m,
              mesos: m.mesos.filter(me => me.id !== id)
          })));
          if (selectedMeso?.id === id) setSelectedMeso(null);
      } else if (type === 'MICRO') {
          setMacros(macros.map(m => ({
              ...m,
              mesos: m.mesos.map(me => ({
                  ...me,
                  micros: me.micros.filter(mi => mi.id !== id)
              }))
          })));
          if (selectedMicro?.id === id) setSelectedMicro(null);
      }
      
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
  };

  const handleSaveMacro = () => {
      if (editingId) {
          setMacros(macros.map(m => m.id === editingId ? {
              ...m,
              name: formName,
              startDate: formStartDate,
              endDate: formEndDate,
              model: formModel,
              architecture: formArchitecture
          } : m));
      } else {
          const newMacro: MacroCycle = {
              id: Date.now().toString(),
              name: formName,
              season: 'Nova Temporada',
              startDate: formStartDate,
              endDate: formEndDate,
              model: formModel,
              architecture: formArchitecture,
              isExpanded: true,
              mesos: []
          };
          setMacros([...macros, newMacro]);
      }
      closeModal();
  };

  const handleSaveMeso = () => {
      if (editingId) {
          setMacros(macros.map(m => ({
              ...m,
              mesos: m.mesos.map(me => me.id === editingId ? {
                  ...me,
                  name: formName,
                  startDate: formStartDate,
                  endDate: formEndDate
              } : me)
          })));
      } else {
          if (!targetParentId) return;
          const newMeso: MesoCycle = {
              id: Date.now().toString(),
              name: formName || 'Novo Mesociclo',
              startDate: formStartDate,
              endDate: formEndDate,
              isExpanded: true,
              micros: []
          };
          
          setMacros(macros.map(m => {
              if (m.id === targetParentId) {
                  return { ...m, mesos: [...m.mesos, newMeso] };
              }
              return m;
          }));
      }
      closeModal();
  };

  const handleSaveMicro = () => {
      if (editingId) {
           setMacros(macros.map(macro => ({
              ...macro,
              mesos: macro.mesos.map(meso => ({
                  ...meso,
                  micros: meso.micros.map(micro => micro.id === editingId ? {
                      ...micro,
                      name: formName,
                      startDate: formStartDate,
                      endDate: formEndDate
                  } : micro)
              }))
          })));
      } else {
          if (!targetParentId) return;
          const newMicro: MicroCycle = {
              id: Date.now().toString(),
              name: formName || 'Novo Micro',
              startDate: formStartDate,
              endDate: formEndDate,
              focus: ['Geral'],
              volume: 0,
              intensity: 'Medium'
          };

          setMacros(prevMacros => prevMacros.map(macro => ({
              ...macro,
              mesos: macro.mesos.map(meso => {
                  if (meso.id === targetParentId) {
                      return { ...meso, micros: [...meso.micros, newMicro] };
                  }
                  return meso;
              })
          })));
      }
      closeModal();
  };

  const handleAddMeso = (e: React.MouseEvent, macroId: string) => {
      e.stopPropagation();
      openMesoModal(e, macroId);
  };


  return (
    <div className="h-full flex flex-col space-y-4 md:space-y-6 relative overflow-hidden">
      <header className="flex justify-between items-center flex-shrink-0 px-1">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Gestão da Planificação</h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Planejamento Estratégico</p>
        </div>
        <button 
            onClick={openMacroModal}
            className="bg-brand-orange hover:bg-orange-600 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20 font-medium text-sm md:text-base"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Novo Macrociclo</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-8 flex-1 min-h-0 overflow-hidden">
        {/* Left: Hierarchy Tree - Modernized without action buttons */}
        <div className="lg:w-80 flex-shrink-0 space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[300px] lg:max-h-none">
          {macros.map(macro => (
            <div key={macro.id} className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden transition-all group relative flex flex-col mb-4">
              <div 
                className={`flex items-center justify-between p-4 md:p-5 cursor-pointer transition-colors ${selectedMacro?.id === macro.id ? 'bg-orange-50/50' : 'bg-white hover:bg-slate-50'}`}
                onClick={() => handleMacroClick(macro.id)}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${macro.isExpanded ? 'bg-brand-orange text-white' : 'bg-slate-100 text-slate-400'}`}>
                     {macro.isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className={`font-bold text-[11px] md:text-xs truncate ${selectedMacro?.id === macro.id ? 'text-brand-orange' : 'text-slate-700'}`}>{macro.name}</h3>
                    <span className="text-[8px] md:text-[9px] text-slate-400 font-medium uppercase tracking-wider mb-2">{macro.season}</span>
                    <DateTag start={macro.startDate} end={macro.endDate} />
                  </div>
                </div>
              </div>

              {macro.isExpanded && (
                <div className="bg-slate-50/30 border-t border-slate-100 p-2 md:p-3">
                  <div className="space-y-3">
                    {macro.mesos.map(meso => (
                        <div key={meso.id} className="relative pl-4">
                        {/* Tree Line */}
                        <div className="absolute left-0 top-3 bottom-0 w-px bg-slate-200"></div>
                        
                        <div className="py-1 mt-1 group/meso relative">
                          <div 
                            className={`flex items-center justify-between p-2 rounded-xl transition-all border ${selectedMeso?.id === meso.id ? 'bg-white shadow-md border-orange-200 ring-1 ring-orange-50' : 'bg-transparent border-transparent hover:bg-white/80 hover:border-slate-200'}`}
                          >
                             <div className="flex items-center gap-2 relative z-10 flex-1 min-w-0">
                                <div className="absolute -left-[21px] top-1/2 -translate-y-1/2 w-4 h-px bg-slate-200"></div>
                                
                                <button 
                                    onClick={(e) => toggleMeso(macro.id, meso.id, e)}
                                    className={`p-1 rounded-md flex-shrink-0 transition-all ${meso.isExpanded ? 'bg-orange-50 text-brand-orange' : 'text-slate-400 hover:text-brand-orange hover:bg-white'}`}
                                >
                                    <ChevronRight size={12} className={`transition-transform duration-200 ${meso.isExpanded ? 'rotate-90' : ''}`} />
                                </button>

                                <div 
                                    className="flex flex-col gap-1 flex-1 cursor-pointer py-1 min-w-0 group/meso-content" 
                                    onClick={(e) => handleMesoClick(macro.id, meso, e)}
                                >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className={`font-bold text-[11px] md:text-xs truncate transition-colors ${selectedMeso?.id === meso.id ? 'text-brand-orange' : 'text-slate-700 group-hover/meso-content:text-brand-orange'}`}>
                                            {meso.name}
                                        </span>
                                    </div>
                                    <div className="overflow-hidden">
                                        <DateTag start={meso.startDate} end={meso.endDate} className={selectedMeso?.id === meso.id ? 'bg-orange-50/50 border-orange-100' : 'bg-slate-50 border-slate-100'} />
                                    </div>
                                </div>
                             </div>
                          </div>

                          {meso.isExpanded && (
                            <div className="mt-2 space-y-2 ml-6 border-l border-slate-200 pl-4 py-1">
                              {meso.micros.map(micro => (
                                <div key={micro.id} className="group/micro flex flex-col">
                                    <div 
                                    onClick={(e) => handleMicroClick(micro, e)}
                                    className={`relative p-2 md:p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${selectedMicro?.id === micro.id ? 'border-brand-orange bg-white shadow-md shadow-orange-100' : 'border-slate-200 bg-white hover:border-brand-orange/30 hover:shadow-sm'}`}
                                    >
                                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-px bg-slate-200"></div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-[9px] md:text-[11px] text-slate-700 truncate">{micro.name}</h4>
                                        <div className="mt-2 overflow-hidden">
                                        <DateTag start={micro.startDate} end={micro.endDate} className="bg-slate-50 border-transparent shadow-none" />
                                        </div>
                                    </div>
                                    
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ml-2 ${micro.intensity === 'High' ? 'bg-red-400' : micro.intensity === 'Medium' ? 'bg-yellow-400' : 'bg-emerald-400'}`}></div>
                                    </div>
                                </div>
                              ))}
                              <button 
                                onClick={(e) => openMicroModal(e, meso.id)}
                                className="relative w-full py-2 text-[10px] md:text-xs font-medium text-slate-400 border border-dashed border-slate-300 rounded-xl hover:border-brand-orange hover:text-brand-orange transition-colors flex justify-center items-center gap-2 bg-white/50"
                              >
                                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-px bg-slate-200"></div>
                                <Plus size={12} /> Novo Micro
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Botão Novo Mesociclo - Dentro do Macro */}
                    <div className="relative pl-4 mt-2">
                        <div className="absolute left-0 top-0 h-4 w-px bg-slate-200"></div>
                        <div className="absolute left-0 top-4 w-4 h-px bg-slate-200"></div>
                        <button 
                            onClick={(e) => handleAddMeso(e, macro.id)}
                            className="w-full py-2 text-[10px] md:text-xs font-bold text-slate-500 border border-slate-200 bg-white rounded-xl hover:border-brand-orange hover:text-brand-orange hover:shadow-sm transition-all flex justify-center items-center gap-2"
                        >
                            <Plus size={12} /> Adicionar Mesociclo
                        </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right: Details Panel - Clean & Modern */}
        <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-[40px] overflow-hidden flex flex-col border border-slate-200 shadow-sm text-slate-800 min-h-0">
          <div className="flex-1 min-h-0 flex flex-col">
            {selectedMicro ? (
                <MicroDetail 
                  micro={selectedMicro} 
                  onEdit={() => handleEdit(selectedMicro.id, 'MICRO')} 
                  onDelete={() => handleDelete(selectedMicro.id, 'MICRO')} 
                />
            ) : selectedMeso ? (
                <MesoDetail 
                  meso={selectedMeso} 
                  onEdit={() => handleEdit(selectedMeso.id, 'MESO')} 
                  onDelete={() => handleDelete(selectedMeso.id, 'MESO')} 
                />
            ) : selectedMacro ? (
                <MacroDetail 
                  macro={selectedMacro} 
                  onEdit={() => handleEdit(selectedMacro.id, 'MACRO')} 
                  onDelete={() => handleDelete(selectedMacro.id, 'MACRO')} 
                />
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 bg-white rounded-2xl border border-dashed border-slate-200 m-4">
                <TrendingUp size={64} strokeWidth={1} className="opacity-50" />
                <p className="font-medium text-sm md:text-lg text-center px-4">Selecione um ciclo para visualizar o dashboard.</p>
                </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modals for creation/editing */}
      {modalType !== 'NONE' && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[95vh]">
              <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
                 <h3 className="text-lg md:text-xl font-bold text-slate-800">
                    {editingId ? 'Editar' : 'Criar'} {modalType === 'MACRO' ? 'Macrociclo' : modalType === 'MESO' ? 'Mesociclo' : 'Microciclo'}
                 </h3>
                 <button onClick={closeModal} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400"><X size={20} /></button>
              </div>
              <div className="p-6 md:p-8 space-y-4 md:space-y-6 overflow-y-auto custom-scrollbar">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nome do Ciclo</label>
                    <input 
                       type="text" 
                       value={formName} 
                       onChange={e => setFormName(e.target.value)}
                       placeholder="Ex: Preparação Geral" 
                       className="w-full p-3 md:p-4 bg-slate-50 border border-slate-200 rounded-2xl text-base md:text-lg font-bold text-slate-700 focus:border-brand-orange focus:bg-white outline-none transition-all shadow-inner" 
                    />
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Data Início</label>
                       <input 
                          type="date" 
                          value={formStartDate} 
                          onChange={e => setFormStartDate(e.target.value)}
                          className="w-full p-3 md:p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-brand-orange transition-all" 
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Data Fim</label>
                       <input 
                          type="date" 
                          value={formEndDate} 
                          onChange={e => setFormEndDate(e.target.value)}
                          className="w-full p-3 md:p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-brand-orange transition-all" 
                       />
                    </div>
                 </div>
                 {modalType === 'MACRO' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Modelo</label>
                          <input type="text" value={formModel} onChange={e => setFormModel(e.target.value)} placeholder="Ex: ATR" className="w-full p-3 md:p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-brand-orange" />
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Arquitetura</label>
                          <input type="text" value={formArchitecture} onChange={e => setFormArchitecture(e.target.value)} placeholder="Ex: Analítica" className="w-full p-3 md:p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-brand-orange" />
                       </div>
                    </div>
                 )}
              </div>
              <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 flex-shrink-0">
                 <button onClick={closeModal} className="px-4 md:px-6 py-2 md:py-3 text-sm md:text-base text-slate-500 font-bold hover:bg-white rounded-xl transition-colors">Cancelar</button>
                 <button 
                    onClick={modalType === 'MACRO' ? handleSaveMacro : modalType === 'MESO' ? handleSaveMeso : handleSaveMicro}
                    className="px-6 md:px-8 py-2 md:py-3 bg-brand-orange text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-orange-500/20 hover:scale-105 transition-all"
                 >
                    Salvar Ciclo
                 </button>
              </div>
           </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-brand-slate/60 z-[200] flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl text-center flex flex-col items-center animate-in zoom-in-95 duration-200">
                <div className="w-16 md:w-20 h-16 md:h-20 bg-red-50 rounded-full flex items-center justify-center mb-4 md:mb-6 border border-red-100">
                    <AlertTriangle size={32} className="text-red-500 md:w-10 md:h-10" />
                </div>
                <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-2 tracking-tight">Excluir Permanente?</h3>
                <p className="text-xs md:text-sm text-slate-500 mb-6 md:mb-8 leading-relaxed px-2">Você está prestes a remover este ciclo e todos os seus itens vinculados. Esta ação não pode ser desfeita.</p>
                <div className="flex gap-3 w-full">
                    <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 md:py-4 text-sm md:text-base text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-colors">Manter</button>
                    <button onClick={confirmDelete} className="flex-1 py-3 md:py-4 bg-red-500 text-white font-black uppercase text-[10px] md:text-xs tracking-widest rounded-2xl hover:bg-red-600 shadow-lg shadow-red-200 transition-all">Excluir</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
