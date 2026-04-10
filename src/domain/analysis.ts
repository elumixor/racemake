export type SectorNumber = 1 | 2 | 3;

export type Issue = "heavy_braking" | "low_throttle" | "tyre_overheat" | "inconsistency";

/** Diagnostic details collected during sector analysis, used to enrich coaching messages. */
export interface DiagnosticDetails {
  issue: Issue;
  peakTyreTemp?: { tyre: string; temp: number };
  peakBrake?: { brake: number; speed: number };
  avgThrottle?: number;
  speedStddev?: number;
}

export interface AnalysisResult {
  bestLap: { lapNumber: number; lapTime: number };
  worstLap: { lapNumber: number; lapTime: number; delta: number };
  problemSector: SectorNumber;
  issue: Issue;
  coachingMessage: string;
}
