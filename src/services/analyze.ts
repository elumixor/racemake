import type { AnalysisResult, SectorNumber } from "domain/analysis";
import type { LapSummary } from "domain/laps";
import type { TelemetryFrame } from "domain/telemetry";
import { computeLapSummaries } from "./compute-lap-summaries";
import { diagnoseSector } from "./diagnose-sector";
import { generateCoaching } from "./generate-coaching";
import { getSector } from "./track";

/** Find the sector with the largest time delta between worst and best lap. */
function findWorstSector(worstLap: LapSummary, bestLap: LapSummary): SectorNumber | null {
  let sectorNum: SectorNumber | null = null;
  let maxDelta = 0; // only consider sectors where time is actually lost

  for (const ws of worstLap.sectors) {
    const bs = bestLap.sectors.find((s) => s.sector === ws.sector);
    if (!bs) continue;
    const d = ws.time - bs.time;
    if (d > maxDelta) {
      maxDelta = d;
      sectorNum = ws.sector;
    }
  }

  return sectorNum;
}

/**
 * Compare best vs worst lap to identify the weakest sector and diagnose
 * the likely cause. Returns null if there aren't enough laps or if
 * lap times are identical (nothing to improve).
 */
export function analyze(frames: TelemetryFrame[]): AnalysisResult | null {
  const { summaries, laps } = computeLapSummaries(frames);
  if (summaries.length < 2) return null;

  const bestLap = summaries.reduce((a, b) => (a.lapTime < b.lapTime ? a : b));
  const worstLap = summaries.reduce((a, b) => (a.lapTime > b.lapTime ? a : b));
  if (bestLap.lapNumber === worstLap.lapNumber) return null;
  const delta = Math.round((worstLap.lapTime - bestLap.lapTime) * 1000) / 1000;

  const problemSector = findWorstSector(worstLap, bestLap);
  if (problemSector === null) return null;

  const worstLapData = laps.find((l) => l.lapNumber === worstLap.lapNumber);
  if (!worstLapData) return null;

  const sectorFrames = worstLapData.frames.filter((f) => getSector(f.pos) === problemSector);
  const issue = diagnoseSector(sectorFrames);
  const coachingMessage = generateCoaching(problemSector, issue, worstLap.lapNumber);

  return {
    bestLap: { lapNumber: bestLap.lapNumber, lapTime: bestLap.lapTime },
    worstLap: {
      lapNumber: worstLap.lapNumber,
      lapTime: worstLap.lapTime,
      delta,
    },
    problemSector,
    issue,
    coachingMessage,
  };
}
