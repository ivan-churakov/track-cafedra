import type { Discipline } from '../Components/SVGTrack/Track';

/**
 * Форма позиции учебного плана из эндпоинта GET /api/study-plans/{id}/tracks.
 * Название дисциплины приходит в поле `title` (StudyPlanTrackService.toTopic),
 * а не `name`, как в /api/curriculum-entries.
 */
export type TrackTopicEntry = {
  title?: string;
  semesters?: number[];
  exam_semesters?: number[];
  credit_semesters?: number[];
  credit_units?: number;
  lecture_hours?: number;
  practice_hours?: number;
};

/** Русское склонение слова по числу: формы для 1, 2–4 и 0/5–20. */
function plural(n: number, one: string, few: string, many: string): string {
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

/** «5 з.е.» — зачётные единицы; пусто, если значение не задано. */
function formatCreditUnits(units?: number): string {
  return units == null ? '' : `${units} з.е.`;
}

/** «16 часов (8 пар)» — академические часы и пары (1 пара = 2 часа). */
function formatHours(hours?: number): string {
  if (hours == null || hours === 0) return '';
  const pairs = Math.round(hours / 2);
  return `${hours} ${plural(hours, 'час', 'часа', 'часов')} (${pairs} ${plural(pairs, 'пара', 'пары', 'пар')})`;
}

/** Преобразует позицию учебного плана из ответа /tracks в модель станции трека. */
export function entryToDiscipline(e: TrackTopicEntry): Discipline {
  return {
    title: e.title ?? '',
    exam: (e.exam_semesters ?? []).map(s => `${s} сем.`).join(', '),
    test: (e.credit_semesters ?? []).map(s => `${s} сем.`).join(', '),
    creditUnit: formatCreditUnits(e.credit_units),
    lecture: formatHours(e.lecture_hours),
    practice: formatHours(e.practice_hours),
    // Курс = ⌈семестр / 2⌉: семестры 1–2 → 1 курс, 3–4 → 2 курс, 5–6 → 3, 7–8 → 4.
    course: Array.from(new Set((e.semesters ?? []).map(sem => String(Math.ceil(sem / 2))))),
  };
}
