import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { auth, teachers as teachersApi, retakes as retakesApi, duties as dutiesApi, profDev, directories, reports, setToken, getToken, removeToken, downloadAuthed, ApiError } from '../../lib/api';
import type {
  Teacher,
  TeacherCreatePayload,
  RetakeSchedule,
  RetakeCreatePayload,
  DutySchedule,
  DutyCreatePayload,
  Position,
  AcademicTitle,
  AcademicDegree,
  ProfessionalDevelopment,
  ProfDevCreatePayload,
  DocumentType,
} from '../../types';

/** "2026-02-15T14:00:00" → "2026-02-15T14:00" для <input type="datetime-local">. */
function toDatetimeLocal(value: string): string {
  return value ? value.slice(0, 16) : '';
}

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
  onKpk,
}: {
  teachers: Teacher[];
  loading: boolean;
  onEdit: (t: Teacher) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
  onKpk: (t: Teacher) => void;
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
                        onClick={() => onKpk(t)}
                        className="px-3 py-1 text-xs bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-300 rounded-lg transition-colors"
                      >
                        КПК
                      </button>
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

  const [positions, setPositions] = useState<Position[]>([]);
  const [titles, setTitles] = useState<AcademicTitle[]>([]);
  const [degrees, setDegrees] = useState<AcademicDegree[]>([]);

  useEffect(() => {
    directories.positions().then(d => setPositions(d.positions)).catch(() => {});
    directories.academicTitles().then(d => setTitles(d.academic_titles)).catch(() => {});
    directories.academicDegrees().then(d => setDegrees(d.academic_degrees)).catch(() => {});
  }, []);

  const set = <K extends keyof TeacherCreatePayload>(k: K, v: TeacherCreatePayload[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const addTo = (k: 'academic_degrees' | 'academic_titles', v: string) => {
    if (v && !form[k].includes(v)) set(k, [...form[k], v]);
  };
  const removeFrom = (k: 'academic_degrees' | 'academic_titles', v: string) =>
    set(k, form[k].filter(x => x !== v));

  const [localError, setLocalError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const missing =
      !form.last_name.trim() ||
      !form.first_name.trim() ||
      !form.middle_name.trim() ||
      !form.position ||
      form.academic_degrees.length === 0 ||
      form.academic_titles.length === 0 ||
      !form.email.trim() ||
      !form.mirea_teaching_since ||
      form.before_mirea_years == null ||
      form.before_mirea_months == null ||
      !form.tg_username.trim() ||
      !form.schedule_url.trim();
    if (missing) {
      setLocalError('Заполните все поля — они обязательны');
      return;
    }
    setLocalError('');
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
            <Field label="Отчество" required>
              <input required value={form.middle_name} onChange={e => set('middle_name', e.target.value)} className={inputClass} placeholder="Иванович" />
            </Field>
          </div>

          <Field label="Должность" required>
            <select required value={form.position} onChange={e => set('position', e.target.value)} className={inputClass}>
              <option value="">— не указана —</option>
              {positions.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Учёные степени" required>
              <select
                value=""
                onChange={e => { addTo('academic_degrees', e.target.value); e.target.value = ''; }}
                className={inputClass}
              >
                <option value="">+ добавить степень</option>
                {degrees.map(d => (
                  <option key={d.short_name} value={d.short_name}>{d.short_name} — {d.full_name}</option>
                ))}
              </select>
              <div className="flex flex-wrap gap-1 mt-2">
                {form.academic_degrees.map(d => (
                  <span key={d} className="text-xs bg-gray-700 text-gray-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    {d}
                    <button type="button" onClick={() => removeFrom('academic_degrees', d)} className="text-gray-400 hover:text-red-400">✕</button>
                  </span>
                ))}
              </div>
            </Field>
            <Field label="Учёные звания" required>
              <select
                value=""
                onChange={e => { addTo('academic_titles', e.target.value); e.target.value = ''; }}
                className={inputClass}
              >
                <option value="">+ добавить звание</option>
                {titles.map(t => (
                  <option key={t.short_name} value={t.short_name}>{t.short_name} — {t.full_name}</option>
                ))}
              </select>
              <div className="flex flex-wrap gap-1 mt-2">
                {form.academic_titles.map(t => (
                  <span key={t} className="text-xs bg-gray-700 text-gray-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    {t}
                    <button type="button" onClick={() => removeFrom('academic_titles', t)} className="text-gray-400 hover:text-red-400">✕</button>
                  </span>
                ))}
              </div>
            </Field>
          </div>

          <Field label="Email" required>
            <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputClass} placeholder="ivanov@mirea.ru" />
          </Field>

          <Field label="В МИРЭА с (дата)" required>
            <input required type="date" value={form.mirea_teaching_since} onChange={e => set('mirea_teaching_since', e.target.value)} className={inputClass} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Стаж до МИРЭА (лет)" required>
              <input required type="number" min={0} value={form.before_mirea_years} onChange={e => set('before_mirea_years', Number(e.target.value))} className={inputClass} />
            </Field>
            <Field label="Стаж до МИРЭА (мес.)" required>
              <input required type="number" min={0} max={11} value={form.before_mirea_months} onChange={e => set('before_mirea_months', Number(e.target.value))} className={inputClass} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Telegram" required>
              <input required value={form.tg_username} onChange={e => set('tg_username', e.target.value)} className={inputClass} placeholder="@username" />
            </Field>
            <Field label="Ссылка на расписание (iCal)" required>
              <input required value={form.schedule_url} onChange={e => set('schedule_url', e.target.value)} className={inputClass} placeholder="webcal://..." />
            </Field>
          </div>

          {(error || localError) && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-900/50 rounded-xl px-4 py-2">
              {localError || error}
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

// ── KPK Modal (КПК преподавателя) ──────────────────────────────────────────────

const EMPTY_KPK = {
  course_name: '',
  hours: 36,
  document_name: '',
  document_number: '',
  issued_by: '',
  issue_date: '',
};

function KpkModal({ teacher, onClose }: { teacher: Teacher; onClose: () => void }) {
  const [list, setList] = useState<ProfessionalDevelopment[]>([]);
  const [loading, setLoading] = useState(false);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_KPK });
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await profDev.list({ teacherId: teacher.id });
      setList(d.professional_developments);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить КПК');
    } finally {
      setLoading(false);
    }
  }, [teacher.id]);

  useEffect(() => {
    load();
    directories.documentTypes().then(d => setDocTypes(d.document_types)).catch(() => {});
  }, [load]);

  const resetForm = () => {
    setForm({ ...EMPTY_KPK });
    setScanFile(null);
    setError('');
    setShowForm(false);
  };

  const handleAdd = async () => {
    if (!form.course_name.trim()) {
      setError('Укажите название курса');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: ProfDevCreatePayload = {
        teacher_id: teacher.id,
        course_name: form.course_name.trim(),
        hours: form.hours,
        document_name: form.document_name,
        document_number: form.document_number,
        issued_by: form.issued_by,
        issue_date: form.issue_date,
      };
      const created = await profDev.create(payload);
      if (scanFile) {
        const withScan = await profDev.uploadScan(created.id, scanFile);
        setList(prev => [...prev, withScan]);
      } else {
        setList(prev => [...prev, created]);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить запись КПК?')) return;
    try {
      await profDev.delete(id);
      setList(prev => prev.filter(k => k.id !== id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Ошибка удаления');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="w-full max-w-2xl bg-gray-800 rounded-2xl border border-gray-700 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold">КПК преподавателя</h3>
            <div className="text-sm text-gray-400">{teacher.full_name}</div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-xl">✕</button>
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={() => { if (showForm) resetForm(); else { resetForm(); setShowForm(true); } }}
            className="bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
          >
            + Добавить КПК
          </button>
        </div>

        {showForm && (
          <div className="bg-gray-900/50 rounded-xl p-4 border border-cyan-500/30 mb-4 grid sm:grid-cols-2 gap-3">
            <input value={form.course_name} onChange={e => setForm(f => ({ ...f, course_name: e.target.value }))} placeholder="Название курса *" className={`sm:col-span-2 ${inputCls}`} />
            <input type="number" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: Number(e.target.value) }))} min={1} placeholder="Часов" className={inputCls} />
            <input type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} className={inputCls} />
            <select value={form.document_name} onChange={e => setForm(f => ({ ...f, document_name: e.target.value }))} className={inputCls}>
              <option value="">— вид документа —</option>
              {docTypes.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
            <input value={form.document_number} onChange={e => setForm(f => ({ ...f, document_number: e.target.value }))} placeholder="Номер документа" className={inputCls} />
            <input value={form.issued_by} onChange={e => setForm(f => ({ ...f, issued_by: e.target.value }))} placeholder="Кем выдан" className={`sm:col-span-2 ${inputCls}`} />
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Скан документа (pdf/jpg/png, необязательно)</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => setScanFile(e.target.files?.[0] ?? null)}
                className="w-full text-xs text-gray-400 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-gray-700 file:text-gray-200 hover:file:bg-gray-600"
              />
            </div>
            {error && <p className="sm:col-span-2 text-sm text-red-400">{error}</p>}
            <div className="sm:col-span-2 flex justify-end gap-2">
              <button onClick={resetForm} className="text-sm text-gray-400 hover:text-white px-4 py-2">Отмена</button>
              <button onClick={handleAdd} disabled={saving} className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
                {saving ? 'Сохранение...' : 'Добавить'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-gray-400 text-sm py-8 text-center">Загрузка...</div>
        ) : list.length === 0 ? (
          <div className="text-center text-gray-500 py-10">Нет записей КПК</div>
        ) : (
          <div className="flex flex-col gap-2">
            {list.map(k => (
              <div key={k.id} className="bg-gray-900/40 rounded-xl p-4 border border-gray-700 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-200">{k.course_name}</div>
                  <div className="text-sm text-gray-400 mt-1">
                    {k.hours} ч.
                    {k.document_name ? ` · ${k.document_name}` : ''}
                    {k.document_number ? ` № ${k.document_number}` : ''}
                    {k.issued_by ? ` · ${k.issued_by}` : ''}
                    {k.issue_date ? ` · ${k.issue_date}` : ''}
                  </div>
                  {k.scan_download_url && (
                    <button
                      type="button"
                      onClick={() => downloadAuthed(k.scan_download_url!, `Скан_КПК_${k.id}`).catch(() => alert('Не удалось скачать скан.'))}
                      className="text-xs text-cyan-400 hover:text-cyan-300 mt-1 inline-block"
                    >
                      Скан документа ↓
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(k.id)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Schedules Section (пересдачи + дежурства) ──────────────────────────────────

const inputCls =
  'w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500';

function SchedulesSection({ teachers }: { teachers: Teacher[] }) {
  const [sub, setSub] = useState<'retakes' | 'duties'>('retakes');

  const [retakesList, setRetakesList] = useState<RetakeSchedule[]>([]);
  const [dutiesList, setDutiesList] = useState<DutySchedule[]>([]);
  const [loading, setLoading] = useState(false);

  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [buildingOptions, setBuildingOptions] = useState<string[]>([]);

  // Retake form
  const [showRetakeForm, setShowRetakeForm] = useState(false);
  const [editingRetakeId, setEditingRetakeId] = useState<number | null>(null);
  const [rTeacher, setRTeacher] = useState<number | ''>('');
  const [rSubject, setRSubject] = useState('');
  const [rDatetime, setRDatetime] = useState('');
  const [rBuilding, setRBuilding] = useState('');
  const [rAuditorium, setRAuditorium] = useState('');
  const [rDuration, setRDuration] = useState(90);
  const [rCommission, setRCommission] = useState(false);
  const [rComment, setRComment] = useState('');

  // Duty form
  const [showDutyForm, setShowDutyForm] = useState(false);
  const [editingDutyId, setEditingDutyId] = useState<number | null>(null);
  const [dTeacher, setDTeacher] = useState<number | ''>('');
  const [dStart, setDStart] = useState('');
  const [dEnd, setDEnd] = useState('');
  const [dBuilding, setDBuilding] = useState('');
  const [dAuditorium, setDAuditorium] = useState('');
  const [dComment, setDComment] = useState('');

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const getName = (id: number) => teachers.find(t => t.id === id)?.full_name ?? `#${id}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, d] = await Promise.all([retakesApi.list(), dutiesApi.list()]);
      setRetakesList(r.retake_schedules);
      setDutiesList(d.duty_schedules);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    directories.subjects().then(d => setSubjectOptions(d.subjects.map(s => s.name))).catch(() => {});
    directories.buildings().then(d => setBuildingOptions(d.buildings.map(b => b.code))).catch(() => {});
  }, [load]);

  // ── Retakes ──
  const resetRetake = () => {
    setEditingRetakeId(null);
    setRTeacher(''); setRSubject(''); setRDatetime('');
    setRBuilding(''); setRAuditorium(''); setRDuration(90);
    setRCommission(false); setRComment('');
    setFormError(''); setShowRetakeForm(false);
  };

  const startEditRetake = (s: RetakeSchedule) => {
    setEditingRetakeId(s.id);
    setRTeacher(s.teacher_id);
    setRSubject(s.subject_name);
    setRDatetime(toDatetimeLocal(s.datetime));
    setRBuilding(s.building ?? '');
    setRAuditorium(s.auditorium ?? '');
    setRDuration(s.duration_minutes ?? 90);
    setRCommission(s.is_commission);
    setRComment(s.comment ?? '');
    setFormError(''); setShowRetakeForm(true);
  };

  const submitRetake = async () => {
    if (rTeacher === '' || !rSubject.trim() || !rDatetime) {
      setFormError('Заполните преподавателя, дисциплину и дату');
      return;
    }
    setSaving(true); setFormError('');
    try {
      const payload: RetakeCreatePayload = {
        teacher_id: Number(rTeacher),
        subject_name: rSubject.trim(),
        datetime: rDatetime,
        comment: rComment,
        building: rBuilding,
        auditorium: rAuditorium,
        duration_minutes: rDuration,
        is_commission: rCommission,
      };
      if (editingRetakeId != null) {
        const upd = await retakesApi.update(editingRetakeId, payload);
        setRetakesList(prev => prev.map(s => (s.id === editingRetakeId ? upd : s)));
      } else {
        const created = await retakesApi.create(payload);
        setRetakesList(prev => [...prev, created]);
      }
      resetRetake();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const deleteRetake = async (id: number) => {
    if (!confirm('Удалить пересдачу?')) return;
    try {
      await retakesApi.delete(id);
      setRetakesList(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Ошибка удаления');
    }
  };

  // ── Duties ──
  const resetDuty = () => {
    setEditingDutyId(null);
    setDTeacher(''); setDStart(''); setDEnd('');
    setDBuilding(''); setDAuditorium(''); setDComment('');
    setFormError(''); setShowDutyForm(false);
  };

  const startEditDuty = (d: DutySchedule) => {
    setEditingDutyId(d.id);
    setDTeacher(d.teacher_id);
    setDStart(toDatetimeLocal(d.start_datetime));
    setDEnd(toDatetimeLocal(d.end_datetime));
    setDBuilding(d.building ?? '');
    setDAuditorium(d.auditorium ?? '');
    setDComment(d.comment ?? '');
    setFormError(''); setShowDutyForm(true);
  };

  const submitDuty = async () => {
    if (dTeacher === '' || !dStart || !dEnd) {
      setFormError('Заполните преподавателя, начало и окончание');
      return;
    }
    if (dEnd <= dStart) {
      setFormError('Окончание должно быть позже начала');
      return;
    }
    setSaving(true); setFormError('');
    try {
      const payload: DutyCreatePayload = {
        teacher_id: Number(dTeacher),
        start_datetime: dStart,
        end_datetime: dEnd,
        building: dBuilding,
        auditorium: dAuditorium,
        comment: dComment,
      };
      if (editingDutyId != null) {
        const upd = await dutiesApi.update(editingDutyId, payload);
        setDutiesList(prev => prev.map(d => (d.id === editingDutyId ? upd : d)));
      } else {
        const created = await dutiesApi.create(payload);
        setDutiesList(prev => [...prev, created]);
      }
      resetDuty();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const deleteDuty = async (id: number) => {
    if (!confirm('Удалить дежурство?')) return;
    try {
      await dutiesApi.delete(id);
      setDutiesList(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Ошибка удаления');
    }
  };

  const teacherOptions = (
    <>
      <option value="">— преподаватель —</option>
      {teachers.map(t => (
        <option key={t.id} value={t.id}>{t.full_name}</option>
      ))}
    </>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-gray-800 rounded-xl p-1">
          <button
            onClick={() => setSub('retakes')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${sub === 'retakes' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Пересдачи
          </button>
          <button
            onClick={() => setSub('duties')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${sub === 'duties' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Дежурства
          </button>
        </div>
        {sub === 'retakes' ? (
          <button
            onClick={() => { if (showRetakeForm) resetRetake(); else { resetRetake(); setShowRetakeForm(true); } }}
            className="bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
          >
            + Пересдача
          </button>
        ) : (
          <button
            onClick={() => { if (showDutyForm) resetDuty(); else { resetDuty(); setShowDutyForm(true); } }}
            className="bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
          >
            + Дежурство
          </button>
        )}
      </div>

      {/* Retake form */}
      {sub === 'retakes' && showRetakeForm && (
        <div className="bg-gray-800 rounded-xl p-5 border border-cyan-500/30 mb-4 grid sm:grid-cols-2 gap-3">
          <select value={rTeacher} onChange={e => setRTeacher(e.target.value ? Number(e.target.value) : '')} className={inputCls}>
            {teacherOptions}
          </select>
          <select value={rSubject} onChange={e => setRSubject(e.target.value)} className={inputCls}>
            <option value="">— дисциплина —</option>
            {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="datetime-local" value={rDatetime} onChange={e => setRDatetime(e.target.value)} className={inputCls} />
          <input type="number" value={rDuration} onChange={e => setRDuration(Number(e.target.value))} min={30} step={30} placeholder="Длительность, мин." className={inputCls} />
          <select value={rBuilding} onChange={e => setRBuilding(e.target.value)} className={inputCls}>
            <option value="">— корпус —</option>
            {buildingOptions.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <input type="text" value={rAuditorium} onChange={e => setRAuditorium(e.target.value)} placeholder="Аудитория" className={inputCls} />
          <input type="text" value={rComment} onChange={e => setRComment(e.target.value)} placeholder="Комментарий" className="sm:col-span-2 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500" />
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none sm:col-span-2">
            <input type="checkbox" checked={rCommission} onChange={e => setRCommission(e.target.checked)} className="w-4 h-4 rounded border-gray-600 bg-gray-700 accent-cyan-500" />
            Комиссионная пересдача
          </label>
          {formError && <p className="sm:col-span-2 text-sm text-red-400">{formError}</p>}
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button onClick={resetRetake} className="text-sm text-gray-400 hover:text-white px-4 py-2">Отмена</button>
            <button onClick={submitRetake} disabled={saving} className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
              {saving ? 'Сохранение...' : editingRetakeId != null ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </div>
      )}

      {/* Duty form */}
      {sub === 'duties' && showDutyForm && (
        <div className="bg-gray-800 rounded-xl p-5 border border-cyan-500/30 mb-4 grid sm:grid-cols-2 gap-3">
          <select value={dTeacher} onChange={e => setDTeacher(e.target.value ? Number(e.target.value) : '')} className={`sm:col-span-2 ${inputCls}`}>
            {teacherOptions}
          </select>
          <input type="datetime-local" value={dStart} onChange={e => setDStart(e.target.value)} className={inputCls} />
          <input type="datetime-local" value={dEnd} onChange={e => setDEnd(e.target.value)} className={inputCls} />
          <select value={dBuilding} onChange={e => setDBuilding(e.target.value)} className={inputCls}>
            <option value="">— корпус —</option>
            {buildingOptions.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <input type="text" value={dAuditorium} onChange={e => setDAuditorium(e.target.value)} placeholder="Аудитория" className={inputCls} />
          <input type="text" value={dComment} onChange={e => setDComment(e.target.value)} placeholder="Комментарий" className="sm:col-span-2 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500" />
          {formError && <p className="sm:col-span-2 text-sm text-red-400">{formError}</p>}
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button onClick={resetDuty} className="text-sm text-gray-400 hover:text-white px-4 py-2">Отмена</button>
            <button onClick={submitDuty} disabled={saving} className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
              {saving ? 'Сохранение...' : editingDutyId != null ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 text-sm py-8 text-center">Загрузка...</div>
      ) : sub === 'retakes' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400 text-left">
                <th className="pb-3 pr-4">Преподаватель</th>
                <th className="pb-3 pr-4">Дисциплина</th>
                <th className="pb-3 pr-4">Дата/время</th>
                <th className="pb-3 pr-4">Корпус / ауд.</th>
                <th className="pb-3 pr-4">Тип</th>
                <th className="pb-3">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {retakesList.map(s => (
                <tr key={s.id} className="text-gray-300 hover:bg-gray-700/30 transition-colors">
                  <td className="py-3 pr-4 text-white">{s.teacher_full_name ?? getName(s.teacher_id)}</td>
                  <td className="py-3 pr-4">{s.subject_name}</td>
                  <td className="py-3 pr-4 text-gray-400 text-xs">
                    {new Date(s.datetime).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 pr-4">{[s.building, s.auditorium].filter(Boolean).join(' / ') || '—'}</td>
                  <td className="py-3 pr-4">
                    {s.is_commission
                      ? <span className="text-xs px-2 py-0.5 bg-orange-900/50 text-orange-400 rounded-full">Комиссия</span>
                      : <span className="text-xs px-2 py-0.5 bg-red-900/50 text-red-400 rounded-full">Пересдача</span>}
                  </td>
                  <td className="py-3 whitespace-nowrap">
                    <button onClick={() => startEditRetake(s)} className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-cyan-400 rounded-lg mr-2">Изменить</button>
                    <button onClick={() => deleteRetake(s.id)} className="px-3 py-1 text-xs bg-red-900/50 hover:bg-red-800/70 text-red-400 rounded-lg">Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {retakesList.length === 0 && <div className="text-center text-gray-500 py-10">Нет пересдач</div>}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400 text-left">
                <th className="pb-3 pr-4">Преподаватель</th>
                <th className="pb-3 pr-4">Начало</th>
                <th className="pb-3 pr-4">Окончание</th>
                <th className="pb-3 pr-4">Корпус / ауд.</th>
                <th className="pb-3 pr-4">Комментарий</th>
                <th className="pb-3">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {dutiesList.map(d => (
                <tr key={d.id} className="text-gray-300 hover:bg-gray-700/30 transition-colors">
                  <td className="py-3 pr-4 text-white">{d.teacher_full_name ?? getName(d.teacher_id)}</td>
                  <td className="py-3 pr-4 text-gray-400 text-xs">
                    {new Date(d.start_datetime).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 pr-4 text-gray-400 text-xs">
                    {new Date(d.end_datetime).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 pr-4">{[d.building, d.auditorium].filter(Boolean).join(' / ') || '—'}</td>
                  <td className="py-3 pr-4 text-gray-400 text-xs">{d.comment || '—'}</td>
                  <td className="py-3 whitespace-nowrap">
                    <button onClick={() => startEditDuty(d)} className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-cyan-400 rounded-lg mr-2">Изменить</button>
                    <button onClick={() => deleteDuty(d.id)} className="px-3 py-1 text-xs bg-red-900/50 hover:bg-red-800/70 text-red-400 rounded-lg">Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {dutiesList.length === 0 && <div className="text-center text-gray-500 py-10">Нет дежурств</div>}
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

      {/* KPK report */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Отчет КПК</h2>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <p className="text-sm text-gray-400 mb-4">TXT-файл из API бекенда.</p>
          <button onClick={handleDownloadKpk} disabled={downloadingKpk}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
            {downloadingKpk ? 'Загрузка...' : 'Скачать отчет КПК ↓'}
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

  const [editingTeacher, setEditingTeacher] = useState<Teacher | null | undefined>(undefined);
  const [kpkTeacher, setKpkTeacher] = useState<Teacher | null>(null);
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

  // Load data when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    loadTeachers();
  }, [isAuthenticated, loadTeachers]);

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
          <Link href="/new-track" className="block px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
            🗺 Редактор треков
          </Link>
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
              onKpk={t => setKpkTeacher(t)}
            />
          )}
          {section === 'schedules' && (
            <SchedulesSection teachers={teachersList} />
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

      {kpkTeacher && (
        <KpkModal teacher={kpkTeacher} onClose={() => setKpkTeacher(null)} />
      )}
    </div>
  );
}
