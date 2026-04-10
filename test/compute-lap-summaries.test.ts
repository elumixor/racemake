import { test, expect, describe } from "bun:test";
import { computeLapSummaries } from "services/compute-lap-summaries";
import { frame } from "./helpers";

/** Build a minimal completed lap with known sector boundary crossings. */
function buildLap(lap: number, baseTs: number) {
  return [
    // Sector 1: pos 0.0 → 0.3
    frame({ ts: baseTs + 0, lap, pos: 0.0, spd: 200 }),
    frame({ ts: baseTs + 10, lap, pos: 0.15, spd: 220 }),
    frame({ ts: baseTs + 20, lap, pos: 0.3, spd: 210 }),
    // Sector 2: crosses 0.333 boundary
    frame({ ts: baseTs + 25, lap, pos: 0.35, spd: 180 }),
    frame({ ts: baseTs + 40, lap, pos: 0.5, spd: 190 }),
    frame({ ts: baseTs + 55, lap, pos: 0.65, spd: 185 }),
    // Sector 3: crosses 0.667 boundary
    frame({ ts: baseTs + 60, lap, pos: 0.7, spd: 170 }),
    frame({ ts: baseTs + 75, lap, pos: 0.85, spd: 160 }),
    frame({ ts: baseTs + 90, lap, pos: 0.95, spd: 175 }),
  ];
}

describe("computeLapSummaries", () => {
  test("computes lap time from first to last frame", () => {
    const lap1 = buildLap(1, 0);
    const lap2Start = [frame({ ts: 100, lap: 2, pos: 0.0 })];
    const { summaries } = computeLapSummaries([...lap1, ...lap2Start]);

    expect(summaries.length).toBe(1);
    expect(summaries[0]!.lapTime).toBe(90); // ts 0 → 90
  });

  test("produces 3 sector times that sum to lap time", () => {
    const lap1 = buildLap(1, 0);
    const lap2Start = [frame({ ts: 100, lap: 2, pos: 0.0 })];
    const { summaries } = computeLapSummaries([...lap1, ...lap2Start]);

    const s = summaries[0]!;
    expect(s.sectors.length).toBe(3);

    const sectorSum = s.sectors.reduce((acc, sec) => acc + sec.time, 0);
    expect(Math.abs(sectorSum - s.lapTime)).toBeLessThan(0.01);
  });

  test("computes maxSpeed and avgSpeed correctly", () => {
    const lap1 = buildLap(1, 0);
    const lap2Start = [frame({ ts: 100, lap: 2, pos: 0.0 })];
    const { summaries } = computeLapSummaries([...lap1, ...lap2Start]);

    const s = summaries[0]!;
    expect(s.maxSpeed).toBe(220);
    expect(s.avgSpeed).toBeGreaterThan(0);
  });

  test("excludes out-lap and incomplete laps", () => {
    const outLap = [frame({ ts: 0, lap: 0, pos: 0.5 })];
    const lap1 = buildLap(1, 10);
    const lap2Start = [frame({ ts: 200, lap: 2, pos: 0.0 })];
    const incompleteLap = [frame({ ts: 210, lap: 3, pos: 0.0 }), frame({ ts: 220, lap: 3, pos: 0.2 })];

    const { summaries } = computeLapSummaries([...outLap, ...lap1, ...lap2Start, ...incompleteLap]);
    expect(summaries.length).toBe(1);
    expect(summaries[0]!.lapNumber).toBe(1);
  });

  test("returns empty for no completed laps", () => {
    const { summaries } = computeLapSummaries([]);
    expect(summaries).toEqual([]);
  });
});
