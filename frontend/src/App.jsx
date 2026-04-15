import React, { useState, useEffect } from 'react';
import { Award } from 'lucide-react';

import { INITIAL_CONFERENCES, INITIAL_SECTIONS, INITIAL_USERS, INITIAL_SUBMISSIONS } from './data/initialData';
import { ROLES } from './constants';

import Sidebar from './components/layout/Sidebar';

import AuthView from './components/common/AuthView';
import CreateConferenceModal from './components/ui/CreateConferenceModal';

import AuthorView from './views/AuthorView';
import ReviewerView from './views/ReviewerView';
import ChairmanView from './views/ChairmanView';

import AdminInfoView from './views/Admin/AdminInfoView';
import AdminUsersView from './views/Admin/AdminUsersView';
import AdminSubmissionsView from './views/Admin/AdminSubmissionsView';

import PublicInfoView from './views/PublicInfoView';
import SharedProgramView from './views/SharedProgramView';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentRole, setCurrentRole] = useState(ROLES.AUTHOR);
  const [activeTab, setActiveTab] = useState('main');
  
  const [conferences, setConferences] = useState(INITIAL_CONFERENCES);
  const [activeConfId, setActiveConfId] = useState(INITIAL_CONFERENCES[0].id);
  const [isCreateConfOpen, setIsCreateConfOpen] = useState(false);

  const [sections, setSections] = useState(INITIAL_SECTIONS);
  const [submissions, setSubmissions] = useState(INITIAL_SUBMISSIONS);
  const [users, setUsers] = useState(INITIAL_USERS);

  // Фильтрация данных для активной конференции
  const activeConf = conferences.find(c => c.id === activeConfId) || conferences[0];
  const curSections = sections.filter(s => s.conferenceId === activeConfId);
  const curSubmissions = submissions.filter(s => s.conferenceId === activeConfId);
  const curUsers = users.filter(u => u.conferenceId === activeConfId);

  const updateSubmission = (id, updates) => {
    setSubmissions(subs => subs.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  useEffect(() => {
    if (currentRole === ROLES.ADMIN) setActiveTab('info');
    else setActiveTab('main');
  }, [currentRole]);

  if (!isAuthenticated) {
    return <AuthView onAuth={() => setIsAuthenticated(true)} conference={activeConf} />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-900 selection:bg-indigo-100">
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-100 flex-shrink-0">
            <Award className="w-5 h-5 text-white" />
          </div>
          <select 
            className="font-bold text-lg bg-transparent border-none outline-none cursor-pointer text-slate-800 truncate max-w-[200px] md:max-w-md appearance-none"
            value={activeConfId}
            onChange={(e) => {
              if (e.target.value === 'new') setIsCreateConfOpen(true);
              else setActiveConfId(parseInt(e.target.value));
            }}
          >
            {conferences.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            {currentRole === ROLES.ADMIN && <option value="new" className="text-indigo-600 font-bold">+ Создать новую...</option>}
          </select>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-50 p-1 rounded-xl border border-slate-200 ml-4 flex-shrink-0">
          <select 
            className="bg-transparent border-none text-sm font-bold rounded-lg px-3 py-1.5 focus:ring-0 outline-none cursor-pointer text-indigo-600"
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value)}
          >
            <option value={ROLES.AUTHOR}>Автор</option>
            <option value={ROLES.REVIEWER}>Рецензент</option>
            <option value={ROLES.CHAIRMAN}>Председатель</option>
            <option value={ROLES.ADMIN}>Администратор</option>
          </select>
        </div>
      </header>

      <CreateConferenceModal 
        isOpen={isCreateConfOpen}
        onClose={() => setIsCreateConfOpen(false)}
        onCreate={(title) => {
          const newId = Date.now();
          setConferences([...conferences, { id: newId, title, description: '' }]);
          setActiveConfId(newId);
          setIsCreateConfOpen(false);
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={currentRole} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => setIsAuthenticated(false)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            {/* МАРШРУТИЗАЦИЯ ЕДИНАЯ ДЛЯ ВСЕХ */}
            {activeTab === 'main' && currentRole === ROLES.AUTHOR && <AuthorView activeConfId={activeConfId} sections={curSections} submissions={curSubmissions} updateSubmission={updateSubmission} setSubmissions={setSubmissions} />}
            {activeTab === 'main' && currentRole === ROLES.REVIEWER && <ReviewerView submissions={curSubmissions} updateSubmission={updateSubmission} />}
            {activeTab === 'main' && currentRole === ROLES.CHAIRMAN && <ChairmanView submissions={curSubmissions} updateSubmission={updateSubmission} sections={curSections} setSections={setSections} users={curUsers} />}
            
            {activeTab === 'info' && currentRole === ROLES.ADMIN && <AdminInfoView conference={activeConf} conferences={conferences} setConferences={setConferences} />}
            {activeTab === 'info' && currentRole !== ROLES.ADMIN && <PublicInfoView conference={activeConf} sections={curSections} />}
            
            {activeTab === 'program' && <SharedProgramView sections={curSections} submissions={curSubmissions} />}
            
            {activeTab === 'users' && currentRole === ROLES.ADMIN && <AdminUsersView activeConfId={activeConfId} users={curUsers} setUsers={setUsers} submissions={curSubmissions} />}
            {activeTab === 'submissions' && currentRole === ROLES.ADMIN && <AdminSubmissionsView activeConfId={activeConfId} sections={curSections} setSections={setSections} submissions={curSubmissions} updateSubmission={updateSubmission} />}
          </div>
        </main>
      </div>
    </div>
  );
}