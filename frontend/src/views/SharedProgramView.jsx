import { Calendar } from 'lucide-react';

import { getAuthorsString } from '../utils/helpers';

const PROGRAM_STATUSES = ['accepted_oral', 'accepted_poster', 'needs_revision', 'revision_submitted'];

export default function SharedProgramView({ sections, submissions, programSections = [] }) {
  const hasServerProgram = Array.isArray(programSections) && programSections.length > 0;

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm animate-in zoom-in-95">
      <h2 className="text-xl font-black mb-8 text-slate-900 border-b border-slate-50 pb-4 flex items-center gap-2">
        <Calendar className="w-6 h-6 text-indigo-600" /> Программа конференции
      </h2>
      {(hasServerProgram
        ? programSections.map((ps) => ({ id: ps.section_id, name: ps.section_name, description: ps.section_description, serverSubmissions: ps.submissions || [] }))
        : sections
      ).map((sec) => {
        const inProgram = submissions.filter(
          (s) => s.sectionId === sec.id
            && ((hasServerProgram && s.isInProgram) || (!hasServerProgram && s.chairmanLocked))
            && PROGRAM_STATUSES.includes(s.status)
        );

        const list = hasServerProgram
          ? inProgram.filter((s) => (sec.serverSubmissions || []).some((x) => x.id === s.id))
          : inProgram;

        if (list.length === 0) return null;

        return (
          <div key={sec.id} className="mb-10 animate-in slide-in-from-left-4">
            <div className="bg-slate-900 p-5 rounded-2xl mb-4 text-white shadow-lg">
              <h3 className="font-black uppercase tracking-widest text-sm">{sec.name}</h3>
              {sec.description && <p className="text-xs opacity-70 mt-1">{sec.description}</p>}
            </div>
            <div className="space-y-6 ml-4">
              {list.map((p, idx) => (
                <div key={p.id} className="flex gap-4 items-start group">
                  <span className="text-indigo-100 font-black text-3xl transition-colors group-hover:text-indigo-600">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 leading-tight break-words mb-1">{p.theme}</h4>
                    <div className="flex flex-wrap gap-x-3 text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-400">
                        Авторы: <span className="text-slate-700">{getAuthorsString(p)}</span>
                      </span>
                      {['accepted_oral', 'accepted_poster'].includes(p.status) && (
                        <span className="text-indigo-500">
                          • {p.status === 'accepted_oral' ? 'Устный доклад' : 'Постерный доклад'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {submissions.filter((s) => ((hasServerProgram && s.isInProgram) || (!hasServerProgram && s.chairmanLocked)) && PROGRAM_STATUSES.includes(s.status)).length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Программа еще формируется</p>
        </div>
      )}
    </div>
  );
}
