import * as React from "react";
import { GetServerSideProps } from "next";
import { Track } from "../Components/SVGTrack/Track";
import type { Topic } from "../Components/SVGTrack/Track";
import { serverApiFetch } from "../lib/server-api";
import type { StudyPlanTracks } from "../types";
import { entryToDiscipline } from "../lib/curriculum";

const STUDY_PLAN_ID = Number(process.env.NEXT_PUBLIC_STUDY_PLAN_ID_1 ?? 1);

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

export const getServerSideProps: GetServerSideProps<Props> = async () => {
    const data = await serverApiFetch<StudyPlanTracks>(`/api/study-plans/${STUDY_PLAN_ID}/tracks`);

    const topics: Topic = {
      red: (data.topics['red'] ?? []).map(entryToDiscipline),
      green: (data.topics['green'] ?? []).map(entryToDiscipline),
      blue: (data.topics['blue'] ?? []).map(entryToDiscipline),
      orange: (data.topics['orange'] ?? []).map(entryToDiscipline),
    };

    return { props: { topics } };
};

export default TrackPage;
