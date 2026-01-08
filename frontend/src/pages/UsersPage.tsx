
import React, { useState, useMemo, useEffect } from 'react';
import {
    Plus, Search, Edit2, Trash2, User, Mail, Smartphone, Hash, Eye, AlertCircle,
    Filter, ChevronUp, ChevronDown, Lock, Unlock, X, Phone, IdCard, Camera,
    CheckCircle2, AlertTriangle, ChevronLeft, Save, UserCog, Shield, Users
} from 'lucide-react';
import { UserProfile } from '@/types';
import { userService } from '@/services/userService';

type ViewMode = 'LIST' | 'FORM';

// --- Helpers ---
const validateCPF = (cpf: string) => {
    const strCPF = cpf.replace(/[^\d]/g, '');
    if (strCPF.length !== 11) return false;
    if (/^(\d)\1+$/.test(strCPF)) return false;

    let sum = 0;
    let remainder;
    for (let i = 1; i <= 9; i++) sum = sum + parseInt(strCPF.substring(i - 1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(strCPF.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) sum = sum + parseInt(strCPF.substring(i - 1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(strCPF.substring(10, 11))) return false;
    return true;
};

const formatCPF = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

const formatPhone = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
};

const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export default function UsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('LIST');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [showFilters, setShowFilters] = useState(false);

    // Modal for user type selection
    const [showTypeModal, setShowTypeModal] = useState(false);

    const loadUsers = async () => {
        try {
            setIsLoading(true);
            const data = await userService.getAll();
            setUsers(data);
        } catch (error) {
            console.error("Failed to load users", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<{
        fullName: string;
        email: string;
        password: string;
        cpf: string;
        phone: string;
        avatarUrl: string;
        isActive: boolean;
    }>({
        fullName: '',
        email: '',
        password: '',
        cpf: '',
        phone: '',
        avatarUrl: '',
        isActive: true
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (u.cpf && u.cpf.includes(searchTerm));
            const matchStatus = statusFilter === 'Todos' ||
                (statusFilter === 'Ativos' && u.isActive) ||
                (statusFilter === 'Bloqueados' && !u.isActive);
            return matchSearch && matchStatus;
        });
    }, [users, searchTerm, statusFilter]);

    const handleOpenForm = (user?: UserProfile) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                fullName: user.fullName,
                email: user.email,
                password: '',
                cpf: user.cpf || '',
                phone: user.phone || '',
                avatarUrl: user.avatarUrl || '',
                isActive: user.isActive
            });
            setViewMode('FORM');
        } else {
            setShowTypeModal(true);
        }
        setFormErrors({});
    };

    const handleSelectUserType = (type: 'COACH' | 'ATHLETE') => {
        if (type === 'ATHLETE') return; // Disabled for now

        setEditingUser(null);
        setFormData({
            fullName: '',
            email: '',
            password: '',
            cpf: '',
            phone: '',
            avatarUrl: '',
            isActive: true
        });
        setShowTypeModal(false);
        setViewMode('FORM');
    };

    const handleSave = async () => {
        const newErrors: Record<string, string> = {};

        if (!formData.fullName?.trim()) newErrors.fullName = 'Campo obrigatório';
        if (!formData.email?.trim()) newErrors.email = 'Campo obrigatório';
        else if (!validateEmail(formData.email)) newErrors.email = 'E-mail inválido';

        if (!editingUser && !formData.password?.trim()) newErrors.password = 'Campo obrigatório';

        if (formData.cpf && !validateCPF(formData.cpf)) newErrors.cpf = 'CPF inválido';

        if (Object.keys(newErrors).length > 0) {
            setFormErrors(newErrors);
            return;
        }

        try {
            if (editingUser) {
                await userService.update(editingUser.id, {
                    fullName: formData.fullName,
                    email: formData.email,
                    password: formData.password || undefined,
                    cpf: formData.cpf,
                    phone: formData.phone,
                    avatarUrl: formData.avatarUrl,
                    isActive: formData.isActive,
                });
            } else {
                await userService.create({
                    fullName: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                    cpf: formData.cpf,
                    phone: formData.phone,
                    avatarUrl: formData.avatarUrl,
                    role: 'COACH',
                });
            }
            await loadUsers();
            setViewMode('LIST');
        } catch (error: any) {
            console.error("Error saving user", error);
            if (error.response?.data?.detail) {
                if (typeof error.response.data.detail === 'string') {
                    setFormErrors({ email: error.response.data.detail });
                }
            }
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await userService.delete(id);
            await loadUsers();
            setShowDeleteConfirm(null);
        } catch (error) {
            console.error("Error deleting user", error);
        }
    };

    const toggleStatus = async (id: string) => {
        try {
            const user = users.find(u => u.id === id);
            if (user) {
                await userService.update(id, { isActive: !user.isActive });
                await loadUsers();
            }
        } catch (error) {
            console.error("Error updating status", error);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">

            {viewMode === 'LIST' ? (
                <>
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
                        <div className="flex items-center gap-2">
                            <div>
                                <h2 className="text-2xl font-black text-brand-slate tracking-tighter leading-none">Usuários</h2>
                                <p className="text-slate-500 font-medium mt-1 text-[10px] tracking-widest">Gestão de acessos e cadastros</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleOpenForm()}
                            className="bg-brand-orange text-white px-7 py-3 rounded-2xl font-black text-xs shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 tracking-widest"
                        >
                            <Plus size={18} /> Novo Usuário
                        </button>
                    </header>

                    {/* Filters */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-4 md:p-6 flex flex-col gap-4 md:gap-6">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por nome, e-mail ou CPF..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:border-brand-orange focus:bg-white outline-none transition-all"
                            />
                        </div>

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

                        <div className={`${showFilters ? 'flex' : 'hidden md:flex'} flex-col md:flex-row md:items-center gap-6 animate-in slide-in-from-top-2`}>
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase whitespace-nowrap">Status:</span>
                                <div className="flex flex-wrap gap-1">
                                    {['Todos', 'Ativos', 'Bloqueados'].map(st => (
                                        <button
                                            key={st}
                                            onClick={() => setStatusFilter(st)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all tracking-widest whitespace-nowrap border border-transparent ${statusFilter === st ? 'bg-brand-orange text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                        >
                                            {st}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* User Grid */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
                        {isLoading ? (
                            <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
                                <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-slate-400 font-bold text-xs tracking-widest">Carregando...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredUsers.map(u => (
                                    <div key={u.id} className={`bg-white rounded-[32px] border transition-all group shadow-sm hover:shadow-xl ${!u.isActive ? 'border-red-100 opacity-80' : 'border-slate-100'}`}>
                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center border-2 overflow-hidden shadow-inner ${!u.isActive ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-100'}`}>
                                                        {u.avatarUrl ? (
                                                            <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <UserCog className={!u.isActive ? 'text-red-300' : 'text-brand-orange'} size={28} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-black text-brand-slate leading-none tracking-tight">{u.fullName}</h3>
                                                        <span className="text-[10px] font-black text-slate-400 tracking-widest mt-2 inline-block bg-slate-50 px-2 py-0.5 rounded">
                                                            {u.role === 'COACH' ? 'Professor' : u.role}
                                                        </span>
                                                        <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] font-black tracking-tighter ${u.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                                            {u.isActive ? 'Ativo' : 'Bloqueado'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleOpenForm(u)}
                                                        className="p-2 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded-xl transition-all"
                                                        title="Editar cadastro"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleStatus(u.id)}
                                                        className={`p-2 rounded-xl transition-all ${u.isActive ? 'text-slate-400 hover:text-amber-500 hover:bg-amber-50' : 'text-amber-500 bg-amber-50 hover:bg-amber-100'}`}
                                                        title={u.isActive ? 'Bloquear usuário' : 'Desbloquear usuário'}
                                                    >
                                                        {u.isActive ? <Lock size={18} /> : <Unlock size={18} />}
                                                    </button>
                                                    <button
                                                        onClick={() => setShowDeleteConfirm(u.id)}
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
                                                    <span className="text-xs font-bold truncate">{u.email}</span>
                                                </div>
                                                {u.phone && (
                                                    <div className="flex items-center gap-3 text-slate-500">
                                                        <Phone size={14} className="text-slate-300" />
                                                        <span className="text-xs font-bold">{u.phone}</span>
                                                    </div>
                                                )}
                                                {u.cpf && (
                                                    <div className="flex items-center gap-3 text-slate-500">
                                                        <IdCard size={14} className="text-slate-300" />
                                                        <span className="text-xs font-bold">CPF: {u.cpf}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!isLoading && filteredUsers.length === 0 && (
                            <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                    <Users size={40} />
                                </div>
                                <p className="text-slate-400 font-bold text-xs tracking-widest">Nenhum usuário encontrado com esses filtros.</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="h-full flex flex-col w-full max-w-[95%] 2xl:max-w-[90%] mx-auto space-y-8 pb-20 animate-in slide-in-from-right-4">
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
                                    {editingUser ? 'Editar Professor' : 'Novo Professor'}
                                </h2>
                                <p className="text-[10px] font-black text-slate-400 tracking-widest mt-1">Preencha as informações do usuário</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSave}
                            className="bg-brand-orange text-white px-10 py-3.5 rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                        >
                            <Save size={18} /> Salvar Cadastro
                        </button>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Photo & Basic Status - Left Column */}
                        <div className="lg:col-span-3 space-y-8">
                            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col items-center">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    id="avatar-upload"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setFormData({ ...formData, avatarUrl: reader.result as string });
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                                <label
                                    htmlFor="avatar-upload"
                                    className="w-40 h-40 rounded-[48px] bg-slate-50 border-4 border-slate-100 shadow-xl overflow-hidden relative group cursor-pointer hover:border-brand-orange transition-colors"
                                >
                                    {formData.avatarUrl ? (
                                        <img src={formData.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 group-hover:text-brand-orange transition-colors">
                                            <Camera size={40} />
                                            <span className="text-[8px] font-black tracking-widest mt-2 uppercase">Upload Foto</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-brand-slate/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-sm">
                                        <Camera size={32} />
                                    </div>
                                </label>
                                <div className="mt-8 w-full">
                                    <label className="text-[10px] font-black text-slate-400 tracking-widest mb-2 block">Link da Foto (URL)</label>
                                    <input
                                        type="text"
                                        value={formData.avatarUrl}
                                        onChange={e => setFormData({ ...formData, avatarUrl: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:border-brand-orange outline-none transition-all text-slate-600 placeholder:text-slate-300"
                                    />
                                </div>
                            </div>

                            {editingUser && (
                                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
                                    <h4 className="text-[10px] font-black text-slate-400 tracking-widest mb-6">Status do Usuário</h4>
                                    <div className="flex p-1 bg-slate-50 rounded-2xl border border-slate-200">
                                        <button
                                            onClick={() => setFormData({ ...formData, isActive: true })}
                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${formData.isActive ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400'}`}
                                        >
                                            Ativo
                                        </button>
                                        <button
                                            onClick={() => setFormData({ ...formData, isActive: false })}
                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${!formData.isActive ? 'bg-white text-red-600 shadow-md' : 'text-slate-400'}`}
                                        >
                                            Bloqueado
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Main Form Data - Right Column (Wider) */}
                        <div className="lg:col-span-9">
                            <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-12">

                                {/* Personal Info */}
                                <div className="space-y-6">
                                    <h4 className="flex items-center gap-3 text-sm font-black text-brand-slate tracking-tight border-b border-slate-100 pb-4">
                                        <User className="text-brand-orange" size={20} /> Informações Pessoais
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="text-[10px] font-black text-slate-400 tracking-widest mb-2 block">Nome Completo *</label>
                                            <input
                                                type="text"
                                                value={formData.fullName}
                                                onChange={e => {
                                                    setFormData({ ...formData, fullName: e.target.value });
                                                    if (e.target.value) setFormErrors(prev => { const n = { ...prev }; delete n.fullName; return n; });
                                                }}
                                                placeholder="Nome do professor"
                                                className={`w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white transition-all ${formErrors.fullName ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-brand-orange'}`}
                                            />
                                            {formErrors.fullName && <span className="text-[10px] text-red-500 font-bold mt-1 ml-1 block">{formErrors.fullName}</span>}
                                        </div>

                                        <div className="md:col-span-1">
                                            <label className="text-[10px] font-black text-slate-400 tracking-widest mb-2 block">CPF</label>
                                            <input
                                                type="text"
                                                value={formData.cpf}
                                                onChange={(e) => {
                                                    const val = formatCPF(e.target.value);
                                                    setFormData({ ...formData, cpf: val });
                                                    if (val.length >= 14 && !validateCPF(val)) {
                                                        setFormErrors(prev => ({ ...prev, cpf: 'CPF inválido' }));
                                                    } else {
                                                        setFormErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors.cpf;
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                placeholder="000.000.000-00"
                                                className={`w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white transition-all ${formErrors.cpf ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-brand-orange'}`}
                                            />
                                            {formErrors.cpf && <span className="text-[10px] text-red-500 font-bold mt-1 ml-1 block">{formErrors.cpf}</span>}
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="text-[10px] font-black text-slate-400 tracking-widest mb-2 block">Telefone</label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => {
                                                    const val = formatPhone(e.target.value);
                                                    setFormData({ ...formData, phone: val });
                                                }}
                                                placeholder="(00) 00000-0000"
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-brand-orange transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Access Info */}
                                <div className="space-y-6">
                                    <h4 className="flex items-center gap-3 text-sm font-black text-brand-slate tracking-tight border-b border-slate-100 pb-4">
                                        <Shield className="text-brand-orange" size={20} /> Acesso ao Sistema
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 tracking-widest mb-2 block">E-mail *</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, email: e.target.value });
                                                    if (e.target.value && !validateEmail(e.target.value)) {
                                                        setFormErrors(prev => ({ ...prev, email: 'E-mail inválido' }));
                                                    } else {
                                                        setFormErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors.email;
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                placeholder="professor@email.com"
                                                className={`w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white transition-all ${formErrors.email ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-brand-orange'}`}
                                            />
                                            {formErrors.email && <span className="text-[10px] text-red-500 font-bold mt-1 ml-1 block">{formErrors.email}</span>}
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 tracking-widest mb-2 block">
                                                Senha {editingUser ? '(deixe vazio para manter)' : '*'}
                                            </label>
                                            <input
                                                type="password"
                                                value={formData.password}
                                                onChange={e => {
                                                    setFormData({ ...formData, password: e.target.value });
                                                    if (e.target.value) setFormErrors(prev => { const n = { ...prev }; delete n.password; return n; });
                                                }}
                                                placeholder="••••••••"
                                                className={`w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white transition-all ${formErrors.password ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-brand-orange'}`}
                                            />
                                            {formErrors.password && <span className="text-[10px] text-red-500 font-bold mt-1 ml-1 block">{formErrors.password}</span>}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>)}

            {/* User Type Selection Modal */}
            {showTypeModal && (
                <div className="fixed inset-0 bg-brand-slate/80 z-[300] backdrop-blur-xl flex items-center justify-center p-6">
                    <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95">
                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-black text-brand-slate tracking-tighter leading-none">Novo Usuário</h3>
                            <p className="text-slate-500 font-medium mt-2 text-[10px] tracking-widest">Selecione o tipo de usuário</p>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={() => handleSelectUserType('COACH')}
                                className="w-full p-6 bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-brand-orange rounded-3xl flex items-center gap-4 hover:shadow-lg transition-all group"
                            >
                                <div className="w-14 h-14 bg-brand-orange rounded-2xl flex items-center justify-center shadow-lg">
                                    <UserCog className="text-white" size={24} />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-black text-brand-slate text-lg">Professor</h4>
                                    <p className="text-[10px] text-slate-500 font-bold tracking-wider">Acesso administrativo completo</p>
                                </div>
                            </button>

                            <button
                                disabled
                                className="w-full p-6 bg-slate-50 border-2 border-slate-200 rounded-3xl flex items-center gap-4 opacity-50 cursor-not-allowed"
                            >
                                <div className="w-14 h-14 bg-slate-200 rounded-2xl flex items-center justify-center">
                                    <User className="text-slate-400" size={24} />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-black text-slate-400 text-lg">Atleta</h4>
                                    <p className="text-[10px] text-slate-400 font-bold tracking-wider">Em breve</p>
                                </div>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowTypeModal(false)}
                            className="w-full mt-6 py-4 text-xs font-black tracking-widest text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"
                        >
                            Cancelar
                        </button>
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
                        <h3 className="text-2xl font-black text-brand-slate mb-2 tracking-tighter leading-none">Excluir Usuário?</h3>
                        <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed text-[10px] tracking-widest">
                            Essa ação removerá permanentemente o cadastro de {users.find(u => u.id === showDeleteConfirm)?.fullName} do sistema.
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
