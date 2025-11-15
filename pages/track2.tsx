import * as React from "react";
import { Topic, Track } from "../Components/SVGTrack/Track";
import topics from "../public/topic2.json";

const Track2Page = () => {

  return (
    <div className="relative w-full h-full bg-white">
      <Track topics={topics.topics} variant="2" />
    </div>
  );
};

export default Track2Page;
