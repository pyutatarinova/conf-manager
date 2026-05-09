import React, { useState } from 'react';
import { Award } from 'lucide-react';

import { login, registerInvite } from '../../api/auth';

const hasLetter = (value) => /[A-Za-zА-Яа-я]/.test(String(value || ''));

export default function InviteRegisterView({ onAuth, onBack }) {
  const [name, setName] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const value = String(password || '');
      if (value.length < 6 || !hasLetter(value)) {
        setError('Пароль: минимум 6 символов и хотя бы одна буква.');
        return;
      }

      const data = await registerInvite({ name, password, token });
      const email = data?.email;
      if (!email) throw new Error('Не удалось получить email из приглашения.');

      const accessToken = data?.access_token;
      if (accessToken) {
        onAuth?.(accessToken);
        return;
      }

      const loginToken = await login({ email, password });
      onAuth?.(loginToken);
    } catch (err) {
      setError(err?.message || 'Ошибка регистрации по приглашению');
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
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Регистрация по приглашению</h1>
          <p className="text-slate-400 mt-2 font-medium">Введите ФИО, токен и пароль</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            placeholder="ФИО"
            disabled={isSubmitting}
          />

          <input
            required
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            placeholder="Токен приглашения"
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
            Зарегистрироваться
          </button>
        </form>

        <button
          type="button"
          onClick={() => onBack?.()}
          className="w-full mt-6 text-sm text-slate-400 hover:text-indigo-600 font-bold transition-colors"
          disabled={isSubmitting}
        >
          Вход
        </button>
      </div>
    </div>
  );
}
