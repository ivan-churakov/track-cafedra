import { professions } from "./data";
import { getDefaultAnalysisRect } from "./geometry";
import { IT_PROFESSIONS_FOR_SCORING, TVP_PROFESSIONS } from "./profession-groups";
import type { AnalysisResult, FrameRect, ImageMetrics, Profession } from "./types";

export const calculateImageMetrics = (data: ArrayLike<number>): ImageMetrics => {
  let brightnessSum = 0;
  let colorSum = 0;
  let minBrightness = 255;
  let maxBrightness = 0;
  let sampleCount = 0;

  for (let index = 0; index + 2 < data.length; index += 16) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const brightness = (red + green + blue) / 3;
    brightnessSum += brightness;
    colorSum += Math.abs(red - green) + Math.abs(green - blue) + Math.abs(blue - red);
    minBrightness = Math.min(minBrightness, brightness);
    maxBrightness = Math.max(maxBrightness, brightness);
    sampleCount += 1;
  }

  if (!sampleCount) return { brightness: 0, colorVariance: 0, contrast: 0 };
  return {
    brightness: brightnessSum / sampleCount,
    colorVariance: colorSum / sampleCount,
    contrast: maxBrightness - minBrightness,
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

export const determineProfession = (
  metrics: ImageMetrics,
  professionList: Profession[] = professions,
): AnalysisResult => {
  if (!professionList.length) throw new Error("Список профессий пуст");
  const { brightness, colorVariance, contrast } = metrics;
  const scores = professionList.map((profession) => {
    let score = 0;

    if (brightness > 120 && brightness < 180) score += 20;
    if (colorVariance > 30) score += 15;
    if (contrast > 50) score += 15;

    if (profession.name === "Программист" && brightness > 100 && contrast > 40) score += 20;
    if (profession.name === "Дизайнер" && colorVariance > 40) score += 25;
    if (profession.name === "Врач" && brightness > 110 && brightness < 160) score += 20;
    if (profession.name === "Учитель" && brightness > 100 && contrast > 30) score += 20;
    if (profession.name === "Предприниматель" && brightness > 120) score += 20;
    if (profession.name === "Психолог" && brightness > 100 && brightness < 170) score += 20;
    if (profession.name === "Инженер" && contrast > 45) score += 20;
    if (profession.name === "Маркетолог" && brightness > 120 && colorVariance > 35) score += 20;
    if (profession.name === "Писатель" && brightness > 100 && brightness < 180) score += 20;
    if (profession.name === "Архитектор" && contrast > 40 && colorVariance > 30) score += 20;

    if (IT_PROFESSIONS_FOR_SCORING.has(profession.name)) {
      if (brightness > 100 && contrast > 40) score += 25;
      if (colorVariance > 25) score += 15;
    }

    if (profession.name === "Веб-разработчик" && colorVariance > 35) score += 15;
    if (profession.name === "Frontend-разработчик" && colorVariance > 40) score += 20;
    if (profession.name === "Аналитик данных" && contrast > 50) score += 15;
    if (profession.name === "Специалист по ИИ/ML" && brightness > 120 && contrast > 45) score += 20;

    if (TVP_PROFESSIONS.has(profession.name)) {
      if (brightness > 110 && contrast > 45) score += 30;
      if (colorVariance > 40) score += 25;
    }

    if (profession.name === "3D-художник" && colorVariance > 45) score += 20;
    if (profession.name === "Геймдизайнер" && brightness > 120 && colorVariance > 35) score += 20;
    if (profession.name === "VR/AR разработчик" && contrast > 50 && brightness > 110) score += 25;

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
