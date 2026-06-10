import type {
  AuthResponse,
  AuthMe,
  Teacher,
  TeacherCreatePayload,
  ScheduleEvent,
  RetakeSchedule,
  RetakeCreatePayload,
  DutySchedule,
  DutyCreatePayload,
  ProfessionalDevelopment,
  ProfDevCreatePayload,
  StudyPlan,
  Track,
  CurriculumEntry,
  StudyPlanTracks,
  PersonnelSummary,
  KpkSummary,
  Subject,
  Course,
  Direction,
  Position,
  AcademicTitle,
  AcademicDegree,
  EducationLevel,
  DocumentType,
  Building,
} from '../types';

// ── Config ────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

const TOKEN_KEY = 'auth_token';

// ── Token helpers ─────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body?.message ?? res.statusText, body);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return apiFetch<T>(path, { ...init, headers });
}

async function publicFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  return apiFetch<T>(path, { ...init, headers });
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
  }
}

function qs(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

// ── 1. Auth ───────────────────────────────────────────────────────────────────

export const auth = {
  login(login: string, password: string): Promise<AuthResponse> {
    return publicFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password }),
    });
  },

  register(email: string, password: string): Promise<{ message: string; email: string }> {
    return publicFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  me(): Promise<AuthMe> {
    return authFetch('/api/auth/me');
  },
};

// ── 2. Teachers ───────────────────────────────────────────────────────────────

