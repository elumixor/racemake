import type { TelemetryFrame } from "domain/telemetry";

const defaults: TelemetryFrame = {
  ts: 0,
  lap: 1,
  pos: 0,
  spd: 150,
  thr: 0.7,
  brk: 0,
  str: 0,
  gear: 5,
  rpm: 7000,
  tyres: { fl: 90, fr: 90, rl: 85, rr: 85 },
};

/** Build a frame with sensible defaults — override only what matters for the test. */
export function frame(overrides: Partial<TelemetryFrame> = {}): TelemetryFrame {
  return {
    ...defaults,
    tyres: { ...defaults.tyres, ...overrides.tyres },
    ...overrides,
  };
}

/**
 * Build a simple completed lap: frames from pos 0 → ~1 spread across 3 sectors.
 * Returns frames spanning ~120s by default.
 */
export function completedLap(
  lap: number,
  startTs: number,
  opts: { lapTime?: number; speeds?: number[]; overrides?: Partial<TelemetryFrame>[] } = {},
): TelemetryFrame[] {
  const lapTime = opts.lapTime ?? 120;
  // 9 evenly spaced frames covering positions 0.0 → 0.9
  const positions = [0.0, 0.1, 0.2, 0.35, 0.45, 0.55, 0.68, 0.8, 0.9];
  const speeds = opts.speeds ?? positions.map(() => 150 + Math.random() * 50);

  return positions.map((pos, i) => {
    const overridesForFrame = opts.overrides?.[i] ?? {};
    return frame({
      ts: startTs + (i / (positions.length - 1)) * lapTime,
      lap,
      pos,
      spd: speeds[i] ?? 150,
      ...overridesForFrame,
    });
  });
}
