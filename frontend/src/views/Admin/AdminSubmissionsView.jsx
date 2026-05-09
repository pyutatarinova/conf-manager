import React, { useMemo, useState } from 'react';
import { FileDown, Plus, Trash2, List, FileText, Pencil } from 'lucide-react';

import { getAuthorsString } from '../../utils/helpers';
import StatusBadge from '../../components/ui/StatusBadge';
import SubmissionDetailsModal from '../../components/ui/SubmissionDetailsModal';
import { createSection, updateSection } from '../../api/conferences';

export default function AdminSubmissionsView({ activeConfId, sections, setSections, submissions, users, updateSubmission }) {
  const [newSecName, setNewSecName] = useState('');
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [sectionDescDraft, setSectionDescDraft] = useState('');
  const [detailsId, setDetailsId] = useState(null);
  const [sectionError, setSectionError] = useState('');

  const detailsSubmission = useMemo(
    () => (submissions || []).find((s) => s.id === detailsId) || null,
    [submissions, detailsId]
  );

  const addSection = async () => {
    const name = newSecName.trim();
    if (!name || !activeConfId) return;
    setSectionError('');
    try {
      const created = await createSection(activeConfId, { name, description: '' });
      setSections([
        ...sections,
        {
          id: created?.id || Date.now(),
          conferenceId: created?.conference_id || activeConfId,
          name: created?.name || name,
          description: created?.description || ''
        }
      ]);
      setNewSecName('');
    } catch (e) {
      setSectionError(e?.message || 'Не удалось создать секцию.');
    }
  };

  const startEditSection = (section) => {
    setEditingSectionId(section.id);
    setSectionDescDraft(section.description || '');
  };

  const saveSectionDesc = () => {
    if (!editingSectionId) return;
    const target = sections.find((s) => s.id === editingSectionId);
    if (target?.id && activeConfId) {
      void updateSection(activeConfId, target.id, { name: target.name, description: sectionDescDraft }).catch(() => {});
    }
    setSections(sections.map((s) => (s.id === editingSectionId ? { ...s, description: sectionDescDraft } : s)));
    setEditingSectionId(null);
    setSectionDescDraft('');
  };

  const chairmanBySectionId = useMemo(() => {
    const map = new Map();
    (users || [])
      .filter((u) => u.role === 'chairman' && u.sectionId)
      .forEach((u) => map.set(u.sectionId, u.name));
    return map;
  }, [users]);

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8 animate-in zoom-in-95">
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <List className="w-5 h-5 text-indigo-500" /> Управление секциями
        </h2>
        <div className="flex gap-2">
          <input value={newSecName} onChange={(e) => setNewSecName(e.target.value)} className="flex-1 border border-slate-200 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Название новой секции..." />
          <button onClick={addSection} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all hover:bg-indigo-700" type="button">
            <Plus className="w-4 h-4" /> Добавить
          </button>
        </div>
        {sectionError && <p className="text-sm text-red-600 font-semibold">{sectionError}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {sections.map((s) => {
            const chairmanName = chairmanBySectionId.get(s.id) || '—';
            const isEditing = editingSectionId === s.id;

            return (
              <div key={s.id} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 hover:border-slate-300 transition-colors">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{s.name}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Председатель: {chairmanName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => (isEditing ? saveSectionDesc() : startEditSection(s))}
                      className="text-slate-400 hover:text-indigo-600 p-2 bg-white rounded-xl border border-slate-200"
                      title={isEditing ? 'Сохранить описание' : 'Редактировать описание'}
                      type="button"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setSections(sections.filter((x) => x.id !== s.id))} className="text-slate-300 hover:text-red-500 p-2 bg-white rounded-xl border border-slate-200" type="button">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-4 space-y-2">
                    <textarea
                      value={sectionDescDraft}
                      onChange={(e) => setSectionDescDraft(e.target.value)}
                      className="w-full border border-slate-200 p-3 rounded-xl outline-none bg-white min-h-[90px]"
                      placeholder="Описание секции…"
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditingSectionId(null); setSectionDescDraft(''); }} className="px-4 py-2 rounded-xl font-bold text-slate-500 hover:bg-white/60" type="button">
                        Отмена
                      </button>
                      <button onClick={saveSectionDesc} className="px-4 py-2 rounded-xl font-bold bg-slate-900 text-white hover:bg-black" type="button">
                        Сохранить
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 leading-relaxed mt-3">
                    {s.description || <span className="italic opacity-60">Описание не указано</span>}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 border-t border-slate-50 pt-8">
        <h2 className="text-lg font-black text-slate-800">Работы</h2>
        <div className="space-y-3">
          {submissions.map((sub) => (
            <div key={sub.id} className="p-5 border border-slate-100 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/20 hover:border-indigo-100 transition-all">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <StatusBadge status={sub.status} />
                  <p className="text-sm font-bold text-slate-800 truncate max-w-[520px]">{sub.theme}</p>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{getAuthorsString(sub)}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 px-3 py-2 bg-white hover:bg-indigo-50 rounded-xl transition-colors border border-slate-200"
                    title={`Скачать работу: ${sub.fileName}`}
                    type="button"
                  >
                    <FileDown className="w-4 h-4" /> <span className="text-xs font-bold">Работа</span>
                  </button>
                  <button
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 px-3 py-2 bg-white hover:bg-indigo-50 rounded-xl transition-colors border border-slate-200"
                    title={`Скачать тезисы: ${sub.thesisFileName || 'thesis.pdf'}`}
                    type="button"
                  >
                    <FileText className="w-4 h-4" /> <span className="text-xs font-bold">Тезисы</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-end flex-shrink-0">
                <select
                  value={sub.sectionId}
                  onChange={(e) => updateSubmission(sub.id, { sectionId: e.target.value })}
                  className="text-xs font-bold bg-white border border-slate-200 shadow-sm rounded-lg px-3 py-2 outline-none"
                >
                  {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button
                  onClick={() => setDetailsId(sub.id)}
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-shadow shadow-md whitespace-nowrap"
                  type="button"
                >
                  Открыть заявку
                </button>
              </div>
            </div>
          ))}
          {submissions.length === 0 && (
            <p className="text-sm font-bold text-slate-400 text-center uppercase tracking-widest py-8">Нет докладов</p>
          )}
        </div>
      </div>

      <SubmissionDetailsModal
        isOpen={Boolean(detailsId)}
        onClose={() => setDetailsId(null)}
        submission={detailsSubmission}
        sections={sections}
        users={users}
        role="admin"
        onUpdate={updateSubmission}
      />
    </div>
  );
}
