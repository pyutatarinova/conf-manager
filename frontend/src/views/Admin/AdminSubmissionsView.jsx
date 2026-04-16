import React, { useState } from 'react';
import { FileDown, Plus, Trash2, List, FileText } from 'lucide-react';
import { getAuthorsString } from '../../utils/helpers';

export default function AdminSubmissionsView({ activeConfId, sections, setSections, submissions, updateSubmission }) {
  const [newSecName, setNewSecName] = useState('');

  const addSection = () => {
    if (!newSecName.trim()) return;
    setSections([...sections, { id: Date.now(), conferenceId: activeConfId, name: newSecName.trim(), description: '' }]);
    setNewSecName('');
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8 animate-in zoom-in-95">
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <List className="w-5 h-5 text-indigo-500" /> Управление секциями
        </h2>
        <div className="flex gap-2">
          <input value={newSecName} onChange={(e) => setNewSecName(e.target.value)} className="flex-1 border border-slate-200 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Название новой секции..." />
          <button onClick={addSection} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Добавить
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {sections.map((s) => (
            <div key={s.id} className="p-4 border border-slate-100 rounded-xl flex justify-between items-center bg-slate-50/50 hover:border-slate-300 transition-colors">
              <span className="text-sm font-bold text-slate-700">{s.name}</span>
              <button onClick={() => setSections(sections.filter((x) => x.id !== s.id))} className="text-slate-300 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 border-t border-slate-50 pt-8">
        <h2 className="text-lg font-black text-slate-800">Перенос докладов между секциями</h2>
        <div className="space-y-3">
          {submissions.map((sub) => (
            <div key={sub.id} className="p-5 border border-slate-100 rounded-2xl flex justify-between items-center bg-slate-50/20 group hover:border-indigo-100 transition-all">
              <div className="min-w-0 flex-1 mr-4">
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-sm font-bold text-slate-800 truncate">{sub.theme}</p>
                  <button
                    className="text-slate-400 hover:text-indigo-600 p-1.5 bg-white hover:bg-indigo-50 rounded-lg shadow-sm transition-colors flex-shrink-0"
                    title={`Скачать последнюю версию: ${sub.fileName}`}
                  >
                    <FileDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="text-slate-400 hover:text-indigo-600 p-1.5 bg-white hover:bg-indigo-50 rounded-lg shadow-sm transition-colors flex-shrink-0"
                    title={`Скачать тезис: ${sub.thesisFileName || 'thesis.pdf'}`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{getAuthorsString(sub)}</p>
              </div>
              <select
                value={sub.sectionId}
                onChange={(e) => updateSubmission(sub.id, { sectionId: parseInt(e.target.value) })}
                className="text-xs font-bold bg-white border border-slate-200 shadow-sm rounded-lg px-3 py-2 outline-none"
              >
                {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          ))}
          {submissions.length === 0 && (
            <p className="text-sm font-bold text-slate-400 text-center uppercase tracking-widest py-8">Нет докладов</p>
          )}
        </div>
      </div>
    </div>
  );
}
