import React from "react";
import { render } from "@testing-library/react";
import { Track } from "../Components/SVGTrack/Track";

describe("Track component", () => {
  test("renders without crashing", () => {
    const emptyTopics = { red: [], green: [], blue: [], orange: [] };
    render(<Track topics={emptyTopics} variant="1" />);
  });
});
