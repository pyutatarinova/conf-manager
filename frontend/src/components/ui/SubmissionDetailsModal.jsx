import React, { useEffect, useMemo, useState } from 'react';
import { X, FileDown, FileText } from 'lucide-react';

import StatusBadge from './StatusBadge';
import { getAuthorsString } from '../../utils/helpers';

const STATUS_OPTIONS = [
  { value: 'reviewing', label: 'На рецензировании' },
  { value: 'accepted_oral', label: 'Принята (устно)' },
  { value: 'accepted_poster', label: 'Принята (постер)' },
  { value: 'needs_revision', label: 'Доработка' },
  { value: 'rejected', label: 'Отклонена' }
];

export default function SubmissionDetailsModal({
  isOpen,
  onClose,
  submission,
  sections,
  users,
  role,
  onUpdate
}) {
  const [statusDraft, setStatusDraft] = useState('reviewing');
  const [reviewDraft, setReviewDraft] = useState('');

  useEffect(() => {
    if (!isOpen || !submission) return;
    setStatusDraft(submission.status || 'reviewing');
    setReviewDraft(submission.reviewText || '');
  }, [isOpen, submission]);

  const sectionName = useMemo(
    () => (sections || []).find((s) => s.id === submission?.sectionId)?.name || '—',
    [sections, submission]
  );

  const reviewerName = useMemo(() => {
    if (!submission?.reviewerId) return '—';
    const reviewer = (users || []).find((u) => u.id === submission.reviewerId);
    return reviewer?.name || '—';
  }, [users, submission]);

  const isChairmanLocked = Boolean(submission?.chairmanLocked);
  const isReviewerLocked = Boolean(submission?.reviewerLocked);

  const canEdit =
    role === 'admin'
    || (role === 'chairman' && !isChairmanLocked);

  const hasChanges = Boolean(submission) && (
    statusDraft !== submission.status
    || reviewDraft !== (submission.reviewText || '')
  );

  const canConfirmChairman = role === 'chairman' && !isChairmanLocked;
  const primaryEnabled = role === 'chairman' ? canConfirmChairman : (canEdit && hasChanges);
  const primaryLabel = role === 'chairman'
    ? (hasChanges ? 'Сохранить и подтвердить' : 'Подтвердить проверку')
    : 'Сохранить';

  const save = () => {
    if (!submission) return;

    if (role === 'chairman') {
      if (!canConfirmChairman) return;
      if (hasChanges) {
        onUpdate(submission.id, { status: statusDraft, reviewText: reviewDraft, finalizeChairman: true });
      } else {
        onUpdate(submission.id, { finalizeChairman: true });
      }
      onClose();
      return;
    }

    if (!canEdit || !hasChanges) return;
    onUpdate(submission.id, { status: statusDraft, reviewText: reviewDraft });
    onClose();
  };

  if (!isOpen || !submission) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[85vh] flex flex-col">
        <div className="p-6 bg-slate-900 text-white flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Секция: {sectionName}</p>
            <h3 className="text-xl md:text-2xl font-black leading-tight break-words mt-2">{submission.theme}</h3>
            <p className="text-sm text-white/80 mt-2 break-words">
              Авторы: {getAuthorsString(submission)}
            </p>
            <div className="mt-4">
              <StatusBadge status={submission.status} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 hover:text-white transition-colors"
            type="button"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/70 space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Файлы</p>
              <div className="flex flex-wrap gap-2">
                <button
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 shadow-sm"
                  title={`Скачать работу: ${submission.fileName}`}
                  type="button"
                >
                  <FileDown className="w-4 h-4" /> Работа
                </button>
                <button
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 shadow-sm"
                  title={`Скачать тезисы: ${submission.thesisFileName || 'thesis.pdf'}`}
                  type="button"
                >
                  <FileText className="w-4 h-4" /> Тезисы
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Версия: <span className="font-bold text-slate-700">№{(submission.revisionCount ?? 0) + 1}</span>
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/70 space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Проверка</p>
              <p className="text-sm text-slate-800 font-semibold">Рецензент: {reviewerName}</p>
              <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
                <span className={`px-2 py-1 rounded-lg border ${isReviewerLocked ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-white text-slate-500 border-slate-200'}`}>
                  {isReviewerLocked ? 'Рецензия зафиксирована' : 'Рецензия не зафиксирована'}
                </span>
                <span className={`px-2 py-1 rounded-lg border ${isChairmanLocked ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-white text-slate-500 border-slate-200'}`}>
                  {isChairmanLocked ? 'Проверка председателя зафиксирована' : 'Проверка председателя не зафиксирована'}
                </span>
              </div>
              {!isChairmanLocked && (
                <p className="text-xs text-slate-500">
                  В программу доклад попадёт только после подтверждения председателем.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Статус работы</label>
              <select
                value={statusDraft}
                onChange={(e) => setStatusDraft(e.target.value)}
                disabled={!canEdit}
                className="w-full border border-slate-200 p-3 rounded-xl outline-none bg-white font-bold text-slate-700 disabled:opacity-60 shadow-sm"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Комментарий рецензента</label>
              <textarea
                value={reviewDraft}
                onChange={(e) => setReviewDraft(e.target.value)}
                disabled={!canEdit}
                className="w-full border border-slate-200 p-3 rounded-xl outline-none min-h-[110px] disabled:opacity-60 shadow-sm"
                placeholder="Комментарий для автора…"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-2">
            <p className="text-xs text-slate-500">
              {role === 'chairman' && !isChairmanLocked ? 'После подтверждения председатель больше не сможет менять статус и комментарий для текущей версии.' : ' '}
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-50">
                Закрыть
              </button>
              {(role === 'admin' || role === 'chairman') && (
                <button
                  onClick={save}
                  disabled={!primaryEnabled}
                  className="px-5 py-2 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-100"
                >
                  {primaryLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

