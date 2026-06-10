import path from 'path';
import fs from 'fs';
import type { Teacher, RetakeSchedule, DutySchedule, ProfessionalDevelopment, ScheduleEvent } from '../types';

// ── JWT helpers ───────────────────────────────────────────────────────────────

export function makeMockToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: 9999999999 })).toString('base64url');
  return `${header}.${body}.mock`;
}

export function decodeMockToken(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    return JSON.parse(Buffer.from(part, 'base64url').toString('utf-8'));
  } catch {
    return null;
  }
}

// ── Loaders ───────────────────────────────────────────────────────────────────

function readJson<T>(relPath: string): T {
  const abs = path.join(process.cwd(), relPath);
  return JSON.parse(fs.readFileSync(abs, 'utf-8')) as T;
}

// ── Transformers ──────────────────────────────────────────────────────────────

interface OldTeacher {
  id: number;
  full_name: string;
  position: string;
  academic_title: string | null;
  academic_degree: string | null;
  email: string;
  teaching_experience: number;
  photo_url: string;
  tg_username: string;
  schedule_url: string;
  educations?: string[];
}

export function transformTeacher(t: OldTeacher): Teacher {
  const parts = t.full_name.trim().split(' ');
  return {
    id: t.id,
    full_name: t.full_name,
    last_name: parts[0] ?? '',
    first_name: parts[1] ?? '',
    middle_name: parts[2] ?? '',
    position: t.position,
    academic_titles: t.academic_title ? [t.academic_title] : [],
    academic_degrees: t.academic_degree ? [t.academic_degree] : [],
    email: t.email,
    mirea_teaching_since: `${t.teaching_experience}-09-01`,
    teaching_years_before_mirea: 0,
    photo_download_url: t.photo_url || null,
    tg_username: t.tg_username,
    schedule_url: t.schedule_url,
    educations: [],
  };
}

interface OldRetake {
  id: number;
  teacher_id: number;
  discipline_id: number;
  discipline_name: string;
  datetime: string;
  comment: string;
  auditorium: string;
  duration_minutes: number;
  is_commission: boolean;
}

export function transformRetake(r: OldRetake, teacherName?: string): RetakeSchedule {
  return {
    id: r.id,
    teacher_id: r.teacher_id,
    teacher_full_name: teacherName,
    subject_name: r.discipline_name,
    datetime: r.datetime,
    comment: r.comment,
    building: 'В-78',
    auditorium: r.auditorium,
    duration_minutes: r.duration_minutes,
    is_commission: r.is_commission,
  };
}

interface OldDuty {
  id: number;
  teacher_id: number;
  start_datetime: string;
  end_datetime: string;
  auditorium: string;
  comment: string;
}

export function transformDuty(d: OldDuty, teacherName?: string): DutySchedule {
  return {
    id: d.id,
    teacher_id: d.teacher_id,
    teacher_full_name: teacherName,
    start_datetime: d.start_datetime,
    end_datetime: d.end_datetime,
    building: '',
    auditorium: d.auditorium,
    comment: d.comment,
  };
}

interface OldKpk {
  id: number;
  teacherId: number;
  title: string;
  hours: number;
  format: string;
  startDate: string | null;
  room: string;
  description: string;
  status: string;
}

export function transformKpk(k: OldKpk, teacherName?: string): ProfessionalDevelopment {
  return {
    id: k.id,
    teacher_id: k.teacherId,
    teacher_full_name: teacherName,
    course_name: k.title,
    hours: k.hours,
    document_name: 'Удостоверение о повышении квалификации',
    document_number: String(1000000 + k.id),
    issued_by: 'РТУ МИРЭА',
    issue_date: k.startDate ?? '2024-01-01',
    scan_download_url: null,
  };
}

interface OldScheduleEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type?: string;
  location?: string;
  description?: string;
}

export function transformScheduleEvent(e: OldScheduleEvent): ScheduleEvent {
  const typeMatch = /^(ЛК|ПР|ЛР|СЕМ)\s/.exec(e.title);
  const typeShort = typeMatch ? typeMatch[1] : '';
  const cleanTitle = typeShort ? e.title.slice(typeShort.length + 1) : e.title;
  const TYPE_FULL: Record<string, string> = { 'ЛК': 'Лекция', 'ПР': 'Практика', 'ЛР': 'Лабораторная работа', 'СЕМ': 'Семинар' };

  const locMatch = /^(.+?)\s*\((.+?)\)$/.exec(e.location ?? '');
  const auditorium = locMatch ? locMatch[1].trim() : (e.location ?? '');
  const building = locMatch ? locMatch[2].trim() : '';

  return {
    id: e.id,
    title: cleanTitle,
    start: e.start,
    end: e.end,
    class_type_short: typeShort,
    class_type_full: TYPE_FULL[typeShort] ?? '',
    building,
    auditorium,
    groups: e.description ? e.description.split(', ') : [],
  };
}

// ── Aggregated loaders ────────────────────────────────────────────────────────

export function getMockTeachers(): Teacher[] {
  const data = readJson<{ teachers: OldTeacher[] }>('public/teachers.json');
  return data.teachers.map(transformTeacher);
}

export function getMockTeacherMap(): Map<number, string> {
  const data = readJson<{ teachers: OldTeacher[] }>('public/teachers.json');
  return new Map(data.teachers.map(t => [t.id, t.full_name]));
}

export function getMockRetakes(teacherId?: number): RetakeSchedule[] {
  const data = readJson<{ retake_schedules: OldRetake[] }>('public/retake_schedules.json');
  const nameMap = getMockTeacherMap();
  const list = data.retake_schedules.map(r => transformRetake(r, nameMap.get(r.teacher_id)));
  return teacherId ? list.filter(r => r.teacher_id === teacherId) : list;
}

export function getMockDuties(teacherId?: number): DutySchedule[] {
  const data = readJson<{ duty_schedules: OldDuty[] }>('public/retake_schedules.json');
  const nameMap = getMockTeacherMap();
  const list = data.duty_schedules.map(d => transformDuty(d, nameMap.get(d.teacher_id)));
  return teacherId ? list.filter(d => d.teacher_id === teacherId) : list;
}

export function getMockKpk(teacherId?: number): ProfessionalDevelopment[] {
  const data = readJson<{ courses: OldKpk[] }>('public/kpk_courses.json');
  const nameMap = getMockTeacherMap();
  const list = data.courses.map(k => transformKpk(k, nameMap.get(k.teacherId)));
  return teacherId ? list.filter(k => k.teacher_id === teacherId) : list;
}

export function getMockSchedule(teacherId: number): ScheduleEvent[] {
  try {
    const data = readJson<{ events: OldScheduleEvent[] }>(`public/schedules/${teacherId}.json`);
    return (data.events ?? []).map(transformScheduleEvent);
  } catch {
    return [];
  }
}
