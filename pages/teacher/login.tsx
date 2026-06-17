import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { auth, setToken, getToken } from '../../lib/api';

type Mode = 'login' | 'register';

export default function TeacherLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  useEffect(() => {
    const stored =
      localStorage.getItem('teacher_auth') ||
      sessionStorage.getItem('teacher_auth');
    if (getToken() && stored) {
      router.replace('/teacher/dashboard');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await auth.login(email.trim(), password);

      if (res.role !== 'TEACHER') {
        setLoginError('Этот аккаунт не является преподавательским.');
        setLoginLoading(false);
        return;
      }

      setToken(res.access_token);

      const authData = JSON.stringify({
        teacherId: res.teacher_id,
        teacherName: res.teacher_full_name,
      });
      if (remember) {
        localStorage.setItem('teacher_auth', authData);
      } else {
        sessionStorage.setItem('teacher_auth', authData);
      }

      router.push('/teacher/dashboard');
    } catch {
      setLoginError('Неверный логин или пароль. Обратитесь к администратору кафедры.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (regPassword !== regConfirm) {
      setRegError('Пароли не совпадают');
      return;
    }
    if (regPassword.length < 8) {
      setRegError('Пароль должен содержать минимум 8 символов');
      return;
    }

    setRegLoading(true);
    try {
      await auth.register(regEmail.trim().toLowerCase(), regPassword);
      setRegSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Ошибка при отправке заявки. Попробуйте позже.';
      setRegError(message);
    } finally {
      setRegLoading(false);
    }
  };

  const inputClass =
    'w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors';

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
            ← На главную
          </Link>
        </div>

        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl">
          {/* Mode tabs */}
          <div className="flex gap-1 bg-gray-700/50 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setMode('login'); setLoginError(''); setRegError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'login' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Войти
            </button>
            <button
              onClick={() => { setMode('register'); setLoginError(''); setRegError(''); setRegSuccess(false); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'register' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Зарегистрироваться
            </button>
          </div>

          {mode === 'login' && (
            <>
              <h1 className="text-xl font-bold text-white mb-5">Войти в кабинет</h1>

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                  <input
                    type="text"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setLoginError(''); }}
                    placeholder="ivanov.ii@mirea.ru"
                    autoComplete="email"
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Пароль</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setLoginError(''); }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className={inputClass}
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

                {loginError && (
                  <p className="text-red-400 text-sm bg-red-900/20 border border-red-900/50 rounded-xl px-4 py-2">
                    {loginError}
                  </p>
                )}

                <div className="flex items-center justify-end mt-2">
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
                  >
                    {loginLoading ? 'Вход...' : 'Войти →'}
                  </button>
                </div>
              </form>
            </>
          )}

          {mode === 'register' && !regSuccess && (
            <>
              <h1 className="text-xl font-bold text-white mb-2">Заявка на регистрацию</h1>
              <p className="text-sm text-gray-400 mb-5">
                Введите корпоративный email (домены{' '}
                <span className="text-gray-300">@edu.mirea.ru</span>,{' '}
                <span className="text-gray-300">@mirea.ru</span>). Вы должны быть предварительно
                внесены в справочник кафедры администратором.
              </p>

              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Email *</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={e => { setRegEmail(e.target.value); setRegError(''); }}
                    placeholder="ivanov.ii@edu.mirea.ru"
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Пароль *</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={e => { setRegPassword(e.target.value); setRegError(''); }}
                    placeholder="Минимум 8 символов"
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Подтвердите пароль *</label>
                  <input
                    type="password"
                    value={regConfirm}
                    onChange={e => { setRegConfirm(e.target.value); setRegError(''); }}
                    placeholder="Повторите пароль"
                    required
                    className={inputClass}
                  />
                </div>

                {regError && (
                  <p className="text-red-400 text-sm bg-red-900/20 border border-red-900/50 rounded-xl px-4 py-2">
                    {regError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={regLoading}
                  className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors mt-2"
                >
                  {regLoading ? 'Отправка...' : 'Подать заявку'}
                </button>
              </form>
            </>
          )}

          {mode === 'register' && regSuccess && (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">✓</div>
              <h2 className="text-lg font-bold text-white mb-2">Письмо отправлено</h2>
              <p className="text-gray-400 text-sm">
                Ссылка для подтверждения регистрации отправлена на{' '}
                <span className="text-cyan-400">{regEmail}</span>.
                Перейдите по ней для активации аккаунта.
              </p>
              <button
                onClick={() => { setMode('login'); setRegSuccess(false); }}
                className="mt-6 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                ← Вернуться к входу
              </button>
            </div>
          )}
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
