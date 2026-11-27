import {
  analyzeImageData,
  calculateImageMetrics,
  determineProfession,
  normalizeAnalysisRect,
} from "../lib/career-camera/analysis";
import type { Profession } from "../lib/career-camera/types";

const makeProfession = (name: string): Profession => ({
  name,
  icon: "",
  description: "",
  skills: [],
  traits: [],
  salary: { min: 0, max: 0, currency: "₽" },
});

describe("career camera analysis", () => {
  test("calculates zero metrics for an empty frame", () => {
    expect(calculateImageMetrics(new Uint8ClampedArray())).toEqual({
      brightness: 0,
      colorVariance: 0,
      contrast: 0,
    });
  });

  test("calculates brightness, color variance and contrast from sampled pixels", () => {
    const data = new Uint8ClampedArray(8 * 4);
    data.set([255, 0, 0, 255], 0);
    data.set([255, 255, 255, 255], 4 * 4);

    expect(calculateImageMetrics(data)).toEqual({
      brightness: 170,
      colorVariance: 255,
      contrast: 170,
    });
  });

  test("keeps the existing rule-based profession scoring", () => {
    const result = determineProfession(
      { brightness: 130, colorVariance: 50, contrast: 60 },
      [makeProfession("Врач"), makeProfession("Дизайнер")],
    );

    expect(result.main.name).toBe("Дизайнер");
    expect(result.match).toBe(75);
    expect(result.others).toEqual([
      { profession: expect.objectContaining({ name: "Врач" }), match: 70 },
    ]);
  });

  test("caps the main recommendation index at 95 percent", () => {
    const result = determineProfession(
      { brightness: 130, colorVariance: 50, contrast: 60 },
      [makeProfession("Специалист по ИИ/ML")],
    );

    expect(result.match).toBe(95);
  });

  test("returns image metrics together with the recommendation", () => {
    const data = new Uint8ClampedArray(4 * 4);
    data.set([100, 100, 100, 255], 0);

    const result = analyzeImageData(data, [makeProfession("Писатель")]);

    expect(result.metrics).toEqual({ brightness: 100, colorVariance: 0, contrast: 0 });
  });

  test("normalizes the selected area and rejects a tiny area", () => {
    expect(
      normalizeAnalysisRect({ x: -10, y: 5, width: 20, height: 20 }, 100, 80),
    ).toEqual({ x: 0, y: 5, width: 20, height: 20 });
    expect(
      normalizeAnalysisRect({ x: 10, y: 10, width: 2, height: 2 }, 100, 80),
    ).toEqual({ x: 0, y: 0, width: 100, height: 80 });
  });
});
