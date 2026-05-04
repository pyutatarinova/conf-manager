import { useState } from 'react';
import {
  Plus, X, Upload, List, FileDown, FileText,
  MessageSquare, ChevronUp, ChevronDown, Trash2
} from 'lucide-react';

import StatusBadge from '../components/ui/StatusBadge';
import { getAuthorsString } from '../utils/helpers';

import { uploadFile } from '../api/files';
import { attachThesis, createSubmission } from '../api/submissions';

const ACCEPTED_FILE_TYPES = '.pdf,.docx';

const isSupportedFile = (file) => {
  if (!file || !file.name) return false;
  const lowerName = file.name.toLowerCase();
  return lowerName.endsWith('.pdf') || lowerName.endsWith('.docx');
};

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''));

export default function AuthorView({ activeConfId, currentUser, sendEmail, isSubmitOpen, sections, submissions, setSubmissions, updateSubmission }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coAuthors, setCoAuthors] = useState([]);
  const [expandedReview, setExpandedReview] = useState(null);
  const [revisionUploads, setRevisionUploads] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [revisionErrors, setRevisionErrors] = useState({});

  const addCoAuthor = () => setCoAuthors([...coAuthors, { name: '', email: '', position: '' }]);
  const removeCoAuthor = (idx) => setCoAuthors(coAuthors.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isSubmitOpen) {
      setSubmitError('Приём заявок закрыт. Вы можете просматривать ранее поданные работы.');
      return;
    }

    const myEmail = String(currentUser?.email || '').trim();
    if (!myEmail) {
      setSubmitError('Не удалось определить email вашего аккаунта. Перезайдите в систему.');
      return;
    }
    const fd = new FormData(e.target);
    const paperFile = fd.get('file');
    const thesisFile = fd.get('thesisFile');

    if (!isSupportedFile(paperFile) || !isSupportedFile(thesisFile)) {
      setSubmitError('Допустимы только файлы PDF и DOCX.');
      return;
    }

    setSubmitError('');

    try {
      // Backend submission currently accepts one file_id; we bind it to the main paper file.
      const uploaded = await uploadFile(paperFile);
      const fileId = uploaded?.id;
      if (!fileId) throw new Error('Не удалось загрузить файл.');

      const uploadedThesis = await uploadFile(thesisFile);
      const thesisFileId = uploadedThesis?.id;
      if (!thesisFileId) throw new Error('Не удалось загрузить файл тезиса.');

      const created = await createSubmission({
        conference_id: activeConfId,
        section_id: isUuid(fd.get('sectionId')) ? fd.get('sectionId') : null,
        title: fd.get('theme'),
        file_id: fileId
      });

      const submissionId = created?.id;
      if (submissionId) {
        await attachThesis(submissionId, thesisFileId);
      }

      setSubmissions([...submissions, {
        id: created?.id || Date.now(),
        conferenceId: activeConfId,
        authorName: fd.get('fullName'),
        email: myEmail,
        position: fd.get('position') || currentUser?.affiliation || '',
        coAuthors,
        theme: fd.get('theme'),
        sectionId: fd.get('sectionId'),
        fileName: paperFile.name || 'doc.pdf',
        thesisFileName: thesisFile.name || 'thesis.pdf',
        status: 'reviewing',
        revisionCount: 0,
        reviewText: '',
        reviewerId: null,
        isBest: false,
        backendFileId: fileId,
        backendThesisFileId: thesisFileId
      }]);

      setIsSubmitting(false);
      setCoAuthors([]);

      const uniqueCoauthorEmails = [...new Set(coAuthors.map((a) => String(a.email || '').trim()).filter(Boolean))];
      uniqueCoauthorEmails.forEach((email) => {
        sendEmail?.({
          to: email,
          subject: 'Вы указаны соавтором работы',
          text: `Вас указали соавтором работы "${fd.get('theme')}". Если у вас уже есть аккаунт с этой почтой — работа появится в личном кабинете. Если нет — зарегистрируйтесь с этой почтой.`
        });
      });
    } catch (err) {
      setSubmitError(err?.message || 'Не удалось отправить работу.');
    }
  };

  const handleRevisionFilesChange = (submissionId, field, file) => {
    setRevisionErrors((prev) => ({ ...prev, [submissionId]: '' }));
    setRevisionUploads((prev) => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        [field]: file || null
      }
    }));
  };

  const uploadRevisionFiles = (sub) => {
    const files = revisionUploads[sub.id] || {};
    if (!files.paper || !files.thesis) return;

    if (!isSupportedFile(files.paper) || !isSupportedFile(files.thesis)) {
      setRevisionErrors((prev) => ({ ...prev, [sub.id]: 'Допустимы только PDF и DOCX для работы и тезиса.' }));
      return;
    }

    (async () => {
      try {
        const uploaded = await uploadFile(files.paper);
        const fileId = uploaded?.id;
        if (!fileId) throw new Error('Не удалось загрузить исправленную версию.');

        const uploadedThesis = await uploadFile(files.thesis);
        const thesisFileId = uploadedThesis?.id;
        if (!thesisFileId) throw new Error('Не удалось загрузить исправленную версию тезиса.');

        updateSubmission(sub.id, {
          status: 'reviewing',
          revisionCount: sub.revisionCount + 1,
          fileName: files.paper.name || sub.fileName,
          thesisFileName: files.thesis.name || sub.thesisFileName,
          reviewText: '',
          backendFileId: fileId,
          backendThesisFileId: thesisFileId
        });

        if (sub.id) {
          await attachThesis(sub.id, thesisFileId);
        }

        setRevisionUploads((prev) => {
          const next = { ...prev };
          delete next[sub.id];
          return next;
        });
        setRevisionErrors((prev) => ({ ...prev, [sub.id]: '' }));
      } catch (e) {
        setRevisionErrors((prev) => ({ ...prev, [sub.id]: e?.message || 'Не удалось загрузить исправленную версию.' }));
      }
    })();

  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Мои публикации</h1>
          <p className="text-sm text-slate-500 font-medium">Статус ваших научных работ</p>
        </div>
        <button
          disabled={!isSubmitOpen}
          onClick={() => {
            if (!isSubmitOpen) {
              setSubmitError('Приём заявок закрыт. Вы можете просматривать ранее поданные работы.');
              return;
            }
            setIsSubmitting(!isSubmitting);
          }}
          className={`${isSubmitting ? 'bg-slate-100 text-slate-500' : 'bg-indigo-600 text-white'} px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSubmitting ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          <span className="hidden md:inline">{isSubmitting ? 'Закрыть' : 'Новая работа'}</span>
        </button>
      </div>

      {!isSubmitOpen && (
        <div className="bg-amber-50 border border-amber-100 text-amber-900 p-4 rounded-2xl text-sm font-semibold">
          Приём заявок в этой конференции закрыт: новые работы подать нельзя.
        </div>
      )}

      {isSubmitting && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl border border-indigo-50 space-y-6 animate-in zoom-in-95 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Основной автор (ФИО)</label>
              <input required name="fullName" defaultValue={currentUser?.name || ''} className="w-full border border-slate-200 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Иванов И.И." />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Email</label>
              <input value={currentUser?.email || ''} readOnly className="w-full border border-slate-200 p-3.5 rounded-xl outline-none bg-slate-50 text-slate-600" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Должность</label>
              <input name="position" defaultValue={currentUser?.affiliation || ''} className="w-full border border-slate-200 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Аспирант" />
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Соавторы</h4>
              <button type="button" onClick={addCoAuthor} className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline">
                <Plus className="w-3.5 h-3.5" /> Добавить соавтора
              </button>
            </div>
            {coAuthors.map((ca, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-10 gap-2 items-center animate-in slide-in-from-left-2">
                <input required className="md:col-span-3 text-sm p-2.5 rounded-lg border-slate-200" placeholder="ФИО" value={ca.name} onChange={(e) => { const n = [...coAuthors]; n[i].name = e.target.value; setCoAuthors(n); }} />
                <input required className="md:col-span-3 text-sm p-2.5 rounded-lg border-slate-200" placeholder="Email" value={ca.email} onChange={(e) => { const n = [...coAuthors]; n[i].email = e.target.value; setCoAuthors(n); }} />
                <input className="md:col-span-3 text-sm p-2.5 rounded-lg border-slate-200" placeholder="Должность" value={ca.position} onChange={(e) => { const n = [...coAuthors]; n[i].position = e.target.value; setCoAuthors(n); }} />
                <button type="button" onClick={() => removeCoAuthor(i)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Название работы</label>
            <input required name="theme" className="w-full border border-slate-200 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Введите название..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select required name="sectionId" className="w-full border border-slate-200 p-3.5 rounded-xl outline-none bg-white">
              <option value="">Выберите секцию</option>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Файл работы (PDF/DOCX)</label>
              <input required name="file" type="file" accept={ACCEPTED_FILE_TYPES} className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Файл тезиса (PDF/DOCX)</label>
              <input required name="thesisFile" type="file" accept={ACCEPTED_FILE_TYPES} className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-sm" />
            </div>
          </div>

          {submitError && <p className="text-xs text-red-500 font-semibold">{submitError}</p>}

          <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-lg">
            Отправить на рецензию
          </button>
        </form>
      )}

      <div className="space-y-4">
        {submissions.map((sub) => (
          <div key={sub.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 md:p-8 space-y-4">
              <div className="flex items-center gap-3">
                <StatusBadge status={sub.status} />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Версия {sub.revisionCount + 1}</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 leading-tight break-words">{sub.theme}</h3>
                <div className="text-sm text-slate-600 font-medium break-words">
                  {getAuthorsString(sub)}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                <div className="flex items-center gap-1.5"><List className="w-3.5 h-3.5" /> {sections.find((s) => s.id === sub.sectionId)?.name}</div>
                <div className="flex items-center gap-1.5"><FileDown className="w-3.5 h-3.5" /> {sub.fileName}</div>
                <div className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {sub.thesisFileName || 'thesis.pdf'}</div>
              </div>

              {sub.reviewText && (
                <div className="pt-2">
                  <button
                    onClick={() => setExpandedReview(expandedReview === sub.id ? null : sub.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${expandedReview === sub.id ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
                  >
                    <span className="flex items-center gap-2 font-bold text-sm text-slate-700">
                      <MessageSquare className="w-4 h-4 text-amber-500" />
                      Комментарий рецензента
                      {expandedReview !== sub.id && <span className="text-[10px] font-black opacity-50 uppercase">(Нажмите, чтобы развернуть)</span>}
                    </span>
                    {expandedReview === sub.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {expandedReview === sub.id && (
                    <div className="p-5 mt-2 bg-amber-50 rounded-2xl border border-amber-100 animate-in slide-in-from-top-2 duration-200">
                      <p className="text-sm text-amber-900 leading-relaxed break-words whitespace-pre-wrap">
                        {sub.reviewText}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {sub.status === 'needs_revision' && (
              <div className="px-6 pb-6 pt-0">
                {sub.revisionCount >= 1 ? (
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 text-center py-2">
                    Лимит доработки исчерпан, текущая версия считается финальной
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Исправленная работа (PDF/DOCX)</label>
                        <input
                          type="file"
                          accept={ACCEPTED_FILE_TYPES}
                          onChange={(e) => handleRevisionFilesChange(sub.id, 'paper', e.target.files?.[0])}
                          className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Исправленный тезис (PDF/DOCX)</label>
                        <input
                          type="file"
                          accept={ACCEPTED_FILE_TYPES}
                          onChange={(e) => handleRevisionFilesChange(sub.id, 'thesis', e.target.files?.[0])}
                          className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-sm"
                        />
                      </div>
                    </div>
                    {revisionErrors[sub.id] && <p className="text-xs text-red-500 font-semibold">{revisionErrors[sub.id]}</p>}
                    <button
                      onClick={() => uploadRevisionFiles(sub)}
                      disabled={!revisionUploads[sub.id]?.paper || !revisionUploads[sub.id]?.thesis}
                      className="w-full bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" /> Загрузить исправленную версию и тезис
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {submissions.length === 0 && !isSubmitting && (
          <div className="text-center py-20">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">У вас пока нет поданных работ</p>
          </div>
        )}
      </div>
    </div>
  );
}
