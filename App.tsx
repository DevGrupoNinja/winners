
import React, { useState } from 'react';
import { LayoutDashboard, Droplets, Dumbbell, Trophy, Activity, Users, LogOut, Menu, X, Home } from 'lucide-react';
import { HomeModule } from './components/HomeModule';
import { CyclesModule } from './components/CyclesModule';
import { TrainingModule } from './components/TrainingModule';
import { GymModule } from './components/GymModule';
import { CompetitionModule } from './components/CompetitionModule';
import { AnalyticsModule } from './components/AnalyticsModule';
import { AthletesModule } from './components/AthletesModule';

type NavView = 'HOME' | 'CYCLES' | 'TRAINING' | 'GYM' | 'COMPETITIONS' | 'ANALYTICS' | 'ATHLETES';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<NavView>('HOME');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'HOME', label: 'Início', icon: Home },
    { id: 'CYCLES', label: 'Planificação', icon: LayoutDashboard },
    { id: 'TRAINING', label: 'Natação', icon: Droplets },
    { id: 'GYM', label: 'Preparação Física', icon: Dumbbell },
    { id: 'COMPETITIONS', label: 'Competições', icon: Trophy },
    { id: 'ANALYTICS', label: 'Avaliações', icon: Activity },
    { id: 'ATHLETES', label: 'Atletas', icon: Users },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'HOME': return <HomeModule onNavigate={(view) => setCurrentView(view as NavView)} />;
      case 'CYCLES': return <CyclesModule />;
      case 'TRAINING': return <TrainingModule />;
      case 'GYM': return <GymModule />;
      case 'COMPETITIONS': return <CompetitionModule />;
      case 'ANALYTICS': return <AnalyticsModule />;
      case 'ATHLETES': return <AthletesModule />;
      default: return <HomeModule onNavigate={(view) => setCurrentView(view as NavView)} />;
    }
  };

  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden font-sans">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-brand-slate text-gray-300 shadow-xl z-20">
        <div className="p-6 border-b border-gray-700 flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center">
            <Trophy className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Winners</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as NavView)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand-orange text-white shadow-lg shadow-orange-900/20' 
                    : 'hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-white transition-colors">
            <LogOut size={20} />
            <span>Sair</span>
          </button>
          <div className="mt-4 flex items-center gap-3 px-4">
            <div className="w-8 h-8 rounded-full bg-gray-600"></div>
            <div>
               <p className="text-sm text-white font-medium">Coach Carlos</p>
               <p className="text-xs text-gray-500">Head Coach</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full w-full relative">
        {/* Mobile Header */}
        <header className="md:hidden bg-brand-slate text-white p-4 flex justify-between items-center z-30 shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center">
               <Trophy size={18} />
            </div>
            <span className="font-bold text-lg">Winners</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
           <div className="absolute top-[64px] left-0 w-full h-[calc(100%-64px)] bg-brand-slate z-20 p-4 space-y-2 md:hidden">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id as NavView);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-4 rounded-lg text-white ${
                    currentView === item.id ? 'bg-brand-orange' : 'hover:bg-gray-800'
                  }`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </button>
              ))}
           </div>
        )}

        <main className="flex-1 overflow-hidden p-4 md:p-8 bg-brand-bg relative">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
