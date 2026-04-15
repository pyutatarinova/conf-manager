import { List } from 'lucide-react';

export default function PublicInfoView({ conference, sections }) {
  return (
    <div className="space-y-6 animate-in zoom-in-95 duration-200">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h2 className="text-3xl font-black text-slate-900 mb-6">{conference.title}</h2>
        <div className="prose text-slate-600 leading-relaxed max-w-none">
          {conference.description || <span className="italic opacity-50">Описание пока не добавлено...</span>}
        </div>
      </div>

      {sections && sections.length > 0 && (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
            <List className="w-6 h-6 text-indigo-500" /> Направления и секции
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {sections.map(sec => (
              <div key={sec.id} className="p-6 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-white hover:shadow-md hover:border-indigo-100 transition-all">
                <h4 className="font-bold text-slate-800 text-lg mb-2">{sec.name}</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {sec.description || <span className="italic opacity-50">Описание не указано</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}