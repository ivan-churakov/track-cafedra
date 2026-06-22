import * as React from "react";
import { GetStaticProps } from "next";
import { Track } from "../Components/SVGTrack/Track";
import type { Topic } from "../Components/SVGTrack/Track";
import { studyPlans } from "../lib/api";
import { entryToDiscipline } from "../lib/curriculum";

const STUDY_PLAN_ID = Number(process.env.NEXT_PUBLIC_STUDY_PLAN_ID_2 ?? 2);

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
