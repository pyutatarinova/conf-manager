import { LogOut, FileText, Info, Calendar, Users, List, MessageSquare } from 'lucide-react';
import { ROLES } from '../../constants';

export default function Sidebar({ role, activeTab, setActiveTab, onLogout }) {
  const options = {
    [ROLES.AUTHOR]: [
      { id: 'main', icon: FileText, label: 'Мои работы' },
      { id: 'info', icon: Info, label: 'О конференции' },
      { id: 'program', icon: Calendar, label: 'Программа' }
    ],
    [ROLES.REVIEWER]: [
      { id: 'main', icon: MessageSquare, label: 'Рецензии' },
      { id: 'info', icon: Info, label: 'О конференции' },
      { id: 'program', icon: Calendar, label: 'Программа' }
    ],
    [ROLES.CHAIRMAN]: [
      { id: 'main', icon: Users, label: 'Упр. секцией' },
      { id: 'info', icon: Info, label: 'О конференции' },
      { id: 'program', icon: Calendar, label: 'Программа' }
    ],
    [ROLES.ADMIN]: [
      { id: 'info', icon: Info, label: 'Настройки' },
      { id: 'users', icon: Users, label: 'Персонал' },
      { id: 'submissions', icon: List, label: 'Секции/Работы' },
      { id: 'program', icon: Calendar, label: 'Программа' }
    ]
  };

  return (
    <aside className="w-20 md:w-64 bg-white border-r border-slate-200 p-4 flex flex-col shadow-[1px_0_0_rgba(0,0,0,0.05)] transition-all">
      <div className="mb-10 px-4 hidden md:block">
        <p className="text-2xl font-black text-indigo-600 tracking-tighter">Event<span className="text-slate-900">Flow</span></p>
      </div>
      <nav className="flex-1 space-y-1.5 overflow-y-auto">
        {options[role].map(item => (
          <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id)} 
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-[1.02]' : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-600'}`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" /> 
            <span className="hidden md:block truncate text-left">{item.label}</span>
          </button>
        ))}
      </nav>
      <button 
        onClick={onLogout} 
        className="mt-auto flex items-center gap-3 px-4 py-4 text-sm text-slate-400 hover:text-red-500 font-bold transition-colors border-t border-slate-50 pt-6"
      >
        <LogOut className="w-5 h-5"/> 
        <span className="hidden md:block">Выйти</span>
      </button>
    </aside>
  );
}