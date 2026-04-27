import { CalendarDays, Plus } from 'lucide-react';
import { formatConferenceDate } from '../utils/helpers';

export default function ConferenceSelectView({ conferences, onSelect, isAdmin, onCreateConference }) {
  const visibleConferences = isAdmin ? conferences : conferences.filter((c) => c.isPublic);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900">Выберите конференцию</h1>
          </div>
          {isAdmin && (
            <button
              onClick={onCreateConference}
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <Plus className="w-4 h-4" /> Создать конференцию
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleConferences.map((conference) => {
            const startDate = formatConferenceDate(conference.startDate);
            const endDate = formatConferenceDate(conference.endDate);
            const dateLabel = startDate && endDate ? `${startDate} - ${endDate}` : 'Даты пока не указаны';

            return (
              <button
                key={conference.id}
                onClick={() => onSelect(conference.id)}
                className="text-left w-full bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group"
              >
                {isAdmin && (
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${conference.isPublic ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {conference.isPublic ? 'Опубликована' : 'Скрыта'}
                    </span>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${conference.isSubmit ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                      {conference.isSubmit ? 'Приём заявок открыт' : 'Приём заявок закрыт'}
                    </span>
                  </div>
                )}
                {!isAdmin && (
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${conference.isSubmit ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                      {conference.isSubmit ? 'Приём заявок открыт' : 'Приём заявок закрыт'}
                    </span>
                  </div>
                )}
                <h2 className="text-xl font-black text-slate-900 mb-3 leading-tight">{conference.title}</h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-4 min-h-[72px]">
                  {conference.description || 'Описание конференции пока не добавлено.'}
                </p>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-500">
                  <CalendarDays className="w-4 h-4" /> {dateLabel}
                </div>
              </button>
            );
          })}

          {visibleConferences.length === 0 && (
            <div className="col-span-full bg-white border border-slate-100 rounded-3xl p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
              Нет доступных конференций
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
