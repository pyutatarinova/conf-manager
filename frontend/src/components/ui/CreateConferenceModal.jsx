import { useState } from 'react';

export default function CreateConferenceModal({ isOpen, onClose, onCreate }) {
  const [title, setTitle] = useState('');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
        <h3 className="text-xl font-black text-slate-900 mb-2">Новая конференция</h3>
        <p className="text-slate-500 text-sm mb-6">Создайте чистое рабочее пространство.</p>
        <input 
          autoFocus
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          placeholder="Название конференции..."
          className="w-full border border-slate-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 mb-6 font-bold"
        />
        <div className="flex gap-3">
          <button onClick={() => { onClose(); setTitle(''); }} className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">Отмена</button>
          <button 
            disabled={!title.trim()}
            onClick={() => { onCreate(title); setTitle(''); }} 
            className="flex-1 px-4 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            Создать
          </button>
        </div>
      </div>
    </div>
  );
}