export const teachers = {
  list(): Promise<{ teachers: Teacher[] }> {
    return publicFetch('/api/teachers');
  },

  get(id: number): Promise<Teacher> {
    return publicFetch(`/api/teachers/${id}`);
  },

  create(payload: TeacherCreatePayload): Promise<Teacher> {
    return authFetch('/api/teachers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update(id: number, payload: TeacherCreatePayload): Promise<Teacher> {
    return authFetch(`/api/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  delete(id: number): Promise<void> {
    return authFetch(`/api/teachers/${id}`, { method: 'DELETE' });
  },

  uploadPhoto(id: number, file: File): Promise<Teacher> {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch(`/api/teachers/${id}/photo`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
  },

  deletePhoto(id: number): Promise<Teacher> {
    return authFetch(`/api/teachers/${id}/photo`, { method: 'DELETE' });
  },

  photoUrl(id: number): string {
    return `${BASE_URL}/api/teachers/${id}/photo`;
  },
};

// ── 3. Schedule ───────────────────────────────────────────────────────────────

export const schedule = {
  get(
    teacherId: number,
    params?: { from?: string; to?: string },
  ): Promise<{ events: ScheduleEvent[] }> {
    return publicFetch(`/api/teachers/${teacherId}/schedule${qs(params ?? {})}`);
  },
};

// ── 4. Retake schedules ───────────────────────────────────────────────────────

export const retakes = {
  list(teacherId?: number): Promise<{ retake_schedules: RetakeSchedule[] }> {
    return publicFetch(`/api/retake-schedules${qs({ teacherId })}`);
  },

  create(payload: RetakeCreatePayload): Promise<RetakeSchedule> {
    return authFetch('/api/retake-schedules', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update(id: number, payload: RetakeCreatePayload): Promise<RetakeSchedule> {
    return authFetch(`/api/retake-schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  delete(id: number): Promise<void> {
    return authFetch(`/api/retake-schedules/${id}`, { method: 'DELETE' });
  },
};

// ── 5. Duty schedules ─────────────────────────────────────────────────────────

export const duties = {
  list(teacherId?: number): Promise<{ duty_schedules: DutySchedule[] }> {
    return publicFetch(`/api/duty-schedules${qs({ teacherId })}`);
  },

  create(payload: DutyCreatePayload): Promise<DutySchedule> {
    return authFetch('/api/duty-schedules', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update(id: number, payload: DutyCreatePayload): Promise<DutySchedule> {
    return authFetch(`/api/duty-schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  delete(id: number): Promise<void> {
    return authFetch(`/api/duty-schedules/${id}`, { method: 'DELETE' });
  },
};

// ── 6. Professional development (КПК) ────────────────────────────────────────

export const profDev = {
  list(params?: {
    teacherId?: number;
    from?: string;
    to?: string;
  }): Promise<{ professional_developments: ProfessionalDevelopment[] }> {
    return authFetch(`/api/professional-developments${qs(params ?? {})}`);
  },

  get(id: number): Promise<ProfessionalDevelopment> {
    return authFetch(`/api/professional-developments/${id}`);
  },

  create(payload: ProfDevCreatePayload): Promise<ProfessionalDevelopment> {
    return authFetch('/api/professional-developments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update(id: number, payload: ProfDevCreatePayload): Promise<ProfessionalDevelopment> {
    return authFetch(`/api/professional-developments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  delete(id: number): Promise<void> {
    return authFetch(`/api/professional-developments/${id}`, { method: 'DELETE' });
  },

  uploadScan(id: number, file: File): Promise<ProfessionalDevelopment> {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch(`/api/professional-developments/${id}/scan`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
  },

  deleteScan(id: number): Promise<ProfessionalDevelopment> {
    return authFetch(`/api/professional-developments/${id}/scan`, { method: 'DELETE' });
  },

  archiveUrl(teacherId: number): string {
    const token = getToken();
    return `${BASE_URL}/api/professional-developments/archive?teacherId=${teacherId}${token ? `&token=${token}` : ''}`;
  },

  scanUrl(id: number): string {
    return `${BASE_URL}/api/professional-developments/${id}/scan`;
  },
};

// ── 7. Study plans / tracks / curriculum ─────────────────────────────────────

export const studyPlans = {
  list(): Promise<{ study_plans: StudyPlan[] }> {
    return publicFetch('/api/study-plans');
  },

  get(id: number): Promise<StudyPlan> {
    return publicFetch(`/api/study-plans/${id}`);
  },

  tracks(planId: number): Promise<StudyPlanTracks> {
    return publicFetch(`/api/study-plans/${planId}/tracks`);
  },

  create(payload: Omit<StudyPlan, 'id'>): Promise<StudyPlan> {
    return authFetch('/api/study-plans', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update(id: number, payload: Omit<StudyPlan, 'id'>): Promise<StudyPlan> {
    return authFetch(`/api/study-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  delete(id: number): Promise<void> {
    return authFetch(`/api/study-plans/${id}`, { method: 'DELETE' });
  },
};

export const trackApi = {
  list(study_plan_id?: number): Promise<{ tracks: Track[] }> {
    return publicFetch(`/api/tracks${qs({ study_plan_id })}`);
  },

  get(id: number): Promise<Track> {
    return publicFetch(`/api/tracks/${id}`);
  },

  create(payload: Omit<Track, 'id'>): Promise<Track> {
    return authFetch('/api/tracks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update(id: number, payload: Omit<Track, 'id'>): Promise<Track> {
    return authFetch(`/api/tracks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  delete(id: number): Promise<void> {
    return authFetch(`/api/tracks/${id}`, { method: 'DELETE' });
  },
};

export const curriculumEntries = {
  list(studyPlanId?: number): Promise<{ curriculum_entries: CurriculumEntry[] }> {
    return publicFetch(`/api/curriculum-entries${qs({ studyPlanId })}`);
  },

  get(id: number): Promise<CurriculumEntry> {
    return publicFetch(`/api/curriculum-entries/${id}`);
  },

  create(payload: Omit<CurriculumEntry, 'id'>): Promise<CurriculumEntry> {
    return authFetch('/api/curriculum-entries', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update(id: number, payload: Omit<CurriculumEntry, 'id'>): Promise<CurriculumEntry> {
    return authFetch(`/api/curriculum-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  delete(id: number): Promise<void> {
    return authFetch(`/api/curriculum-entries/${id}`, { method: 'DELETE' });
  },
};

// ── 8. Reports ────────────────────────────────────────────────────────────────

export const reports = {
  personnelSummary(params?: { from?: string; to?: string }): Promise<PersonnelSummary> {
    return authFetch(`/api/reports/personnel-summary${qs(params ?? {})}`);
  },

  kpkSummary(params?: {
    teacherId?: number;
    from?: string;
    to?: string;
  }): Promise<KpkSummary> {
    return authFetch(`/api/reports/kpk-summary${qs(params ?? {})}`);
  },

  retakesExcelUrl(semester: 'current' | 'previous' = 'current'): string {
    const token = getToken();
    return `${BASE_URL}/api/reports/retakes.xlsx?semester=${semester}${token ? `&token=${token}` : ''}`;
  },
};

// ── 9. Directories ────────────────────────────────────────────────────────────

export const directories = {
  subjects(): Promise<{ subjects: Subject[] }> {
    return publicFetch('/api/subjects');
  },

  courses(query?: string): Promise<{ courses: Course[] }> {
    return publicFetch(`/api/courses${qs({ query })}`);
  },

  directions(): Promise<{ directions: Direction[] }> {
    return publicFetch('/api/directions');
  },

  positions(): Promise<{ positions: Position[] }> {
    return publicFetch('/api/positions');
  },

  academicTitles(): Promise<{ academic_titles: AcademicTitle[] }> {
    return publicFetch('/api/academic-titles');
  },

  academicDegrees(): Promise<{ academic_degrees: AcademicDegree[] }> {
    return publicFetch('/api/academic-degrees');
  },

  educationLevels(): Promise<{ education_levels: EducationLevel[] }> {
    return publicFetch('/api/education-levels');
  },

  documentTypes(): Promise<{ document_types: DocumentType[] }> {
    return publicFetch('/api/document-types');
  },

  buildings(): Promise<{ buildings: Building[] }> {
    return publicFetch('/api/buildings');
  },
};
