import { test, expect, describe } from "bun:test";
import { getCompletedLaps } from "services/get-completed-laps";
import { frame, completedLap } from "./helpers";

describe("getCompletedLaps", () => {
  test("excludes out-lap that starts mid-track", () => {
    const outLap = [
      frame({ ts: 0, lap: 0, pos: 0.5 }),
      frame({ ts: 5, lap: 0, pos: 0.7 }),
      frame({ ts: 10, lap: 0, pos: 0.9 }),
    ];
    const fullLap = completedLap(1, 15);
    // Need a lap 2 to mark lap 1 as complete
    const nextLapStart = [frame({ ts: 200, lap: 2, pos: 0.0 })];

    const result = getCompletedLaps([...outLap, ...fullLap, ...nextLapStart]);
    expect(result.every((l) => l.lapNumber !== 0)).toBe(true);
  });

  test("excludes incomplete final lap", () => {
    const fullLap = completedLap(1, 0);
    const incompleteLap = [
      frame({ ts: 200, lap: 2, pos: 0.0 }),
      frame({ ts: 210, lap: 2, pos: 0.15 }),
      frame({ ts: 220, lap: 2, pos: 0.3 }),
      // stops mid-track, no lap 3 follows
    ];

    const result = getCompletedLaps([...fullLap, ...incompleteLap]);
    expect(result.every((l) => l.lapNumber !== 2)).toBe(true);
  });

  test("filters stationary frames (pit stop)", () => {
    const stationaryFrames = [
      frame({ ts: 0, lap: 1, pos: 0.0, spd: 3 }),
      frame({ ts: 1, lap: 1, pos: 0.0, spd: 2 }), // stationary: low speed + same pos
      frame({ ts: 2, lap: 1, pos: 0.0, spd: 1 }), // stationary
    ];
    const movingFrames = completedLap(1, 3);
    const nextLapStart = [frame({ ts: 200, lap: 2, pos: 0.0 })];

    const result = getCompletedLaps([...stationaryFrames, ...movingFrames, ...nextLapStart]);
    const lap1 = result.find((l) => l.lapNumber === 1);
    // Stationary frames with same pos and spd < 5 should be removed
    const stationaryInResult = lap1?.frames.filter((f) => f.spd < 5 && f.ts > 0);
    expect(stationaryInResult?.length ?? 0).toBe(0);
  });

  test("includes a fully completed lap", () => {
    const lap1 = completedLap(1, 0);
    const lap2Start = [frame({ ts: 200, lap: 2, pos: 0.0 })];

    const result = getCompletedLaps([...lap1, ...lap2Start]);
    expect(result.length).toBe(1);
    expect(result[0]!.lapNumber).toBe(1);
  });

  test("returns empty for only an out-lap", () => {
    const outLap = [
      frame({ ts: 0, lap: 0, pos: 0.5 }),
      frame({ ts: 5, lap: 0, pos: 0.8 }),
    ];
    expect(getCompletedLaps(outLap)).toEqual([]);
  });

  test("returns empty for empty input", () => {
    expect(getCompletedLaps([])).toEqual([]);
  });
});
