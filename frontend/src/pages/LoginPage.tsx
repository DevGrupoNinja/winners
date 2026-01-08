import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, Mail, Trophy } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, isLoading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError('Falha no login. Verifique suas credenciais.');
        }
    };

    return (
        <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-4">
            {/* Logo e Título */}
            <div className="text-center mb-10">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-brand-orange rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                        <Trophy className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-brand-slate tracking-tight">Winners</h1>
                </div>
                <p className="text-slate-400 font-medium">High Performance Swimming</p>
            </div>

            {/* Card de Login */}
            <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50">
                <h2 className="text-2xl font-bold text-brand-slate text-center mb-8">Acesse sua conta</h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-500">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-brand-slate font-medium placeholder:text-slate-300 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-orange-100 transition-all"
                                placeholder="Email"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-500">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-brand-slate font-medium placeholder:text-slate-300 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-orange-100 transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-brand-orange hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-200 active:scale-[0.98]"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
