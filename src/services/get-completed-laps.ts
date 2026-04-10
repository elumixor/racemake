import type { LapFrames } from "domain/laps";
import type { TelemetryFrame } from "domain/telemetry";

const MIN_SPEED_KMH = 5;
const LAP_START_THRESHOLD = 0.1; // pos must be below this to count as a full lap start
const LAP_END_THRESHOLD = 0.9; // pos must be above this to count as a full lap end

/** A frame is stationary if the car is barely moving and position hasn't changed. */
function isStationary(frame: TelemetryFrame, prev: TelemetryFrame | undefined): boolean {
  return frame.spd < MIN_SPEED_KMH && prev !== undefined && frame.pos === prev.pos;
}

/**
 * Extracts fully completed laps from raw telemetry, filtering out:
 * - Stationary frames (pit stops, red flags)
 * - Out-laps that don't start near the start/finish line
 * - Incomplete final laps that end mid-track
 */
export function getCompletedLaps(raw: TelemetryFrame[]): LapFrames[] {
  const filtered: TelemetryFrame[] = [];
  for (let i = 0; i < raw.length; i++) {
    const frame = raw[i];
    if (frame && !isStationary(frame, raw[i - 1])) {
      filtered.push(frame);
    }
  }

  const lapMap = new Map<number, TelemetryFrame[]>();
  for (const f of filtered) {
    const arr = lapMap.get(f.lap) ?? [];
    arr.push(f);
    lapMap.set(f.lap, arr);
  }

  const lapNumbers = [...lapMap.keys()].sort((a, b) => a - b);
  const lapNumberSet = new Set(lapNumbers);
  const completed: LapFrames[] = [];

  for (const num of lapNumbers) {
    const lapFrames = lapMap.get(num);
    if (!lapFrames) continue;

    const first = lapFrames[0];
    const last = lapFrames[lapFrames.length - 1];
    if (!first || !last) continue;

    if (first.pos > LAP_START_THRESHOLD) continue;

    // A lap is complete if there's a subsequent lap in the data,
    // or if the car made it near the end of the track.
    if (!lapNumberSet.has(num + 1) && last.pos < LAP_END_THRESHOLD) continue;

    completed.push({ lapNumber: num, frames: lapFrames });
  }

  return completed;
}
