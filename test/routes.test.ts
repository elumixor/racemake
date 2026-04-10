import { test, expect, describe, beforeEach } from "bun:test";
import { app } from "../src/routes";
import { telemetry } from "../tasks/hard";

/** Helper to make requests against the Hono app without starting a server. */
function req(path: string, init?: RequestInit) {
  return app.request(path, init);
}

function postIngest(data: unknown) {
  return req("/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

describe("POST /ingest", () => {
  test("accepts valid telemetry and returns counts", async () => {
    const res = await postIngest(telemetry);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.laps).toBeGreaterThan(0);
    expect(body.frames).toBe(telemetry.length);
  });

  test("rejects invalid payload", async () => {
    const res = await postIngest([{ invalid: true }]);
    expect(res.status).toBe(400);
  });

  test("rejects non-array payload", async () => {
    const res = await postIngest({ not: "an array" });
    expect(res.status).toBe(400);
  });
});

describe("GET /laps", () => {
  test("returns lap summaries after ingest", async () => {
    await postIngest(telemetry);
    const res = await req("/laps");
    expect(res.status).toBe(200);
    const laps = await res.json();

    expect(laps.length).toBeGreaterThanOrEqual(2);

    for (const lap of laps) {
      expect(lap.lapNumber).toBeGreaterThan(0);
      expect(lap.lapTime).toBeGreaterThan(0);
      expect(lap.sectors).toHaveLength(3);
      expect(lap.avgSpeed).toBeGreaterThan(0);
      expect(lap.maxSpeed).toBeGreaterThan(0);

      // Sector times should sum to lap time (within rounding tolerance)
      const sectorSum = lap.sectors.reduce((s: number, sec: { time: number }) => s + sec.time, 0);
      expect(Math.abs(sectorSum - lap.lapTime)).toBeLessThan(0.1);
    }
  });

  test("excludes out-lap (lap 0) and incomplete final lap", async () => {
    await postIngest(telemetry);
    const res = await req("/laps");
    const laps = await res.json();
    const lapNumbers = laps.map((l: { lapNumber: number }) => l.lapNumber);
    expect(lapNumbers).not.toContain(0); // out-lap excluded
  });
});

describe("GET /analysis", () => {
  test("returns valid analysis after ingest", async () => {
    await postIngest(telemetry);
    const res = await req("/analysis");
    expect(res.status).toBe(200);
    const analysis = await res.json();

    expect(analysis.bestLap).toBeDefined();
    expect(analysis.bestLap.lapNumber).toBeGreaterThan(0);
    expect(analysis.bestLap.lapTime).toBeGreaterThan(0);

    expect(analysis.worstLap).toBeDefined();
    expect(analysis.worstLap.lapNumber).toBeGreaterThan(0);
    expect(analysis.worstLap.lapTime).toBeGreaterThan(analysis.bestLap.lapTime);
    expect(analysis.worstLap.delta).toBeGreaterThan(0);

    expect(analysis.problemSector).toBeGreaterThanOrEqual(1);
    expect(analysis.problemSector).toBeLessThanOrEqual(3);

    expect(["heavy_braking", "low_throttle", "tyre_overheat", "inconsistency"]).toContain(analysis.issue);
    expect(analysis.coachingMessage.length).toBeGreaterThan(0);
  });

  test("worst lap delta equals worstLap.lapTime - bestLap.lapTime", async () => {
    await postIngest(telemetry);
    const res = await req("/analysis");
    const analysis = await res.json();
    expect(analysis.worstLap.delta).toBe(
      Math.round((analysis.worstLap.lapTime - analysis.bestLap.lapTime) * 1000) / 1000,
    );
  });
});
