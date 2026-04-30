import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Teacher } from '../../types';

interface Props {
  teachers: Teacher[];
}

export default function TeacherLoginPage({ teachers }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored =
      localStorage.getItem('teacher_auth') ||
      sessionStorage.getItem('teacher_auth');
    if (stored) {
      router.replace('/teacher/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise<void>(r => setTimeout(r, 400));

    const matched = teachers.find(
      t => t.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!matched || password !== 'demo123') {
      setError('Неверный логин или пароль. Обратитесь к администратору кафедры.');
      setLoading(false);
      return;
    }

    const authData = JSON.stringify({ teacherId: matched.id, teacherName: matched.full_name });
    if (remember) {
      localStorage.setItem('teacher_auth', authData);
    } else {
      sessionStorage.setItem('teacher_auth', authData);
    }

    router.push('/teacher/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
            ← На главную
          </Link>
        </div>

        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-1">Войти в кабинет</h1>
          <p className="text-gray-400 text-sm mb-6">
            Регистрация не требуется. Учётные данные выдаёт администрация кафедры.
          </p>

          <div className="bg-gray-700/50 rounded-xl px-4 py-3 mb-6 text-sm text-gray-400 border border-gray-600/60">
            Самостоятельная регистрация не предусмотрена — это сделано намеренно для защиты данных кафедры.
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Email / корпоративный логин
              </label>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ivanov.ii@mirea.ru"
                autoComplete="email"
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-400">
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 accent-cyan-500"
              />
              Запомнить меня
            </label>

            {error && (
              <p className="text-red-400 text-sm bg-red-900/20 border border-red-900/50 rounded-xl px-4 py-2">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                className="text-sm text-gray-400 hover:text-white transition-colors"
                onClick={() => setError('Для сброса пароля обратитесь к администратору кафедры.')}
              >
                Забыли пароль?
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                {loading ? 'Вход...' : 'Войти →'}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-sm font-semibold text-gray-300 mb-2">Нет логина?</p>
            <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
              <li>Обратитесь к заведующему кафедрой</li>
              <li>Или к ответственному за IT-инфраструктуру</li>
              <li>Учётные данные выдаются только штатным преподавателям</li>
            </ul>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Студенты могут посмотреть расписание и кабинеты{' '}
          <Link href="/students" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            здесь
          </Link>{' '}
          — без входа.
        </p>
      </div>
    </div>
  );
}

export async function getStaticProps() {
  const teachersData = require('../../public/teachers.json');
  return {
    props: {
      teachers: teachersData.teachers,
    },
  };
}
