import type { Issue } from "domain/analysis";
import type { SectorNumber } from "domain/analysis";
import { getSectorName } from "./track";

/** Produce a human-readable coaching tip for the given sector issue (or a generic "all clear" if null). */
export function generateCoaching(sector: SectorNumber, issue: Issue | null, lapNumber: number): string {
  const name = getSectorName(sector);

  switch (issue) {
    case "tyre_overheat":
      return `${name} is costing you on lap ${lapNumber}. Tyre temps are through the roof. Back off the inputs, let the rubber breathe. You're cooking the fronts and losing grip on exit.`;
    case "heavy_braking":
      return `${name} on lap ${lapNumber} — you're braking way too late and too hard. Trail-brake earlier, scrub speed progressively. You're flat-spotting the tyres and losing time on exit.`;
    case "low_throttle":
      return `${name} is killing your lap ${lapNumber}. Throttle trace is way too timid. Trust the car, get on the power earlier. You're leaving tenths on the table every corner exit.`;
    case "inconsistency":
      return `${name} on lap ${lapNumber} — the speed trace is all over the place. Smooth inputs, consistent lines. Pick a reference and hit it every lap. The pace is there, you just need to be cleaner.`;
    case null:
      return `${name} on lap ${lapNumber} — no obvious issues in the telemetry. Delta is small. Focus on carrying more momentum and nailing the exits.`;
  }
}
