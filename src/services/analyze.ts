import type { AnalysisResult, DiagnosticDetails, SectorDelta, SectorNumber } from "domain/analysis";
import type { LapSummary } from "domain/laps";
import type { TelemetryFrame } from "domain/telemetry";
import { computeLapSummaries } from "./compute-lap-summaries";
import { diagnoseSector } from "./diagnose-sector";
import { generateCoaching } from "./generate-coaching";
import { getSector } from "./track";

/**
 * Compute per-sector time deltas (worst - best), sorted by biggest loss first.
 */
function computeSectorDeltas(worstLap: LapSummary, bestLap: LapSummary): SectorDelta[] {
  const deltas: SectorDelta[] = [];

  for (const ws of worstLap.sectors) {
    const bs = bestLap.sectors.find((s) => s.sector === ws.sector);
    if (!bs) continue;
    deltas.push({ sector: ws.sector, delta: Math.round((ws.time - bs.time) * 1000) / 1000 });
  }

  return deltas.sort((a, b) => b.delta - a.delta);
}

/**
 * Compare best vs worst lap to identify the weakest sector and diagnose
 * the likely cause. Returns null only if there aren't enough completed laps
 * or all laps are identical.
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

  const sectorDeltas = computeSectorDeltas(worstLap, bestLap);

  // Try sectors in order of time lost until we find a diagnosable issue
  let problemSector: SectorNumber | null = null;
  let diag: DiagnosticDetails | null = null;
  let problemDelta = 0;

  for (const { sector, delta: sDelta } of sectorDeltas) {
    const sectorFrames = worstLapData.frames.filter((f) => getSector(f.pos) === sector);
    const result = diagnoseSector(sectorFrames);
    if (result) {
      problemSector = sector;
      diag = result;
      problemDelta = sDelta;
      break;
    }
  }

  if (!problemSector || !diag) return null;

  const coachingMessage = generateCoaching(problemSector, diag, worstLap.lapNumber, problemDelta);

  return {
    bestLap: { lapNumber: bestLap.lapNumber, lapTime: bestLap.lapTime },
    worstLap: { lapNumber: worstLap.lapNumber, lapTime: worstLap.lapTime, delta },
    problemSector,
    sectorDeltas,
    issue: diag.issue,
    diagnostics: diag,
    coachingMessage,
  };
}
