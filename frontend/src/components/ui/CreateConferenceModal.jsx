import { useState } from 'react';

export default function CreateConferenceModal({ isOpen, onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const isRangeInvalid = Boolean(startDate && endDate && endDate < startDate);

  const resetAndClose = () => {
    setTitle('');
    setStartDate('');
    setEndDate('');
    onClose();
  };

  const handleCreate = () => {
    if (!title.trim() || isRangeInvalid) return;
    onCreate({
      title: title.trim(),
      startDate: startDate || '',
      endDate: endDate || ''
    });
    setTitle('');
    setStartDate('');
    setEndDate('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
        <h3 className="text-xl font-black text-slate-900 mb-2">Новая конференция</h3>
        <p className="text-slate-500 text-sm mb-6">Создайте рабочее пространство и задайте даты проведения.</p>

        <div className="space-y-4 mb-6">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название конференции..."
            className="w-full border border-slate-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase">Дата начала</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase">Дата окончания</label>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {isRangeInvalid && (
            <p className="text-xs text-red-500 font-semibold">Дата окончания не может быть раньше даты начала.</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={resetAndClose}
            className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
            type="button"
          >
            Отмена
          </button>
          <button
            disabled={!title.trim() || isRangeInvalid}
            onClick={handleCreate}
            className="flex-1 px-4 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all disabled:opacity-50"
            type="button"
          >
            Создать
          </button>
        </div>
      </div>
    </div>
  );
}

