import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileMenu } from './MobileMenu';
import {
    Dumbbell,
    Target,
    Trophy,
    BarChart3,
    Users,
    Home,
    Activity,
    Menu
} from 'lucide-react';

export function DashboardLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-brand-bg">
            <Sidebar />
            <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

            {/* Main Content Area */}
            <div className="md:pl-64 flex flex-col min-h-screen transition-all duration-300">

                {/* Mobile Header */}
                <header className="md:hidden h-16 bg-brand-slate text-white flex items-center justify-between px-4 sticky top-0 z-30 shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-orange p-1.5 rounded-lg shadow-lg shadow-orange-900/20">
                            <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-white tracking-tight">
                            Winners
                        </span>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 text-white hover:bg-gray-800 rounded-xl transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-8 overflow-hidden bg-brand-bg relative">
                    <div className="h-full animate-in fade-in-50 duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
