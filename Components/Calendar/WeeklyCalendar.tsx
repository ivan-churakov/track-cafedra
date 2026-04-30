import React, { useState, useMemo } from 'react';
import { CalendarEvent, CalendarEventType } from '../../types';

interface WeeklyCalendarProps {
  events: CalendarEvent[];
}

const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const HOUR_START = 8;
const HOUR_END = 22;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const HOUR_HEIGHT = 60; // px per hour
const CALENDAR_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT;

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Monday as week start
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

const EVENT_COLORS: Record<CalendarEventType, string> = {
  class: 'bg-blue-600 border-blue-400',
  retake: 'bg-red-600 border-red-400',
  commission: 'bg-orange-500 border-orange-300',
  duty: 'bg-green-700 border-green-500',
};

const EVENT_LABELS: Record<CalendarEventType, string> = {
  class: 'Занятие',
  retake: 'Пересдача',
  commission: 'Комиссия',
  duty: 'Дежурство',
};

interface EventBlockProps {
  event: CalendarEvent;
  dayStart: Date;
}

function EventBlock({ event, dayStart }: EventBlockProps) {
  const [hovered, setHovered] = useState(false);

  const startMinutes = event.start.getHours() * 60 + event.start.getMinutes();
  const endMinutes = event.end.getHours() * 60 + event.end.getMinutes();
  const offsetMinutes = startMinutes - HOUR_START * 60;
  const durationMinutes = endMinutes - startMinutes;

  const top = (offsetMinutes / 60) * HOUR_HEIGHT;
  const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 20);

  if (offsetMinutes < 0 || offsetMinutes >= TOTAL_HOURS * 60) return null;

  const colorClass = EVENT_COLORS[event.type];

  return (
    <div
      className={`absolute left-0.5 right-0.5 rounded border-l-2 ${colorClass} text-white text-xs px-1 py-0.5 cursor-pointer overflow-hidden z-10 transition-all`}
      style={{ top: `${top}px`, height: `${height}px` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="font-medium truncate">{event.title}</div>
      {height > 30 && (
        <div className="opacity-80 text-[10px]">
          {formatTime(event.start)}–{formatTime(event.end)}
        </div>
      )}
      {height > 42 && event.location && (
        <div className="opacity-80 text-[10px] truncate">{event.location}</div>
      )}

      {/* Tooltip */}
      {hovered && (
        <div className="absolute left-full top-0 ml-2 z-50 w-56 bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl text-xs text-white pointer-events-none">
          <div className="font-semibold mb-1">{event.title}</div>
          <div className="text-gray-300 mb-1">
            {EVENT_LABELS[event.type]} · {formatTime(event.start)}–{formatTime(event.end)}
          </div>
          {event.location && (
            <div className="text-gray-400">📍 {event.location}</div>
          )}
          {event.description && (
            <div className="text-gray-400 mt-1">{event.description}</div>
          )}
        </div>
      )}
    </div>
  );
}

export function WeeklyCalendar({ events }: WeeklyCalendarProps) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const eventsByDay = useMemo(() => {
    return weekDays.map((day) =>
      events.filter((e) => isSameDay(e.start, day))
    );
  }, [events, weekDays]);

  const timeLabels = useMemo(
    () =>
      Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
        const h = HOUR_START + i;
        return `${h.toString().padStart(2, '0')}:00`;
      }),
    []
  );

  const prevWeek = () => setWeekStart((d) => addDays(d, -7));
  const nextWeek = () => setWeekStart((d) => addDays(d, 7));
  const goToToday = () => setWeekStart(getWeekStart(new Date()));

  const today = new Date();

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div className="text-white font-semibold capitalize">
          {formatMonthYear(weekStart)}
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 rounded-lg transition-colors"
          >
            Сегодня
          </button>
          <button
            onClick={prevWeek}
            className="px-2 py-1 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            ‹
          </button>
          <button
            onClick={nextWeek}
            className="px-2 py-1 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            ›
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 px-4 py-2 border-b border-gray-700 flex-wrap">
        {(Object.keys(EVENT_COLORS) as CalendarEventType[]).map((type) => (
          <div key={type} className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className={`w-3 h-3 rounded ${EVENT_COLORS[type].split(' ')[0]}`} />
            {EVENT_LABELS[type]}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex overflow-x-auto">
        {/* Time column */}
        <div className="flex-shrink-0 w-14 border-r border-gray-700">
          <div className="h-10 border-b border-gray-700" />
          <div className="relative" style={{ height: `${CALENDAR_HEIGHT}px` }}>
            {timeLabels.map((label, i) => (
              <div
                key={i}
                className="absolute right-2 text-[10px] text-gray-500 -translate-y-2"
                style={{ top: `${i * HOUR_HEIGHT}px` }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Day columns */}
        {weekDays.map((day, di) => {
          const isToday = isSameDay(day, today);
          const isWeekend = di >= 5;

          return (
            <div
              key={di}
              className={`flex-1 min-w-[100px] border-r border-gray-700 last:border-r-0 ${
                isWeekend ? 'bg-gray-800/30' : ''
              }`}
            >
              {/* Day header */}
              <div
                className={`h-10 border-b border-gray-700 flex flex-col items-center justify-center ${
                  isToday ? 'bg-cyan-700/30' : ''
                }`}
              >
                <span className="text-[10px] text-gray-400">{DAY_NAMES[di]}</span>
                <span
                  className={`text-sm font-semibold ${
                    isToday ? 'text-cyan-400' : 'text-gray-200'
                  }`}
                >
                  {formatDate(day)}
                </span>
              </div>

              {/* Events area */}
              <div className="relative" style={{ height: `${CALENDAR_HEIGHT}px` }}>
                {/* Hour lines */}
                {timeLabels.map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-t border-gray-700/50"
                    style={{ top: `${i * HOUR_HEIGHT}px` }}
                  />
                ))}

                {/* Events */}
                {eventsByDay[di].map((event) => (
                  <EventBlock key={event.id} event={event} dayStart={day} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
