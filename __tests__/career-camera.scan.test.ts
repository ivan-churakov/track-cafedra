import { getEdgeOpacity, getEdgePixels } from "../lib/career-camera/scan";

const makeSplitImage = (width: number, height: number) => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const value = x < width / 2 ? 0 : 255;
      const index = (y * width + x) * 4;
      data.set([value, value, value, 255], index);
    }
  }
  return data;
};

describe("career camera scan", () => {
  test("does not mark a uniform image as a contour", () => {
    expect(getEdgePixels(new Uint8ClampedArray(8 * 8 * 4), 8, 8)).toEqual([]);
  });

  test("finds a real intensity boundary", () => {
    const edges = getEdgePixels(makeSplitImage(9, 9), 9, 9);

    expect(edges.length).toBeGreaterThan(0);
    expect(edges[0].strength).toBeGreaterThan(0);
    expect(edges[0].strength).toBeLessThanOrEqual(1);
    expect(Math.hypot(edges[0].tangentX, edges[0].tangentY)).toBeCloseTo(1);
  });

  test("detects soft contours in low-contrast regions", () => {
    const width = 9;
    const height = 9;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const value = x < width / 2 ? 0 : 16;
        data.set([value, value, value, 255], (y * width + x) * 4);
      }
    }

    expect(getEdgePixels(data, width, height).length).toBeGreaterThan(0);
  });

  test("limits contour detection to the selected area", () => {
    const data = makeSplitImage(9, 9);
    const area = { x: 0, y: 0, width: 2, height: 9 };

    expect(getEdgePixels(data, 9, 9, area)).toEqual([]);
  });

  test("keeps detected points inside the selected area", () => {
    const area = { x: 3, y: 2, width: 3, height: 4 };
    const edges = getEdgePixels(makeSplitImage(9, 9), 9, 9, area);

    expect(edges.length).toBeGreaterThan(0);
    expect(
      edges.every(
        (point) =>
          point.x >= area.x &&
          point.x < area.x + area.width &&
          point.y >= area.y &&
          point.y < area.y + area.height,
      ),
    ).toBe(true);
  });

  test("limits capture contours to the active scanner band", () => {
    expect(getEdgeOpacity(20, 50, "capture")).toBe(0);
    expect(getEdgeOpacity(49, 50, "capture")).toBeGreaterThan(0.9);
    expect(getEdgeOpacity(70, 50, "capture")).toBe(0);
    expect(getEdgeOpacity(50, 50, "live")).toBe(1);
    expect(getEdgeOpacity(90, 50, "live")).toBe(0);
  });
});
