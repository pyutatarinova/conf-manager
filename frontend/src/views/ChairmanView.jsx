import React, { useEffect, useMemo, useState } from 'react';
import { FileDown, FileText } from 'lucide-react';

import ConfirmModal from '../components/ui/ConfirmModal';
import StatusBadge from '../components/ui/StatusBadge';
import SubmissionDetailsModal from '../components/ui/SubmissionDetailsModal';
import { getAuthorsString } from '../utils/helpers';
import { downloadSubmissionFileDirect } from '../api/submissions';
import { triggerBrowserDownload } from '../utils/download';

export default function ChairmanView({ submissions, updateSubmission, sections, setSections, users, chairmanId }) {
  const chairman = useMemo(() => (users || []).find((u) => u.id === chairmanId) || null, [users, chairmanId]);
  const mySectionId = chairman?.sectionId || '';
  const mySection = useMemo(() => (sections || []).find((s) => s.id === mySectionId) || null, [sections, mySectionId]);

  const [desc, setDesc] = useState(mySection?.description || '');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [detailsId, setDetailsId] = useState(null);
  const [downloadBusy, setDownloadBusy] = useState({});

  useEffect(() => {
    setDesc(mySection?.description || '');
  }, [mySection]);

  const mySubmissions = useMemo(
    () => (submissions || []).filter((s) => s.sectionId === mySectionId),
    [submissions, mySectionId]
  );

  const detailsSubmission = useMemo(
    () => mySubmissions.find((s) => s.id === detailsId) || null,
    [mySubmissions, detailsId]
  );

  const download = async (submissionId, fileType) => {
    if (!submissionId) return;
    const key = `${submissionId}:${fileType}`;
    setDownloadBusy((prev) => ({ ...prev, [key]: true }));
    try {
      const { blob, filename } = await downloadSubmissionFileDirect(submissionId, fileType);
      triggerBrowserDownload(blob, filename);
    } finally {
      setDownloadBusy((prev) => ({ ...prev, [key]: false }));
    }
  };

  if (!mySection) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
          Председателю не назначена секция (или секции ещё не созданы).
        </p>
      </div>
    );
  }

  const confirmSave = () => {
    setSections(sections.map((s) => (s.id === mySectionId ? { ...s, description: desc } : s)));
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Секция: {mySection.name}</h1>
          <p className="text-sm text-slate-500 font-medium">Председатель секции: {chairman?.name || '—'}</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-300 uppercase">Подано</p>
            <p className="text-xl font-black">{mySubmissions.length}</p>
          </div>
          <div className="w-px h-8 bg-slate-100"></div>
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-300 uppercase">Проверено</p>
            <p className="text-xl font-black text-emerald-500">
              {mySubmissions.filter((s) => s.reviewerLocked || s.chairmanLocked).length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-indigo-900 p-8 rounded-[2.5rem] shadow-xl text-white space-y-4">
        <label className="text-xs font-black uppercase tracking-widest opacity-60">Описание секции (для программы)</label>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="w-full bg-white/10 border border-white/10 p-4 rounded-2xl outline-none focus:bg-white/20 transition-all text-white placeholder:text-white/30"
          rows="2"
        />
        <div className="flex justify-end">
          <button
            disabled={desc === mySection.description}
            onClick={() => setIsConfirmOpen(true)}
            className="bg-white text-indigo-900 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all disabled:opacity-50"
          >
            Сохранить описание
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmSave}
        title="Сохранить изменения?"
        message="Вы уверены, что хотите обновить публичное описание секции?"
      />

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
                <th className="p-6">Название доклада</th>
                <th className="p-6">Рецензент</th>
                <th className="p-6">Статус</th>
                <th className="p-6 text-right">Детали</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {mySubmissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <p className="font-bold text-slate-800 leading-tight break-words max-w-xs">{sub.theme}</p>
                      <div className="flex items-center gap-2">
                        <button
                          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 px-2 py-1.5 bg-white shadow-sm hover:bg-indigo-50 rounded-lg transition-colors flex-shrink-0 border border-slate-200"
                          title={`Скачать работу`}
                          type="button"
                          onClick={() => download(sub.id, 'article')}
                          disabled={Boolean(downloadBusy[`${sub.id}:article`])}
                        >
                          <FileDown className="w-4 h-4" /> <span className="text-xs font-bold">Работа</span>
                        </button>
                        <button
                          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 px-2 py-1.5 bg-white shadow-sm hover:bg-indigo-50 rounded-lg transition-colors flex-shrink-0 border border-slate-200"
                          title={`Скачать тезис`}
                          type="button"
                          onClick={() => download(sub.id, 'abstract')}
                          disabled={Boolean(downloadBusy[`${sub.id}:abstract`])}
                        >
                          <FileText className="w-4 h-4" /> <span className="text-xs font-bold">Тезис</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{getAuthorsString(sub)}</p>
                  </td>
                  <td className="p-6">
                    <select
                      value={sub.reviewerId || ''}
                      onChange={(e) => updateSubmission(sub.id, { reviewerId: e.target.value || null })}
                      disabled={sub.chairmanLocked}
                      className="text-xs font-bold bg-slate-100 border-none rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-400 disabled:opacity-50"
                      title={sub.chairmanLocked ? 'Решение председателя зафиксировано: назначение рецензента недоступно.' : ''}
                    >
                      <option value="">Назначить...</option>
                      {(users || []).filter((u) => u.role === 'reviewer').map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-6">
                    <StatusBadge status={sub.status} />
                  </td>
                  <td className="p-6 text-right">
                    <button
                      onClick={() => setDetailsId(sub.id)}
                      className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      Открыть
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {mySubmissions.length === 0 && (
            <div className="text-center py-12 text-slate-400 font-bold text-sm uppercase tracking-widest">
              Нет заявок в данной секции
            </div>
          )}
        </div>
      </div>

      <SubmissionDetailsModal
        isOpen={Boolean(detailsId)}
        onClose={() => setDetailsId(null)}
        submission={detailsSubmission}
        sections={sections}
        users={users}
        role="chairman"
        onUpdate={updateSubmission}
      />
    </div>
  );
}


