import professionsJson from "./data/professions.json";
import topicsDataJson from "./data/topics-data.json";
import type { Profession, TopicsData } from "./types";

export const professions = professionsJson as Profession[];
export const topicsData = topicsDataJson as TopicsData;
