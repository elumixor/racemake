import type { AnalysisResult, DiagnosticDetails, SectorNumber } from "domain/analysis";
import type { LapSummary } from "domain/laps";
import type { TelemetryFrame } from "domain/telemetry";
import { computeLapSummaries } from "./compute-lap-summaries";
import { diagnoseSector } from "./diagnose-sector";
import { generateCoaching } from "./generate-coaching";
import { getSector } from "./track";

/**
 * Rank sectors by time lost (worst - best), descending.
 * Returns all 3 sectors so we can fall through if the worst one has no diagnosable issue.
 */
function rankSectorsByDelta(worstLap: LapSummary, bestLap: LapSummary): SectorNumber[] {
  const deltas: { sector: SectorNumber; delta: number }[] = [];

  for (const ws of worstLap.sectors) {
    const bs = bestLap.sectors.find((s) => s.sector === ws.sector);
    if (!bs) continue;
    deltas.push({ sector: ws.sector, delta: ws.time - bs.time });
  }

  return deltas.sort((a, b) => b.delta - a.delta).map((d) => d.sector);
}

/**
 * Compare best vs worst lap to identify the weakest sector and diagnose
 * the likely cause. Returns null only if there aren't enough completed laps.
 *
 * If the worst sector has no diagnosable issue, falls through to the
 * next-worst sector until an issue is found.
 */
export function analyze(frames: TelemetryFrame[]): AnalysisResult | null {
  const { summaries, laps } = computeLapSummaries(frames);
  if (summaries.length < 2) return null;

  const bestLap = summaries.reduce((a, b) => (a.lapTime < b.lapTime ? a : b));
  const worstLap = summaries.reduce((a, b) => (a.lapTime > b.lapTime ? a : b));
  if (bestLap.lapNumber === worstLap.lapNumber) return null;
  const delta = Math.round((worstLap.lapTime - bestLap.lapTime) * 1000) / 1000;

  const worstLapData = laps.find((l) => l.lapNumber === worstLap.lapNumber);
  if (!worstLapData) return null;

  // Try sectors in order of time lost until we find a diagnosable issue
  const rankedSectors = rankSectorsByDelta(worstLap, bestLap);
  let problemSector: SectorNumber | null = null;
  let diag: DiagnosticDetails | null = null;

  for (const sector of rankedSectors) {
    const sectorFrames = worstLapData.frames.filter((f) => getSector(f.pos) === sector);
    const result = diagnoseSector(sectorFrames);
    if (result) {
      problemSector = sector;
      diag = result;
      break;
    }
  }

  if (!problemSector || !diag) return null;

  const coachingMessage = generateCoaching(problemSector, diag, worstLap.lapNumber);

  return {
    bestLap: { lapNumber: bestLap.lapNumber, lapTime: bestLap.lapTime },
    worstLap: {
      lapNumber: worstLap.lapNumber,
      lapTime: worstLap.lapTime,
      delta,
    },
    problemSector,
    issue: diag.issue,
    coachingMessage,
  };
}
