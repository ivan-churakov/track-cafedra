import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { GetStaticPaths, GetStaticProps } from 'next';
import { Teacher, CalendarEvent, RetakeSchedule, DutySchedule } from '../../types';
import { WeeklyCalendar } from '../../Components/Calendar/WeeklyCalendar';
import { fetchICalEvents } from '../../utils/ical';

interface Props {
  teacher: Teacher;
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

function getExperience(startYear: number): number {
  return new Date().getFullYear() - startYear;
}

function getDegreeLevel(degree: string | null): { label: string; color: string } | null {
  if (!degree) return null;
  const d = degree.toLowerCase();
  if (d.includes('доктор')) return { label: 'Доктор наук', color: 'text-yellow-400' };
  if (d.includes('кандидат')) return { label: 'Кандидат наук', color: 'text-cyan-400' };
  return { label: degree, color: 'text-gray-300' };
}

export default function TeacherProfilePage({ teacher, retakeSchedules, dutySchedules }: Props) {
  const [icalEvents, setIcalEvents] = useState<CalendarEvent[]>([]);
  const [icalStatus, setIcalStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!teacher.schedule_url) return;

    setIcalStatus('loading');
    fetchICalEvents(teacher.schedule_url)
      .then((events) => {
        setIcalEvents(events);
        setIcalStatus('success');
      })
      .catch(() => {
        setIcalStatus('error');
      });
  }, [teacher.schedule_url]);

  const allEvents = useMemo((): CalendarEvent[] => {
    const retakes = retakeSchedules.map(retakeToEvent);
    const duties = dutySchedules.map(dutyToEvent);
    return [...icalEvents, ...retakes, ...duties];
  }, [icalEvents, retakeSchedules, dutySchedules]);

  const experience = getExperience(teacher.teaching_experience);
  const degreeInfo = getDegreeLevel(teacher.academic_degree);

  const initials = teacher.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

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
                {teacher.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={teacher.photo_url}
                    alt={teacher.full_name}
                    className="w-32 h-32 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-gray-600 flex items-center justify-center text-4xl font-bold text-gray-300">
                    {initials}
                  </div>
                )}
              </div>

              {/* Name */}
              <h1 className="text-xl font-bold text-center mb-1 leading-tight">
                {teacher.full_name}
              </h1>
              <p className="text-gray-400 text-sm text-center mb-5">{teacher.position}</p>

              {/* Stats */}
              <div className="space-y-3">
                {/* Experience */}
                <div className="bg-gray-700/50 rounded-xl p-3">
                  <div className="text-xs text-gray-500 mb-1">Педагогический стаж</div>
                  <div className="text-lg font-bold">
                    {experience}{' '}
                    <span className="text-sm font-normal text-gray-400">
                      {experience % 100 >= 11 && experience % 100 <= 19
                        ? 'лет'
                        : experience % 10 === 1
                        ? 'год'
                        : experience % 10 >= 2 && experience % 10 <= 4
                        ? 'года'
                        : 'лет'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">с {teacher.teaching_experience} года</div>
                </div>

                {/* Academic degree */}
                {degreeInfo && (
                  <div className="bg-gray-700/50 rounded-xl p-3">
                    <div className="text-xs text-gray-500 mb-1">Учёная степень</div>
                    <div className={`font-semibold text-sm ${degreeInfo.color}`}>
                      {degreeInfo.label}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{teacher.academic_degree}</div>
                  </div>
                )}

                {/* Academic title */}
                {teacher.academic_title && (
                  <div className="bg-gray-700/50 rounded-xl p-3">
                    <div className="text-xs text-gray-500 mb-1">Учёное звание</div>
                    <div className="font-semibold text-sm text-gray-200">
                      {teacher.academic_title}
                    </div>
                  </div>
                )}

                {/* Contacts */}
                <div className="bg-gray-700/50 rounded-xl p-3 space-y-2">
                  <div className="text-xs text-gray-500 mb-1">Контакты</div>
                  {teacher.email && (
                    <a
                      href={`mailto:${teacher.email}`}
                      className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <span>✉</span> {teacher.email}
                    </a>
                  )}
                  {teacher.tg_username && (
                    <a
                      href={`https://t.me/${teacher.tg_username.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <span>✈</span> {teacher.tg_username}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Education */}
            {teacher.educations && teacher.educations.length > 0 && (
              <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 mt-4">
                <h2 className="font-semibold mb-3 text-sm text-gray-300">Образование</h2>
                <ul className="space-y-2">
                  {teacher.educations.map((edu, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-400">
                      <span className="text-cyan-600 mt-0.5 flex-shrink-0">•</span>
                      <span>{edu}</span>
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
                <div className="flex items-center gap-2">
                  {icalStatus === 'loading' && (
                    <span className="text-xs text-gray-500">Загрузка расписания...</span>
                  )}
                  {icalStatus === 'success' && (
                    <span className="text-xs text-green-500">✓ Расписание загружено</span>
                  )}
                  {icalStatus === 'error' && (
                    <span className="text-xs text-yellow-500">
                      ⚠ Не удалось загрузить iCal (CORS)
                    </span>
                  )}
                  <a
                    href={teacher.schedule_url}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    title="Добавить в Google Calendar"
                  >
                    📅 Google Calendar
                  </a>
                </div>
              )}
            </div>

            {icalStatus === 'error' && (
              <div className="mb-4 bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-4 text-sm text-yellow-400">
                <strong>Не удалось загрузить расписание занятий</strong> из-за ограничений CORS.
                <br />
                Вы можете добавить расписание в Google Calendar по ссылке выше.
                Ниже показаны только пересдачи и дежурства.
              </div>
            )}

            <WeeklyCalendar events={allEvents} />
          </div>
        </div>
      </div>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const teachersData = require('../../public/teachers.json');
  const paths = teachersData.teachers.map((t: Teacher) => ({
    params: { id: t.id.toString() },
  }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const teachersData = require('../../public/teachers.json');
  const schedulesData = require('../../public/retake_schedules.json');

  const teacher = teachersData.teachers.find(
    (t: Teacher) => t.id.toString() === params?.id
  );

  if (!teacher) return { notFound: true };

  const retakeSchedules = schedulesData.retake_schedules.filter(
    (r: RetakeSchedule) => r.teacher_id === teacher.id
  );
  const dutySchedules = schedulesData.duty_schedules.filter(
    (d: DutySchedule) => d.teacher_id === teacher.id
  );

  return {
    props: { teacher, retakeSchedules, dutySchedules },
  };
};
