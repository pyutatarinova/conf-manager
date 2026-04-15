import React, { useState} from 'react';
import { Award } from 'lucide-react';

export default function AuthView({ onAuth, conference }) {
  const [isLogin, setIsLogin] = useState(true);
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl max-w-md w-full border border-slate-100 animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">{conference?.title || 'Система управления'}</h1>
          <p className="text-slate-400 mt-2 font-medium">{isLogin ? 'Личный кабинет' : 'Регистрация участника'}</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onAuth(); }} className="space-y-4">
          {!isLogin && <input required type="text" className="w-full border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="ФИО" />}
          <input required type="email" className="w-full border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Email" />
          <input required type="password" className="w-full border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Пароль" />
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100 active:scale-95">
            {isLogin ? 'Войти в систему' : 'Зарегистрироваться'}
          </button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-6 text-sm text-slate-400 hover:text-indigo-600 font-bold transition-colors">
          {isLogin ? 'У вас еще нет аккаунта?' : 'Уже зарегистрированы? Войти'}
        </button>
      </div>
    </div>
  );
}