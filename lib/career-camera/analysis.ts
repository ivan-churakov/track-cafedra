import { professions } from "./data";
import { getDefaultAnalysisRect } from "./geometry";
import { IT_PROFESSIONS_FOR_SCORING, TVP_PROFESSIONS } from "./profession-groups";
import type { AnalysisResult, FrameRect, ImageMetrics, Profession } from "./types";

export const calculateImageMetrics = (data: ArrayLike<number>): ImageMetrics => {
  let brightnessSum = 0;
  let colorSum = 0;
  const brightnessSamples: number[] = [];
  let sampleCount = 0;

  for (let index = 0; index + 2 < data.length; index += 16) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const brightness = (red + green + blue) / 3;
    brightnessSum += brightness;
    colorSum += Math.abs(red - green) + Math.abs(green - blue) + Math.abs(blue - red);
    brightnessSamples.push(brightness);
    sampleCount += 1;
  }

  if (!sampleCount) return { brightness: 0, colorVariance: 0, contrast: 0 };
  brightnessSamples.sort((a, b) => a - b);
  const percentile = (ratio: number) =>
    brightnessSamples[Math.round((brightnessSamples.length - 1) * ratio)];
  return {
    brightness: brightnessSum / sampleCount,
    colorVariance: colorSum / sampleCount,
    contrast: percentile(0.95) - percentile(0.05),
  };
};

export const normalizeAnalysisRect = (
  rect: FrameRect | null,
  frameWidth: number,
  frameHeight: number,
): FrameRect => {
  if (!frameWidth || !frameHeight) return { x: 0, y: 0, width: 0, height: 0 };
  const base = rect ?? getDefaultAnalysisRect(frameWidth, frameHeight);
  const x = Math.min(frameWidth - 1, Math.max(0, Math.floor(base.x)));
  const y = Math.min(frameHeight - 1, Math.max(0, Math.floor(base.y)));
  const width = Math.min(frameWidth - x, Math.max(1, Math.ceil(base.width)));
  const height = Math.min(frameHeight - y, Math.max(1, Math.ceil(base.height)));

  if (width < 4 || height < 4) return getDefaultAnalysisRect(frameWidth, frameHeight);
  return { x, y, width, height };
};

const BRIGHTNESS_SENSITIVITY = 12;
const COLOR_SENSITIVITY = 5;
const CONTRAST_SENSITIVITY = 10;

const above = (value: number, threshold: number, sensitivity: number) =>
  1 / (1 + Math.exp((threshold - value) / sensitivity));

const between = (value: number, min: number, max: number, sensitivity: number) =>
  above(value, min, sensitivity) * above(max, value, sensitivity);

export const determineProfession = (
  metrics: ImageMetrics,
  professionList: Profession[] = professions,
): AnalysisResult => {
  if (!professionList.length) throw new Error("Список профессий пуст");
  const { brightness, colorVariance, contrast } = metrics;
  const scores = professionList.map((profession) => {
    let score = 0;

    score += 20 * between(brightness, 120, 180, BRIGHTNESS_SENSITIVITY);
    score += 15 * above(colorVariance, 30, COLOR_SENSITIVITY);
    score += 15 * above(contrast, 50, CONTRAST_SENSITIVITY);

    if (profession.name === "Программист") {
      score += 20 * above(brightness, 100, BRIGHTNESS_SENSITIVITY) * above(contrast, 40, CONTRAST_SENSITIVITY);
    }
    if (profession.name === "Дизайнер") score += 25 * above(colorVariance, 40, COLOR_SENSITIVITY);
    if (profession.name === "Врач") score += 20 * between(brightness, 110, 160, BRIGHTNESS_SENSITIVITY);
    if (profession.name === "Учитель") {
      score += 20 * above(brightness, 100, BRIGHTNESS_SENSITIVITY) * above(contrast, 30, CONTRAST_SENSITIVITY);
    }
    if (profession.name === "Предприниматель") score += 20 * above(brightness, 120, BRIGHTNESS_SENSITIVITY);
    if (profession.name === "Психолог") score += 20 * between(brightness, 100, 170, BRIGHTNESS_SENSITIVITY);
    if (profession.name === "Инженер") score += 20 * above(contrast, 45, CONTRAST_SENSITIVITY);
    if (profession.name === "Маркетолог") {
      score += 20 * above(brightness, 120, BRIGHTNESS_SENSITIVITY) * above(colorVariance, 35, COLOR_SENSITIVITY);
    }
    if (profession.name === "Писатель") score += 20 * between(brightness, 100, 180, BRIGHTNESS_SENSITIVITY);
    if (profession.name === "Архитектор") {
      score += 20 * above(contrast, 40, CONTRAST_SENSITIVITY) * above(colorVariance, 30, COLOR_SENSITIVITY);
    }

    if (IT_PROFESSIONS_FOR_SCORING.has(profession.name)) {
      score += 25 * above(brightness, 100, BRIGHTNESS_SENSITIVITY) * above(contrast, 40, CONTRAST_SENSITIVITY);
      score += 15 * above(colorVariance, 25, COLOR_SENSITIVITY);
    }

    if (profession.name === "Веб-разработчик") score += 15 * above(colorVariance, 35, COLOR_SENSITIVITY);
    if (profession.name === "Frontend-разработчик") score += 20 * above(colorVariance, 40, COLOR_SENSITIVITY);
    if (profession.name === "Аналитик данных") score += 15 * above(contrast, 50, CONTRAST_SENSITIVITY);
    if (profession.name === "Специалист по ИИ/ML") {
      score += 20 * above(brightness, 120, BRIGHTNESS_SENSITIVITY) * above(contrast, 45, CONTRAST_SENSITIVITY);
    }

    if (TVP_PROFESSIONS.has(profession.name)) {
      score += 30 * above(brightness, 110, BRIGHTNESS_SENSITIVITY) * above(contrast, 45, CONTRAST_SENSITIVITY);
      score += 25 * above(colorVariance, 40, COLOR_SENSITIVITY);
    }

    if (profession.name === "3D-художник") score += 20 * above(colorVariance, 45, COLOR_SENSITIVITY);
    if (profession.name === "Геймдизайнер") {
      score += 20 * above(brightness, 120, BRIGHTNESS_SENSITIVITY) * above(colorVariance, 35, COLOR_SENSITIVITY);
    }
    if (profession.name === "VR/AR разработчик") {
      score += 25 * above(contrast, 50, CONTRAST_SENSITIVITY) * above(brightness, 110, BRIGHTNESS_SENSITIVITY);
    }

    return { profession, score };
  });

  scores.sort((a, b) => b.score - a.score);
  const mainScore = scores[0].score;
  const match = Math.min(95, Math.max(65, Math.round(mainScore)));
  const others = scores.slice(1, 4).map((item) => ({
    profession: item.profession,
    match: Math.min(90, Math.max(50, Math.round(item.score))),
  }));

  return { main: scores[0].profession, match, others, metrics };
};

export const analyzeImageData = (
  data: ArrayLike<number>,
  professionList: Profession[] = professions,
): AnalysisResult => determineProfession(calculateImageMetrics(data), professionList);
