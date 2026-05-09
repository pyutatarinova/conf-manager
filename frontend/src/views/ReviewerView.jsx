import React, { useState } from 'react';
import { CheckCircle, FileDown, Eye, FileText } from 'lucide-react';

import StatusBadge from '../components/ui/StatusBadge';
import { getAuthorsString } from '../utils/helpers';
import { downloadSubmissionFileDirect } from '../api/submissions';
import { triggerBrowserDownload } from '../utils/download';

export default function ReviewerView({ submissions, updateSubmission, currentReviewerId }) {
  const [activeReviewId, setActiveReviewId] = useState(null);
  const [reviewInput, setReviewInput] = useState('');
  const [statusInput, setStatusInput] = useState('reviewing');
  const [downloadBusy, setDownloadBusy] = useState({});

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

  const handleSave = (sub) => {
    if (sub.reviewerLocked || sub.chairmanLocked) return;
    const nextStatus = statusInput === 'needs_revision' && sub.revisionCount >= 1 ? 'reviewing' : statusInput;
    updateSubmission(sub.id, { status: nextStatus, reviewText: reviewInput, finalizeReview: nextStatus !== 'reviewing' });
    setActiveReviewId(null);
    setReviewInput('');
    setStatusInput('reviewing');
  };

  const mySubmissions = submissions.filter((s) => !currentReviewerId || s.reviewerId === currentReviewerId || s.reviewerId === null);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Рабочий кабинет</h1>
          <p className="text-sm text-slate-500 font-medium">Рецензирование присланных докладов</p>
        </div>
      </div>

      <div className="space-y-4">
        {mySubmissions.map((sub) => {
          const isLocked = Boolean(sub.reviewerLocked || sub.chairmanLocked);
          const currentVersion = sub.revisionCount + 1;
          const canRequestRevision = sub.revisionCount < 1;

          return (
            <div key={sub.id} className={`bg-white rounded-[2rem] border p-6 transition-all ${activeReviewId === sub.id ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-100'}`}>
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={sub.status} />
                    <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-black text-slate-500 rounded uppercase">
                      Версия №{currentVersion}
                    </span>
                    {isLocked && (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        <CheckCircle className="w-3 h-3" /> Оценено
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 break-words leading-tight">{sub.theme}</h3>
                  <div className="text-sm text-slate-600 font-medium">
                    {getAuthorsString(sub)}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 px-3 py-2 bg-slate-50 hover:bg-indigo-50 rounded-xl transition-colors border border-slate-200"
                    title={`Скачать файл: ${sub.fileName}`}
                    type="button"
                    onClick={() => download(sub.id, 'article')}
                    disabled={Boolean(downloadBusy[`${sub.id}:article`])}
                  >
                    <FileDown className="w-5 h-5" />
                    <span className="text-xs font-bold">Работа</span>
                  </button>
                  <button
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 px-3 py-2 bg-slate-50 hover:bg-indigo-50 rounded-xl transition-colors border border-slate-200"
                    title={`Скачать тезис: ${sub.thesisFileName || 'thesis.pdf'}`}
                    type="button"
                    onClick={() => download(sub.id, 'abstract')}
                    disabled={Boolean(downloadBusy[`${sub.id}:abstract`])}
                  >
                    <FileText className="w-5 h-5" />
                    <span className="text-xs font-bold">Тезис</span>
                  </button>
                  {!isLocked && activeReviewId !== sub.id && (
                    <button
                      onClick={() => {
                        setActiveReviewId(sub.id);
                        setReviewInput(sub.reviewText || '');
                        setStatusInput(sub.status || 'reviewing');
                      }}
                      className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-shadow shadow-md whitespace-nowrap"
                    >
                      Оценить
                    </button>
                  )}
                  {isLocked && (
                    <button
                      onClick={() => {
                        setActiveReviewId(activeReviewId === sub.id ? null : sub.id);
                        setReviewInput(sub.reviewText || '');
                        setStatusInput(sub.status || 'reviewing');
                      }}
                      className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 px-3 py-2 bg-slate-50 hover:bg-indigo-50 rounded-xl transition-colors border border-slate-200"
                      title="Просмотр оценки"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {activeReviewId === sub.id && (
                <div className="mt-6 p-6 bg-slate-50 rounded-2xl space-y-5 animate-in slide-in-from-top-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Вердикт по версии №{currentVersion}</label>
                      <select
                        value={statusInput}
                        onChange={(e) => setStatusInput(e.target.value)}
                        disabled={isLocked}
                        className="w-full border border-slate-200 p-3 rounded-xl outline-none bg-white font-bold text-slate-700 disabled:opacity-60"
                      >
                        <option value="reviewing">Оставить на рассмотрении</option>
                        <option value="accepted_oral">Принять как устный доклад</option>
                        <option value="accepted_poster">Принять как постерный доклад</option>
                        {canRequestRevision && <option value="needs_revision">Отправить на доработку (только 1 раз)</option>}
                        <option value="rejected">Отклонить работу</option>
                      </select>
                    </div>
                  </div>

                  {!canRequestRevision && (
                    <p className="text-xs text-slate-500 font-semibold">Повторная доработка недоступна: следующая версия считается финальной.</p>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Текст рецензии для авторов</label>
                    <textarea
                      value={reviewInput}
                      onChange={(e) => setReviewInput(e.target.value)}
                      placeholder="Укажите замечания или причину отказа..."
                      disabled={isLocked}
                      className="w-full border border-slate-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px] disabled:opacity-60"
                    ></textarea>
                  </div>
                  <div className="flex gap-3 justify-end items-center pt-2">
                    <button onClick={() => setActiveReviewId(null)} className="font-bold text-slate-400 px-4 hover:text-slate-600">Отмена</button>
                    <button onClick={() => handleSave(sub)} className="bg-slate-900 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg hover:bg-black">Сохранить</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {mySubmissions.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Нет работ для рецензирования</p>
          </div>
        )}
      </div>
    </div>
  );
}

