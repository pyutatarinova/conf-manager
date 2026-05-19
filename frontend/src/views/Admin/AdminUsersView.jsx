import React, { useEffect, useMemo, useState } from 'react';
import { Users, Trash2 } from 'lucide-react';

import { createInvite, deleteParticipant, listParticipants } from '../../api/conferences';

export default function AdminUsersView({ activeConfId, users, setUsers, submissions, sections }) {
  const [newUser, setNewUser] = useState({ email: '', position: '', role: 'reviewer', sectionId: '' });
  const [inviteError, setInviteError] = useState('');
  const [inviteCreated, setInviteCreated] = useState(false);

  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsError, setParticipantsError] = useState('');
  const [deleteBusy, setDeleteBusy] = useState({});

  const isEmailValid = (value) => {
    const email = String(value || '').trim();
    return Boolean(email) && email.includes('@');
  };

  const sectionNameById = useMemo(() => {
    const map = new Map();
    (sections || []).forEach((s) => map.set(s.id, s.name));
    return map;
  }, [sections]);

  const loadParticipants = async () => {
    if (!activeConfId) {
      setParticipants([]);
      return;
    }
    setParticipantsLoading(true);
    setParticipantsError('');
    try {
      const data = await listParticipants(activeConfId);
      setParticipants(Array.isArray(data) ? data : []);
    } catch (e) {
      setParticipantsError(e?.message || 'Не удалось загрузить список участников.');
    } finally {
      setParticipantsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      if (!active) return;
      await loadParticipants();
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConfId]);

  const createInviteSafe = async () => {
    setInviteError('');
    setInviteCreated(false);

    if (!activeConfId) {
      setInviteError('Сначала выберите конференцию.');
      return;
    }

    if (!isEmailValid(newUser.email)) {
      setInviteError('Введите корректный email (должен содержать @).');
      return;
    }

    const role = newUser.role === 'chairman' ? 'chair' : 'reviewer';
    const section_id = role === 'chair' ? (newUser.sectionId || null) : null;

    try {
      await createInvite(activeConfId, { email: newUser.email, role, section_id });
      await loadParticipants();
      setNewUser({ email: '', position: '', role: 'reviewer', sectionId: '' });
      setInviteCreated(true);
    } catch (e) {
      setInviteError(e?.message || 'Не удалось создать приглашение.');
    }
  };

  const removeParticipant = async (inviteId) => {
    if (!activeConfId || !inviteId) return;
    setDeleteBusy((prev) => ({ ...prev, [inviteId]: true }));
    try {
      await deleteParticipant(activeConfId, inviteId);
      await loadParticipants();
    } catch (e) {
      setParticipantsError(e?.message || 'Не удалось удалить участника.');
    } finally {
      setDeleteBusy((prev) => ({ ...prev, [inviteId]: false }));
    }
  };

  return (
    <div className="space-y-6 animate-in zoom-in-95">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" /> Регистрация участников
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <input value="" onChange={() => {}} className="hidden" placeholder="ФИО" />
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
            <option value="">Секция</option>
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

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Ожидают подтверждения</h3>
          <button
            type="button"
            onClick={() => void loadParticipants()}
            className="text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100"
            disabled={participantsLoading}
          >
            Обновить
          </button>
        </div>

        {participantsLoading && (
          <div className="text-center py-8 text-slate-400 font-bold text-sm uppercase tracking-widest">
            Загрузка участников…
          </div>
        )}
        {participantsError && (
          <div className="text-center py-4 text-red-600 font-semibold">
            {participantsError}
          </div>
        )}

        {!participantsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {participants.filter((p) => !p.is_used).length === 0 && (
              <div className="md:col-span-2 text-center py-8 text-slate-400 font-bold text-sm uppercase tracking-widest">
                Нет ожидающих приглашений
              </div>
            )}
            {participants.filter((p) => !p.is_used).map((p) => {
              const roleLabel = p.role === 'chair' ? 'chairman' : p.role;
              const title = p.email;
              const sectionName = p.section_id ? (sectionNameById.get(p.section_id) || '—') : null;

              return (
                <div key={p.invite_id} className="bg-slate-50/40 p-5 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black flex-shrink-0">
                      {String(title || '').charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{title}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{roleLabel}</p>
                      {p.role === 'chair' && sectionName && (
                        <p className="text-[10px] font-bold text-slate-500 mt-1">Секция: {sectionName}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => void removeParticipant(p.invite_id)}
                    className="text-slate-300 hover:text-red-500 transition-colors p-2 disabled:opacity-50"
                    type="button"
                    disabled={Boolean(deleteBusy[p.invite_id])}
                    title="Отменить приглашение"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Приняли приглашение</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!participantsLoading && participants.filter((p) => Boolean(p.is_used)).length === 0 && (
            <div className="md:col-span-2 text-center py-8 text-slate-400 font-bold text-sm uppercase tracking-widest">
              Нет принятых приглашений
            </div>
          )}
          {participants.filter((p) => Boolean(p.is_used)).map((p) => {
            const roleLabel = p.role === 'chair' ? 'chairman' : p.role;
            const title = p.user_name ? p.user_name : p.email;
            const sub = p.user_name ? p.email : '';
            const sectionName = p.section_id ? (sectionNameById.get(p.section_id) || '—') : null;

            return (
              <div key={p.invite_id} className="bg-white p-5 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black flex-shrink-0">
                    {String(title || '').charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{title}</p>
                    {sub && <p className="text-xs text-slate-500 font-semibold truncate">{sub}</p>}
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{roleLabel}</p>
                    {p.role === 'chair' && sectionName && (
                      <p className="text-[10px] font-bold text-slate-500 mt-1">Секция: {sectionName}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => void removeParticipant(p.invite_id)}
                  className="text-slate-300 hover:text-red-500 transition-colors p-2 disabled:opacity-50"
                  type="button"
                  disabled={Boolean(deleteBusy[p.invite_id])}
                  title="Удалить участника"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
