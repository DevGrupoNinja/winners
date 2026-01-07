import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export interface SettingsTab {
    id: string;
    label: string;
    icon?: ReactNode;
}

interface SettingsLayoutProps {
    title: string;
    backPath: string;
    tabs: SettingsTab[];
    activeTab: string;
    onTabChange: (id: string) => void;
    children: ReactNode;
}

export function SettingsLayout({
    title,
    backPath,
    tabs,
    activeTab,
    onTabChange,
    children
}: SettingsLayoutProps) {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header */}
            <header className="flex items-center gap-4">
                <button
                    onClick={() => navigate(backPath)}
                    className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-brand-slate"
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-2xl font-black text-brand-slate tracking-tight">{title}</h2>
            </header>

            {/* Content with sidebar tabs */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* Tabs Sidebar */}
                <nav className="md:w-64 flex-shrink-0">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2 space-y-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                        ? 'bg-brand-slate text-white shadow-md'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-brand-slate'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </nav>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    {children}
                </div>
            </div>
        </div>
    );
}
