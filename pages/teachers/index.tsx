import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Teacher, CalendarEvent, RetakeSchedule, DutySchedule } from '../../types';
import { WeeklyCalendar } from '../../Components/Calendar/WeeklyCalendar';

interface Props {
  teachers: Teacher[];
  retakeSchedules: RetakeSchedule[];
  dutySchedules: DutySchedule[];
}

function retakeToEvent(r: RetakeSchedule): CalendarEvent {
  const start = new Date(r.datetime);
  const end = new Date(start.getTime() + r.duration_minutes * 60 * 1000);
  return {
    id: `retake-${r.id}`,
    title: r.is_commission ? `[Комиссия] ${r.discipline_name}` : `[Пересдача] ${r.discipline_name}`,
    start,
    end,
    type: r.is_commission ? 'commission' : 'retake',
    location: r.auditorium,
    description: r.comment || undefined,
  };
}

function dutyToEvent(d: DutySchedule): CalendarEvent {
  return {
    id: `duty-${d.id}`,
    title: 'Дежурство',
    start: new Date(d.start_datetime),
    end: new Date(d.end_datetime),
    type: 'duty',
    location: d.auditorium,
    description: d.comment || undefined,
  };
}

export default function TeachersPage({ teachers, retakeSchedules, dutySchedules }: Props) {
  const [query, setQuery] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return teachers.filter((t) => t.full_name.toLowerCase().includes(q));
  }, [query, teachers]);

  const selectedTeacher = useMemo(
    () => teachers.find((t) => t.id === selectedTeacherId) ?? null,
    [teachers, selectedTeacherId]
  );

  const calendarEvents = useMemo((): CalendarEvent[] => {
    if (!selectedTeacherId) return [];

    const retakes = retakeSchedules
      .filter((r) => r.teacher_id === selectedTeacherId)
      .map(retakeToEvent);

    const duties = dutySchedules
      .filter((d) => d.teacher_id === selectedTeacherId)
      .map(dutyToEvent);

    return [...retakes, ...duties];
  }, [selectedTeacherId, retakeSchedules, dutySchedules]);

  const handleSelect = (teacher: Teacher) => {
    setSelectedTeacherId(teacher.id);
    setQuery(teacher.full_name);
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (selectedTeacherId !== null) setSelectedTeacherId(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top bar */}
      <div className="border-b border-gray-700 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
          ← На главную
        </Link>
        <span className="text-gray-600">|</span>
        <h1 className="text-lg font-semibold">Расписание преподавателей</h1>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="mb-8">
          <label className="block text-sm text-gray-400 mb-2">
            Введите ФИО преподавателя
          </label>
          <div className="relative max-w-xl">
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              placeholder="Например: Петров Алексей Владимирович"
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors text-base"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setSelectedTeacherId(null); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          {/* Dropdown results */}
          {query && !selectedTeacherId && filtered.length > 0 && (
            <div className="absolute max-w-xl bg-gray-800 border border-gray-600 rounded-xl mt-1 overflow-hidden shadow-xl z-20">
              {filtered.map((teacher) => (
                <button
                  key={teacher.id}
                  onClick={() => handleSelect(teacher)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
                >
                  <div className="font-medium">{teacher.full_name}</div>
                  <div className="text-sm text-gray-400">{teacher.position}</div>
                </button>
              ))}
            </div>
          )}

          {query && !selectedTeacherId && filtered.length === 0 && query.trim().length > 1 && (
            <div className="mt-2 text-sm text-gray-500">Преподаватель не найден</div>
          )}
        </div>

        {/* Selected teacher info */}
        {selectedTeacher && (
          <div className="mb-6 flex items-center gap-4 bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="w-14 h-14 rounded-full bg-gray-600 flex items-center justify-center text-2xl font-bold text-gray-300 flex-shrink-0">
              {selectedTeacher.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-lg">{selectedTeacher.full_name}</div>
              <div className="text-gray-400 text-sm">{selectedTeacher.position}</div>
              {selectedTeacher.academic_degree && (
                <div className="text-gray-500 text-xs mt-0.5">{selectedTeacher.academic_degree}</div>
              )}
            </div>
            <Link
              href={`/teachers/${selectedTeacher.id}`}
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors whitespace-nowrap"
            >
              Карточка →
            </Link>
          </div>
        )}

        {/* Calendar */}
        {selectedTeacherId ? (
          <>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-gray-300">
                Расписание пересдач и дежурств
              </h2>
              {calendarEvents.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Нет запланированных пересдач и дежурств
                </p>
              )}
            </div>
            <WeeklyCalendar events={calendarEvents} />
          </>
        ) : (
          !query && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <div className="text-gray-400 text-lg">
                Введите ФИО преподавателя для просмотра расписания
              </div>
              <div className="text-gray-600 text-sm mt-2">
                Поиск работает по полному или частичному совпадению
              </div>
            </div>
          )
        )}

        {/* All teachers list */}
        {!query && (
          <div>
            <h2 className="text-base font-semibold text-gray-300 mb-4">
              Все преподаватели кафедры
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {teachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-gray-500 transition-colors cursor-pointer"
                  onClick={() => handleSelect(teacher)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center font-bold text-gray-300 text-sm flex-shrink-0">
                      {teacher.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm leading-tight truncate">
                        {teacher.full_name}
                      </div>
                      <div className="text-gray-400 text-xs truncate">{teacher.position}</div>
                    </div>
                  </div>
                  {teacher.academic_degree && (
                    <div className="text-gray-500 text-xs">{teacher.academic_degree}</div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                      onClick={(e) => { e.stopPropagation(); handleSelect(teacher); }}
                    >
                      Расписание
                    </button>
                    <span className="text-gray-700">·</span>
                    <Link
                      href={`/teachers/${teacher.id}`}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Карточка
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export async function getStaticProps() {
  const teachersData = require('../../public/teachers.json');
  const schedulesData = require('../../public/retake_schedules.json');

  return {
    props: {
      teachers: teachersData.teachers,
      retakeSchedules: schedulesData.retake_schedules,
      dutySchedules: schedulesData.duty_schedules,
    },
  };
}
