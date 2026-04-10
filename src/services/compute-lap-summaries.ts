import type { LapFrames, LapSummary } from "domain/laps";
import type { TelemetryFrame } from "domain/telemetry";
import type { SectorNumber } from "domain/analysis";
import { getCompletedLaps } from "./get-completed-laps";
import { getSector, SPA } from "./track";

/**
 * Converts raw telemetry into per-lap summaries with sector splits, speed stats,
 * and the filtered completed laps used to produce them.
 *
 * Sector times are linearly interpolated at sector boundaries so they
 * sum exactly to the lap time (no inter-sector gaps).
 */
export function computeLapSummaries(raw: TelemetryFrame[]): { summaries: LapSummary[]; laps: LapFrames[] } {
  const laps = getCompletedLaps(raw);
  const summaries: LapSummary[] = [];
  const [s1End, s2End] = SPA.sectorBoundaries;

  for (const { lapNumber, frames } of laps) {
    const first = frames[0];
    const last = frames[frames.length - 1];
    if (!first || !last) continue;

    const lapTime = Math.round((last.ts - first.ts) * 1000) / 1000;
    if (lapTime <= 0) continue;

    const bySector: [TelemetryFrame[], TelemetryFrame[], TelemetryFrame[]] = [[], [], []];
    for (const f of frames) {
      bySector[getSector(f.pos) - 1]?.push(f);
    }

    // Walk consecutive frame pairs to detect sector transitions.
    // At each transition, interpolate the exact timestamp where the
    // boundary position was crossed, giving us: [lapStart, s1→s2, s2→s3, lapEnd].
    const boundaryTs: number[] = [first.ts];

    for (let i = 1; i < frames.length; i++) {
      const prev = frames[i - 1];
      const curr = frames[i];
      if (!prev || !curr) continue;

      const prevSector = getSector(prev.pos);
      const currSector = getSector(curr.pos);

      if (prevSector !== currSector) {
        const boundary = prevSector === 1 ? s1End : s2End;
        const posDelta = curr.pos - prev.pos;
        const boundaryTime =
          posDelta === 0 ? prev.ts : prev.ts + ((boundary - prev.pos) / posDelta) * (curr.ts - prev.ts);
        boundaryTs.push(boundaryTime);
      }
    }

    boundaryTs.push(last.ts);

    const sectors = bySector.map((_, i) => {
      const sector = (i + 1) as SectorNumber;
      const start = boundaryTs[i];
      const end = boundaryTs[i + 1];
      if (start === undefined || end === undefined) return { sector, time: 0 };
      return { sector, time: Math.round((end - start) * 1000) / 1000 };
    });

    let maxSpeed = 0;
    let totalSpeed = 0;
    for (const f of frames) {
      totalSpeed += f.spd;
      if (f.spd > maxSpeed) maxSpeed = f.spd;
    }
    const avgSpeed = Math.round((totalSpeed / frames.length) * 10) / 10;

    summaries.push({ lapNumber, lapTime, sectors, avgSpeed, maxSpeed });
  }

  return { summaries, laps };
}
