import type { ColorFamily } from "./types";

export const COLOR_PROFESSION_GROUPS: Record<ColorFamily, ReadonlySet<string>> = {
  neutral: new Set([
    "Программист",
    "Backend-разработчик",
    "DevOps-инженер",
    "Тестировщик (QA)",
    "Системный администратор",
    "Аналитик данных",
    "Специалист по ИИ/ML",
    "Бизнес-аналитик",
    "Архитектор ПО",
    "Менеджер IT-проектов",
    "Администратор БД",
    "Инженер",
  ]),
  red: new Set([
    "Игровой разработчик",
    "Геймдизайнер",
    "Аниматор игр",
    "Маркетолог",
  ]),
  yellow: new Set([
    "Дизайнер",
    "3D-художник",
    "Технический художник",
    "Архитектор",
    "Менеджер IT-проектов",
  ]),
  green: new Set([
    "Аналитик данных",
    "Специалист по ИИ/ML",
    "Бизнес-аналитик",
    "Тестировщик (QA)",
  ]),
  cyan: new Set([
    "Программист",
    "Веб-разработчик",
    "Мобильный разработчик",
    "Frontend-разработчик",
  ]),
  blue: new Set([
    "Backend-разработчик",
    "DevOps-инженер",
    "Системный администратор",
    "Архитектор ПО",
    "Администратор БД",
    "Инженер",
  ]),
  purple: new Set([
    "VR/AR разработчик",
    "Специалист по смешанной реальности",
    "Разработчик игровых движков",
    "Разработчик симуляторов",
  ]),
};

export const getPixelColorFamily = (red: number, green: number, blue: number): ColorFamily => {
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  if (max < 45 || delta / max < 0.18) return "neutral";

  let hue = 0;
  if (max === red) hue = 60 * (((green - blue) / delta) % 6);
  else if (max === green) hue = 60 * ((blue - red) / delta + 2);
  else hue = 60 * ((red - green) / delta + 4);
  if (hue < 0) hue += 360;

  if (hue < 30 || hue >= 330) return "red";
  if (hue < 90) return "yellow";
  if (hue < 150) return "green";
  if (hue < 210) return "cyan";
  if (hue < 270) return "blue";
  return "purple";
};
