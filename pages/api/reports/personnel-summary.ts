import type { NextApiRequest, NextApiResponse } from 'next';
import { getMockTeachers, getMockKpk } from '../../../lib/mock-data';
import type { PersonnelSummary } from '../../../types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const teachers = getMockTeachers();
  const now = new Date().toISOString();

  const teacherRows = teachers.map(t => {
    const kpk = getMockKpk(t.id);
    const lastKpk = kpk.sort((a, b) => b.issue_date.localeCompare(a.issue_date))[0];
    const startYear = t.mirea_teaching_since ? new Date(t.mirea_teaching_since).getFullYear() : 2000;
    const experience = new Date().getFullYear() - startYear + (t.teaching_years_before_mirea ?? 0);
    const nextDue = lastKpk ? new Date(new Date(lastKpk.issue_date).getTime() + 5 * 365.25 * 24 * 3600 * 1000) : null;
    const daysUntil = nextDue ? Math.round((nextDue.getTime() - Date.now()) / 86400000) : null;

    return {
      teacher_id: t.id,
      teacher_full_name: t.full_name,
      position: t.position,
      academic_degree: t.academic_degrees?.[0] ?? '',
      academic_title: t.academic_titles?.[0] ?? '',
      experience_years: Math.max(0, experience),
      last_pd_date: lastKpk?.issue_date ?? null,
      next_pd_due: nextDue ? nextDue.toISOString().slice(0, 10) : null,
      days_until_next_pd: daysUntil,
      kpk_status: daysUntil === null ? 'нет данных' : daysUntil < 0 ? 'просрочено' : daysUntil < 180 ? 'скоро' : 'актуально',
    };
  });

  const withDegree = teacherRows.filter(t => t.academic_degree).length;
  const avgExp = teacherRows.length ? teacherRows.reduce((s, t) => s + t.experience_years, 0) / teacherRows.length : 0;
  const activeKpk = teacherRows.filter(t => t.kpk_status === 'актуально' || t.kpk_status === 'скоро').length;

  const summary: PersonnelSummary = {
    department: 'Кафедра',
    generated_at: now,
    period_from: new Date().getFullYear() + '-01-01',
    period_to: new Date().getFullYear() + '-12-31',
    summary: {
      total_teachers: teacherRows.length,
      with_degree_count: withDegree,
      with_degree_percent: teacherRows.length ? Math.round(withDegree / teacherRows.length * 100) : 0,
      avg_experience_years: Math.round(avgExp * 10) / 10,
      active_kpk_count: activeKpk,
    },
    teachers: teacherRows,
  };

  return res.status(200).json(summary);
}
