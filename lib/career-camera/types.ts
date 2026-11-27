export interface FramePoint {
  x: number;
  y: number;
}

export interface FrameRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ProfessionSalary {
  min: number;
  max: number;
  currency: string;
  note?: string;
}

export interface Profession {
  name: string;
  icon: string;
  description: string;
  skills: string[];
  traits: string[];
  salary: ProfessionSalary;
}

export interface ImageMetrics {
  brightness: number;
  colorVariance: number;
  contrast: number;
}

export interface ProfessionMatch {
  profession: Profession;
  match: number;
}

export interface AnalysisResult {
  main: Profession;
  match: number;
  others: ProfessionMatch[];
  metrics: ImageMetrics;
}

export type ProfileKey = "RKBP" | "TVP";

export interface Topic {
  title: string;
  exam: string;
  test: string;
  creditUnit: string;
  lecture: string;
  practice: string;
  course: string[];
}

export interface ProfileData {
  profile: string;
  profileShort: string;
  topics: {
    red: Topic[];
    green: Topic[];
    blue: Topic[];
    orange: Topic[];
  };
}

export interface TopicsData {
  profiles: Record<ProfileKey, ProfileData>;
}

export interface EdgePixel extends FramePoint {
  strength: number;
  tangentX: number;
  tangentY: number;
}
