import * as React from "react";
import { GetStaticProps } from "next";
import { Track } from "../Components/SVGTrack/Track";
import type { Topic, Discipline } from "../Components/SVGTrack/Track";
import { studyPlans } from "../lib/api";

const STUDY_PLAN_ID = Number(process.env.NEXT_PUBLIC_STUDY_PLAN_ID_2 ?? 2);

/**
 * Форма позиции учебного плана из эндпоинта GET /api/study-plans/{id}/tracks.
 * Название дисциплины приходит в поле `title` (StudyPlanTrackService.toTopic),
 * а не `name`, как в /api/curriculum-entries.
 */
type TrackTopicEntry = {
  title?: string;
  semesters?: number[];
  exam_semesters?: number[];
  credit_semesters?: number[];
  credit_units?: number;
  lecture_hours?: number;
  practice_hours?: number;
};

function entryToDiscipline(e: TrackTopicEntry): Discipline {
  return {
    title: e.title ?? '',
    exam: (e.exam_semesters ?? []).map(s => `${s} сем.`).join(', '),
    test: (e.credit_semesters ?? []).map(s => `${s} сем.`).join(', '),
    creditUnit: String(e.credit_units ?? ''),
    lecture: String(e.lecture_hours ?? ''),
    practice: String(e.practice_hours ?? ''),
    course: (e.semesters ?? []).map(String),
  };
}

interface Props {
  topics: Topic;
}

const Track2Page = ({ topics }: Props) => {
  return (
    <div className="relative w-full h-full bg-white">
      <Track topics={topics} variant="2" />
    </div>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  try {
    const data = await studyPlans.tracks(STUDY_PLAN_ID);

    const topics: Topic = {
      red: (data.topics['red'] ?? []).map(entryToDiscipline),
      green: (data.topics['green'] ?? []).map(entryToDiscipline),
      blue: (data.topics['blue'] ?? []).map(entryToDiscipline),
      orange: (data.topics['orange'] ?? []).map(entryToDiscipline),
    };

    return { props: { topics } };
  } catch {
    // Fallback to static JSON while backend is unavailable
    const fallback = require('../public/topic2.json');
    return { props: { topics: fallback.topics } };
  }
};

export default Track2Page;
