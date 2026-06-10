import * as React from "react";
import { GetServerSideProps } from "next";
import { Track } from "../Components/SVGTrack/Track";
import type { Topic, Discipline } from "../Components/SVGTrack/Track";
import type { CurriculumEntry } from "../types";
import { studyPlans } from "../lib/api";

const STUDY_PLAN_ID = Number(process.env.NEXT_PUBLIC_STUDY_PLAN_ID_1 ?? 1);

function entryToDiscipline(e: CurriculumEntry): Discipline {
  return {
    title: e.name,
    exam: e.exam_semesters.map(s => `${s} сем.`).join(', '),
    test: e.credit_semesters.map(s => `${s} сем.`).join(', '),
    creditUnit: String(e.credit_units),
    lecture: String(e.lecture_hours),
    practice: String(e.practice_hours),
    course: e.semesters.map(String),
  };
}

interface Props {
  topics: Topic;
}

const TrackPage = ({ topics }: Props) => {
  return (
    <div className="relative w-full h-full bg-white">
      <Track topics={topics} variant="1" />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fallback = require('../public/topic.json');
    return { props: { topics: fallback.topics } };
  }
};

export default TrackPage;
