// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  access_token: string;
  token_type: 'Bearer';
  role: 'ADMIN' | 'TEACHER';
  teacher_id?: number;
  teacher_full_name?: string;
}

export interface AuthMe {
  username: string;
  role: 'ADMIN' | 'TEACHER';
  teacher_id?: number;
  teacher_full_name?: string;
}

// ── Teachers ──────────────────────────────────────────────────────────────────

export interface TeacherEducation {
  specialty: string;
  institution: string;
  graduation_year: number;
  level: string;
}

export interface Teacher {
  id: number;
  full_name: string;
  last_name: string;
  first_name: string;
  middle_name: string;
  position: string;
  academic_titles: string[];
  academic_degrees: string[];
  email: string;
  mirea_teaching_since: string; // YYYY-MM-DD
  teaching_years_before_mirea: number;
  photo_download_url: string | null;
  tg_username: string;
  schedule_url: string;
  educations: TeacherEducation[];
}

export interface TeacherCreatePayload {
  last_name: string;
  first_name: string;
  middle_name: string;
  position: string;
  academic_titles: string[];
  academic_degrees: string[];
  email: string;
  mirea_teaching_since: string;
  before_mirea_years: number;
  before_mirea_months: number;
  tg_username: string;
  schedule_url: string;
  educations: TeacherEducation[];
}

// ── Schedule ──────────────────────────────────────────────────────────────────

export type CalendarEventType = 'class' | 'retake' | 'commission' | 'duty';

export interface ScheduleEvent {
  id: string;
  title: string;
  start: string; // ISO with offset: 2026-02-10T10:40:00+03:00
  end: string;
  class_type_short: string;
  class_type_full: string;
  building: string;
  auditorium: string;
  groups: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: CalendarEventType;
  location?: string;
  description?: string;
}

// ── Retake schedules ──────────────────────────────────────────────────────────

export interface RetakeSchedule {
  id: number;
  teacher_id: number;
  teacher_full_name?: string;
  subject_name: string;
  datetime: string; // local without offset: 2026-02-15T14:00:00
  comment: string;
  building: string;
  auditorium: string;
  duration_minutes: number;
  is_commission: boolean;
}

export interface RetakeCreatePayload {
  teacher_id: number;
  subject_name: string;
  datetime: string;
  comment: string;
  building: string;
  auditorium: string;
  duration_minutes: number;
  is_commission: boolean;
}

// ── Duty schedules ────────────────────────────────────────────────────────────

export interface DutySchedule {
  id: number;
  teacher_id: number;
  teacher_full_name?: string;
  start_datetime: string;
  end_datetime: string;
  building: string;
  auditorium: string;
  comment: string;
}

export interface DutyCreatePayload {
  teacher_id: number;
  start_datetime: string;
  end_datetime: string;
  building: string;
  auditorium: string;
  comment: string;
}

// ── Professional development (КПК) ────────────────────────────────────────────

export interface ProfessionalDevelopment {
  id: number;
  teacher_id: number;
  teacher_full_name?: string;
  course_name: string;
  hours: number;
  document_name: string;
  document_number: string;
  issued_by: string;
  issue_date: string; // YYYY-MM-DD
  scan_download_url: string | null;
}

export interface ProfDevCreatePayload {
  teacher_id: number;
  course_name: string;
  hours: number;
  document_name: string;
  document_number: string;
  issued_by: string;
  issue_date: string;
}

// ── Study plans / tracks / curriculum ─────────────────────────────────────────

export interface StudyPlan {
  id: number;
  profile_abbreviation: string;
  profile_name: string;
  direction_code: string;
  direction_name: string;
}

export interface Track {
  id: number;
  study_plan_id: number;
  name: string;
  color: string;
}

export interface CurriculumEntry {
  id: number;
  name: string;
  study_plan_id: number;
  track_color: string;
  track_position: number;
  semesters: number[];
  exam_semesters: number[];
  credit_semesters: number[];
  credit_units: number;
  lecture_hours: number;
  practice_hours: number;
}

export interface StudyPlanTracks {
  topics: Record<string, CurriculumEntry[]>;
}

// ── Reports ───────────────────────────────────────────────────────────────────

export interface PersonnelSummaryTeacher {
  teacher_id: number;
  teacher_full_name: string;
  position: string;
  academic_degree: string;
  academic_title: string;
  experience_years: number;
  last_pd_date: string | null;
  next_pd_due: string | null;
  days_until_next_pd: number | null;
  kpk_status: string;
}

export interface PersonnelSummary {
  department: string;
  generated_at: string;
  period_from: string;
  period_to: string;
  summary: {
    total_teachers: number;
    with_degree_count: number;
    with_degree_percent: number;
    avg_experience_years: number;
    active_kpk_count: number;
  };
  teachers: PersonnelSummaryTeacher[];
}

export interface KpkSummary {
  generated_at: string;
  period_from: string;
  period_to: string;
  summary: {
    total_records: number;
    total_hours: number;
  };
  items: ProfessionalDevelopment[];
}

// ── Directories ───────────────────────────────────────────────────────────────

export interface Subject {
  id: number;
  name: string;
}

export interface Course {
  id: number;
  name: string;
  hours: number;
}

export interface Direction {
  id: number;
  code: string;
  name: string;
}

export interface Position {
  id: number;
  name: string;
}

export interface AcademicTitle {
  short_name: string;
  full_name: string;
}

export interface AcademicDegree {
  short_name: string;
  full_name: string;
}

export interface EducationLevel {
  id: number;
  name: string;
}

export interface DocumentType {
  id: number;
  name: string;
}

export interface Building {
  id: number;
  code: string;
  address: string;
}
