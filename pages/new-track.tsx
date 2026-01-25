import * as React from "react";
import { Track } from "../Components/SVGTrack/NewTrack";
import topics from "../public/newTopic.json";
import { useLocalStorage } from "../Components/SVGTrack/useLocalStorage";

const TrackPage = () => {
  const [disciplines, setDisciplines] = useLocalStorage("disciplines", topics);

  return (
    <div className="relative w-full h-full bg-white">
      <Track topics={disciplines} setTopics={setDisciplines} variant="1" />
    </div>
  );
};

export default TrackPage;
