import { test, expect, describe } from "bun:test";
import { diagnoseSector } from "services/diagnose-sector";
import { frame } from "./helpers";

describe("diagnoseSector", () => {
  test("detects tyre_overheat when any tyre exceeds 110°C", () => {
    const result = diagnoseSector([
      frame({ tyres: { fl: 112, fr: 95, rl: 90, rr: 90 } }),
      frame({ tyres: { fl: 95, fr: 95, rl: 90, rr: 90 } }),
    ]);
    expect(result?.issue).toBe("tyre_overheat");
    expect(result?.peakTyreTemp.tyre).toBe("FL");
    expect(result?.peakTyreTemp.temp).toBe(112);
  });

  test("detects tyre_overheat on rear tyres", () => {
    const result = diagnoseSector([frame({ tyres: { fl: 90, fr: 90, rl: 90, rr: 115 } })]);
    expect(result?.issue).toBe("tyre_overheat");
    expect(result?.peakTyreTemp.tyre).toBe("RR");
    expect(result?.peakTyreTemp.temp).toBe(115);
  });

  test("detects heavy_braking at high speed", () => {
    const result = diagnoseSector([frame({ brk: 0.9, spd: 250 }), frame({ brk: 0.5, spd: 180 })]);
    expect(result?.issue).toBe("heavy_braking");
    expect(result?.peakBrake.brake).toBe(0.9);
    expect(result?.peakBrake.speed).toBe(250);
  });

  test("does NOT flag heavy_braking at low speed", () => {
    const result = diagnoseSector([
      frame({ brk: 0.95, spd: 80 }), // hard brake but slow — not the "heavy_braking" pattern
      frame({ brk: 0.95, spd: 60 }),
    ]);
    expect(result?.issue).not.toBe("heavy_braking");
  });

  test("detects inconsistency when speed stddev > 40", () => {
    // Huge speed variance: 50 and 250 → mean=150, stddev=100
    const result = diagnoseSector([frame({ spd: 50, thr: 0.8 }), frame({ spd: 250, thr: 0.8 })]);
    expect(result?.issue).toBe("inconsistency");
    expect(result?.speedStddev).toBeGreaterThan(40);
  });

  test("detects low_throttle when avg < 0.6", () => {
    const result = diagnoseSector([
      frame({ spd: 150, thr: 0.3 }),
      frame({ spd: 155, thr: 0.4 }),
      frame({ spd: 148, thr: 0.35 }),
    ]);
    expect(result?.issue).toBe("low_throttle");
    expect(result?.avgThrottle).toBeLessThan(0.6);
  });

  test("tyre_overheat takes priority over heavy_braking", () => {
    const result = diagnoseSector([
      frame({ brk: 0.9, spd: 250, tyres: { fl: 115, fr: 95, rl: 90, rr: 90 } }),
    ]);
    expect(result?.issue).toBe("tyre_overheat");
  });

  test("heavy_braking takes priority over inconsistency", () => {
    const result = diagnoseSector([
      frame({ brk: 0.9, spd: 250, thr: 0.8 }),
      frame({ brk: 0.1, spd: 50, thr: 0.8 }),
    ]);
    expect(result?.issue).toBe("heavy_braking");
  });

  test("always includes all metrics when an issue is detected", () => {
    const result = diagnoseSector([
      frame({ spd: 150, thr: 0.3, brk: 0.1, tyres: { fl: 95, fr: 95, rl: 90, rr: 90 } }),
      frame({ spd: 155, thr: 0.4, brk: 0.0, tyres: { fl: 96, fr: 96, rl: 91, rr: 91 } }),
    ]);
    expect(result).not.toBeNull();
    // All metric fields are present regardless of which issue triggered
    expect(result?.peakTyreTemp).toBeDefined();
    expect(result?.peakBrake).toBeDefined();
    expect(typeof result?.avgThrottle).toBe("number");
    expect(typeof result?.speedStddev).toBe("number");
  });

  test("returns null for clean sector", () => {
    expect(
      diagnoseSector([
        frame({ spd: 150, thr: 0.8, brk: 0.1 }),
        frame({ spd: 155, thr: 0.85, brk: 0.0 }),
        frame({ spd: 148, thr: 0.75, brk: 0.05 }),
      ]),
    ).toBeNull();
  });

  test("returns null for empty frames", () => {
    expect(diagnoseSector([])).toBeNull();
  });
});
