import type { DiagnosticDetails, SectorNumber } from "domain/analysis";
import { getSectorName } from "./track";

/** Produce a data-driven coaching tip in the PitGPT race-engineer voice. */
export function generateCoaching(sector: SectorNumber, diag: DiagnosticDetails, lapNumber: number): string {
  const name = getSectorName(sector);

  switch (diag.issue) {
    case "tyre_overheat": {
      const { tyre, temp } = diag.peakTyreTemp ?? { tyre: "front", temp: 0 };
      return `${name} is costing you on lap ${lapNumber}. ${tyre} hit ${temp}°C — way over the limit. Back off the inputs, let the rubber breathe. You're destroying grip on exit.`;
    }
    case "heavy_braking": {
      const { brake, speed } = diag.peakBrake ?? { brake: 0, speed: 0 };
      return `${name} on lap ${lapNumber} — ${Math.round(brake * 100)}% brake at ${Math.round(speed)} km/h is way too aggressive. Trail-brake earlier, scrub speed progressively. You're flat-spotting and losing the exit.`;
    }
    case "low_throttle": {
      const pct = Math.round((diag.avgThrottle ?? 0) * 100);
      return `${name} is killing your lap ${lapNumber}. Average throttle only ${pct}% through the sector. Trust the car, get on the power earlier. You're leaving tenths on the table every exit.`;
    }
    case "inconsistency": {
      const sd = diag.speedStddev ?? 0;
      return `${name} on lap ${lapNumber} — speed variance is ${sd} km/h stddev, all over the place. Smooth inputs, consistent lines. Pick a reference and hit it every lap.`;
    }
  }
}
