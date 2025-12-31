
import React, { useState, useMemo, useEffect } from 'react';
// ... imports ...
import {
    User,
    Search,
    Plus,
    Edit2,
    Trash2,
    Lock,
    Unlock,
    X,
    Mail,
    Phone,
    MapPin,
    IdCard,
    Calendar,
    Tag,
    Camera,
    MoreVertical,
    CheckCircle2,
    AlertTriangle,
    ChevronLeft,
    Save
} from 'lucide-react';
import { Athlete } from '@/types';
import { athleteService } from '@/services/athleteService'; // Import service

type ViewMode = 'LIST' | 'FORM';

export default function AthletesPage() {
    const [athletes, setAthletes] = useState<Athlete[]>([]); // Init empty
    const [isLoading, setIsLoading] = useState(true); // Add loading state
    const [viewMode, setViewMode] = useState<ViewMode>('LIST');
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Todos');
    const [statusFilter, setStatusFilter] = useState('Todos');

    const loadAthletes = async () => {
        try {
            setIsLoading(true);
            const data = await athleteService.getAll();
            setAthletes(data);
        } catch (error) {
            console.error("Failed to load athletes", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAthletes();
    }, []);

    const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Athlete>>({
        firstName: '',
        lastName: '',
        birthDate: '',
        cpf: '',
        address: '',
        email: '',
        phone: '',
        category: 'Absoluto',
        avatarUrl: '',
        status: 'Active'
    });

    const filteredAthletes = useMemo(() => {
        return athletes.filter(a => {
            const matchSearch = (a.firstName + ' ' + a.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.cpf.includes(searchTerm) ||
                a.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchCategory = categoryFilter === 'Todos' || a.category === categoryFilter;
            const matchStatus = statusFilter === 'Todos' || (statusFilter === 'Ativos' && a.status === 'Active') || (statusFilter === 'Bloqueados' && a.status === 'Blocked');
            return matchSearch && matchCategory && matchStatus;
        });
    }, [athletes, searchTerm, categoryFilter, statusFilter]);

    const handleOpenForm = (athlete?: Athlete) => {
        if (athlete) {
            setEditingAthlete(athlete);
            setFormData({ ...athlete });
        } else {
            setEditingAthlete(null);
            setFormData({
                firstName: '',
                lastName: '',
                birthDate: '',
                cpf: '',
                address: '',
                email: '',
                phone: '',
                category: 'Absoluto',
                avatarUrl: '',
                status: 'Active'
            });
        }
        setViewMode('FORM');
    };

    const handleSave = async () => {
        if (!formData.firstName || !formData.lastName || !formData.cpf) {
            alert('Por favor, preencha os campos obrigatórios (Nome, Sobrenome e CPF).');
            return;
        }

        try {
            if (editingAthlete) {
                await athleteService.update(editingAthlete.id, formData as Athlete);
            } else {
                await athleteService.create(formData as Athlete);
            }
            await loadAthletes(); // Refresh list
            setViewMode('LIST');
        } catch (error) {
            console.error("Error saving athlete", error);
            alert("Erro ao salvar atleta.");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await athleteService.delete(id);
            await loadAthletes();
            setShowDeleteConfirm(null);
        } catch (error) {
            console.error("Error deleting athlete", error);
            alert("Erro ao remover atleta.");
        }
    };

    const toggleStatus = async (id: string) => {
        try {
            const athlete = athletes.find(a => a.id === id);
            if (athlete) {
                const newStatus = athlete.status === 'Active' ? 'Blocked' : 'Active';
                await athleteService.update(id, { status: newStatus });
                await loadAthletes();
            }
        } catch (error) {
            console.error("Error updating status", error);
        }
    };

    const categories = ['Todos', 'Absoluto', 'Infantil', 'Petiz', 'Master'];

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">

            {viewMode === 'LIST' ? (
                <>
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
                        <div>
                            <h2 className="text-2xl font-black text-brand-slate tracking-tighter leading-none">Atletas</h2>
                            <p className="text-slate-500 font-medium mt-1 text-[10px] tracking-widest">Gestão de elenco e cadastros</p>
                        </div>
                        <button
                            onClick={() => handleOpenForm()}
                            className="bg-brand-orange text-white px-7 py-3 rounded-2xl font-black text-xs shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 tracking-widest"
                        >
                            <Plus size={18} /> Novo Atleta
                        </button>
                    </header>

                    {/* Filters */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-6">
                        <div className="flex-1 min-w-[240px] relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por nome, CPF ou e-mail..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:border-brand-orange focus:bg-white outline-none transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-400 tracking-widest">Categoria:</span>
                            <div className="flex gap-1">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategoryFilter(cat)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${categoryFilter === cat ? 'bg-brand-slate text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-400 tracking-widest">Status:</span>
                            <div className="flex gap-1">
                                {['Todos', 'Ativos', 'Bloqueados'].map(st => (
                                    <button
                                        key={st}
                                        onClick={() => setStatusFilter(st)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${statusFilter === st ? 'bg-brand-orange text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Athlete Grid */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredAthletes.map(a => (
                                <div key={a.id} className={`bg-white rounded-[32px] border transition-all group shadow-sm hover:shadow-xl ${a.status === 'Blocked' ? 'border-red-100 opacity-80' : 'border-slate-100'}`}>
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center border-2 overflow-hidden shadow-inner ${a.status === 'Blocked' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-100'}`}>
                                                    {a.avatarUrl ? (
                                                        <img src={a.avatarUrl} alt={a.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className={a.status === 'Blocked' ? 'text-red-300' : 'text-brand-orange'} size={28} />
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black text-brand-slate leading-none tracking-tight">{a.name}</h3>
                                                    <span className="text-[10px] font-black text-slate-400 tracking-widest mt-2 inline-block bg-slate-50 px-2 py-0.5 rounded">{a.category}</span>
                                                    <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] font-black tracking-tighter ${a.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${a.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                                        {a.status === 'Active' ? 'Ativo' : 'Bloqueado'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenForm(a)}
                                                    className="p-2 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded-xl transition-all"
                                                    title="Editar cadastro"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => toggleStatus(a.id)}
                                                    className={`p-2 rounded-xl transition-all ${a.status === 'Active' ? 'text-slate-400 hover:text-amber-500 hover:bg-amber-50' : 'text-amber-500 bg-amber-50 hover:bg-amber-100'}`}
                                                    title={a.status === 'Active' ? 'Bloquear atleta' : 'Desbloquear atleta'}
                                                >
                                                    {a.status === 'Active' ? <Lock size={18} /> : <Unlock size={18} />}
                                                </button>
                                                <button
                                                    onClick={() => setShowDeleteConfirm(a.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                    title="Remover cadastro"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-6 border-t border-slate-50">
                                            <div className="flex items-center gap-3 text-slate-500">
                                                <Mail size={14} className="text-slate-300" />
                                                <span className="text-xs font-bold truncate">{a.email}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-500">
                                                <Phone size={14} className="text-slate-300" />
                                                <span className="text-xs font-bold">{a.phone}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-500">
                                                <IdCard size={14} className="text-slate-300" />
                                                <span className="text-xs font-bold">CPF: {a.cpf}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-500">
                                                <MapPin size={14} className="text-slate-300" />
                                                <span className="text-xs font-bold truncate">{a.address}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {filteredAthletes.length === 0 && (
                            <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                    <User size={40} />
                                </div>
                                <p className="text-slate-400 font-bold text-xs tracking-widest">Nenhum atleta encontrado com esses filtros.</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="h-full flex flex-col max-w-5xl mx-auto space-y-8 pb-20 animate-in slide-in-from-right-4">
                    <header className="flex items-center justify-between bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm sticky top-0 z-20">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => setViewMode('LIST')}
                                className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-white hover:text-brand-orange hover:shadow-md transition-all"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <div>
                                <h2 className="text-2xl font-black text-brand-slate tracking-tight leading-none">
                                    {editingAthlete ? 'Editar Atleta' : 'Novo Cadastro'}
                                </h2>
                                <p className="text-[10px] font-black text-slate-400 tracking-widest mt-1">Preencha as informações do atleta</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSave}
                            className="bg-brand-orange text-white px-10 py-3.5 rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                        >
                            <Save size={18} /> Salvar Cadastro
                        </button>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Photo & Basic Status */}
                        <div className="lg:col-span-1 space-y-8">
                            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col items-center">
                                <div className="w-40 h-40 rounded-[48px] bg-slate-50 border-4 border-white shadow-xl overflow-hidden relative group cursor-pointer">
                                    {formData.avatarUrl ? (
                                        <img src={formData.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                            <Camera size={40} />
                                            <span className="text-[8px] font-black tracking-widest mt-2">Upload Foto</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-brand-slate/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                        <Camera size={32} />
                                    </div>
                                </div>
                                <div className="mt-8 w-full">
                                    <label className="text-[10px] font-black text-slate-400 tracking-widest mb-2 block">Link da Foto (URL)</label>
                                    <input
                                        type="text"
                                        value={formData.avatarUrl}
                                        onChange={e => setFormData({ ...formData, avatarUrl: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:border-brand-orange outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
                                <h4 className="text-[10px] font-black text-slate-400 tracking-widest mb-6">Configurações Adicionais</h4>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 tracking-widest mb-2 block">Categoria</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none appearance-none focus:border-brand-orange transition-all"
                                        >
                                            {categories.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 tracking-widest mb-2 block">Status Inicial</label>
                                        <div className="flex p-1 bg-slate-50 rounded-2xl border border-slate-200">
                                            <button
                                                onClick={() => setFormData({ ...formData, status: 'Active' })}
                                                className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${formData.status === 'Active' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400'}`}
                                            >
                                                Ativo
                                            </button>
                                            <button
                                                onClick={() => setFormData({ ...formData, status: 'Blocked' })}
                                                className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${formData.status === 'Blocked' ? 'bg-white text-red-600 shadow-md' : 'text-slate-400'}`}
                                            >
                                                Bloqueado
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Form Data */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-10">

                                {/* Personal Info */}
                                <div className="space-y-6">
                                    <h4 className="flex items-center gap-3 text-sm font-black text-brand-slate tracking-tight border-b border-slate-100 pb-4">
                                        <User className="text-brand-orange" size={20} /> Informações Pessoais
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 tracking-widest mb-2 block">Nome *</label>
                                            <input
                                                type="text"
                                                value={formData.firstName}
                                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-brand-orange transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 tracking-widest mb-2 block">Sobrenome *</label>
                                            <input
                                                type="text"
                                                value={formData.lastName}
                                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-brand-orange transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 tracking-widest mb-2 block">CPF *</label>
                                            <input
                                                type="text"
                                                value={formData.cpf}
                                                onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                                                placeholder="000.000.000-00"
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-brand-orange transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 tracking-widest mb-2 block">Data de Nascimento</label>
                                            <input
                                                type="date"
                                                value={formData.birthDate}
                                                onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-brand-orange transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="space-y-6">
                                    <h4 className="flex items-center gap-3 text-sm font-black text-brand-slate tracking-tight border-b border-slate-100 pb-4">
                                        <Mail className="text-brand-orange" size={20} /> Contato & Endereço
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 tracking-widest mb-2 block">E-mail</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="atleta@email.com"
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-brand-orange transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 tracking-widest mb-2 block">Telefone</label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="(00) 00000-0000"
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-brand-orange transition-all"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-[10px] font-black text-slate-400 tracking-widest mb-2 block">Endereço Completo</label>
                                            <input
                                                type="text"
                                                value={formData.address}
                                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                                placeholder="Rua, Número, Bairro, Cidade, Estado"
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-brand-orange transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-brand-slate/80 z-[300] backdrop-blur-xl flex items-center justify-center p-6">
                    <div className="bg-white rounded-[40px] p-10 max-w-sm w-full shadow-2xl text-center flex flex-col items-center animate-in zoom-in-95">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100">
                            <AlertTriangle size={48} className="text-red-500" />
                        </div>
                        <h3 className="text-2xl font-black text-brand-slate mb-2 tracking-tighter leading-none">Excluir Atleta?</h3>
                        <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed text-[10px] tracking-widest">
                            Essa ação removerá permanentemente o cadastro de {athletes.find(a => a.id === showDeleteConfirm)?.name} do sistema.
                        </p>
                        <div className="flex gap-4 w-full">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="flex-1 py-4 text-xs font-black tracking-widest text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDelete(showDeleteConfirm)}
                                className="flex-1 py-4 bg-red-500 text-white font-black text-xs tracking-widest rounded-2xl shadow-xl hover:bg-red-600 active:scale-95 transition-all"
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
