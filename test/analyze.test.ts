import { test, expect, describe } from "bun:test";
import { analyze } from "services/analyze";
import { frame } from "./helpers";

/** Build a lap with controllable sector characteristics. */
function buildLap(
  lap: number,
  baseTs: number,
  opts: { s2Speed?: number; s2Throttle?: number; lapTime?: number } = {},
) {
  const lt = opts.lapTime ?? 120;
  const s2Spd = opts.s2Speed ?? 180;
  const s2Thr = opts.s2Throttle ?? 0.7;

  return [
    frame({ ts: baseTs, lap, pos: 0.0, spd: 200, thr: 0.8 }),
    frame({ ts: baseTs + lt * 0.1, lap, pos: 0.1, spd: 210, thr: 0.85 }),
    frame({ ts: baseTs + lt * 0.25, lap, pos: 0.25, spd: 200, thr: 0.8 }),
    // Cross into S2
    frame({ ts: baseTs + lt * 0.35, lap, pos: 0.35, spd: s2Spd, thr: s2Thr }),
    frame({ ts: baseTs + lt * 0.5, lap, pos: 0.5, spd: s2Spd, thr: s2Thr }),
    frame({ ts: baseTs + lt * 0.6, lap, pos: 0.6, spd: s2Spd, thr: s2Thr }),
    // Cross into S3
    frame({ ts: baseTs + lt * 0.7, lap, pos: 0.7, spd: 190, thr: 0.8 }),
    frame({ ts: baseTs + lt * 0.85, lap, pos: 0.85, spd: 185, thr: 0.8 }),
    frame({ ts: baseTs + lt, lap, pos: 0.95, spd: 195, thr: 0.8 }),
  ];
}

describe("analyze", () => {
  test("returns null with fewer than 2 completed laps", () => {
    const lap1 = buildLap(1, 0);
    const lap2Start = [frame({ ts: 200, lap: 2, pos: 0.0 })];
    expect(analyze([...lap1, ...lap2Start])).toBeNull();
  });

  test("identifies best and worst laps", () => {
    const fast = buildLap(1, 0, { lapTime: 110 });
    const slow = buildLap(2, 120, { lapTime: 140, s2Throttle: 0.3 });
    const nextLap = [frame({ ts: 400, lap: 3, pos: 0.0 })];

    const result = analyze([...fast, ...slow, ...nextLap]);
    expect(result).not.toBeNull();
    expect(result!.bestLap.lapNumber).toBe(1);
    expect(result!.worstLap.lapNumber).toBe(2);
    expect(result!.worstLap.delta).toBeGreaterThan(0);
  });

  test("identifies problem sector and diagnoses issue", () => {
    const fast = buildLap(1, 0, { lapTime: 110 });
    const slow = buildLap(2, 120, { lapTime: 140, s2Throttle: 0.3 });
    const nextLap = [frame({ ts: 400, lap: 3, pos: 0.0 })];

    const result = analyze([...fast, ...slow, ...nextLap]);
    expect(result).not.toBeNull();
    expect(result!.problemSector).toBeGreaterThanOrEqual(1);
    expect(result!.problemSector).toBeLessThanOrEqual(3);
    expect(["heavy_braking", "low_throttle", "tyre_overheat", "inconsistency"]).toContain(result!.issue);
    expect(result!.coachingMessage.length).toBeGreaterThan(0);
  });

  test("delta is positive (worst - best)", () => {
    const fast = buildLap(1, 0, { lapTime: 100 });
    const slow = buildLap(2, 110, { lapTime: 130, s2Throttle: 0.4 });
    const nextLap = [frame({ ts: 350, lap: 3, pos: 0.0 })];

    const result = analyze([...fast, ...slow, ...nextLap]);
    expect(result!.worstLap.delta).toBe(result!.worstLap.lapTime - result!.bestLap.lapTime);
  });
});
