import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  schedule as scheduleApi,
  retakes as retakesApi,
  duties as dutiesApi,
  profDev,
  teachers as teachersApi,
  directories,
  ApiError,
  getToken,
  removeToken,
  downloadAuthed,
} from '../../lib/api';
import type {
  Teacher,
  TeacherCreatePayload,
  ScheduleEvent,
  RetakeSchedule,
  RetakeCreatePayload,
  DutySchedule,
  DutyCreatePayload,
  ProfessionalDevelopment,
  ProfDevCreatePayload,
  CalendarEvent,
  CalendarEventType,
  Position,
  AcademicTitle,
  AcademicDegree,
} from '../../types';
import { WeeklyCalendar } from '../../Components/Calendar/WeeklyCalendar';

type Tab = 'schedule' | 'kpk' | 'retakes' | 'duties' | 'profile';

/** "2026-02-15T14:00:00" → "2026-02-15T14:00" для <input type="datetime-local">. */
function toDatetimeLocal(value: string): string {
  return value ? value.slice(0, 16) : '';
}

interface AuthData {
  teacherId: number;
  teacherName: string;
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function scheduleEventToCalendar(e: ScheduleEvent): CalendarEvent {
  return {
    id: e.id,
    title: e.title,
    start: new Date(e.start),
    end: new Date(e.end),
    type: 'class' as CalendarEventType,
    location: [e.building, e.auditorium].filter(Boolean).join(' / '),
    description: e.groups?.join(', '),
  };
}

function retakeToCalendar(r: RetakeSchedule): CalendarEvent {
  const start = new Date(r.datetime);
  const end = new Date(start.getTime() + r.duration_minutes * 60 * 1000);
  return {
    id: `retake-${r.id}`,
    title: r.is_commission ? `[Комиссия] ${r.subject_name}` : `[Пересдача] ${r.subject_name}`,
    start, end,
    type: r.is_commission ? 'commission' : 'retake',
    location: [r.building, r.auditorium].filter(Boolean).join(' / '),
    description: r.comment || undefined,
  };
}

function dutyToCalendar(d: DutySchedule): CalendarEvent {
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

// ── Subject Combobox ──────────────────────────────────────────────────────────

interface ComboboxProps {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}

function SubjectCombobox({ value, onChange, options, placeholder }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (q ? options.filter(o => o.toLowerCase().includes(q)) : options).slice(0, 20);
  }, [query, options]);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? 'Введите или выберите дисциплину'}
        className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-30 w-full mt-1 bg-gray-800 border border-gray-600 rounded-xl shadow-xl max-h-48 overflow-y-auto">
          {filtered.map((opt, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onChange(opt); setQuery(opt); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors border-b border-gray-700/50 last:border-b-0"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const router = useRouter();
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [tab, setTab] = useState<Tab>('schedule');

  // Data
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [kpkList, setKpkList] = useState<ProfessionalDevelopment[]>([]);
  const [retakesList, setRetakesList] = useState<RetakeSchedule[]>([]);
  const [dutiesList, setDutiesList] = useState<DutySchedule[]>([]);

  // Directories
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [buildingOptions, setBuildingOptions] = useState<string[]>([]);
  const [docTypeOptions, setDocTypeOptions] = useState<string[]>([]);
  const [positionOptions, setPositionOptions] = useState<Position[]>([]);
  const [titleOptions, setTitleOptions] = useState<AcademicTitle[]>([]);
  const [degreeOptions, setDegreeOptions] = useState<AcademicDegree[]>([]);

  // Loading states
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [kpkLoading, setKpkLoading] = useState(false);
  const [retakesLoading, setRetakesLoading] = useState(false);

  // KPK form
  const [showAddKpk, setShowAddKpk] = useState(false);
  const [editingKpkId, setEditingKpkId] = useState<number | null>(null);
  const [kpkSaving, setKpkSaving] = useState(false);
  const [kpkError, setKpkError] = useState('');
  const [kpkForm, setKpkForm] = useState<Partial<ProfDevCreatePayload>>({
    course_name: '', hours: 36, document_name: '', document_number: '', issued_by: '', issue_date: '',
  });
  const [kpkScanFile, setKpkScanFile] = useState<File | null>(null);

  // Retake form
  const [showAddRetake, setShowAddRetake] = useState(false);
  const [editingRetakeId, setEditingRetakeId] = useState<number | null>(null);
  const [retakeSaving, setRetakeSaving] = useState(false);
  const [retakeError, setRetakeError] = useState('');
  const [retakeDiscipline, setRetakeDiscipline] = useState('');
  const [retakeDates, setRetakeDates] = useState<string[]>(['']);
  const [retakeBuilding, setRetakeBuilding] = useState('');
  const [retakeAuditorium, setRetakeAuditorium] = useState('');
  const [retakeDuration, setRetakeDuration] = useState(90);
  const [retakeIsCommission, setRetakeIsCommission] = useState(false);
  const [retakeComment, setRetakeComment] = useState('');

  // Duty form
  const [showAddDuty, setShowAddDuty] = useState(false);
  const [editingDutyId, setEditingDutyId] = useState<number | null>(null);
  const [dutySaving, setDutySaving] = useState(false);
  const [dutyError, setDutyError] = useState('');
  const [dutyStart, setDutyStart] = useState('');
  const [dutyEnd, setDutyEnd] = useState('');
  const [dutyBuilding, setDutyBuilding] = useState('');
  const [dutyAuditorium, setDutyAuditorium] = useState('');
  const [dutyComment, setDutyComment] = useState('');

  // Profile edit
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profLastName, setProfLastName] = useState('');
  const [profFirstName, setProfFirstName] = useState('');
  const [profMiddleName, setProfMiddleName] = useState('');
  const [profPosition, setProfPosition] = useState('');
  const [profDegrees, setProfDegrees] = useState<string[]>([]);
  const [profTitles, setProfTitles] = useState<string[]>([]);
  const [profMireaSince, setProfMireaSince] = useState('');
  const [profBeforeYears, setProfBeforeYears] = useState(0);
  const [profBeforeMonths, setProfBeforeMonths] = useState(0);
  const [profTg, setProfTg] = useState('');

  // Auth check
  useEffect(() => {
    const bounce = () => {
      // Clear stale credentials so /teacher/login does not redirect back here (infinite loop)
      removeToken();
      localStorage.removeItem('teacher_auth');
      sessionStorage.removeItem('teacher_auth');
      router.replace('/teacher/login');
    };

    if (!getToken()) {
      bounce();
      return;
    }
    const stored =
      localStorage.getItem('teacher_auth') ||
      sessionStorage.getItem('teacher_auth');
    if (!stored) {
      bounce();
      return;
    }
    try {
      setAuthData(JSON.parse(stored));
    } catch {
      bounce();
    }
  }, [router]);

  useEffect(() => {
    directories.subjects().then(d => setSubjectOptions(d.subjects.map(s => s.name))).catch(() => {});
    directories.buildings().then(d => setBuildingOptions(d.buildings.map(b => b.code))).catch(() => {});
    directories.documentTypes().then(d => setDocTypeOptions(d.document_types.map(dt => dt.name))).catch(() => {});
    directories.positions().then(d => setPositionOptions(d.positions)).catch(() => {});
    directories.academicTitles().then(d => setTitleOptions(d.academic_titles)).catch(() => {});
    directories.academicDegrees().then(d => setDegreeOptions(d.academic_degrees)).catch(() => {});
  }, []);

  const loadAll = useCallback(async (teacherId: number) => {
    setScheduleLoading(true);
    setKpkLoading(true);
    setRetakesLoading(true);

    scheduleApi.get(teacherId)
      .then(d => setScheduleEvents(d.events))
      .catch(() => setScheduleEvents([]))
      .finally(() => setScheduleLoading(false));

    profDev.list({ teacherId })
      .then(d => setKpkList(d.professional_developments))
      .finally(() => setKpkLoading(false));

    Promise.all([
      retakesApi.list(teacherId),
      dutiesApi.list(teacherId),
    ]).then(([r, d]) => {
      setRetakesList(r.retake_schedules);
      setDutiesList(d.duty_schedules);
    }).finally(() => setRetakesLoading(false));

    teachersApi.get(teacherId).then(t => {
      setTeacher(t);
      setProfLastName(t.last_name);
      setProfFirstName(t.first_name);
      setProfMiddleName(t.middle_name);
      setProfPosition(t.position);
      setProfDegrees(t.academic_degrees);
      setProfTitles(t.academic_titles);
      setProfMireaSince(t.mirea_teaching_since);
      setProfBeforeYears(Math.floor(t.teaching_years_before_mirea));
      setProfBeforeMonths(Math.round((t.teaching_years_before_mirea % 1) * 12));
      setProfTg(t.tg_username);
    });
  }, []);

  useEffect(() => {
    if (authData) loadAll(authData.teacherId);
  }, [authData, loadAll]);

  const calendarEvents = useMemo((): CalendarEvent[] => {
    return [
      ...scheduleEvents.map(scheduleEventToCalendar),
      ...retakesList.map(retakeToCalendar),
      ...dutiesList.map(dutyToCalendar),
    ];
  }, [scheduleEvents, retakesList, dutiesList]);

  const resetKpkForm = () => {
    setKpkForm({ course_name: '', hours: 36, document_name: '', document_number: '', issued_by: '', issue_date: '' });
    setKpkScanFile(null);
    setEditingKpkId(null);
    setKpkError('');
    setShowAddKpk(false);
  };

  const startEditKpk = (k: ProfessionalDevelopment) => {
    setEditingKpkId(k.id);
    setKpkForm({
      course_name: k.course_name,
      hours: k.hours,
      document_name: k.document_name,
      document_number: k.document_number,
      issued_by: k.issued_by,
      issue_date: k.issue_date,
    });
    setKpkScanFile(null);
    setKpkError('');
    setShowAddKpk(true);
  };

  const handleAddKpk = async () => {
    if (!authData || !kpkForm.course_name?.trim()) return;
    setKpkSaving(true);
    setKpkError('');
    try {
      const payload: ProfDevCreatePayload = {
        teacher_id: authData.teacherId,
        course_name: kpkForm.course_name!,
        hours: kpkForm.hours ?? 36,
        document_name: kpkForm.document_name ?? '',
        document_number: kpkForm.document_number ?? '',
        issued_by: kpkForm.issued_by ?? '',
        issue_date: kpkForm.issue_date ?? '',
      };
      if (editingKpkId != null) {
        let updated = await profDev.update(editingKpkId, payload);
        if (kpkScanFile) {
          updated = await profDev.uploadScan(editingKpkId, kpkScanFile);
        }
        setKpkList(prev => prev.map(k => (k.id === editingKpkId ? updated : k)));
      } else {
        const created = await profDev.create(payload);
        if (kpkScanFile) {
          const withScan = await profDev.uploadScan(created.id, kpkScanFile);
          setKpkList(prev => [...prev, withScan]);
        } else {
          setKpkList(prev => [...prev, created]);
        }
      }
      resetKpkForm();
    } catch (err) {
      setKpkError(err instanceof ApiError ? err.message : 'Ошибка сохранения');
    } finally {
      setKpkSaving(false);
    }
  };

  const handleDeleteKpk = async (id: number) => {
    try {
      await profDev.delete(id);
      setKpkList(prev => prev.filter(k => k.id !== id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Ошибка удаления');
    }
  };

  const resetRetakeForm = () => {
    setRetakeDiscipline('');
    setRetakeDates(['']);
    setRetakeBuilding('');
    setRetakeAuditorium('');
    setRetakeDuration(90);
    setRetakeIsCommission(false);
    setRetakeComment('');
    setEditingRetakeId(null);
    setRetakeError('');
    setShowAddRetake(false);
  };

  const startEditRetake = (r: RetakeSchedule) => {
    setEditingRetakeId(r.id);
    setRetakeDiscipline(r.subject_name);
    setRetakeDates([toDatetimeLocal(r.datetime)]);
    setRetakeBuilding(r.building ?? '');
    setRetakeAuditorium(r.auditorium ?? '');
    setRetakeDuration(r.duration_minutes ?? 90);
    setRetakeIsCommission(r.is_commission);
    setRetakeComment(r.comment ?? '');
    setRetakeError('');
    setShowAddRetake(true);
  };

  const handleSubmitRetake = async () => {
    if (!authData || !retakeDiscipline.trim()) return;
    const validDates = retakeDates.filter(d => d.trim());
    if (validDates.length === 0) return;
    setRetakeSaving(true);
    setRetakeError('');
    try {
      if (editingRetakeId != null) {
        const payload: RetakeCreatePayload = {
          teacher_id: authData.teacherId,
          subject_name: retakeDiscipline.trim(),
          datetime: validDates[0],
          comment: retakeComment,
          building: retakeBuilding,
          auditorium: retakeAuditorium,
          duration_minutes: retakeDuration,
          is_commission: retakeIsCommission,
        };
        const updated = await retakesApi.update(editingRetakeId, payload);
        setRetakesList(prev => prev.map(r => (r.id === editingRetakeId ? updated : r)));
      } else {
        const created: RetakeSchedule[] = [];
        for (const dt of validDates) {
          const payload: RetakeCreatePayload = {
            teacher_id: authData.teacherId,
            subject_name: retakeDiscipline.trim(),
            datetime: dt,
            comment: retakeComment,
            building: retakeBuilding,
            auditorium: retakeAuditorium,
            duration_minutes: retakeDuration,
            is_commission: retakeIsCommission,
          };
          const r = await retakesApi.create(payload);
          created.push(r);
        }
        setRetakesList(prev => [...prev, ...created]);
      }
      resetRetakeForm();
    } catch (err) {
      setRetakeError(err instanceof ApiError ? err.message : 'Ошибка сохранения');
    } finally {
      setRetakeSaving(false);
    }
  };

  const handleDeleteRetake = async (id: number) => {
    try {
      await retakesApi.delete(id);
      setRetakesList(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Ошибка удаления');
    }
  };

  // ── Дежурства ──────────────────────────────────────────────────────────────
  const resetDutyForm = () => {
    setDutyStart('');
    setDutyEnd('');
    setDutyBuilding('');
    setDutyAuditorium('');
    setDutyComment('');
    setEditingDutyId(null);
    setDutyError('');
    setShowAddDuty(false);
  };

  const startEditDuty = (d: DutySchedule) => {
    setEditingDutyId(d.id);
    setDutyStart(toDatetimeLocal(d.start_datetime));
    setDutyEnd(toDatetimeLocal(d.end_datetime));
    setDutyBuilding(d.building ?? '');
    setDutyAuditorium(d.auditorium ?? '');
    setDutyComment(d.comment ?? '');
    setDutyError('');
    setShowAddDuty(true);
  };

  const handleSubmitDuty = async () => {
    if (!authData || !dutyStart || !dutyEnd) return;
    if (dutyEnd <= dutyStart) {
      setDutyError('Окончание должно быть позже начала');
      return;
    }
    setDutySaving(true);
    setDutyError('');
    try {
      const payload: DutyCreatePayload = {
        teacher_id: authData.teacherId,
        start_datetime: dutyStart,
        end_datetime: dutyEnd,
        building: dutyBuilding,
        auditorium: dutyAuditorium,
        comment: dutyComment,
      };
      if (editingDutyId != null) {
        const updated = await dutiesApi.update(editingDutyId, payload);
        setDutiesList(prev => prev.map(d => (d.id === editingDutyId ? updated : d)));
      } else {
        const created = await dutiesApi.create(payload);
        setDutiesList(prev => [...prev, created]);
      }
      resetDutyForm();
    } catch (err) {
      setDutyError(err instanceof ApiError ? err.message : 'Ошибка сохранения');
    } finally {
      setDutySaving(false);
    }
  };

  const handleDeleteDuty = async (id: number) => {
    try {
      await dutiesApi.delete(id);
      setDutiesList(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Ошибка удаления');
    }
  };

  const addProfChip = (kind: 'degrees' | 'titles', v: string) => {
    if (!v) return;
    const setter = kind === 'degrees' ? setProfDegrees : setProfTitles;
    setter(prev => (prev.includes(v) ? prev : [...prev, v]));
  };
  const removeProfChip = (kind: 'degrees' | 'titles', v: string) => {
    const setter = kind === 'degrees' ? setProfDegrees : setProfTitles;
    setter(prev => prev.filter(x => x !== v));
  };

  const handleSaveProfile = async () => {
    if (!authData || !teacher) return;
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess(false);
    const payload: TeacherCreatePayload = {
      last_name: profLastName.trim(),
      first_name: profFirstName.trim(),
      middle_name: profMiddleName.trim(),
      position: profPosition.trim(),
      academic_degrees: profDegrees,
      academic_titles: profTitles,
      email: teacher.email,
      mirea_teaching_since: profMireaSince,
      before_mirea_years: profBeforeYears,
      before_mirea_months: profBeforeMonths,
      tg_username: profTg.trim(),
      schedule_url: teacher.schedule_url,
      educations: teacher.educations,
    };
    try {
      const updated = await teachersApi.update(authData.teacherId, payload);
      setTeacher(updated);
      setProfileSuccess(true);
      setProfileEditing(false);
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : 'Ошибка сохранения');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleLogout = () => {
    removeToken();
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

  const inputClass = 'w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors';

  const mireasInception = teacher?.mirea_teaching_since
    ? new Date(teacher.mirea_teaching_since).getFullYear()
    : null;
  const totalExperienceYears = teacher
    ? Math.floor(teacher.teaching_years_before_mirea) +
      (mireasInception ? new Date().getFullYear() - mireasInception : 0)
    : null;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top bar */}
      <div className="border-b border-gray-700 px-6 py-4 flex items-center gap-2 sm:gap-4">
        <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">Главная</Link>
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
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition-colors">
            Выйти
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-2xl font-bold">{scheduleLoading ? '—' : scheduleEvents.length}</div>
            <div className="text-sm font-medium text-gray-300 mt-1">Занятий в семестре</div>
            <div className="text-xs text-gray-500 mt-0.5">из расписания</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-2xl font-bold">{kpkLoading ? '—' : kpkList.length}</div>
            <div className="text-sm font-medium text-gray-300 mt-1">Записей КПК</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-2xl font-bold">{retakesLoading ? '—' : retakesList.length}</div>
            <div className="text-sm font-medium text-gray-300 mt-1">Пересдач</div>
            <div className="text-xs text-gray-500 mt-0.5">запланировано</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-2xl font-bold">{totalExperienceYears ?? '—'}</div>
            <div className="text-sm font-medium text-gray-300 mt-1">Лет стажа</div>
            {mireasInception && (
              <div className="text-xs text-gray-500 mt-0.5">в МИРЭА с {mireasInception}</div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-800 rounded-xl p-1 border border-gray-700">
          {([
            { key: 'schedule', label: '📅 Расписание' },
            { key: 'kpk', label: '🎓 КПК' },
            { key: 'retakes', label: '📝 Пересдачи' },
            { key: 'duties', label: '🛡️ Дежурства' },
            { key: 'profile', label: '👤 Профиль' },
          ] as { key: Tab; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Schedule */}
        {tab === 'schedule' && (
          <div>
            {scheduleLoading ? (
              <div className="text-gray-400 text-sm py-8 text-center">Загрузка расписания...</div>
            ) : (
              <WeeklyCalendar events={calendarEvents} />
            )}
          </div>
        )}

        {/* Tab: KPK */}
        {tab === 'kpk' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-gray-300">
                Повышение квалификации ({kpkLoading ? '...' : kpkList.length})
              </h2>
              <button
                onClick={() => { resetKpkForm(); setShowAddKpk(true); }}
                className="bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
              >
                + Добавить
              </button>
            </div>

            {kpkLoading ? (
              <div className="text-gray-400 text-sm py-8 text-center">Загрузка...</div>
            ) : (
              <div className="flex flex-col gap-3">
                {kpkList.length === 0 && (
                  <div className="text-center text-gray-500 py-8">Нет записей КПК</div>
                )}
                {kpkList.map(k => (
                  <div key={k.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-200">{k.course_name}</div>
                      <div className="text-sm text-gray-400 mt-1">
                        {k.hours} ч. · {k.document_name}
                        {k.document_number ? ` № ${k.document_number}` : ''}
                        {k.issued_by ? ` · ${k.issued_by}` : ''}
                        {k.issue_date ? ` · ${k.issue_date}` : ''}
                      </div>
                      {k.scan_download_url && (
                        <button
                          type="button"
                          onClick={() =>
                            downloadAuthed(k.scan_download_url!, `Скан_КПК_${k.id}`).catch(() =>
                              alert('Не удалось скачать скан документа.'),
                            )
                          }
                          className="text-xs text-cyan-400 hover:text-cyan-300 mt-1 inline-block"
                        >
                          Скан документа ↓
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <button
                        onClick={() => startEditKpk(k)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => handleDeleteKpk(k.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showAddKpk && (
              <div
                className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
                onClick={resetKpkForm}
              >
                <div
                  className="w-full max-w-lg bg-gray-800 rounded-2xl border border-gray-700 p-6 max-h-[90vh] overflow-y-auto flex flex-col gap-4"
                  onClick={e => e.stopPropagation()}
                >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-200">
                    {editingKpkId != null ? 'Редактирование записи КПК' : 'Новая запись КПК'}
                  </h3>
                  <button
                    onClick={resetKpkForm}
                    className="text-gray-500 hover:text-white transition-colors text-xl"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Название курса *</label>
                    <input
                      type="text"
                      value={kpkForm.course_name ?? ''}
                      onChange={e => setKpkForm(f => ({ ...f, course_name: e.target.value }))}
                      placeholder="Современные технологии баз данных"
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Количество часов</label>
                    <input
                      type="number" min={1}
                      value={kpkForm.hours ?? 36}
                      onChange={e => setKpkForm(f => ({ ...f, hours: Number(e.target.value) }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Дата выдачи документа</label>
                    <input
                      type="date"
                      value={kpkForm.issue_date ?? ''}
                      onChange={e => setKpkForm(f => ({ ...f, issue_date: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Вид документа</label>
                    <select
                      value={kpkForm.document_name ?? ''}
                      onChange={e => setKpkForm(f => ({ ...f, document_name: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">— не указан —</option>
                      {docTypeOptions.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Номер документа</label>
                    <input
                      type="text"
                      value={kpkForm.document_number ?? ''}
                      onChange={e => setKpkForm(f => ({ ...f, document_number: e.target.value }))}
                      placeholder="772400123456"
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Выдан организацией</label>
                    <input
                      type="text"
                      value={kpkForm.issued_by ?? ''}
                      onChange={e => setKpkForm(f => ({ ...f, issued_by: e.target.value }))}
                      placeholder="РТУ МИРЭА"
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">
                      {editingKpkId != null ? 'Заменить скан документа (pdf/jpg/png, необязательно)' : 'Скан документа (pdf/jpg/png, необязательно)'}
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={e => setKpkScanFile(e.target.files?.[0] ?? null)}
                      className="w-full text-xs text-gray-400 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-gray-700 file:text-gray-200 hover:file:bg-gray-600"
                    />
                    {kpkScanFile && <p className="text-xs text-cyan-400 mt-1">{kpkScanFile.name}</p>}
                  </div>
                </div>

                {kpkError && (
                  <p className="text-sm text-red-400 bg-red-900/20 border border-red-900/50 rounded-xl px-4 py-2">
                    {kpkError}
                  </p>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={resetKpkForm}
                    className="text-sm text-gray-400 hover:text-white px-4 py-2 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleAddKpk}
                    disabled={kpkSaving}
                    className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    {kpkSaving ? 'Сохранение...' : editingKpkId != null ? 'Сохранить' : 'Добавить'}
                  </button>
                </div>
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
                График пересдач ({retakesLoading ? '...' : retakesList.length})
              </h2>
              <button
                onClick={() => { if (showAddRetake) { resetRetakeForm(); } else { resetRetakeForm(); setShowAddRetake(true); } }}
                className="bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
              >
                + Добавить
              </button>
            </div>

            {retakesLoading ? (
              <div className="text-gray-400 text-sm py-8 text-center">Загрузка...</div>
            ) : (
              <div className="flex flex-col gap-3">
                {retakesList.length === 0 && (
                  <div className="text-center text-gray-500 py-8">Нет запланированных пересдач</div>
                )}
                {retakesList.map(r => (
                  <div key={r.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-200">{r.subject_name}</span>
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
                        {r.building ? ` · ${r.building}` : ''}
                        {r.auditorium ? `, ${r.auditorium}` : ''}
                        {` · ${r.duration_minutes} мин.`}
                      </div>
                      {r.comment && <div className="text-xs text-gray-500 mt-1">{r.comment}</div>}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <button
                        onClick={() => startEditRetake(r)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => handleDeleteRetake(r.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showAddRetake && (
              <div className="bg-gray-800 rounded-xl p-5 border border-cyan-500/30 flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-gray-300">
                  {editingRetakeId != null ? 'Редактирование пересдачи' : 'Новая пересдача'}
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Дисциплина *</label>
                    <SubjectCombobox
                      value={retakeDiscipline}
                      onChange={setRetakeDiscipline}
                      options={subjectOptions}
                      placeholder="Введите или выберите дисциплину"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Даты и время *</label>
                    <div className="flex flex-col gap-2">
                      {retakeDates.map((dt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="datetime-local"
                            value={dt}
                            onChange={e => {
                              const next = [...retakeDates];
                              next[i] = e.target.value;
                              setRetakeDates(next);
                            }}
                            className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                          />
                          {retakeDates.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setRetakeDates(retakeDates.filter((_, j) => j !== i))}
                              className="text-gray-500 hover:text-red-400 transition-colors text-lg leading-none flex-shrink-0"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      {editingRetakeId == null && (
                        <button
                          type="button"
                          onClick={() => setRetakeDates([...retakeDates, ''])}
                          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors text-left"
                        >
                          + Добавить дату
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Корпус</label>
                    <select
                      value={retakeBuilding}
                      onChange={e => setRetakeBuilding(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">— не указан —</option>
                      {buildingOptions.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Аудитория</label>
                    <input
                      type="text"
                      value={retakeAuditorium}
                      onChange={e => setRetakeAuditorium(e.target.value)}
                      placeholder="А-101"
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Длительность (мин.)</label>
                    <input
                      type="number"
                      value={retakeDuration}
                      onChange={e => setRetakeDuration(Number(e.target.value))}
                      min={30} step={30}
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Комментарий для студентов</label>
                    <textarea
                      value={retakeComment}
                      onChange={e => setRetakeComment(e.target.value)}
                      rows={2}
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500 resize-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={retakeIsCommission}
                        onChange={e => setRetakeIsCommission(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 accent-cyan-500"
                      />
                      Комиссионная пересдача
                    </label>
                  </div>
                </div>

                {retakeError && (
                  <p className="text-sm text-red-400 bg-red-900/20 border border-red-900/50 rounded-xl px-4 py-2">
                    {retakeError}
                  </p>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={resetRetakeForm}
                    className="text-sm text-gray-400 hover:text-white px-4 py-2 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSubmitRetake}
                    disabled={retakeSaving}
                    className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    {retakeSaving
                      ? 'Сохранение...'
                      : editingRetakeId != null
                        ? 'Сохранить'
                        : `Добавить (${retakeDates.filter(d => d).length} дат)`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Duties */}
        {tab === 'duties' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-300">
                Дежурства ({retakesLoading ? '...' : dutiesList.length})
              </h2>
              <button
                onClick={() => { if (showAddDuty) { resetDutyForm(); } else { resetDutyForm(); setShowAddDuty(true); } }}
                className="bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
              >
                + Добавить
              </button>
            </div>

            {retakesLoading ? (
              <div className="text-gray-400 text-sm py-8 text-center">Загрузка...</div>
            ) : (
              <div className="flex flex-col gap-3">
                {dutiesList.length === 0 && (
                  <div className="text-center text-gray-500 py-8">Нет запланированных дежурств</div>
                )}
                {dutiesList.map(d => (
                  <div key={d.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-200">
                        {new Date(d.start_datetime).toLocaleString('ru-RU', {
                          day: 'numeric', month: 'long', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                        {' — '}
                        {new Date(d.end_datetime).toLocaleTimeString('ru-RU', {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {d.building ? d.building : '—'}
                        {d.auditorium ? `, ${d.auditorium}` : ''}
                      </div>
                      {d.comment && <div className="text-xs text-gray-500 mt-1">{d.comment}</div>}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <button
                        onClick={() => startEditDuty(d)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => handleDeleteDuty(d.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showAddDuty && (
              <div className="bg-gray-800 rounded-xl p-5 border border-cyan-500/30 flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-gray-300">
                  {editingDutyId != null ? 'Редактирование дежурства' : 'Новое дежурство'}
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Начало *</label>
                    <input
                      type="datetime-local"
                      value={dutyStart}
                      onChange={e => setDutyStart(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Окончание *</label>
                    <input
                      type="datetime-local"
                      value={dutyEnd}
                      onChange={e => setDutyEnd(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Корпус</label>
                    <select
                      value={dutyBuilding}
                      onChange={e => setDutyBuilding(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">— не указан —</option>
                      {buildingOptions.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Аудитория</label>
                    <input
                      type="text"
                      value={dutyAuditorium}
                      onChange={e => setDutyAuditorium(e.target.value)}
                      placeholder="А-101"
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Комментарий</label>
                    <textarea
                      value={dutyComment}
                      onChange={e => setDutyComment(e.target.value)}
                      rows={2}
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500 resize-none"
                    />
                  </div>
                </div>

                {dutyError && (
                  <p className="text-sm text-red-400 bg-red-900/20 border border-red-900/50 rounded-xl px-4 py-2">
                    {dutyError}
                  </p>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={resetDutyForm}
                    className="text-sm text-gray-400 hover:text-white px-4 py-2 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSubmitDuty}
                    disabled={dutySaving}
                    className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    {dutySaving ? 'Сохранение...' : editingDutyId != null ? 'Сохранить' : 'Добавить'}
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center text-xl font-bold text-gray-200">
                      {teacher.photo_download_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}${teacher.photo_download_url}`}
                          alt={teacher.full_name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        getInitials(teacher.full_name)
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{teacher.full_name}</h2>
                    </div>
                  </div>
                  {!profileEditing && (
                    <button
                      onClick={() => setProfileEditing(true)}
                      className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Редактировать
                    </button>
                  )}
                </div>

                {!profileEditing ? (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Должность</div>
                        <div className="text-gray-300">{teacher.position || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Email</div>
                        <div className="text-gray-300">{teacher.email}</div>
                      </div>
                      {teacher.academic_degrees.length > 0 && (
                        <div>
                          <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Учёные степени</div>
                          <div className="text-gray-300">{teacher.academic_degrees.join(', ')}</div>
                        </div>
                      )}
                      {teacher.academic_titles.length > 0 && (
                        <div>
                          <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Учёные звания</div>
                          <div className="text-gray-300">{teacher.academic_titles.join(', ')}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">В МИРЭА с</div>
                        <div className="text-gray-300">{teacher.mirea_teaching_since || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Общий стаж</div>
                        <div className="text-gray-300">{totalExperienceYears ?? '—'} лет</div>
                      </div>
                    </div>

                    {teacher.educations.length > 0 && (
                      <div>
                        <div className="text-gray-500 text-xs uppercase tracking-wide mb-2">Образование</div>
                        <ul className="flex flex-col gap-1">
                          {teacher.educations.map((edu, i) => (
                            <li key={i} className="text-sm text-gray-300">
                              {edu.institution} · {edu.specialty} · {edu.level} · {edu.graduation_year}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {profileSuccess && <p className="text-sm text-green-400">Профиль обновлён</p>}
                  </>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Фамилия</label>
                        <input value={profLastName} onChange={e => setProfLastName(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Имя</label>
                        <input value={profFirstName} onChange={e => setProfFirstName(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Отчество</label>
                        <input value={profMiddleName} onChange={e => setProfMiddleName(e.target.value)} className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Должность</label>
                      <select value={profPosition} onChange={e => setProfPosition(e.target.value)} className={inputClass}>
                        <option value="">— не указана —</option>
                        {positionOptions.map(p => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Учёные степени</label>
                        <select
                          value=""
                          onChange={e => { addProfChip('degrees', e.target.value); e.target.value = ''; }}
                          className={inputClass}
                        >
                          <option value="">+ добавить степень</option>
                          {degreeOptions.map(d => (
                            <option key={d.short_name} value={d.short_name}>{d.short_name} — {d.full_name}</option>
                          ))}
                        </select>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {profDegrees.map(d => (
                            <span key={d} className="text-xs bg-gray-700 text-gray-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              {d}
                              <button type="button" onClick={() => removeProfChip('degrees', d)} className="text-gray-400 hover:text-red-400">✕</button>
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Учёные звания (необязательно)</label>
                        <select
                          value=""
                          onChange={e => { addProfChip('titles', e.target.value); e.target.value = ''; }}
                          className={inputClass}
                        >
                          <option value="">+ добавить звание</option>
                          {titleOptions.map(t => (
                            <option key={t.short_name} value={t.short_name}>{t.short_name} — {t.full_name}</option>
                          ))}
                        </select>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {profTitles.map(t => (
                            <span key={t} className="text-xs bg-gray-700 text-gray-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              {t}
                              <button type="button" onClick={() => removeProfChip('titles', t)} className="text-gray-400 hover:text-red-400">✕</button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">В МИРЭА с (дата)</label>
                      <input type="date" value={profMireaSince} onChange={e => setProfMireaSince(e.target.value)} className={inputClass} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Стаж до МИРЭА (лет)</label>
                        <input type="number" min={0} value={profBeforeYears} onChange={e => setProfBeforeYears(Number(e.target.value))} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Стаж до МИРЭА (мес.)</label>
                        <input type="number" min={0} max={11} value={profBeforeMonths} onChange={e => setProfBeforeMonths(Number(e.target.value))} className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Telegram</label>
                      <input value={profTg} onChange={e => setProfTg(e.target.value)} className={inputClass} placeholder="@username" />
                    </div>

                    {profileError && (
                      <p className="text-sm text-red-400 bg-red-900/20 border border-red-900/50 rounded-xl px-4 py-2">
                        {profileError}
                      </p>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveProfile}
                        disabled={profileSaving}
                        className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-medium transition-colors text-sm"
                      >
                        {profileSaving ? 'Сохранение...' : 'Сохранить'}
                      </button>
                      <button
                        onClick={() => { setProfileEditing(false); setProfileError(''); }}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-xl font-medium transition-colors text-sm"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500">Загрузка профиля...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
