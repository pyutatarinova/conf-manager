import React, { useEffect, useState } from 'react';
import { Info } from 'lucide-react';

import ConfirmModal from '../../components/ui/ConfirmModal';
import { updateConference } from '../../api/conferences';

export default function AdminInfoView({ conference, conferences, setConferences }) {
  const [editConf, setEditConf] = useState(conference);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [toggleConfirm, setToggleConfirm] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditConf(conference);
    setSaveError('');
    setIsSaving(false);
  }, [conference]);

  const applyConferenceField = (field, value) => {
    setEditConf((prev) => ({ ...prev, [field]: value }));
    setConferences(conferences.map((c) => (c.id === conference.id ? { ...c, [field]: value } : c)));
  };

  const updateRemote = async (next) => {
    if (!conference?.id) return null;
    const payload = {
      title: next.title,
      description: next.description,
      start_date: next.startDate ? `${next.startDate}T00:00:00.000Z` : null,
      submission_deadline: next.endDate ? `${next.endDate}T00:00:00.000Z` : null,
      is_public: Boolean(next.isPublic),
      is_submit: Boolean(next.isSubmit)
    };
    return updateConference(conference.id, payload);
  };

  const saveConf = async () => {
    if (!editConf?.id) return;
    setSaveError('');
    setIsSaving(true);
    try {
      await updateRemote(editConf);
      setConferences(conferences.map((c) => (c.id === editConf.id ? editConf : c)));
    } catch (e) {
      setSaveError(e?.message || 'Не удалось сохранить конференцию.');
    } finally {
      setIsSaving(false);
    }
  };

  const isRangeInvalid = Boolean(editConf?.startDate && editConf?.endDate && editConf.endDate < editConf.startDate);

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 max-w-4xl w-full mx-auto animate-in zoom-in-95">
      <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-4">
        <Info className="w-5 h-5 text-indigo-500" /> Параметры конференции
      </h2>

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Публикация</p>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-slate-800 whitespace-normal break-words">
                  {editConf?.isPublic ? 'Конференция опубликована' : 'Конференция скрыта'}
                </p>
                <p className="text-xs text-slate-500">
                  {editConf?.isPublic ? 'Видна всем пользователям.' : 'Видна только администратору.'}
                </p>
              </div>
              <button
                onClick={() => setToggleConfirm({ field: 'isPublic', nextValue: !editConf?.isPublic })}
                className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-colors ${editConf?.isPublic ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50' : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'}`}
                type="button"
              >
                {editConf?.isPublic ? 'Скрыть' : 'Опубликовать'}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Приём заявок</p>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-slate-800 whitespace-normal break-words">
                  {editConf?.isSubmit ? 'Приём заявок открыт' : 'Приём заявок закрыт'}
                </p>
                <p className="text-xs text-slate-500">
                  {editConf?.isSubmit ? 'Авторы могут подавать новые работы.' : 'Авторы не смогут подать новую работу.'}
                </p>
              </div>
              <button
                onClick={() => setToggleConfirm({ field: 'isSubmit', nextValue: !editConf?.isSubmit })}
                className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-colors ${editConf?.isSubmit ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50' : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'}`}
                type="button"
              >
                {editConf?.isSubmit ? 'Закрыть' : 'Открыть'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase">Название</label>
          <input
            value={editConf?.title || ''}
            onChange={(e) => setEditConf({ ...editConf, title: e.target.value })}
            className="w-full border border-slate-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase">Краткое описание</label>
          <textarea
            value={editConf?.description || ''}
            onChange={(e) => setEditConf({ ...editConf, description: e.target.value })}
            className="w-full border border-slate-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            rows="4"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">Дата начала</label>
            <input
              type="date"
              value={editConf?.startDate || ''}
              onChange={(e) => setEditConf({ ...editConf, startDate: e.target.value })}
              className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">Дедлайн заявок</label>
            <input
              type="date"
              value={editConf?.endDate || ''}
              min={editConf?.startDate || undefined}
              onChange={(e) => setEditConf({ ...editConf, endDate: e.target.value })}
              className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {isRangeInvalid && (
          <p className="text-xs text-red-500 font-semibold">Дата окончания не может быть раньше даты начала.</p>
        )}

        <button
          disabled={isRangeInvalid || JSON.stringify(editConf) === JSON.stringify(conference)}
          onClick={() => setIsConfirmOpen(true)}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
          type="button"
        >
          Применить изменения
        </button>
        {isSaving && <p className="text-xs text-slate-500 font-semibold">Сохранение…</p>}
        {saveError && <p className="text-sm text-red-600 font-semibold">{saveError}</p>}
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={saveConf}
        title="Обновить настройки?"
        message="Это действие изменит информацию для всех участников конференции."
      />
      <ConfirmModal
        isOpen={Boolean(toggleConfirm)}
        onClose={() => setToggleConfirm(null)}
        onConfirm={() => {
          if (!toggleConfirm) return;
          (async () => {
            const next = { ...editConf, [toggleConfirm.field]: toggleConfirm.nextValue };
            setSaveError('');
            setIsSaving(true);
            try {
              await updateRemote(next);
              applyConferenceField(toggleConfirm.field, toggleConfirm.nextValue);
            } catch (e) {
              setSaveError(e?.message || 'Не удалось сохранить конференцию.');
            } finally {
              setIsSaving(false);
              setToggleConfirm(null);
            }
          })();
        }}
        title={toggleConfirm?.field === 'isPublic'
          ? (toggleConfirm?.nextValue ? 'Опубликовать конференцию?' : 'Скрыть конференцию?')
          : (toggleConfirm?.nextValue ? 'Открыть приём заявок?' : 'Закрыть приём заявок?')}
        message={toggleConfirm?.field === 'isPublic'
          ? (toggleConfirm?.nextValue ? 'Вы уверены, что хотите опубликовать конференцию?' : 'Вы уверены, что хотите скрыть конференцию?')
          : (toggleConfirm?.nextValue ? 'Вы уверены, что хотите открыть приём заявок?' : 'Вы уверены, что хотите закрыть приём заявок?')}
      />
    </div>
  );
}
