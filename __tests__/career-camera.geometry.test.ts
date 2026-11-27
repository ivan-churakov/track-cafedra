import {
  clientToFrame,
  finalizeFocusRectAfterDrag,
  focusRectToPercent,
  getDefaultAnalysisRect,
  rectFromDragCorners,
} from "../lib/career-camera/geometry";

describe("career camera geometry", () => {
  test("uses the whole frame by default", () => {
    expect(getDefaultAnalysisRect(640, 480)).toEqual({ x: 0, y: 0, width: 640, height: 480 });
  });

  test("maps a point from the mirrored video into frame coordinates", () => {
    expect(
      clientToFrame(164, 98, { left: 100, top: 50, width: 640, height: 480 }, 640, 480),
    ).toEqual({ x: 576, y: 48 });
  });

  test("clamps pointer coordinates outside the viewport", () => {
    expect(
      clientToFrame(50, 600, { left: 100, top: 50, width: 640, height: 480 }, 640, 480),
    ).toEqual({ x: 640, y: 480 });
  });

  test("builds a rectangle regardless of drag direction", () => {
    expect(
      rectFromDragCorners({ x: 500, y: 100 }, { x: 450, y: 160 }, 640, 480),
    ).toEqual({ x: 450, y: 100, width: 50, height: 60 });
  });

  test("turns a tiny drag into a usable centered focus area", () => {
    const rect = finalizeFocusRectAfterDrag(
      { x: 100, y: 100, width: 1, height: 1 },
      { x: 100, y: 100 },
      { x: 101, y: 101 },
      640,
      480,
    );

    expect(rect.width).toBe(201.6);
    expect(rect.height).toBe(201.6);
    expect(rect.x).toBeCloseTo(0);
    expect(rect.y).toBeCloseTo(0);
  });

  test("converts frame coordinates into mirrored overlay percentages", () => {
    expect(
      focusRectToPercent({ x: 384, y: 96, width: 128, height: 192 }, 640, 480),
    ).toEqual({ left: 20, top: 20, width: 20, height: 40 });
  });
});
