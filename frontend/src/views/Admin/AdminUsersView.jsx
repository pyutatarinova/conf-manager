import React, { useState } from 'react';
import { Users, Trash2 } from 'lucide-react';

import { createInvite } from '../../api/conferences';

export default function AdminUsersView({ activeConfId, users, setUsers, submissions, sections }) {
  const [newUser, setNewUser] = useState({ email: '', position: '', role: 'reviewer', sectionId: '' });
  const [inviteError, setInviteError] = useState('');
  const [inviteCreated, setInviteCreated] = useState(false);

  const isEmailValid = (value) => {
    const email = String(value || '').trim();
    return Boolean(email) && email.includes('@');
  };

  const createInviteSafe = async () => {
    setInviteError('');
    setInviteCreated(false);

    if (!activeConfId) {
      setInviteError('Сначала выберите конференцию.');
      return;
    }

    if (false) {
      setInviteError('Введите ФИО.');
      return;
    }

    if (!isEmailValid(newUser.email)) {
      setInviteError('Введите корректный email (должен содержать @).');
      return;
    }

    const role = newUser.role === 'chairman' ? 'chair' : 'reviewer';

    try {
      await createInvite(activeConfId, { email: newUser.email, role });
      setUsers([...users, { id: Date.now(), conferenceId: activeConfId, name: '', ...newUser }]);
      setNewUser({ email: '', position: '', role: 'reviewer', sectionId: '' });
      setInviteCreated(true);
    } catch (e) {
      setInviteError(e?.message || 'Не удалось создать приглашение.');
    }
  };

  return (
    <div className="space-y-6 animate-in zoom-in-95">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" /> Регистрация персонала
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <input
            value=""
            onChange={() => {}}
            className="hidden"
            placeholder="ФИО"
          />
          <input
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            className="md:col-span-7 border border-slate-200 p-3 rounded-xl text-sm"
            placeholder="Email"
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value, sectionId: '' })}
            className="md:col-span-2 border border-slate-200 p-3 rounded-xl text-sm bg-white font-bold"
          >
            <option value="reviewer">Рецензент</option>
            <option value="chairman">Председатель</option>
          </select>

          <select
            value={newUser.sectionId}
            onChange={(e) => setNewUser({ ...newUser, sectionId: e.target.value })}
            disabled={newUser.role !== 'chairman'}
            className="md:col-span-3 border border-slate-200 p-3 rounded-xl text-sm bg-white font-bold disabled:opacity-50"
            title={newUser.role !== 'chairman' ? 'Секция нужна только для председателя' : ''}
          >
            <option value="">{newUser.role === 'chairman' ? 'Секция' : 'Секция'}</option>
            {(sections || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <button
            onClick={() => void createInviteSafe()}
            disabled={newUser.role === 'chairman' && !newUser.sectionId}
            className="md:col-span-12 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed py-3"
            type="button"
          >
            Добавить в проект
          </button>
        </div>

        {inviteError && <p className="mt-3 text-sm font-semibold text-red-600">{inviteError}</p>}
        {inviteCreated && <p className="mt-3 text-sm font-semibold text-emerald-700">Приглашение отправлено на почту.</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map((u) => (
          <div key={u.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                {String(u.name || '').charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-800">{u.name}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{u.role}</p>
                {u.role === 'chairman' && u.sectionId && (
                  <p className="text-[10px] font-bold text-slate-500 mt-1">
                    Секция: {(sections || []).find((s) => s.id === u.sectionId)?.name || '—'}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setUsers(users.filter((x) => x.id !== u.id))}
              className="text-slate-300 hover:text-red-500 transition-colors p-2"
              type="button"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
