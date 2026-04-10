import type { SectorNumber } from "./analysis";
import type { TelemetryFrame } from "./telemetry";

export interface LapFrames {
  lapNumber: number;
  frames: TelemetryFrame[];
}

export interface SectorSummary {
  sector: SectorNumber;
  time: number;
}

export interface LapSummary {
  lapNumber: number;
  lapTime: number;
  sectors: SectorSummary[];
  avgSpeed: number;
  maxSpeed: number;
}
