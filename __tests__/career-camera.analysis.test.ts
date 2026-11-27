import {
  analyzeImageData,
  calculateImageMetrics,
  determineProfession,
  normalizeAnalysisRect,
} from "../lib/career-camera/analysis";
import type { ImageMetrics, Profession } from "../lib/career-camera/types";
import { professions } from "../lib/career-camera/data";
import { COLOR_PROFESSION_GROUPS } from "../lib/career-camera/color-profiles";

const makeProfession = (name: string): Profession => ({
  name,
  icon: "",
  description: "",
  skills: [],
  traits: [],
  salary: { min: 0, max: 0, currency: "₽" },
});

const withColor = (dominantColor: ImageMetrics["dominantColor"], metrics: ImageMetrics) => ({
  ...metrics,
  dominantColor,
  colorShare: 0.8,
});

const solidColor = (red: number, green: number, blue: number) => {
  const data = new Uint8ClampedArray(16);
  data.set([red, green, blue, 255], 0);
  return data;
};

describe("career camera analysis", () => {
  test("calculates zero metrics for an empty frame", () => {
    expect(calculateImageMetrics(new Uint8ClampedArray())).toEqual({
      brightness: 0,
      colorVariance: 0,
      contrast: 0,
      dominantColor: "neutral",
      colorShare: 0,
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
      dominantColor: "red",
      colorShare: 0.5,
    });
  });

  test("uses continuous scores around the existing profession thresholds", () => {
    const result = determineProfession(
      { brightness: 130, colorVariance: 50, contrast: 60 },
      [makeProfession("Инженер"), makeProfession("Дизайнер")],
    );

    expect(result.main.name).toBe("Дизайнер");
    expect(result.match).toBe(65);
    expect(result.others).toEqual([
      { profession: expect.objectContaining({ name: "Инженер" }), match: 56 },
    ]);
  });

  test("keeps the recommendation deterministic", () => {
    const random = jest.spyOn(Math, "random").mockReturnValue(0.5);
    const professions = [makeProfession("Инженер"), makeProfession("Дизайнер")];
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

    const result = analyzeImageData(data, [makeProfession("Инженер")]);

    expect(result.metrics).toEqual({
      brightness: 100,
      colorVariance: 0,
      contrast: 0,
      dominantColor: "neutral",
      colorShare: 0,
    });
  });

  test("removes non-technical professions from the catalog", () => {
    const names = professions.map((profession) => profession.name);

    expect(professions).toHaveLength(27);
    ["Врач", "Учитель", "Предприниматель", "Психолог", "Писатель"].forEach((name) => {
      expect(names).not.toContain(name);
    });
  });

  test("assigns every catalog profession to a color group", () => {
    const covered = new Set<string>();
    Object.values(COLOR_PROFESSION_GROUPS).forEach((group) => {
      group.forEach((name) => covered.add(name));
    });

    professions.forEach((profession) => expect(covered.has(profession.name)).toBe(true));
  });

  test("detects dominant clothing colors and neutral frames", () => {
    expect(calculateImageMetrics(solidColor(255, 0, 0))).toMatchObject({ dominantColor: "red", colorShare: 1 });
    expect(calculateImageMetrics(solidColor(0, 255, 0))).toMatchObject({ dominantColor: "green", colorShare: 1 });
    expect(calculateImageMetrics(solidColor(0, 0, 255))).toMatchObject({ dominantColor: "blue", colorShare: 1 });
    expect(calculateImageMetrics(solidColor(100, 100, 100))).toMatchObject({ dominantColor: "neutral", colorShare: 0 });
  });

  test("switches profession candidates when the dominant color changes", () => {
    const metrics = { brightness: 130, colorVariance: 50, contrast: 60 };
    const red = determineProfession(withColor("red", metrics));
    const blue = determineProfession(withColor("blue", metrics));

    expect(["Игровой разработчик", "Геймдизайнер", "Аниматор игр", "Маркетолог"]).toContain(red.main.name);
    expect([
      "Backend-разработчик",
      "DevOps-инженер",
      "Системный администратор",
      "Архитектор ПО",
      "Администратор БД",
      "Инженер",
    ]).toContain(blue.main.name);
  });

  test("returns different recommendations for different solid colors without a face", () => {
    const red = analyzeImageData(solidColor(255, 0, 0));
    const blue = analyzeImageData(solidColor(0, 0, 255));

    expect(red.main.name).not.toBe(blue.main.name);
  });

  test("uses technical professions for neutral clothing and frames", () => {
    const result = determineProfession(withColor("neutral", {
      brightness: 100,
      colorVariance: 0,
      contrast: 30,
    }));

    expect(result.main.name).not.toBe("3D-художник");
    expect(result.main.name).not.toBe("Дизайнер");
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
