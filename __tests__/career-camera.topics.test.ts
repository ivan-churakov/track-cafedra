import {
  determineProfile,
  formatCourse,
  getRecommendedTopics,
  parseHours,
} from "../lib/career-camera/topics";
import type { Profession, TopicsData } from "../lib/career-camera/types";

const makeProfession = (name: string): Profession => ({
  name,
  icon: "",
  description: "",
  skills: [],
  traits: [],
  salary: { min: 0, max: 0, currency: "₽" },
});

const makeTopic = (title: string) => ({
  title,
  exam: "",
  test: "",
  creditUnit: "2 з.е.",
  lecture: "16 часов (8 пар)",
  practice: "32 часа (16 пар)",
  course: ["2"],
});

const topicsData: TopicsData = {
  profiles: {
    RKBP: {
      profile: "Профиль РКБП",
      profileShort: "РКБП",
      topics: {
        red: [makeTopic("Философия")],
        green: [makeTopic("Веб-разработка интерфейсов")],
        blue: [],
        orange: [makeTopic("Трехмерное моделирование")],
      },
    },
    TVP: {
      profile: "Профиль ТВП",
      profileShort: "ТВП",
      topics: {
        red: [makeTopic("Философия")],
        green: [],
        blue: [],
        orange: [makeTopic("Трехмерное моделирование")],
      },
    },
  },
};

describe("career camera topics", () => {
  test("selects the TVP profile only for virtual-space professions", () => {
    expect(determineProfile(makeProfession("3D-художник"))).toBe("TVP");
    expect(determineProfile(makeProfession("Frontend-разработчик"))).toBe("RKBP");
  });

  test("ranks topics by profession keywords and profile bonuses", () => {
    const result = getRecommendedTopics(makeProfession("Frontend-разработчик"), topicsData);

    expect(result.topics[0].title).toBe("Веб-разработка интерфейсов");
    expect(result.profile.profileShort).toBe("РКБП");
  });

  test("parses lecture and practice hours", () => {
    expect(parseHours("32 часа (16 пар)")).toBe(32);
    expect(parseHours("16 часов (8 пар)")).toBe(16);
    expect(parseHours("")).toBe(0);
  });

  test("formats one or several courses", () => {
    expect(formatCourse(["3"])).toBe("3 курс");
    expect(formatCourse(["1", "2"])).toBe("1–2 курс");
    expect(formatCourse([])).toBe("");
  });
});
