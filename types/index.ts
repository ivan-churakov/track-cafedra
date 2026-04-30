export interface Teacher {
  id: number;
  full_name: string;
  position: string;
  academic_title: string | null;
  academic_degree: string | null;
  email: string;
  teaching_experience: number; // год начала преподавательской деятельности
  photo_url: string;
  tg_username: string;
  schedule_url: string;
  educations?: string[];
}

export interface RetakeSchedule {
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

export interface DutySchedule {
  id: number;
  teacher_id: number;
  start_datetime: string;
  end_datetime: string;
  auditorium: string;
  comment: string;
}

export type CalendarEventType = 'class' | 'retake' | 'commission' | 'duty';

export interface KpkCourse {
  id: number;
  teacherId: number;
  title: string;
  hours: number;
  format: 'offline' | 'online' | 'mixed';
  startDate: string | null;
  room: string;
  description: string;
  status: 'draft' | 'published';
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
