import { useState } from 'react';
import {
  Plus, X, Upload, List, FileDown,
  MessageSquare, ChevronUp, ChevronDown
} from 'lucide-react';

import StatusBadge from '../components/ui/StatusBadge';
import { getAuthorsString } from '../utils/helpers';

export default function AuthorView({ activeConfId, sections, submissions, setSubmissions, updateSubmission }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coAuthors, setCoAuthors] = useState([]);
  const [expandedReview, setExpandedReview] = useState(null);

  const addCoAuthor = () => setCoAuthors([...coAuthors, { name: '', email: '', position: '' }]);
  const removeCoAuthor = (idx) => setCoAuthors(coAuthors.filter((_, i) => i !== idx));

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    setSubmissions([...submissions, {
      id: Date.now(),
      conferenceId: activeConfId,
      authorName: fd.get('fullName'),
      email: fd.get('email'),
      position: fd.get('position'),
      coAuthors,
      theme: fd.get('theme'),
      sectionId: parseInt(fd.get('sectionId')),
      fileName: fd.get('file').name || 'doc.pdf',
      status: 'reviewing',
      revisionCount: 0,
      reviewText: '',
      reviewerId: null,
      isBest: false,
      headApproved: false
    }]);
    setIsSubmitting(false);
    setCoAuthors([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Мои публикации</h1>
          <p className="text-sm text-slate-500 font-medium">Статус ваших научных работ</p>
        </div>
        <button 
          onClick={() => setIsSubmitting(!isSubmitting)} 
          className={`${isSubmitting ? 'bg-slate-100 text-slate-500' : 'bg-indigo-600 text-white'} px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2`}
        >
          {isSubmitting ? <X className="w-5 h-5"/> : <Plus className="w-5 h-5"/>}
          <span className="hidden md:inline">{isSubmitting ? 'Закрыть' : 'Новая работа'}</span>
        </button>
      </div>

      {isSubmitting && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl border border-indigo-50 space-y-6 animate-in zoom-in-95 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Основной Автор (ФИО)</label>
              <input required name="fullName" className="w-full border border-slate-200 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Иванов И.И." />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Email</label>
              <input required name="email" type="email" className="w-full border border-slate-200 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="ivanov@uni.ru" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Должность</label>
              <input required name="position" className="w-full border border-slate-200 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Аспирант" />
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
                <input required className="md:col-span-3 text-sm p-2.5 rounded-lg border-slate-200" placeholder="ФИО" value={ca.name} onChange={e=> {let n=[...coAuthors]; n[i].name=e.target.value; setCoAuthors(n)}} />
                <input required className="md:col-span-3 text-sm p-2.5 rounded-lg border-slate-200" placeholder="Email" value={ca.email} onChange={e=> {let n=[...coAuthors]; n[i].email=e.target.value; setCoAuthors(n)}} />
                <input className="md:col-span-3 text-sm p-2.5 rounded-lg border-slate-200" placeholder="Должность" value={ca.position} onChange={e=> {let n=[...coAuthors]; n[i].position=e.target.value; setCoAuthors(n)}} />
                <button type="button" onClick={()=>removeCoAuthor(i)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Название работы</label>
            <input required name="theme" className="w-full border border-slate-200 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Введите название..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select required name="sectionId" className="w-full border border-slate-200 p-3.5 rounded-xl outline-none bg-white">
              <option value="">Выберите секцию</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input required name="file" type="file" className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-sm" />
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-lg">Отправить на рецензию</button>
        </form>
      )}

      <div className="space-y-4">
        {submissions.map(sub => (
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
                 <div className="flex items-center gap-1.5"><List className="w-3.5 h-3.5" /> {sections.find(s=>s.id === sub.sectionId)?.name}</div>
                 <div className="flex items-center gap-1.5"><FileDown className="w-3.5 h-3.5" /> {sub.fileName}</div>
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
                <button 
                  onClick={() => updateSubmission(sub.id, { status: 'reviewing', revisionCount: sub.revisionCount + 1 })}
                  className="w-full bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  <Upload className="w-4 h-4" /> Загрузить исправленную версию
                </button>
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