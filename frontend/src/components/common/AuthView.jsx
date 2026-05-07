import React, { useState } from 'react';
import { Award } from 'lucide-react';

import { login, register } from '../../api/auth';

const hasLetter = (value) => /[A-Za-zА-Яа-я]/.test(String(value || ''));

export default function AuthView({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const token = await login({ email, password });
        onAuth?.(token);
        return;
      }

      const value = String(password || '');
      if (value.length < 6 || !hasLetter(value)) {
        setError('Пароль: минимум 6 символов и хотя бы одна буква.');
        return;
      }

      await register({ name, email, password });
      const token = await login({ email, password });
      onAuth?.(token);
    } catch (err) {
      setError(err?.message || 'Ошибка авторизации');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl max-w-md w-full border border-slate-100 animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Менеджер конференций</h1>
          <p className="text-slate-400 mt-2 font-medium">
            {isLogin ? 'Личный кабинет' : 'Регистрация участника'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="ФИО"
              disabled={isSubmitting}
            />
          )}

          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            placeholder="Email"
            disabled={isSubmitting}
          />

          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            placeholder="Пароль"
            disabled={isSubmitting}
          />

          {error && (
            <div className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100 active:scale-95"
          >
            {isLogin ? 'Войти в систему' : 'Зарегистрироваться'}
          </button>
        </form>

        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
          }}
          className="w-full mt-6 text-sm text-slate-400 hover:text-indigo-600 font-bold transition-colors"
          disabled={isSubmitting}
        >
          {isLogin ? 'У вас ещё нет аккаунта?' : 'Уже зарегистрированы? Войти'}
        </button>
      </div>
    </div>
  );
}

