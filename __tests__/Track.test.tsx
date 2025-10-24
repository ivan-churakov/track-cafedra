import React from "react";
import { render } from "@testing-library/react";
import { Track } from "../Components/SVGTrack/Track";

describe("Track component", () => {
  test("renders without crashing", () => {
    render(<Track />);
  });
});
