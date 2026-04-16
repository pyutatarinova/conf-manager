import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';

import ConfirmModal from '../../components/ui/ConfirmModal';

export default function AdminInfoView({ conference, conferences, setConferences }) {
  const [editConf, setEditConf] = useState(conference);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    setEditConf(conference);
  }, [conference]);

  const saveConf = () => {
    setConferences(conferences.map((c) => (c.id === editConf.id ? editConf : c)));
  };

  const isRangeInvalid = Boolean(editConf?.startDate && editConf?.endDate && editConf.endDate < editConf.startDate);

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 max-w-2xl w-full mx-auto animate-in zoom-in-95">
      <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-4">
        <Info className="w-5 h-5 text-indigo-500" /> Параметры конференции
      </h2>
      <div className="space-y-5">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase">Название</label>
          <input
            value={editConf.title}
            onChange={(e) => setEditConf({ ...editConf, title: e.target.value })}
            className="w-full border border-slate-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase">Краткое описание</label>
          <textarea
            value={editConf.description}
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
              value={editConf.startDate || ''}
              onChange={(e) => setEditConf({ ...editConf, startDate: e.target.value })}
              className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">Дата окончания</label>
            <input
              type="date"
              value={editConf.endDate || ''}
              min={editConf.startDate || undefined}
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
        >
          Применить изменения
        </button>
      </div>
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={saveConf}
        title="Обновить настройки?"
        message="Это действие изменит информацию для всех участников конференции."
      />
    </div>
  );
}

