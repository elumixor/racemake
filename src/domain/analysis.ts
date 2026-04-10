export type SectorNumber = 1 | 2 | 3;

export type Issue = "heavy_braking" | "low_throttle" | "tyre_overheat" | "inconsistency";

export interface Lap {
  lapNumber: number;
  lapTime: number;
}

export interface AnalysisResult {
  bestLap: { lapNumber: number; lapTime: number };
  worstLap: { lapNumber: number; lapTime: number; delta: number };
  problemSector: SectorNumber;
  issue: Issue | null;
  coachingMessage: string;
}
