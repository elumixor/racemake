export type SectorNumber = 1 | 2 | 3;

export type Issue = "heavy_braking" | "low_throttle" | "tyre_overheat" | "inconsistency";

/** All metrics computed for a sector — every field is always present when an issue is detected. */
export interface DiagnosticDetails {
  issue: Issue;
  peakTyreTemp: { tyre: string; temp: number };
  peakBrake: { brake: number; speed: number };
  avgThrottle: number;
  speedStddev: number;
}

export interface SectorDelta {
  sector: SectorNumber;
  delta: number;
}

export interface AnalysisResult {
  bestLap: { lapNumber: number; lapTime: number };
  worstLap: { lapNumber: number; lapTime: number; delta: number };
  problemSector: SectorNumber;
  sectorDeltas: SectorDelta[];
  issue: Issue;
  diagnostics: DiagnosticDetails;
  coachingMessage: string;
}
