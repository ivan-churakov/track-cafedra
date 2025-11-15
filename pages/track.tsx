import * as React from "react";
import { Track } from "../Components/SVGTrack/Track";
import topics from "../public/topic.json";

const TrackPage = () => {

  return (
    <div className="relative w-full h-full bg-white">
      <Track topics={topics.topics} variant="1" />
    </div>
  );
};

export default TrackPage;
