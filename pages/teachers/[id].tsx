import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { teachers as teachersApi, retakes as retakesApi, duties as dutiesApi, schedule as scheduleApi } from '../../lib/api';
import type { Teacher, CalendarEvent, CalendarEventType, RetakeSchedule, DutySchedule, ScheduleEvent } from '../../types';
import { WeeklyCalendar } from '../../Components/Calendar/WeeklyCalendar';

interface Props {
  teacher: Teacher;
  retakeSchedules: RetakeSchedule[];
  dutySchedules: DutySchedule[];
  scheduleEvents: ScheduleEvent[];
}

function retakeToEvent(r: RetakeSchedule): CalendarEvent {
  const start = new Date(r.datetime);
  const end = new Date(start.getTime() + r.duration_minutes * 60 * 1000);
  return {
    id: `retake-${r.id}`,
    title: r.is_commission ? `[Комиссия] ${r.subject_name}` : `[Пересдача] ${r.subject_name}`,
    start, end,
    type: r.is_commission ? 'commission' : ('retake' as CalendarEventType),
    location: [r.building, r.auditorium].filter(Boolean).join(' / '),
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
    location: [d.building, d.auditorium].filter(Boolean).join(' / '),
    description: d.comment || undefined,
  };
}

function scheduleToCalendar(e: ScheduleEvent): CalendarEvent {
  return {
    id: e.id,
    title: e.title,
    start: new Date(e.start),
    end: new Date(e.end),
    type: 'class',
    location: [e.building, e.auditorium].filter(Boolean).join(' / '),
    description: e.groups?.join(', '),
  };
}

function totalExperience(teacher: Teacher): number {
  const mireaSince = teacher.mirea_teaching_since
    ? new Date().getFullYear() - new Date(teacher.mirea_teaching_since).getFullYear()
    : 0;
  return Math.floor(teacher.teaching_years_before_mirea) + mireaSince;
}

function pluralYears(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 19) return 'лет';
  if (n % 10 === 1) return 'год';
  if (n % 10 >= 2 && n % 10 <= 4) return 'года';
  return 'лет';
}

function getDegreeLevel(degrees: string[]): { label: string; color: string } | null {
  if (degrees.length === 0) return null;
  const d = degrees[0].toLowerCase();
  if (d.includes('доктор')) return { label: 'Доктор наук', color: 'text-yellow-400' };
  if (d.includes('д.') || d.includes('д-р')) return { label: 'Доктор наук', color: 'text-yellow-400' };
  if (d.includes('кандидат') || d.includes('к.')) return { label: 'Кандидат наук', color: 'text-cyan-400' };
  return { label: degrees[0], color: 'text-gray-300' };
}

export default function TeacherProfilePage({
  teacher,
  retakeSchedules,
  dutySchedules,
  scheduleEvents,
}: Props) {
  const preloadedEvents = useMemo(
    (): CalendarEvent[] => scheduleEvents.map(scheduleToCalendar),
    [scheduleEvents],
  );

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(preloadedEvents);

  const allEvents = useMemo((): CalendarEvent[] => {
    return [
      ...calendarEvents,
      ...retakeSchedules.map(retakeToEvent),
      ...dutySchedules.map(dutyToEvent),
    ];
  }, [calendarEvents, retakeSchedules, dutySchedules]);

  const experience = totalExperience(teacher);
  const degreeInfo = getDegreeLevel(teacher.academic_degrees);
  const mireasInception = teacher.mirea_teaching_since
    ? new Date(teacher.mirea_teaching_since).getFullYear()
    : null;

  const initials = teacher.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2);

  const photoSrc = teacher.photo_download_url
    ? `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}${teacher.photo_download_url}`
    : null;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top bar */}
      <div className="border-b border-gray-700 px-6 py-4 flex items-center gap-4">
        <Link href="/teachers" className="text-gray-400 hover:text-white transition-colors text-sm">
          ← К поиску
        </Link>
        <span className="text-gray-600">|</span>
        <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
          На главную
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Teacher info card */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
              {/* Photo / Avatar */}
              <div className="flex justify-center mb-5">
                {photoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoSrc}
                    alt={teacher.full_name}
                    className="w-32 h-32 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-gray-600 flex items-center justify-center text-4xl font-bold text-gray-300">
                    {initials}
                  </div>
                )}
              </div>

              <h1 className="text-xl font-bold text-center mb-1 leading-tight">
                {teacher.full_name}
              </h1>
              <p className="text-gray-400 text-sm text-center mb-5">{teacher.position}</p>

              <div className="space-y-3">
                {/* Experience */}
                <div className="bg-gray-700/50 rounded-xl p-3">
                  <div className="text-xs text-gray-500 mb-1">Педагогический стаж</div>
                  <div className="text-lg font-bold">
                    {experience}{' '}
                    <span className="text-sm font-normal text-gray-400">{pluralYears(experience)}</span>
                  </div>
                  {mireasInception && (
                    <div className="text-xs text-gray-500">в МИРЭА с {mireasInception} г.</div>
                  )}
                </div>

                {/* Academic degree */}
                {degreeInfo && (
                  <div className="bg-gray-700/50 rounded-xl p-3">
                    <div className="text-xs text-gray-500 mb-1">Учёная степень</div>
                    <div className={`font-semibold text-sm ${degreeInfo.color}`}>
                      {degreeInfo.label}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {teacher.academic_degrees.join(', ')}
                    </div>
                  </div>
                )}

                {/* Academic titles */}
                {teacher.academic_titles.length > 0 && (
                  <div className="bg-gray-700/50 rounded-xl p-3">
                    <div className="text-xs text-gray-500 mb-1">Учёное звание</div>
                    <div className="font-semibold text-sm text-gray-200">
                      {teacher.academic_titles.join(', ')}
                    </div>
                  </div>
                )}

                {/* Contacts */}
                {teacher.email && (
                  <div className="bg-gray-700/50 rounded-xl p-3">
                    <div className="text-xs text-gray-500 mb-1">Контакты</div>
                    <a
                      href={`mailto:${teacher.email}`}
                      className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <span>✉</span> {teacher.email}
                    </a>
                    {teacher.tg_username && (
                      <div className="text-sm text-gray-400 mt-1">{teacher.tg_username}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Education */}
            {teacher.educations.length > 0 && (
              <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 mt-4">
                <h2 className="font-semibold mb-3 text-sm text-gray-300">Образование</h2>
                <ul className="space-y-3">
                  {teacher.educations.map((edu, i) => (
                    <li key={i} className="text-sm text-gray-400">
                      <div className="text-gray-300 font-medium">{edu.specialty}</div>
                      <div>{edu.institution}</div>
                      <div className="text-xs text-gray-500">{edu.level} · {edu.graduation_year}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right: Calendar */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Расписание</h2>
              {teacher.schedule_url && (
                <a
                  href={teacher.schedule_url}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  title="Добавить в Google Calendar"
                >
                  📅 Google Calendar
                </a>
              )}
            </div>

            <WeeklyCalendar events={allEvents} />
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const id = Number(params?.id);
  if (!id) return { notFound: true };

  try {
    const [teacher, retakesData, dutiesData, scheduleData] = await Promise.all([
      teachersApi.get(id),
      retakesApi.list(id),
      dutiesApi.list(id),
      scheduleApi.get(id),
    ]);

    return {
      props: {
        teacher,
        retakeSchedules: retakesData.retake_schedules,
        dutySchedules: dutiesData.duty_schedules,
        scheduleEvents: scheduleData.events,
      },
    };
  } catch {
    return { notFound: true };
  }
};
