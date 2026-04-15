import { AlertCircle } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
        <div className="bg-amber-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-amber-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">Отмена</button>
          <button onClick={() => { onConfirm(); onClose(); }} className="flex-1 px-4 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-shadow shadow-lg shadow-indigo-100">ОК</button>
        </div>
      </div>
    </div>
  );
}