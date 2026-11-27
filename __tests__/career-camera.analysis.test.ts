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

  test("uses continuous scores around the existing profession thresholds", () => {
    const result = determineProfession(
      { brightness: 130, colorVariance: 50, contrast: 60 },
      [makeProfession("Врач"), makeProfession("Дизайнер")],
    );

    expect(result.main.name).toBe("Дизайнер");
    expect(result.match).toBe(65);
    expect(result.others).toEqual([
      { profession: expect.objectContaining({ name: "Врач" }), match: 55 },
    ]);
  });

  test("keeps the recommendation deterministic", () => {
    const random = jest.spyOn(Math, "random").mockReturnValue(0.5);
    const professions = [makeProfession("Врач"), makeProfession("Дизайнер")];
    const metrics = { brightness: 130, colorVariance: 50, contrast: 60 };

    expect(determineProfession(metrics, professions)).toEqual(determineProfession(metrics, professions));
    expect(random).not.toHaveBeenCalled();
    random.mockRestore();
  });

  test("caps the main recommendation index at 95 percent", () => {
    const result = determineProfession(
      { brightness: 160, colorVariance: 150, contrast: 200 },
      [makeProfession("Специалист по ИИ/ML")],
    );

    expect(result.match).toBe(95);
  });

  test("ignores a small number of brightness outliers in contrast", () => {
    const data = new Uint8ClampedArray(100 * 16);
    for (let sample = 0; sample < 100; sample += 1) {
      const value = sample < 4 || sample >= 96 ? (sample < 4 ? 0 : 255) : 100;
      data.set([value, value, value, 255], sample * 16);
    }

    expect(calculateImageMetrics(data).contrast).toBe(0);
  });

  test("changes the score when the frame changes slightly", () => {
    const professions = [makeProfession("Дизайнер")];
    const initial = determineProfession(
      { brightness: 140, colorVariance: 72, contrast: 80 },
      professions,
    );
    const adjusted = determineProfession(
      { brightness: 145, colorVariance: 67, contrast: 75 },
      professions,
    );

    expect(adjusted.match).not.toBe(initial.match);
  });

  test("selects different professions for distinct visual profiles", () => {
    const subdued = determineProfession({ brightness: 85, colorVariance: 12, contrast: 28 });
    const vibrant = determineProfession({ brightness: 155, colorVariance: 85, contrast: 90 });

    expect(subdued.main.name).not.toBe(vibrant.main.name);
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
