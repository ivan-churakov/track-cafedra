import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { formatCourse, getRecommendedTopics, parseHours } from "../../lib/career-camera/topics";
import type { AnalysisResult, Profession, ProfessionMatch, Topic } from "../../lib/career-camera/types";

const salaryFormatter = new Intl.NumberFormat("ru-RU");

const formatSalary = (profession: Profession) => {
  const { salary } = profession;
  if (salary.note) return salary.note;
  return `${salaryFormatter.format(salary.min)}–${salaryFormatter.format(salary.max)} ${salary.currency}/мес`;
};

const TopicCard = ({ topic }: { topic: Topic }) => {
  const lectureHours = parseHours(topic.lecture);
  const practiceHours = parseHours(topic.practice);
  const totalHours = lectureHours + practiceHours;
  const lecturePercent = totalHours ? lectureHours / totalHours * 100 : 0;
  const practicePercent = totalHours ? practiceHours / totalHours * 100 : 0;
  const meta = [topic.creditUnit, formatCourse(topic.course)].filter(Boolean).join(" · ");

  return (
    <article className="flex flex-col rounded-xl border border-white/15 bg-white/[0.07] p-5">
      <h4 className="text-base font-medium leading-snug text-white">{topic.title}</h4>
      {meta && <p className="mt-2 text-sm text-slate-300">{meta}</p>}
      {totalHours > 0 && (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-300">
            <span>Лекции {lectureHours} ч</span>
            <span>Практика {practiceHours} ч</span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-white/10" aria-label={`Всего ${totalHours} часов`}>
            <span className="bg-teal-300" style={{ width: `${lecturePercent}%` }} />
            <span className="bg-amber-300" style={{ width: `${practicePercent}%` }} />
          </div>
        </div>
      )}
      {(topic.test || topic.exam) && (
        <dl className="mt-5 space-y-1.5 border-t border-white/10 pt-4 text-sm">
          {topic.test && (
            <div className="flex justify-between gap-4">
              <dt className="text-teal-200">Зачёт</dt>
              <dd className="text-right text-slate-200">{topic.test}</dd>
            </div>
          )}
          {topic.exam && (
            <div className="flex justify-between gap-4">
              <dt className="text-teal-200">Экзамен</dt>
              <dd className="text-right text-slate-200">{topic.exam}</dd>
            </div>
          )}
        </dl>
      )}
    </article>
  );
};

export const CareerResults = ({ result }: { result: AnalysisResult }) => {
  const [selectedName, setSelectedName] = useState(result.main.name);
  useEffect(() => setSelectedName(result.main.name), [result]);

  const matches = useMemo<ProfessionMatch[]>(() => [
    { profession: result.main, match: result.match },
    ...result.others,
  ], [result]);
  const selected = matches.find((item) => item.profession.name === selectedName) ?? matches[0];
  const recommendation = useMemo(
    () => getRecommendedTopics(selected.profession),
    [selected.profession],
  );

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.45)] sm:p-8" aria-labelledby="camera-result-title">
      <h2 id="camera-result-title" className="text-2xl font-medium tracking-tight text-slate-900">Результат</h2>
      <div className="mt-5 grid gap-6 border-l-4 border-teal-500 bg-slate-50 p-5 sm:p-7 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <div className="mb-4 text-5xl" aria-hidden="true">{selected.profession.icon}</div>
          <h3 className="text-2xl font-medium tracking-tight text-slate-900 sm:text-3xl">{selected.profession.name}</h3>
          <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">{selected.profession.description}</p>
          <p className="mt-4 text-sm text-slate-600">
            <span className="font-medium text-slate-800">Зарплата: </span>
            {formatSalary(selected.profession)}
          </p>
        </div>
        <div className="flex items-baseline gap-2 md:flex-col md:items-end md:gap-0">
          <span className="text-4xl font-medium tracking-tight text-teal-700">{selected.match}%</span>
          <span className="text-sm text-slate-500">совпадение</span>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-medium text-slate-900">Необходимые навыки</h3>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {selected.profession.skills.map((skill) => (
            <li key={skill} className="flex items-start gap-2 text-sm leading-relaxed text-slate-600">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" aria-hidden="true" />
              {skill}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-slate-900">Подходящие профессии</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {matches.map((item) => {
            const isSelected = item.profession.name === selected.profession.name;
            return (
              <button
                key={item.profession.name}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedName(item.profession.name)}
                className={`rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${isSelected ? "border-slate-800 bg-slate-800 text-white" : "border-slate-200 bg-white text-slate-800 hover:border-teal-400"}`}
              >
                <span className="block text-2xl" aria-hidden="true">{item.profession.icon}</span>
                <span className="mt-2 block text-sm font-medium leading-snug">{item.profession.name}</span>
                <span className={`mt-1 block text-sm ${isSelected ? "text-teal-200" : "text-teal-700"}`}>{item.match}%</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-slate-900 p-5 sm:p-7">
        <p className="text-sm text-teal-200">{recommendation.profile.profile} · {recommendation.profile.profileShort}</p>
        <h3 className="mt-2 text-2xl font-medium tracking-tight text-white">Рекомендации кафедры КБ9</h3>
        {recommendation.topics.length ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {recommendation.topics.map((topic) => <TopicCard key={topic.title} topic={topic} />)}
          </div>
        ) : (
          <p className="mt-4 text-slate-300">Подойдут все дисциплины выбранного профиля.</p>
        )}
        <div className="mt-7 border-t border-white/15 pt-6">
          <h3 className="text-lg font-medium text-white">Почему кафедра КБ9</h3>
          <ul className="mt-4 grid gap-3 text-sm leading-relaxed text-slate-300 md:grid-cols-2">
            <li>Современные программы в области информационных систем</li>
            <li>Практические занятия на реальных проектах</li>
            <li>Опытные преподаватели и актуальные технологии</li>
            <li>Дисциплины от программирования до бизнес-анализа</li>
            <li>Перспективы трудоустройства в IT</li>
          </ul>
        </div>
      </div>
    </section>
  );
};
