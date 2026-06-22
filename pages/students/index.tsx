import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Teacher, RetakeSchedule, DutySchedule, CalendarEvent, CalendarEventType, ProfessionalDevelopment, ScheduleEvent } from '../../types';
import {
  teachers as teachersApi,
  retakes as retakesApi,
  duties as dutiesApi,
  schedule as scheduleApi,
} from '../../lib/api';
import { WeeklyCalendar } from '../../Components/Calendar/WeeklyCalendar';
import { TelegramBotPopup } from '../../Components/TelegramBotPopup/TelegramBotPopup';

type Filter = 'all' | 'today' | 'duty' | 'retake';

interface TeacherStatus {
  today: boolean;
  hasDuty: boolean;
  hasRetake: boolean;
  daysThisWeek: string[];
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function shortName(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length < 2) return name;
  const last = parts[0];
  const first = parts[1]?.[0] ?? '';
  const mid = parts[2]?.[0] ?? '';
  return `${last} ${first}.${mid ? mid + '.' : ''}`;
}

function getWeekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

const DOW_NAMES = ['', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

export default function StudentsPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [retakeSchedules, setRetakeSchedules] = useState<RetakeSchedule[]>([]);
  const [dutySchedules, setDutySchedules] = useState<DutySchedule[]>([]);
  const [schedulesByTeacher, setSchedulesByTeacher] = useState<Record<string, ScheduleEvent[]>>({});
  // Студенты анонимны, а КПК требует авторизации — поэтому здесь не загружается.
  const kpkByTeacher: Record<string, ProfessionalDevelopment[]> = {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [teacherStatus, setTeacherStatus] = useState<Record<number, TeacherStatus>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [teachersData, retakesData, dutiesData] = await Promise.all([
          teachersApi.list(),
          retakesApi.list(),
          dutiesApi.list(),
        ]);
        if (cancelled) return;

        setTeachers(teachersData.teachers);
        setRetakeSchedules(retakesData.retake_schedules);
        setDutySchedules(dutiesData.duty_schedules);

        // Расписание каждого преподавателя — параллельно; ошибка по одному не валит остальных.
        const byTeacher: Record<string, ScheduleEvent[]> = {};
        await Promise.all(
          teachersData.teachers.map(async (t) => {
            try {
              const s = await scheduleApi.get(t.id);
              byTeacher[t.id] = s.events;
            } catch {
              byTeacher[t.id] = [];
            }
          }),
        );
        if (!cancelled) setSchedulesByTeacher(byTeacher);
      } catch {
        if (!cancelled) setError('Не удалось загрузить данные с сервера');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const now = new Date();
    const week = getWeekRange(now);
    const statuses: Record<number, TeacherStatus> = {};

    for (const teacher of teachers) {
      const raw: ScheduleEvent[] = schedulesByTeacher[teacher.id] ?? [];
      const retakes = retakeSchedules.filter(r => r.teacher_id === teacher.id);
      const duties = dutySchedules.filter(d => d.teacher_id === teacher.id);

      let today = false;
      let hasDuty = false;
      let hasRetake = false;
      const daysSet = new Set<string>();

      for (const e of raw) {
        const d = new Date(e.start as string);
        if (isToday(d)) today = true;
        if (d >= week.start && d <= week.end) {
          const dow = DOW_NAMES[d.getDay()];
          if (dow) daysSet.add(dow);
        }
      }
      for (const r of retakes) {
        const d = new Date(r.datetime);
        if (isToday(d)) today = true;
        if (d >= week.start && d <= week.end) {
          hasRetake = true;
          const dow = DOW_NAMES[d.getDay()];
          if (dow) daysSet.add(dow);
        }
      }
      for (const du of duties) {
        const d = new Date(du.start_datetime);
        if (isToday(d)) today = true;
        if (d >= week.start && d <= week.end) {
          hasDuty = true;
          const dow = DOW_NAMES[d.getDay()];
          if (dow) daysSet.add(dow);
        }
      }
      statuses[teacher.id] = { today, hasDuty, hasRetake, daysThisWeek: Array.from(daysSet) };
    }
    setTeacherStatus(statuses);
  }, [teachers, schedulesByTeacher, retakeSchedules, dutySchedules]);

  const filteredTeachers = useMemo(() => {
    let list = teachers;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(t =>
        t.full_name.toLowerCase().includes(q) ||
        t.position.toLowerCase().includes(q)
      );
    }
    if (filter === 'today') list = list.filter(t => teacherStatus[t.id]?.today);
    if (filter === 'duty') list = list.filter(t => teacherStatus[t.id]?.hasDuty);
    if (filter === 'retake') list = list.filter(t => teacherStatus[t.id]?.hasRetake);
    return list;
  }, [teachers, query, filter, teacherStatus]);

  const selectedTeacher = useMemo(
    () => teachers.find(t => t.id === selectedId) ?? null,
    [teachers, selectedId]
  );

  const calendarEvents = useMemo((): CalendarEvent[] => {
    if (!selectedId) return [];
    const events: CalendarEvent[] = (schedulesByTeacher[selectedId] ?? []).map(e => ({
      id: e.id,
      title: e.title,
      start: new Date(e.start),
      end: new Date(e.end),
      type: 'class' as CalendarEventType,
      location: [e.building, e.auditorium].filter(Boolean).join(' / '),
      description: e.groups?.join(', '),
    }));
    retakeSchedules
      .filter(r => r.teacher_id === selectedId)
      .forEach(r => {
        const start = new Date(r.datetime);
        const end = new Date(start.getTime() + r.duration_minutes * 60 * 1000);
        events.push({
          id: `retake-${r.id}`,
          title: r.is_commission ? `[Комиссия] ${r.subject_name}` : `[Пересдача] ${r.subject_name}`,
          start, end,
          type: r.is_commission ? 'commission' : 'retake',
          location: [r.building, r.auditorium].filter(Boolean).join(' / '),
          description: r.comment || undefined,
        });
      });
    dutySchedules
      .filter(d => d.teacher_id === selectedId)
      .forEach(d => {
        events.push({
          id: `duty-${d.id}`,
          title: 'Дежурство',
          start: new Date(d.start_datetime),
          end: new Date(d.end_datetime),
          type: 'duty',
          location: [d.building, d.auditorium].filter(Boolean).join(' / '),
          description: d.comment || undefined,
        });
      });
    return events;
  }, [selectedId, schedulesByTeacher, retakeSchedules, dutySchedules]);

  const selectedKpk = selectedId ? (kpkByTeacher[selectedId] ?? []) : [];
  const selectedRetakes = selectedId
    ? retakeSchedules.filter(r => r.teacher_id === selectedId)
    : [];

  const handleSelect = (teacher: Teacher) => {
    setSelectedId(teacher.id);
    setShowDetail(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top bar */}
      <div className="border-b border-gray-700 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
          ← На главную
        </Link>
        <span className="text-gray-600">|</span>
        <h1 className="text-lg font-semibold">Портал для студентов</h1>
        <div className="flex-1" />
        <Link href="/teacher/login" className="text-sm text-gray-400 hover:text-white transition-colors">
          Я преподаватель →
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Search + filters */}
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Фамилия, должность или кабинет"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <div className="flex gap-2 flex-wrap">
            {([
              { key: 'all', label: 'все' },
              { key: 'today', label: 'в вузе сегодня' },
              { key: 'duty', label: 'дежурство' },
              { key: 'retake', label: 'пересдачи' },
            ] as { key: Filter; label: string }[]).map(chip => (
              <button
                key={chip.key}
                onClick={() => setFilter(chip.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === chip.key
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="text-gray-500 text-sm">Загрузка данных с сервера...</div>
        )}
        {error && (
          <div className="text-red-400 text-sm bg-red-900/20 border border-red-900/50 rounded-xl px-4 py-2">
            {error}
          </div>
        )}

        {/* Two-panel layout */}
        <div className="flex gap-6">
          {/* Teacher list */}
          <div
            className={`${showDetail ? 'hidden md:flex' : 'flex'} flex-col gap-3 w-full md:w-2/5 flex-shrink-0 overflow-y-auto max-h-[620px]`}
          >
            {filteredTeachers.length === 0 && (
              <div className="text-center text-gray-500 py-12">Нет преподавателей по фильтру</div>
            )}
            {filteredTeachers.map(teacher => {
              const st = teacherStatus[teacher.id];
              return (
                <button
                  key={teacher.id}
                  onClick={() => handleSelect(teacher)}
                  className={`text-left bg-gray-800 rounded-xl p-4 border transition-all hover:border-cyan-500/60 ${
                    selectedId === teacher.id ? 'border-cyan-500' : 'border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gray-600 flex items-center justify-center font-bold text-gray-200 text-sm flex-shrink-0">
                      {getInitials(teacher.full_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm leading-tight truncate">
                        {shortName(teacher.full_name)}
                      </div>
                      <div className="text-gray-400 text-xs truncate mt-0.5">
                        {[teacher.position, teacher.academic_degrees[0]].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </div>
                  {st && (st.today || st.hasDuty || st.hasRetake || st.daysThisWeek.length > 0) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {st.today && (
                        <span className="text-xs bg-green-900/60 text-green-400 px-2 py-0.5 rounded-full">
                          ● в вузе сегодня
                        </span>
                      )}
                      {!st.today && st.daysThisWeek.length > 0 && (
                        <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">
                          ● {st.daysThisWeek.join(', ')}
                        </span>
                      )}
                      {st.hasDuty && (
                        <span className="text-xs bg-yellow-900/60 text-yellow-400 px-2 py-0.5 rounded-full">
                          дежурство
                        </span>
                      )}
                      {st.hasRetake && (
                        <span className="text-xs bg-red-900/60 text-red-400 px-2 py-0.5 rounded-full">
                          пересдача
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Teacher detail */}
          <div
            className={`${showDetail ? 'flex' : 'hidden md:flex'} flex-col gap-4 flex-1 min-w-0`}
          >
            <button
              className="md:hidden text-sm text-gray-400 hover:text-white self-start transition-colors"
              onClick={() => setShowDetail(false)}
            >
              ← Назад к списку
            </button>

            {selectedTeacher ? (
              <>
                {/* Header card */}
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center font-bold text-gray-200 text-xl flex-shrink-0">
                      {getInitials(selectedTeacher.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-lg leading-tight">{selectedTeacher.full_name}</h2>
                      <p className="text-gray-400 text-sm mt-0.5">{selectedTeacher.position}</p>
                      {selectedTeacher.academic_degrees.length > 0 && (
                        <p className="text-gray-500 text-xs mt-0.5">{selectedTeacher.academic_degrees.join(', ')}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {teacherStatus[selectedTeacher.id]?.today && (
                          <span className="text-xs bg-green-900/60 text-green-400 px-3 py-1 rounded-full">
                            ● в вузе сегодня
                          </span>
                        )}
                        {teacherStatus[selectedTeacher.id]?.hasDuty && (
                          <span className="text-xs bg-yellow-900/60 text-yellow-400 px-3 py-1 rounded-full">
                            дежурство на этой неделе
                          </span>
                        )}
                        {teacherStatus[selectedTeacher.id]?.hasRetake && (
                          <span className="text-xs bg-red-900/60 text-red-400 px-3 py-1 rounded-full">
                            пересдача на этой неделе
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contacts */}
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Email</div>
                    <a href={`mailto:${selectedTeacher.email}`} className="text-cyan-400 hover:text-cyan-300 transition-colors">
                      {selectedTeacher.email}
                    </a>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">В МИРЭА с</div>
                    <span className="text-gray-300">
                      {selectedTeacher.mirea_teaching_since
                        ? new Date(selectedTeacher.mirea_teaching_since).getFullYear()
                        : '—'} г.
                    </span>
                  </div>
                </div>

                {/* Retakes */}
                {selectedRetakes.length > 0 && (
                  <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-300 mb-3">Пересдачи</h3>
                    <div className="flex flex-col gap-2">
                      {selectedRetakes.map(r => (
                        <div key={r.id} className="flex items-start gap-3 text-sm">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${r.is_commission ? 'bg-orange-400' : 'bg-red-400'}`} />
                          <div className="min-w-0">
                            <div className="font-medium text-gray-200">{r.subject_name}</div>
                            <div className="text-gray-400 text-xs">
                              {new Date(r.datetime).toLocaleString('ru-RU', {
                                day: 'numeric', month: 'long',
                                hour: '2-digit', minute: '2-digit',
                              })}
                              {r.building ? ` · ${r.building}` : ''}
                              {r.auditorium ? `, ${r.auditorium}` : ''}
                              {r.is_commission && ' · Комиссия'}
                            </div>
                            {r.comment && (
                              <div className="text-gray-500 text-xs mt-0.5">{r.comment}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* KPK */}
                {selectedKpk.length > 0 && (
                  <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-300 mb-3">
                      Курсы повышения квалификации
                    </h3>
                    <div className="flex flex-col gap-2">
                      {selectedKpk.map(c => (
                        <div key={c.id} className="text-sm">
                          <div className="font-medium text-gray-200">{c.course_name}</div>
                          <div className="text-gray-400 text-xs mt-0.5">
                            {c.hours} ч.
                            {c.issued_by ? ` · ${c.issued_by}` : ''}
                            {c.issue_date ? ` · ${c.issue_date}` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-600 gap-2 py-20">
                <div className="text-4xl">👈</div>
                <div>Выберите преподавателя из списка</div>
              </div>
            )}
          </div>
        </div>

        {/* Calendar */}
        {selectedTeacher && (
          <div>
            <h2 className="text-base font-semibold text-gray-300 mb-4">
              Расписание — {selectedTeacher.full_name}
            </h2>
            <WeeklyCalendar events={calendarEvents} />
          </div>
        )}
      </div>
      <TelegramBotPopup />
    </div>
  );
}
