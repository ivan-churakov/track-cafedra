import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { useRouter } from 'next/router';
import { Teacher, KpkCourse, RetakeSchedule, DutySchedule, CalendarEvent, CalendarEventType } from '../../types';
import { WeeklyCalendar } from '../../Components/Calendar/WeeklyCalendar';

interface RawScheduleEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: CalendarEventType;
  location?: string;
  description?: string;
}

interface Props {
  teachers: Teacher[];
  allKpkCourses: KpkCourse[];
  allRetakes: RetakeSchedule[];
  allDuties: DutySchedule[];
  schedulesByTeacher: Record<string, RawScheduleEvent[]>;
}

type Tab = 'schedule' | 'kpk' | 'retakes' | 'profile';

const FORMAT_LABELS: Record<string, string> = {
  offline: 'очно',
  online: 'онлайн',
  mixed: 'смешанный',
};

function newId(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function TeacherDashboard({
  teachers,
  allKpkCourses,
  allRetakes,
  allDuties,
  schedulesByTeacher,
}: Props) {
  const router = useRouter();
  const [authData, setAuthData] = useState<{ teacherId: number; teacherName: string } | null>(null);
  const [tab, setTab] = useState<Tab>('schedule');

  // KPK state
  const [kpkCourses, setKpkCourses] = useState<KpkCourse[]>([]);
  const [showAddKpk, setShowAddKpk] = useState(false);
  const [kpkForm, setKpkForm] = useState<Partial<KpkCourse>>({
    title: '', hours: 36, format: 'offline', startDate: null, room: '', description: '',
  });

  // Retakes state
  const [retakes, setRetakes] = useState<RetakeSchedule[]>([]);
  const [showAddRetake, setShowAddRetake] = useState(false);
  const [retakeForm, setRetakeForm] = useState<Partial<RetakeSchedule>>({
    discipline_name: '', datetime: '', auditorium: '',
    duration_minutes: 90, is_commission: false, comment: '',
  });

  // Auth check
  useEffect(() => {
    const stored =
      localStorage.getItem('teacher_auth') ||
      sessionStorage.getItem('teacher_auth');
    if (!stored) {
      router.replace('/teacher/login');
      return;
    }
    try {
      setAuthData(JSON.parse(stored));
    } catch {
      router.replace('/teacher/login');
    }
  }, [router]);

  // Seed KPK from localStorage or static data
  useEffect(() => {
    if (!authData) return;
    const key = `kpk_courses_${authData.teacherId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try { setKpkCourses(JSON.parse(stored)); return; } catch {}
    }
    setKpkCourses(allKpkCourses.filter(c => c.teacherId === authData.teacherId));
  }, [authData, allKpkCourses]);

  // Seed retakes from localStorage or static data
  useEffect(() => {
    if (!authData) return;
    const key = `retakes_${authData.teacherId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try { setRetakes(JSON.parse(stored)); return; } catch {}
    }
    setRetakes(allRetakes.filter(r => r.teacher_id === authData.teacherId));
  }, [authData, allRetakes]);

  const teacher = useMemo(
    () => teachers.find(t => t.id === authData?.teacherId) ?? null,
    [teachers, authData]
  );

  const calendarEvents = useMemo((): CalendarEvent[] => {
    if (!authData) return [];
    const events: CalendarEvent[] = (schedulesByTeacher[authData.teacherId] ?? []).map(e => ({
      id: e.id, title: e.title,
      start: new Date(e.start), end: new Date(e.end),
      type: e.type, location: e.location, description: e.description,
    }));
    retakes.forEach(r => {
      const start = new Date(r.datetime);
      const end = new Date(start.getTime() + r.duration_minutes * 60 * 1000);
      events.push({
        id: `retake-${r.id}`,
        title: r.is_commission ? `[Комиссия] ${r.discipline_name}` : `[Пересдача] ${r.discipline_name}`,
        start, end,
        type: r.is_commission ? 'commission' : 'retake',
        location: r.auditorium,
        description: r.comment || undefined,
      });
    });
    allDuties.filter(d => d.teacher_id === authData.teacherId).forEach(d => {
      events.push({
        id: `duty-${d.id}`, title: 'Дежурство',
        start: new Date(d.start_datetime), end: new Date(d.end_datetime),
        type: 'duty', location: d.auditorium,
      });
    });
    return events;
  }, [authData, schedulesByTeacher, retakes, allDuties]);

  const saveKpk = (list: KpkCourse[]) => {
    if (!authData) return;
    setKpkCourses(list);
    localStorage.setItem(`kpk_courses_${authData.teacherId}`, JSON.stringify(list));
  };

  const saveRetakes = (list: RetakeSchedule[]) => {
    if (!authData) return;
    setRetakes(list);
    localStorage.setItem(`retakes_${authData.teacherId}`, JSON.stringify(list));
  };

  const handleAddKpk = (status: 'draft' | 'published') => {
    if (!authData || !kpkForm.title?.trim()) return;
    const course: KpkCourse = {
      id: newId(),
      teacherId: authData.teacherId,
      title: kpkForm.title!,
      hours: kpkForm.hours ?? 36,
      format: (kpkForm.format as KpkCourse['format']) ?? 'offline',
      startDate: kpkForm.startDate ?? null,
      room: kpkForm.room ?? '',
      description: kpkForm.description ?? '',
      status,
    };
    saveKpk([...kpkCourses, course]);
    setKpkForm({ title: '', hours: 36, format: 'offline', startDate: null, room: '', description: '' });
    setShowAddKpk(false);
  };

  const handleAddRetake = () => {
    if (!authData || !retakeForm.discipline_name?.trim() || !retakeForm.datetime) return;
    const retake: RetakeSchedule = {
      id: newId(),
      teacher_id: authData.teacherId,
      discipline_id: 0,
      discipline_name: retakeForm.discipline_name!,
      datetime: retakeForm.datetime!,
      comment: retakeForm.comment ?? '',
      auditorium: retakeForm.auditorium ?? '',
      duration_minutes: retakeForm.duration_minutes ?? 90,
      is_commission: retakeForm.is_commission ?? false,
    };
    saveRetakes([...retakes, retake]);
    setRetakeForm({ discipline_name: '', datetime: '', auditorium: '', duration_minutes: 90, is_commission: false, comment: '' });
    setShowAddRetake(false);
  };

  const handleDownloadKpk = () => {
    const lines = kpkCourses.map((c, i) => {
      const parts = [
        `${i + 1}. ${c.title}`,
        `   Часы: ${c.hours}`,
        `   Формат: ${FORMAT_LABELS[c.format] ?? c.format}`,
        c.startDate ? `   Начало: ${new Date(c.startDate).toLocaleDateString('ru-RU')}` : '',
        c.room ? `   Место: ${c.room}` : '',
        c.description ? `   Описание: ${c.description}` : '',
        `   Статус: ${c.status === 'published' ? 'опубликовано' : 'черновик'}`,
      ];
      return parts.filter(Boolean).join('\n');
    });
    const content = `Курсы повышения квалификации\n${teacher?.full_name ?? ''}\n\n${lines.join('\n\n')}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `КПК_${teacher?.full_name ?? 'преподаватель'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    localStorage.removeItem('teacher_auth');
    sessionStorage.removeItem('teacher_auth');
    router.push('/teacher/login');
  };

  if (!authData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top bar */}
      <div className="border-b border-gray-700 px-6 py-4 flex items-center gap-2 sm:gap-4">
        <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
          Главная
        </Link>
        <span className="text-gray-600">/</span>
        <Link href="/teacher/login" className="text-gray-400 hover:text-white text-sm transition-colors">
          Вход
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-gray-300 text-sm">Кабинет</span>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-1.5 border border-gray-700">
            <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold">
              {getInitials(authData.teacherName)}
            </div>
            <span className="text-sm text-gray-300 max-w-[140px] truncate hidden sm:block">
              {authData.teacherName}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Выйти
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-2xl font-bold">{(schedulesByTeacher[authData.teacherId] ?? []).length}</div>
            <div className="text-sm font-medium text-gray-300 mt-1">Занятий в семестре</div>
            <div className="text-xs text-gray-500 mt-0.5">из расписания</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-2xl font-bold flex items-baseline gap-1.5">
              {kpkCourses.length}
              {kpkCourses.filter(c => c.status === 'draft').length > 0 && (
                <span className="text-xs text-yellow-400 font-medium">
                  {kpkCourses.filter(c => c.status === 'draft').length} черн.
                </span>
              )}
            </div>
            <div className="text-sm font-medium text-gray-300 mt-1">Курсов КПК</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-2xl font-bold">{retakes.length}</div>
            <div className="text-sm font-medium text-gray-300 mt-1">Пересдач</div>
            <div className="text-xs text-gray-500 mt-0.5">запланировано</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-2xl font-bold">
              {teacher ? new Date().getFullYear() - teacher.teaching_experience : '—'}
            </div>
            <div className="text-sm font-medium text-gray-300 mt-1">Лет стажа</div>
            <div className="text-xs text-gray-500 mt-0.5">c {teacher?.teaching_experience}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-800 rounded-xl p-1 border border-gray-700">
          {([
            { key: 'schedule', label: '📅 Расписание' },
            { key: 'kpk', label: '🎓 КПК' },
            { key: 'retakes', label: '📝 Пересдачи' },
            { key: 'profile', label: '👤 Профиль' },
          ] as { key: Tab; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-gray-700 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Schedule */}
        {tab === 'schedule' && (
          <div>
            <p className="text-sm text-gray-400 mb-4">
              Расписание загружено из системы. Редактирование будет доступно после подключения к бэкенду.
            </p>
            <WeeklyCalendar events={calendarEvents} />
          </div>
        )}

        {/* Tab: KPK */}
        {tab === 'kpk' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-gray-300">
                Курсы повышения квалификации ({kpkCourses.length})
              </h2>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={handleDownloadKpk}
                  disabled={kpkCourses.length === 0}
                  className="text-sm text-gray-400 hover:text-white border border-gray-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Скачать ↓
                </button>
                <button
                  onClick={() => setShowAddKpk(v => !v)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
                >
                  + Добавить
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {kpkCourses.length === 0 && (
                <div className="text-center text-gray-500 py-8">Нет курсов</div>
              )}
              {kpkCourses.map(c => (
                <div key={c.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-200">{c.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        c.status === 'published'
                          ? 'bg-green-900/60 text-green-400'
                          : 'bg-yellow-900/60 text-yellow-400'
                      }`}>
                        {c.status === 'published' ? 'опубликовано' : 'черновик'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {c.hours} ч. · {FORMAT_LABELS[c.format] ?? c.format}
                      {c.startDate ? ` · начало ${new Date(c.startDate).toLocaleDateString('ru-RU')}` : ''}
                      {c.room ? ` · ${c.room}` : ''}
                    </div>
                    {c.description && (
                      <div className="text-xs text-gray-500 mt-1">{c.description}</div>
                    )}
                  </div>
                  <div className="flex gap-3 flex-shrink-0 text-xs">
                    <button
                      onClick={() => saveKpk(kpkCourses.map(x => x.id === c.id ? { ...x, status: x.status === 'draft' ? 'published' : 'draft' } : x))}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {c.status === 'draft' ? 'Опубликовать' : 'В черновик'}
                    </button>
                    <button
                      onClick={() => saveKpk(kpkCourses.filter(x => x.id !== c.id))}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {showAddKpk && (
              <div className="bg-gray-800 rounded-xl p-5 border border-cyan-500/30 flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-gray-300">Новый курс</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Название *</label>
                    <input
                      type="text"
                      value={kpkForm.title ?? ''}
                      onChange={e => setKpkForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Название курса"
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Часы</label>
                    <input
                      type="number"
                      value={kpkForm.hours ?? 36}
                      onChange={e => setKpkForm(f => ({ ...f, hours: Number(e.target.value) }))}
                      min={1}
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Формат</label>
                    <select
                      value={kpkForm.format ?? 'offline'}
                      onChange={e => setKpkForm(f => ({ ...f, format: e.target.value as KpkCourse['format'] }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                    >
                      <option value="offline">Очно</option>
                      <option value="online">Онлайн</option>
                      <option value="mixed">Смешанный</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Дата начала</label>
                    <input
                      type="date"
                      value={kpkForm.startDate ?? ''}
                      onChange={e => setKpkForm(f => ({ ...f, startDate: e.target.value || null }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Аудитория / ссылка</label>
                    <input
                      type="text"
                      value={kpkForm.room ?? ''}
                      onChange={e => setKpkForm(f => ({ ...f, room: e.target.value }))}
                      placeholder="А-101 или https://..."
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Описание</label>
                    <textarea
                      value={kpkForm.description ?? ''}
                      onChange={e => setKpkForm(f => ({ ...f, description: e.target.value }))}
                      rows={2}
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500 resize-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowAddKpk(false)}
                    className="text-sm text-gray-400 hover:text-white px-4 py-2 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={() => handleAddKpk('draft')}
                    className="text-sm border border-gray-600 text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Сохранить черновик
                  </button>
                  <button
                    onClick={() => handleAddKpk('published')}
                    className="bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    Опубликовать
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Retakes */}
        {tab === 'retakes' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-300">
                График пересдач ({retakes.length})
              </h2>
              <button
                onClick={() => setShowAddRetake(v => !v)}
                className="bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
              >
                + Добавить
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {retakes.length === 0 && (
                <div className="text-center text-gray-500 py-8">Нет запланированных пересдач</div>
              )}
              {retakes.map(r => (
                <div key={r.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-200">{r.discipline_name}</span>
                      {r.is_commission && (
                        <span className="text-xs bg-orange-900/60 text-orange-400 px-2 py-0.5 rounded-full">
                          Комиссия
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {new Date(r.datetime).toLocaleString('ru-RU', {
                        day: 'numeric', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                      {r.auditorium ? ` · ${r.auditorium}` : ''}
                      {` · ${r.duration_minutes} мин.`}
                    </div>
                    {r.comment && (
                      <div className="text-xs text-gray-500 mt-1">{r.comment}</div>
                    )}
                  </div>
                  <button
                    onClick={() => saveRetakes(retakes.filter(x => x.id !== r.id))}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>

            {showAddRetake && (
              <div className="bg-gray-800 rounded-xl p-5 border border-cyan-500/30 flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-gray-300">Новая пересдача</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Дисциплина *</label>
                    <input
                      type="text"
                      value={retakeForm.discipline_name ?? ''}
                      onChange={e => setRetakeForm(f => ({ ...f, discipline_name: e.target.value }))}
                      placeholder="Название дисциплины"
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Дата и время *</label>
                    <input
                      type="datetime-local"
                      value={retakeForm.datetime ?? ''}
                      onChange={e => setRetakeForm(f => ({ ...f, datetime: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Аудитория</label>
                    <input
                      type="text"
                      value={retakeForm.auditorium ?? ''}
                      onChange={e => setRetakeForm(f => ({ ...f, auditorium: e.target.value }))}
                      placeholder="А-101"
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Длительность (мин.)</label>
                    <input
                      type="number"
                      value={retakeForm.duration_minutes ?? 90}
                      onChange={e => setRetakeForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))}
                      min={30}
                      step={30}
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Комментарий для студентов</label>
                    <textarea
                      value={retakeForm.comment ?? ''}
                      onChange={e => setRetakeForm(f => ({ ...f, comment: e.target.value }))}
                      rows={2}
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500 resize-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={retakeForm.is_commission ?? false}
                        onChange={e => setRetakeForm(f => ({ ...f, is_commission: e.target.checked }))}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 accent-cyan-500"
                      />
                      Комиссионная пересдача
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowAddRetake(false)}
                    className="text-sm text-gray-400 hover:text-white px-4 py-2 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleAddRetake}
                    className="bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    Добавить
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Profile */}
        {tab === 'profile' && (
          <div className="max-w-xl">
            {teacher ? (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center text-xl font-bold text-gray-200">
                    {getInitials(teacher.full_name)}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{teacher.full_name}</h2>
                    <p className="text-gray-400 text-sm">{teacher.position}</p>
                    {teacher.academic_degree && (
                      <p className="text-gray-500 text-xs mt-0.5">{teacher.academic_degree}</p>
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Email</div>
                    <div className="text-gray-300">{teacher.email}</div>
                  </div>
                  {teacher.tg_username && (
                    <div>
                      <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Telegram</div>
                      <div className="text-gray-300">{teacher.tg_username}</div>
                    </div>
                  )}
                  {teacher.academic_title && (
                    <div>
                      <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Учёное звание</div>
                      <div className="text-gray-300">{teacher.academic_title}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Стаж</div>
                    <div className="text-gray-300">
                      с {teacher.teaching_experience} г. ({new Date().getFullYear() - teacher.teaching_experience} лет)
                    </div>
                  </div>
                </div>

                {teacher.educations && teacher.educations.length > 0 && (
                  <div>
                    <div className="text-gray-500 text-xs uppercase tracking-wide mb-2">Образование</div>
                    <ul className="flex flex-col gap-1">
                      {teacher.educations.map((edu, i) => (
                        <li key={i} className="text-sm text-gray-300">{edu}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-xs text-gray-500 border-t border-gray-700 pt-4">
                  Для изменения данных профиля обратитесь к администратору кафедры.
                </p>
              </div>
            ) : (
              <div className="text-gray-500">Данные профиля не найдены</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export async function getStaticProps() {
  const teachersData = require('../../public/teachers.json');
  const schedulesData = require('../../public/retake_schedules.json');
  const kpkData = require('../../public/kpk_courses.json');

  const teachers: Teacher[] = teachersData.teachers;
  const schedulesByTeacher: Record<string, RawScheduleEvent[]> = {};

  for (const teacher of teachers) {
    try {
      const filePath = path.join(process.cwd(), 'public', 'schedules', `${teacher.id}.json`);
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      schedulesByTeacher[teacher.id] = raw.events ?? [];
    } catch {
      schedulesByTeacher[teacher.id] = [];
    }
  }

  return {
    props: {
      teachers,
      allKpkCourses: kpkData.courses,
      allRetakes: schedulesData.retake_schedules,
      allDuties: schedulesData.duty_schedules,
      schedulesByTeacher,
    },
  };
}
