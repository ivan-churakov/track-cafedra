import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { auth, teachers as teachersApi, retakes as retakesApi, reports, setToken, getToken, removeToken, ApiError } from '../../lib/api';
import type { Teacher, TeacherCreatePayload, RetakeSchedule } from '../../types';

type Section = 'teachers' | 'schedules' | 'reports';

// ── Login Form ────────────────────────────────────────────────────────────────

function LoginForm({ onLogin }: { onLogin: (u: string, p: string) => Promise<boolean> }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ok = await onLogin(username, password);
    if (!ok) setError('Неверный логин или пароль');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏛</div>
          <h1 className="text-2xl font-bold text-white">Панель администратора</h1>
          <p className="text-gray-400 text-sm mt-1">Кафедра ПОИС · МИРЭА</p>
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
              onChange={e => { setUsername(e.target.value); setError(''); }}
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="admin@mirea.ru"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && <div className="text-red-400 text-sm text-center">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Вход...' : 'Войти'}
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

// ── Teacher Table ─────────────────────────────────────────────────────────────

function TeacherTable({
  teachers,
  loading,
  onEdit,
  onDelete,
  onAdd,
}: {
  teachers: Teacher[];
  loading: boolean;
  onEdit: (t: Teacher) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
}) {
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

      {loading ? (
        <div className="text-gray-400 text-sm py-8 text-center">Загрузка...</div>
      ) : (
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
              {teachers.map(t => (
                <tr key={t.id} className="text-gray-300 hover:bg-gray-700/30 transition-colors">
                  <td className="py-3 pr-4 text-gray-500">{t.id}</td>
                  <td className="py-3 pr-4 font-medium text-white">{t.full_name}</td>
                  <td className="py-3 pr-4">{t.position}</td>
                  <td className="py-3 pr-4 text-gray-400 text-xs">
                    {t.academic_degrees.length > 0 ? t.academic_degrees.join(', ') : '—'}
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
          {teachers.length === 0 && (
            <div className="text-center text-gray-500 py-10">Нет преподавателей</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Teacher Form Modal ────────────────────────────────────────────────────────

const EMPTY_FORM: TeacherCreatePayload = {
  last_name: '',
  first_name: '',
  middle_name: '',
  position: '',
  academic_titles: [],
  academic_degrees: [],
  email: '',
  mirea_teaching_since: '',
  before_mirea_years: 0,
  before_mirea_months: 0,
  tg_username: '',
  schedule_url: '',
  educations: [],
};

function teacherToForm(t: Teacher): TeacherCreatePayload {
  return {
    last_name: t.last_name,
    first_name: t.first_name,
    middle_name: t.middle_name,
    position: t.position,
    academic_titles: t.academic_titles,
    academic_degrees: t.academic_degrees,
    email: t.email,
    mirea_teaching_since: t.mirea_teaching_since,
    before_mirea_years: Math.floor(t.teaching_years_before_mirea),
    before_mirea_months: Math.round((t.teaching_years_before_mirea % 1) * 12),
    tg_username: t.tg_username,
    schedule_url: t.schedule_url,
    educations: t.educations,
  };
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

function TeacherForm({
  teacher,
  onSave,
  onClose,
  saving,
  error,
}: {
  teacher?: Teacher;
  onSave: (payload: TeacherCreatePayload) => void;
  onClose: () => void;
  saving: boolean;
  error: string;
}) {
  const [form, setForm] = useState<TeacherCreatePayload>(
    teacher ? teacherToForm(teacher) : EMPTY_FORM,
  );

  const set = <K extends keyof TeacherCreatePayload>(k: K, v: TeacherCreatePayload[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

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
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-xl">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Фамилия" required>
              <input required value={form.last_name} onChange={e => set('last_name', e.target.value)} className={inputClass} placeholder="Иванов" />
            </Field>
            <Field label="Имя" required>
              <input required value={form.first_name} onChange={e => set('first_name', e.target.value)} className={inputClass} placeholder="Иван" />
            </Field>
            <Field label="Отчество">
              <input value={form.middle_name} onChange={e => set('middle_name', e.target.value)} className={inputClass} placeholder="Иванович" />
            </Field>
          </div>

          <Field label="Должность">
            <input value={form.position} onChange={e => set('position', e.target.value)} className={inputClass} placeholder="Доцент" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Учёные степени (через запятую)">
              <input
                value={form.academic_degrees.join(', ')}
                onChange={e => set('academic_degrees', e.target.value ? e.target.value.split(',').map(s => s.trim()) : [])}
                className={inputClass}
                placeholder="к.т.н."
              />
            </Field>
            <Field label="Учёные звания (через запятую)">
              <input
                value={form.academic_titles.join(', ')}
                onChange={e => set('academic_titles', e.target.value ? e.target.value.split(',').map(s => s.trim()) : [])}
                className={inputClass}
                placeholder="доц."
              />
            </Field>
          </div>

          <Field label="Email">
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputClass} placeholder="ivanov@mirea.ru" />
          </Field>

          <Field label="В МИРЭА с (дата)">
            <input type="date" value={form.mirea_teaching_since} onChange={e => set('mirea_teaching_since', e.target.value)} className={inputClass} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Стаж до МИРЭА (лет)">
              <input type="number" min={0} value={form.before_mirea_years} onChange={e => set('before_mirea_years', Number(e.target.value))} className={inputClass} />
            </Field>
            <Field label="Стаж до МИРЭА (мес.)">
              <input type="number" min={0} max={11} value={form.before_mirea_months} onChange={e => set('before_mirea_months', Number(e.target.value))} className={inputClass} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Telegram">
              <input value={form.tg_username} onChange={e => set('tg_username', e.target.value)} className={inputClass} placeholder="@username" />
            </Field>
            <Field label="Ссылка на расписание (iCal)">
              <input value={form.schedule_url} onChange={e => set('schedule_url', e.target.value)} className={inputClass} placeholder="webcal://..." />
            </Field>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-900/50 rounded-xl px-4 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-medium transition-colors"
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
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

// ── Schedule Table ────────────────────────────────────────────────────────────

function ScheduleTable({
  schedules,
  teachers,
  loading,
  onDelete,
}: {
  schedules: RetakeSchedule[];
  teachers: Teacher[];
  loading: boolean;
  onDelete: (id: number) => void;
}) {
  const getName = (id: number) =>
    teachers.find(t => t.id === id)?.full_name ?? `#${id}`;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Расписание пересдач</h2>
      {loading ? (
        <div className="text-gray-400 text-sm py-8 text-center">Загрузка...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400 text-left">
                <th className="pb-3 pr-4">Преподаватель</th>
                <th className="pb-3 pr-4">Дисциплина</th>
                <th className="pb-3 pr-4">Дата/время</th>
                <th className="pb-3 pr-4">Корпус / аудитория</th>
                <th className="pb-3 pr-4">Тип</th>
                <th className="pb-3">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {schedules.map(s => (
                <tr key={s.id} className="text-gray-300 hover:bg-gray-700/30 transition-colors">
                  <td className="py-3 pr-4 text-white">
                    {s.teacher_full_name ?? getName(s.teacher_id)}
                  </td>
                  <td className="py-3 pr-4">{s.subject_name}</td>
                  <td className="py-3 pr-4 text-gray-400 text-xs">
                    {new Date(s.datetime).toLocaleString('ru-RU', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 pr-4">
                    {[s.building, s.auditorium].filter(Boolean).join(' / ') || '—'}
                  </td>
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
          {schedules.length === 0 && (
            <div className="text-center text-gray-500 py-10">Нет пересдач</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Reports Section ───────────────────────────────────────────────────────────

function ReportsSection() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingKpk, setDownloadingKpk] = useState(false);
  const [downloadingPersonnel, setDownloadingPersonnel] = useState(false);

  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    try {
      const url = reports.retakesExcelUrl('current');
      const res = await fetch(url, {
        headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
      });
      if (!res.ok) throw new Error('bad response');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'График_пересдач.xlsx';
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      alert('Не удалось загрузить Excel.');
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handleDownloadKpk = async () => {
    setDownloadingKpk(true);
    try {
      const data = await reports.kpkSummary({
        from: dateFrom || undefined,
        to: dateTo || undefined,
      });
      const lines = [
        `Сводка по КПК`,
        `Записей: ${data.summary.total_records}, Часов: ${data.summary.total_hours}`,
        '',
        ...data.items.map(
          item =>
            `${item.teacher_full_name} — ${item.course_name} (${item.issue_date}) · ${item.hours} ч. · ${item.document_name} № ${item.document_number}`,
        ),
      ];
      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'КПК_сводка.txt';
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      alert('Не удалось получить сводку КПК.');
    } finally {
      setDownloadingKpk(false);
    }
  };

  const handleDownloadPersonnel = async () => {
    setDownloadingPersonnel(true);
    try {
      const data = await reports.personnelSummary({
        from: dateFrom || undefined,
        to: dateTo || undefined,
      });
      const lines = [
        data.department,
        `Сформировано: ${new Date(data.generated_at).toLocaleString('ru-RU')}`,
        `Период: ${data.period_from} — ${data.period_to}`,
        '',
        `Всего преподавателей: ${data.summary.total_teachers}`,
        `Со степенью: ${data.summary.with_degree_count} (${data.summary.with_degree_percent}%)`,
        `Средний стаж: ${data.summary.avg_experience_years} лет`,
        `Активных КПК: ${data.summary.active_kpk_count}`,
        '',
        ...data.teachers.map(
          t =>
            `${t.teacher_full_name} | ${t.position} | ${t.academic_degree || '—'} | стаж ${t.experience_years} лет | КПК: ${t.kpk_status} | след. КПК: ${t.next_pd_due ?? '—'} (${t.days_until_next_pd ?? '?'} дн.)`,
        ),
      ];
      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'Кадровая_справка.txt';
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      alert('Не удалось получить кадровую справку.');
    } finally {
      setDownloadingPersonnel(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      {/* Date range filter */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-300">Период для отчётов</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Дата с</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Дата по</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors" />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{ label: 'Последний год', months: 12 }, { label: '2 года', months: 24 }, { label: '3 года', months: 36 }].map(p => (
            <button key={p.label} onClick={() => {
              const to = new Date(); const from = new Date();
              from.setMonth(from.getMonth() - p.months);
              setDateFrom(from.toISOString().slice(0, 10));
              setDateTo(to.toISOString().slice(0, 10));
            }} className="text-xs px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors">
              {p.label}
            </button>
          ))}
          <button onClick={() => { setDateFrom(''); setDateTo(''); }}
            className="text-xs px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-500 transition-colors">
            Сбросить
          </button>
        </div>
      </div>

      {/* KPK summary */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Сводка по КПК</h2>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <p className="text-sm text-gray-400 mb-4">TXT-файл из API бекенда.</p>
          <button onClick={handleDownloadKpk} disabled={downloadingKpk}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
            {downloadingKpk ? 'Загрузка...' : 'Скачать КПК сводку ↓'}
          </button>
        </div>
      </div>

      {/* Personnel summary */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Кадровая справка</h2>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <p className="text-sm text-gray-400 mb-4">Сводка по всем преподавателям с данными о стаже и КПК.</p>
          <button onClick={handleDownloadPersonnel} disabled={downloadingPersonnel}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
            {downloadingPersonnel ? 'Загрузка...' : 'Скачать кадровую справку ↓'}
          </button>
        </div>
      </div>

      {/* Excel schedule */}
      <div>
        <h2 className="text-lg font-semibold mb-4">График пересдач (семестр)</h2>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <p className="text-sm text-gray-400 mb-4">Excel-файл со всеми пересдачами на семестр.</p>
          <button onClick={handleDownloadExcel} disabled={downloadingExcel}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
            {downloadingExcel ? 'Загрузка...' : 'Скачать Excel ↓'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authReady, setAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [section, setSection] = useState<Section>('teachers');

  const [teachersList, setTeachersList] = useState<Teacher[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);

  const [schedulesList, setSchedulesList] = useState<RetakeSchedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);

  const [editingTeacher, setEditingTeacher] = useState<Teacher | null | undefined>(undefined);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Auth check on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      auth.me()
        .then(me => {
          if (me.role === 'ADMIN') {
            setIsAuthenticated(true);
          } else {
            removeToken();
          }
        })
        .catch(() => removeToken())
        .finally(() => setAuthReady(true));
    } else {
      setAuthReady(true);
    }
  }, []);

  const loadTeachers = useCallback(async () => {
    setTeachersLoading(true);
    try {
      const data = await teachersApi.list();
      setTeachersList(data.teachers);
    } finally {
      setTeachersLoading(false);
    }
  }, []);

  const loadSchedules = useCallback(async () => {
    setSchedulesLoading(true);
    try {
      const data = await retakesApi.list();
      setSchedulesList(data.retake_schedules);
    } finally {
      setSchedulesLoading(false);
    }
  }, []);

  // Load data when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    loadTeachers();
    loadSchedules();
  }, [isAuthenticated, loadTeachers, loadSchedules]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        Загрузка...
      </div>
    );
  }

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await auth.login(username, password);
      if (res.role !== 'ADMIN') return false;
      setToken(res.access_token);
      setIsAuthenticated(true);
      return true;
    } catch {
      return false;
    }
  };

  const handleLogout = () => {
    removeToken();
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const handleDeleteTeacher = async (id: number) => {
    if (!confirm('Удалить преподавателя?')) return;
    try {
      await teachersApi.delete(id);
      setTeachersList(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Ошибка удаления');
    }
  };

  const handleSaveTeacher = async (payload: TeacherCreatePayload) => {
    setFormSaving(true);
    setFormError('');
    try {
      if (editingTeacher) {
        const updated = await teachersApi.update(editingTeacher.id, payload);
        setTeachersList(prev => prev.map(t => (t.id === editingTeacher.id ? updated : t)));
      } else {
        const created = await teachersApi.create(payload);
        setTeachersList(prev => [...prev, created]);
      }
      setEditingTeacher(undefined);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Ошибка сохранения');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm('Удалить запись о пересдаче?')) return;
    try {
      await retakesApi.delete(id);
      setSchedulesList(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Ошибка удаления');
    }
  };

  const navItems: { key: Section; icon: string; label: string }[] = [
    { key: 'teachers', icon: '👤', label: 'Преподаватели' },
    { key: 'schedules', icon: '📅', label: 'Пересдачи' },
    { key: 'reports', icon: '📊', label: 'Отчёты' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="px-4 py-5 border-b border-gray-700">
          <div className="text-sm font-bold text-white">Панель управления</div>
          <div className="text-xs text-gray-500 mt-0.5">Кафедра ПОИС</div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => setSection(item.key)}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                section === item.key
                  ? 'bg-cyan-700/30 text-cyan-300'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <div className="px-2 py-3 border-t border-gray-700 space-y-1">
          <Link href="/teachers" className="block px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
            🔍 Поиск преп.
          </Link>
          <Link href="/" className="block px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
            🏠 На главную
          </Link>
          <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors">
            → Выйти
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="px-8 py-6">
          {section === 'teachers' && (
            <TeacherTable
              teachers={teachersList}
              loading={teachersLoading}
              onEdit={t => { setEditingTeacher(t); setFormError(''); }}
              onDelete={handleDeleteTeacher}
              onAdd={() => { setEditingTeacher(null); setFormError(''); }}
            />
          )}
          {section === 'schedules' && (
            <ScheduleTable
              schedules={schedulesList}
              teachers={teachersList}
              loading={schedulesLoading}
              onDelete={handleDeleteSchedule}
            />
          )}
          {section === 'reports' && <ReportsSection />}
        </div>
      </div>

      {editingTeacher !== undefined && (
        <TeacherForm
          teacher={editingTeacher ?? undefined}
          onSave={handleSaveTeacher}
          onClose={() => setEditingTeacher(undefined)}
          saving={formSaving}
          error={formError}
        />
      )}
    </div>
  );
}
