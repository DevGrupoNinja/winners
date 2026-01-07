import { useState, useEffect } from 'react';
import { SettingsLayout, SettingsTab } from '@/components/layout/SettingsLayout';
import { trainingService } from '@/services/trainingService';
import { Sliders, Plus, Trash2, Save, X, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

interface FunctionalDirectionRange {
    id: number;
    re_min: number;
    re_max: number;
    er_min: number;
    er_max: number;
    direction: string;
}

const TABS: SettingsTab[] = [
    { id: 'ranges', label: 'Faixas de Direção Funcional', icon: <Sliders size={16} /> }
];

export default function TrainingSettingsPage() {
    const [activeTab, setActiveTab] = useState('ranges');
    const [ranges, setRanges] = useState<FunctionalDirectionRange[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<FunctionalDirectionRange>>({});
    const [isAdding, setIsAdding] = useState(false);
    const [newRange, setNewRange] = useState<Omit<FunctionalDirectionRange, 'id'>>({
        re_min: 0, re_max: 0, er_min: 0, er_max: 0, direction: ''
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadRanges();
    }, []);

    const loadRanges = async () => {
        setIsLoading(true);
        try {
            const data = await trainingService.getFunctionalDirectionRanges();
            setRanges(data);
        } catch (error) {
            console.error('Failed to load ranges', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newRange.direction.trim()) return;
        setIsSaving(true);
        try {
            const created = await trainingService.createFunctionalDirectionRange(newRange);
            setRanges([...ranges, created]);
            setNewRange({ re_min: 0, re_max: 0, er_min: 0, er_max: 0, direction: '' });
            setIsAdding(false);
            showSuccessFeedback();
        } catch (error) {
            console.error('Failed to create range', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (range: FunctionalDirectionRange) => {
        setEditingId(range.id);
        setEditForm({ ...range });
    };

    const handleSaveEdit = async () => {
        if (editingId === null || !editForm.direction?.trim()) return;
        setIsSaving(true);
        try {
            const updated = await trainingService.updateFunctionalDirectionRange(editingId, {
                re_min: editForm.re_min!,
                re_max: editForm.re_max!,
                er_min: editForm.er_min!,
                er_max: editForm.er_max!,
                direction: editForm.direction!
            });
            setRanges(ranges.map(r => r.id === editingId ? updated : r));
            setEditingId(null);
            setEditForm({});
            showSuccessFeedback();
        } catch (error) {
            console.error('Failed to update range', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        setIsSaving(true);
        try {
            await trainingService.deleteFunctionalDirectionRange(id);
            setRanges(ranges.filter(r => r.id !== id));
            setShowDeleteConfirm(null);
            showSuccessFeedback();
        } catch (error) {
            console.error('Failed to delete range', error);
        } finally {
            setIsSaving(false);
        }
    };

    const showSuccessFeedback = () => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    };

    const renderRangesTab = () => (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-brand-slate">Faixas de Direção Funcional</h3>
                    <p className="text-sm text-slate-400 mt-1">Configure os intervalos de RE/ER para determinar a direção funcional automaticamente.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    disabled={isAdding}
                    className="bg-brand-orange hover:bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg disabled:opacity-50"
                >
                    <Plus size={16} /> Nova Faixa
                </button>
            </div>

            {isLoading ? (
                <div className="p-12 flex items-center justify-center">
                    <Loader2 className="animate-spin w-8 h-8 text-brand-orange" />
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-brand-slate text-white text-[10px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="px-4 py-4 text-center">RE Min</th>
                                <th className="px-4 py-4 text-center">RE Max</th>
                                <th className="px-4 py-4 text-center">ER Min</th>
                                <th className="px-4 py-4 text-center">ER Max</th>
                                <th className="px-4 py-4">Direção</th>
                                <th className="px-4 py-4 text-center w-28">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isAdding && (
                                <tr className="bg-orange-50/50">
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={newRange.re_min}
                                            onChange={e => setNewRange({ ...newRange, re_min: parseFloat(e.target.value) || 0 })}
                                            className="w-full p-2 border border-orange-200 rounded-lg text-center text-sm font-bold bg-white focus:border-brand-orange outline-none"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={newRange.re_max}
                                            onChange={e => setNewRange({ ...newRange, re_max: parseFloat(e.target.value) || 0 })}
                                            className="w-full p-2 border border-orange-200 rounded-lg text-center text-sm font-bold bg-white focus:border-brand-orange outline-none"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={newRange.er_min}
                                            onChange={e => setNewRange({ ...newRange, er_min: parseFloat(e.target.value) || 0 })}
                                            className="w-full p-2 border border-orange-200 rounded-lg text-center text-sm font-bold bg-white focus:border-brand-orange outline-none"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={newRange.er_max}
                                            onChange={e => setNewRange({ ...newRange, er_max: parseFloat(e.target.value) || 0 })}
                                            className="w-full p-2 border border-orange-200 rounded-lg text-center text-sm font-bold bg-white focus:border-brand-orange outline-none"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="text"
                                            placeholder="Ex: Aeróbico, VO2 Max..."
                                            value={newRange.direction}
                                            onChange={e => setNewRange({ ...newRange, direction: e.target.value })}
                                            className="w-full p-2 border border-orange-200 rounded-lg text-sm font-bold bg-white focus:border-brand-orange outline-none"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={handleAdd}
                                                disabled={!newRange.direction.trim() || isSaving}
                                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-50"
                                            >
                                                <Save size={16} />
                                            </button>
                                            <button
                                                onClick={() => { setIsAdding(false); setNewRange({ re_min: 0, re_max: 0, er_min: 0, er_max: 0, direction: '' }); }}
                                                className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {ranges.map(range => (
                                <tr key={range.id} className={`hover:bg-slate-50 ${editingId === range.id ? 'bg-blue-50/50' : ''}`}>
                                    {editingId === range.id ? (
                                        <>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={editForm.re_min}
                                                    onChange={e => setEditForm({ ...editForm, re_min: parseFloat(e.target.value) || 0 })}
                                                    className="w-full p-2 border border-blue-200 rounded-lg text-center text-sm font-bold bg-white focus:border-blue-500 outline-none"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={editForm.re_max}
                                                    onChange={e => setEditForm({ ...editForm, re_max: parseFloat(e.target.value) || 0 })}
                                                    className="w-full p-2 border border-blue-200 rounded-lg text-center text-sm font-bold bg-white focus:border-blue-500 outline-none"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={editForm.er_min}
                                                    onChange={e => setEditForm({ ...editForm, er_min: parseFloat(e.target.value) || 0 })}
                                                    className="w-full p-2 border border-blue-200 rounded-lg text-center text-sm font-bold bg-white focus:border-blue-500 outline-none"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={editForm.er_max}
                                                    onChange={e => setEditForm({ ...editForm, er_max: parseFloat(e.target.value) || 0 })}
                                                    className="w-full p-2 border border-blue-200 rounded-lg text-center text-sm font-bold bg-white focus:border-blue-500 outline-none"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={editForm.direction}
                                                    onChange={e => setEditForm({ ...editForm, direction: e.target.value })}
                                                    className="w-full p-2 border border-blue-200 rounded-lg text-sm font-bold bg-white focus:border-blue-500 outline-none"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={handleSaveEdit}
                                                        disabled={!editForm.direction?.trim() || isSaving}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-50"
                                                    >
                                                        <Save size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => { setEditingId(null); setEditForm({}); }}
                                                        className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-4 py-3 text-center font-bold text-slate-700">{range.re_min}</td>
                                            <td className="px-4 py-3 text-center font-bold text-slate-700">{range.re_max}</td>
                                            <td className="px-4 py-3 text-center font-bold text-slate-700">{range.er_min}</td>
                                            <td className="px-4 py-3 text-center font-bold text-slate-700">{range.er_max}</td>
                                            <td className="px-4 py-3 font-bold text-brand-orange">{range.direction}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => handleEdit(range)}
                                                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
                                                    >
                                                        <Save size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setShowDeleteConfirm(range.id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                            {ranges.length === 0 && !isAdding && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400 italic">
                                        Nenhuma faixa configurada. Clique em "Nova Faixa" para adicionar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    return (
        <>
            <SettingsLayout
                title="Configurações de Natação"
                backPath="/training"
                tabs={TABS}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            >
                {activeTab === 'ranges' && renderRangesTab()}
            </SettingsLayout>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm !== null && (
                <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} className="text-red-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Excluir faixa?</h3>
                        <p className="text-sm text-gray-400 mb-6">
                            Esta ação removerá permanentemente esta faixa de direção funcional.
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
