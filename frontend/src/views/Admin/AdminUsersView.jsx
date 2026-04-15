import React, { useState } from 'react';
import { Users, Trash2 } from 'lucide-react';

export default function AdminUsersView({ activeConfId, users, setUsers, submissions }) {
  const [newUser, setNewUser] = useState({ name: '', email: '', position: '', role: 'reviewer', sectionId: '' });

  return (
    <div className="space-y-6 animate-in zoom-in-95">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" /> Регистрация сотрудников
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="border border-slate-200 p-3 rounded-xl text-sm" placeholder="ФИО" />
          <input value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="border border-slate-200 p-3 rounded-xl text-sm" placeholder="Email" />
          <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="border border-slate-200 p-3 rounded-xl text-sm bg-white font-bold">
            <option value="reviewer">Рецензент</option>
            <option value="chairman">Председатель</option>
          </select>
          <button 
            onClick={() => { 
              setUsers([...users, {id: Date.now(), conferenceId: activeConfId, ...newUser}]); 
              setNewUser({ name: '', email: '', position: '', role: 'reviewer', sectionId: '' }); 
            }} 
            className="md:col-span-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all"
          >
            Добавить в проект
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map(u => (
          <div key={u.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">{u.name.charAt(0)}</div>
              <div>
                <p className="font-bold text-slate-800">{u.name}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{u.role}</p>
              </div>
            </div>
            <button onClick={() => setUsers(users.filter(x => x.id !== u.id))} className="text-slate-300 hover:text-red-500 transition-colors p-2"><Trash2 className="w-4 h-4"/></button>
          </div>
        ))}
      </div>
    </div>
  );
}