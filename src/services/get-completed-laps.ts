import type { LapFrames } from "domain/laps";
import type { TelemetryFrame } from "domain/telemetry";

const MIN_SPEED_KMH = 5;
const LAP_START_THRESHOLD = 0.1; // pos must be below this to count as a full lap start

/** A frame is stationary if the car is barely moving and position hasn't changed. */
function isStationary(frame: TelemetryFrame, prev: TelemetryFrame | undefined): boolean {
  return frame.spd < MIN_SPEED_KMH && prev !== undefined && frame.pos === prev.pos;
}

/**
 * Extracts fully completed laps from raw telemetry, filtering out:
 * - Stationary frames (pit stops, red flags)
 * - Out-laps that don't start near the start/finish line
 * - Incomplete final laps that end mid-track
 *
 * A lap is considered complete when telemetry shows the car crossed
 * back to the start/finish (a subsequent lap exists in the data).
 * Does not assume sequential lap numbers — uses actual lap transitions.
 */
export function getCompletedLaps(raw: TelemetryFrame[]): LapFrames[] {
  const filtered: TelemetryFrame[] = [];
  for (let i = 0; i < raw.length; i++) {
    const frame = raw[i];
    if (frame && !isStationary(frame, raw[i - 1])) {
      filtered.push(frame);
    }
  }

  // Group frames by lap number, preserving insertion order
  const lapMap = new Map<number, TelemetryFrame[]>();
  for (const f of filtered) {
    const arr = lapMap.get(f.lap) ?? [];
    arr.push(f);
    lapMap.set(f.lap, arr);
  }

  const lapNumbers = [...lapMap.keys()].sort((a, b) => a - b);

  // Build a set of lap numbers that have a successor in the data.
  // A lap is complete if a later lap number exists (the car crossed start/finish).
  const hasSuccessor = new Set<number>(lapNumbers.slice(0, -1));

  const completed: LapFrames[] = [];

  for (const num of lapNumbers) {
    const lapFrames = lapMap.get(num);
    if (!lapFrames) continue;

    const first = lapFrames[0];
    if (!first) continue;

    // Out-lap: doesn't start near start/finish
    if (first.pos > LAP_START_THRESHOLD) continue;

    // Incomplete final lap: no subsequent lap in data
    if (!hasSuccessor.has(num)) continue;

    completed.push({ lapNumber: num, frames: lapFrames });
  }

  return completed;
}
