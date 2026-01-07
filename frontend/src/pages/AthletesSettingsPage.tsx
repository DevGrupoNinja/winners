import { useState, useEffect } from 'react';
import { SettingsLayout, SettingsTab } from '@/components/layout/SettingsLayout';
import { athleteService } from '@/services/athleteService';
import { Tag, Plus, Trash2, Save, X, AlertTriangle, CheckCircle2, Loader2, Edit2 } from 'lucide-react';

interface AthleteCategory {
    id: number;
    name: string;
    is_active: number;
}

const TABS: SettingsTab[] = [
    { id: 'categories', label: 'Categorias de Atleta', icon: <Tag size={16} /> }
];

export default function AthletesSettingsPage() {
    const [activeTab, setActiveTab] = useState('categories');
    const [categories, setCategories] = useState<AthleteCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<{ name: string }>({ name: '' });
    const [isAdding, setIsAdding] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setIsLoading(true);
        try {
            const data = await athleteService.getCategories();
            setCategories(data);
        } catch (error) {
            console.error('Failed to load categories', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newCategory.trim()) return;
        setIsSaving(true);
        try {
            const created = await athleteService.createCategory({ name: newCategory.trim() });
            setCategories([...categories, created]);
            setNewCategory('');
            setIsAdding(false);
            showSuccessFeedback();
        } catch (error) {
            console.error('Failed to create category', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (cat: AthleteCategory) => {
        setEditingId(cat.id);
        setEditForm({ name: cat.name });
    };

    const handleSaveEdit = async () => {
        if (editingId === null || !editForm.name.trim()) return;
        setIsSaving(true);
        try {
            const updated = await athleteService.updateCategory(editingId, { name: editForm.name.trim() });
            setCategories(categories.map(c => c.id === editingId ? updated : c));
            setEditingId(null);
            setEditForm({ name: '' });
            showSuccessFeedback();
        } catch (error) {
            console.error('Failed to update category', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        setIsSaving(true);
        try {
            await athleteService.deleteCategory(id);
            setCategories(categories.filter(c => c.id !== id));
            setShowDeleteConfirm(null);
            showSuccessFeedback();
        } catch (error) {
            console.error('Failed to delete category', error);
        } finally {
            setIsSaving(false);
        }
    };

    const showSuccessFeedback = () => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    };

    const renderCategoriesTab = () => (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-brand-slate">Categorias de Atleta</h3>
                    <p className="text-sm text-slate-400 mt-1">Configure as categorias disponíveis para atletas e treinos.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    disabled={isAdding}
                    className="bg-brand-orange hover:bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg disabled:opacity-50"
                >
                    <Plus size={16} /> Nova Categoria
                </button>
            </div>

            {isLoading ? (
                <div className="p-12 flex items-center justify-center">
                    <Loader2 className="animate-spin w-8 h-8 text-brand-orange" />
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {isAdding && (
                        <div className="flex items-center gap-4 p-4 bg-orange-50/50">
                            <input
                                type="text"
                                placeholder="Nome da categoria..."
                                value={newCategory}
                                onChange={e => setNewCategory(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                className="flex-1 p-3 border border-orange-200 rounded-xl text-sm font-bold bg-white focus:border-brand-orange outline-none"
                                autoFocus
                            />
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleAdd}
                                    disabled={!newCategory.trim() || isSaving}
                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-50"
                                >
                                    <Save size={18} />
                                </button>
                                <button
                                    onClick={() => { setIsAdding(false); setNewCategory(''); }}
                                    className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                    {categories.map(cat => (
                        <div key={cat.id} className={`flex items-center gap-4 p-4 hover:bg-slate-50 ${editingId === cat.id ? 'bg-blue-50/50' : ''}`}>
                            {editingId === cat.id ? (
                                <>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={e => setEditForm({ name: e.target.value })}
                                        onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                                        className="flex-1 p-3 border border-blue-200 rounded-xl text-sm font-bold bg-white focus:border-blue-500 outline-none"
                                        autoFocus
                                    />
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={handleSaveEdit}
                                            disabled={!editForm.name.trim() || isSaving}
                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-50"
                                        >
                                            <Save size={18} />
                                        </button>
                                        <button
                                            onClick={() => { setEditingId(null); setEditForm({ name: '' }); }}
                                            className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex-1">
                                        <span className="text-sm font-bold text-brand-slate">{cat.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 hover:opacity-100">
                                        <button
                                            onClick={() => handleEdit(cat)}
                                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => setShowDeleteConfirm(cat.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    {categories.length === 0 && !isAdding && (
                        <div className="p-12 text-center text-slate-400 italic">
                            Nenhuma categoria configurada. Clique em "Nova Categoria" para adicionar.
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <>
            <SettingsLayout
                title="Configurações de Atletas"
                backPath="/athletes"
                tabs={TABS}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            >
                {activeTab === 'categories' && renderCategoriesTab()}
            </SettingsLayout>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm !== null && (
                <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} className="text-red-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Excluir categoria?</h3>
                        <p className="text-sm text-gray-400 mb-6">
                            Esta ação desativará esta categoria. Treinos existentes não serão afetados.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDelete(showDeleteConfirm)}
                                disabled={isSaving}
                                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg disabled:opacity-50"
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Feedback */}
            {showSuccess && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-brand-slate/90 backdrop-blur-md p-4 pointer-events-none">
                    <div className="text-center space-y-6 animate-in fade-in zoom-in duration-300">
                        <div className="w-24 h-24 bg-brand-orange rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-orange-500/50">
                            <CheckCircle2 size={48} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Salvo!</h2>
                    </div>
                </div>
            )}
        </>
    );
}
