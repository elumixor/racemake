import type { DiagnosticDetails, SectorNumber } from "domain/analysis";
import { getSectorName } from "./track";

/**
 * Produce a data-driven coaching tip in the PitGPT race-engineer voice.
 * References the actual time delta and telemetry numbers so the driver
 * knows exactly what to fix and by how much.
 */
export function generateCoaching(
  sector: SectorNumber,
  diag: DiagnosticDetails,
  lapNumber: number,
  sectorDelta: number,
): string {
  const name = getSectorName(sector);
  const deltaStr = `+${sectorDelta.toFixed(1)}s`;

  switch (diag.issue) {
    case "tyre_overheat": {
      const { tyre, temp } = diag.peakTyreTemp;
      const over = Math.round(temp - 110);
      return `${name} cost you ${deltaStr} on lap ${lapNumber}. ${tyre} peaked at ${temp}°C — ${over}° over the limit. You're cooking the rubber and losing grip on exit. Ease the inputs through the middle of the corner, let the fronts recover.`;
    }
    case "heavy_braking": {
      const { brake, speed } = diag.peakBrake;
      return `${name} cost you ${deltaStr} on lap ${lapNumber}. ${Math.round(brake * 100)}% brake at ${Math.round(speed)} km/h — way too late and too hard. Trail-brake earlier, scrub speed progressively. You're locking up and compromising the exit.`;
    }
    case "low_throttle": {
      const pct = Math.round(diag.avgThrottle * 100);
      return `${name} cost you ${deltaStr} on lap ${lapNumber}. Average throttle only ${pct}% through the sector — you're leaving time on the table. Trust the grip, get on the power earlier. The car can take more than you're giving it.`;
    }
    case "inconsistency": {
      const sd = diag.speedStddev;
      return `${name} cost you ${deltaStr} on lap ${lapNumber}. Speed variance is ${sd} km/h stddev — your line is all over the place. Pick a braking reference, commit to the apex, and repeat. Consistency is free lap time.`;
    }
  }
}
