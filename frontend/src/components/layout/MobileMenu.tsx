import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Droplets,
    Dumbbell,
    Trophy,
    Activity,
    Users,
    Home,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

const NAV_ITEMS = [
    { icon: Home, label: 'Início', path: '/' },
    { icon: LayoutDashboard, label: 'Planificação', path: '/cycles' },
    { icon: Droplets, label: 'Natação', path: '/training' },
    { icon: Dumbbell, label: 'Preparação Física', path: '/gym' },
    { icon: Trophy, label: 'Competições', path: '/competitions' },
    { icon: Activity, label: 'Avaliações', path: '/analytics' },
    { icon: Users, label: 'Atletas', path: '/athletes' },
];

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-brand-slate/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Menu Content */}
            <div className="absolute right-0 top-0 bottom-0 w-[280px] bg-brand-slate shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="p-6 flex items-center justify-between border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-orange p-2 rounded-xl shadow-lg shadow-orange-900/20">
                            <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">
                            Winners
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                                isActive
                                    ? "bg-brand-orange text-white shadow-lg shadow-orange-900/20"
                                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-700">
                    <div className="bg-gray-800/40 rounded-2xl p-4 opacity-75">
                        <p className="text-xs text-center text-gray-500 font-medium">
                            Winners Performance v2.0
                        </p>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
