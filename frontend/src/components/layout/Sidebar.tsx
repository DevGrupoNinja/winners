import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Droplets,
    Dumbbell,
    Trophy,
    Activity,
    Users,
    Home,
    UserCog,
    LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const NAV_ITEMS = [
    { icon: Home, label: 'Início', path: '/' },
    { icon: LayoutDashboard, label: 'Planificação', path: '/cycles' },
    { icon: Droplets, label: 'Natação', path: '/training' },
    { icon: Dumbbell, label: 'Preparação Física', path: '/gym' },
    { icon: Trophy, label: 'Competições', path: '/competitions' },
    { icon: Activity, label: 'Avaliações', path: '/analytics' },
    { icon: Users, label: 'Atletas', path: '/athletes' },
    { icon: UserCog, label: 'Usuários', path: '/users' },
];

export function Sidebar() {
    const { user, logout } = useAuth();

    // Generate initials from user name
    const initials = user?.full_name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'US';

    // Translate role to Portuguese
    const roleLabel = user?.role === 'COACH' ? 'Professor' :
        user?.role === 'ADMIN' ? 'Administrador' :
            user?.role || 'Usuário';

    return (
        <aside className="hidden md:flex h-screen w-64 flex-col fixed left-0 top-0 bg-brand-slate text-gray-300 shadow-xl z-40">
            <div className="p-6 border-b border-gray-700">
                <div className="flex items-center gap-3 px-2">
                    <div className="bg-brand-orange p-2 rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/20">
                        <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">
                        Winners
                    </span>
                </div>
            </div>

            <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
                {NAV_ITEMS.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group",
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
                <div className="bg-gray-800/40 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                        {user?.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt={user.full_name || 'Usuário'}
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-600"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-xs">
                                {initials}
                            </div>
                        )}
                        <div className="overflow-hidden flex-1">
                            <p className="font-bold text-white text-sm truncate">{user?.full_name || 'Usuário'}</p>
                            <p className="text-[10px] text-gray-500 truncate uppercase tracking-widest">{roleLabel}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all"
                    >
                        <LogOut size={14} />
                        Sair
                    </button>
                </div>
            </div>
        </aside>
    );
}

