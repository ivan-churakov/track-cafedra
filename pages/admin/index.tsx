import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { Teacher, RetakeSchedule } from '../../types';

interface Props {
  initialTeachers: Teacher[];
  initialRetakeSchedules: RetakeSchedule[];
}

type Section = 'teachers' | 'schedules';

// ──────────────────────────────── Login Form ────────────────────────────────

function LoginForm({ onLogin }: { onLogin: (u: string, p: string) => boolean }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onLogin(username, password);
    if (!ok) setError('Неверный логин или пароль');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏛</div>
          <h1 className="text-2xl font-bold text-white">Панель администратора</h1>
          <p className="text-gray-400 text-sm mt-1">Кафедра ИКБ · МИРЭА</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-800 rounded-2xl border border-gray-700 p-6 space-y-4"
        >
          <div>
            <label className="block text-sm text-gray-400 mb-1">Логин</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="admin"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Войти
          </button>
        </form>

        <div className="text-center mt-4">
          <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            ← На главную
          </Link>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────── Teacher Table ────────────────────────────────

interface TeacherTableProps {
  teachers: Teacher[];
  onEdit: (t: Teacher) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
}

function TeacherTable({ teachers, onEdit, onDelete, onAdd }: TeacherTableProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Преподаватели</h2>
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          + Добавить
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400 text-left">
              <th className="pb-3 pr-4">ID</th>
              <th className="pb-3 pr-4">ФИО</th>
              <th className="pb-3 pr-4">Должность</th>
              <th className="pb-3 pr-4">Степень</th>
              <th className="pb-3 pr-4">Email</th>
              <th className="pb-3">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {teachers.map((t) => (
              <tr key={t.id} className="text-gray-300 hover:bg-gray-700/30 transition-colors">
                <td className="py-3 pr-4 text-gray-500">{t.id}</td>
                <td className="py-3 pr-4 font-medium text-white">{t.full_name}</td>
                <td className="py-3 pr-4">{t.position}</td>
                <td className="py-3 pr-4 text-gray-400 text-xs">
                  {t.academic_degree || '—'}
                </td>
                <td className="py-3 pr-4 text-gray-400">{t.email}</td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(t)}
                      className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      Изменить
                    </button>
                    <button
                      onClick={() => onDelete(t.id)}
                      className="px-3 py-1 text-xs bg-red-900/50 hover:bg-red-800/70 text-red-400 hover:text-red-300 rounded-lg transition-colors"
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ──────────────────────────────── Teacher Form Modal ────────────────────────────────

interface TeacherFormProps {
  teacher?: Teacher;
  onSave: (t: Partial<Teacher>) => void;
  onClose: () => void;
}

const EMPTY_TEACHER: Partial<Teacher> = {
  full_name: '',
  position: '',
  academic_title: null,
  academic_degree: null,
  email: '',
  teaching_experience: new Date().getFullYear(),
  photo_url: '',
  tg_username: '',
  schedule_url: '',
};

function TeacherForm({ teacher, onSave, onClose }: TeacherFormProps) {
  const [form, setForm] = useState<Partial<Teacher>>(teacher ?? EMPTY_TEACHER);

  const set = (field: keyof Teacher, value: string | number | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="w-full max-w-lg bg-gray-800 rounded-2xl border border-gray-700 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">
            {teacher ? 'Редактировать преподавателя' : 'Добавить преподавателя'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="ФИО" required>
            <input
              required
              value={form.full_name ?? ''}
              onChange={(e) => set('full_name', e.target.value)}
              className={inputClass}
              placeholder="Иванов Иван Иванович"
            />
          </Field>

          <Field label="Должность">
            <input
              value={form.position ?? ''}
              onChange={(e) => set('position', e.target.value)}
              className={inputClass}
              placeholder="Доцент"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Учёная степень">
              <input
                value={form.academic_degree ?? ''}
                onChange={(e) => set('academic_degree', e.target.value || null)}
                className={inputClass}
                placeholder="Канд. техн. наук"
              />
            </Field>
            <Field label="Учёное звание">
              <input
                value={form.academic_title ?? ''}
                onChange={(e) => set('academic_title', e.target.value || null)}
                className={inputClass}
                placeholder="Доцент"
              />
            </Field>
          </div>

          <Field label="Email">
            <input
              type="email"
              value={form.email ?? ''}
              onChange={(e) => set('email', e.target.value)}
              className={inputClass}
              placeholder="ivanov@mirea.ru"
            />
          </Field>

          <Field label="Год начала преподавательской деятельности">
            <input
              type="number"
              value={form.teaching_experience ?? ''}
              onChange={(e) => set('teaching_experience', parseInt(e.target.value))}
              className={inputClass}
              placeholder="2010"
              min={1950}
              max={new Date().getFullYear()}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Telegram">
              <input
                value={form.tg_username ?? ''}
                onChange={(e) => set('tg_username', e.target.value)}
                className={inputClass}
                placeholder="@username"
              />
            </Field>
            <Field label="Ссылка на расписание (iCal)">
              <input
                value={form.schedule_url ?? ''}
                onChange={(e) => set('schedule_url', e.target.value)}
                className={inputClass}
                placeholder="webcal://..."
              />
            </Field>
          </div>

          <Field label="URL фотографии">
            <input
              value={form.photo_url ?? ''}
              onChange={(e) => set('photo_url', e.target.value)}
              className={inputClass}
              placeholder="https://..."
            />
          </Field>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-2.5 rounded-xl font-medium transition-colors"
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-xl font-medium transition-colors"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  'w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors';

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

// ──────────────────────────────── Schedule Table ────────────────────────────────

function ScheduleTable({
  schedules,
  teachers,
  onDelete,
}: {
  schedules: RetakeSchedule[];
  teachers: Teacher[];
  onDelete: (id: number) => void;
}) {
  const getTeacherName = (id: number) =>
    teachers.find((t) => t.id === id)?.full_name ?? `#${id}`;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Расписание пересдач</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400 text-left">
              <th className="pb-3 pr-4">Преподаватель</th>
              <th className="pb-3 pr-4">Дисциплина</th>
              <th className="pb-3 pr-4">Дата/время</th>
              <th className="pb-3 pr-4">Аудитория</th>
              <th className="pb-3 pr-4">Тип</th>
              <th className="pb-3">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {schedules.map((s) => (
              <tr key={s.id} className="text-gray-300 hover:bg-gray-700/30 transition-colors">
                <td className="py-3 pr-4 text-white">{getTeacherName(s.teacher_id)}</td>
                <td className="py-3 pr-4">{s.discipline_name}</td>
                <td className="py-3 pr-4 text-gray-400 text-xs">
                  {new Date(s.datetime).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="py-3 pr-4">{s.auditorium}</td>
                <td className="py-3 pr-4">
                  {s.is_commission ? (
                    <span className="text-xs px-2 py-0.5 bg-orange-900/50 text-orange-400 rounded-full">
                      Комиссия
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 bg-red-900/50 text-red-400 rounded-full">
                      Пересдача
                    </span>
                  )}
                </td>
                <td className="py-3">
                  <button
                    onClick={() => onDelete(s.id)}
                    className="px-3 py-1 text-xs bg-red-900/50 hover:bg-red-800/70 text-red-400 hover:text-red-300 rounded-lg transition-colors"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ──────────────────────────────── Main Admin Page ────────────────────────────────

export default function AdminPage({ initialTeachers, initialRetakeSchedules }: Props) {
  const { isAuthenticated, isLoading, login, logout } = useAuth();
  const [section, setSection] = useState<Section>('teachers');
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [schedules, setSchedules] = useState<RetakeSchedule[]>(initialRetakeSchedules);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null | undefined>(undefined);
  // undefined = form closed, null = new teacher, Teacher = editing existing

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        Загрузка...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }

  const handleDeleteTeacher = (id: number) => {
    if (confirm('Удалить преподавателя?')) {
      setTeachers((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const handleSaveTeacher = (data: Partial<Teacher>) => {
    if (editingTeacher === null) {
      // New teacher
      const newId = Math.max(...teachers.map((t) => t.id), 0) + 1;
      setTeachers((prev) => [...prev, { ...EMPTY_TEACHER, ...data, id: newId } as Teacher]);
    } else if (editingTeacher) {
      // Edit existing
      setTeachers((prev) =>
        prev.map((t) => (t.id === editingTeacher.id ? { ...t, ...data } : t))
      );
    }
    setEditingTeacher(undefined);
  };

  const handleDeleteSchedule = (id: number) => {
    if (confirm('Удалить запись о пересдаче?')) {
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="px-4 py-5 border-b border-gray-700">
          <div className="text-sm font-bold text-white">Панель управления</div>
          <div className="text-xs text-gray-500 mt-0.5">Кафедра ИКБ</div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-1">
          <button
            onClick={() => setSection('teachers')}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
              section === 'teachers'
                ? 'bg-cyan-700/30 text-cyan-300'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            👤 Преподаватели
          </button>
          <button
            onClick={() => setSection('schedules')}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
              section === 'schedules'
                ? 'bg-cyan-700/30 text-cyan-300'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            📅 Пересдачи
          </button>
        </nav>

        <div className="px-2 py-3 border-t border-gray-700 space-y-1">
          <Link
            href="/teachers"
            className="block px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            🔍 Поиск преп.
          </Link>
          <Link
            href="/"
            className="block px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            🏠 На главную
          </Link>
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"
          >
            → Выйти
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="px-8 py-6">
          {section === 'teachers' && (
            <TeacherTable
              teachers={teachers}
              onEdit={(t) => setEditingTeacher(t)}
              onDelete={handleDeleteTeacher}
              onAdd={() => setEditingTeacher(null)}
            />
          )}
          {section === 'schedules' && (
            <ScheduleTable
              schedules={schedules}
              teachers={teachers}
              onDelete={handleDeleteSchedule}
            />
          )}
        </div>
      </div>

      {/* Teacher form modal */}
      {editingTeacher !== undefined && (
        <TeacherForm
          teacher={editingTeacher ?? undefined}
          onSave={handleSaveTeacher}
          onClose={() => setEditingTeacher(undefined)}
        />
      )}
    </div>
  );
}

export async function getStaticProps() {
  const teachersData = require('../../public/teachers.json');
  const schedulesData = require('../../public/retake_schedules.json');

  return {
    props: {
      initialTeachers: teachersData.teachers,
      initialRetakeSchedules: schedulesData.retake_schedules,
    },
  };
}
