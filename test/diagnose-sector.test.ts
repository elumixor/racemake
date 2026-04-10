import { test, expect, describe } from "bun:test";
import { diagnoseSector } from "services/diagnose-sector";
import { frame } from "./helpers";

describe("diagnoseSector", () => {
  test("detects tyre_overheat when any tyre exceeds 110°C", () => {
    const frames = [
      frame({ tyres: { fl: 112, fr: 95, rl: 90, rr: 90 } }),
      frame({ tyres: { fl: 95, fr: 95, rl: 90, rr: 90 } }),
    ];
    expect(diagnoseSector(frames)).toBe("tyre_overheat");
  });

  test("detects tyre_overheat on rear tyres", () => {
    const frames = [
      frame({ tyres: { fl: 90, fr: 90, rl: 90, rr: 115 } }),
    ];
    expect(diagnoseSector(frames)).toBe("tyre_overheat");
  });

  test("detects heavy_braking at high speed", () => {
    const frames = [
      frame({ brk: 0.9, spd: 250 }),
      frame({ brk: 0.5, spd: 180 }),
    ];
    expect(diagnoseSector(frames)).toBe("heavy_braking");
  });

  test("does NOT flag heavy_braking at low speed", () => {
    const frames = [
      frame({ brk: 0.95, spd: 80 }), // hard brake but slow — not the "heavy_braking" pattern
      frame({ brk: 0.95, spd: 60 }),
    ];
    expect(diagnoseSector(frames)).not.toBe("heavy_braking");
  });

  test("detects inconsistency when speed stddev > 40", () => {
    // Huge speed variance: 50 and 250 → mean=150, stddev=100
    const frames = [
      frame({ spd: 50, thr: 0.8 }),
      frame({ spd: 250, thr: 0.8 }),
    ];
    expect(diagnoseSector(frames)).toBe("inconsistency");
  });

  test("detects low_throttle when avg < 0.6", () => {
    const frames = [
      frame({ spd: 150, thr: 0.3 }),
      frame({ spd: 155, thr: 0.4 }),
      frame({ spd: 148, thr: 0.35 }),
    ];
    expect(diagnoseSector(frames)).toBe("low_throttle");
  });

  test("tyre_overheat takes priority over heavy_braking", () => {
    const frames = [
      frame({ brk: 0.9, spd: 250, tyres: { fl: 115, fr: 95, rl: 90, rr: 90 } }),
    ];
    expect(diagnoseSector(frames)).toBe("tyre_overheat");
  });

  test("heavy_braking takes priority over inconsistency", () => {
    // Both heavy braking and inconsistent speeds
    const frames = [
      frame({ brk: 0.9, spd: 250, thr: 0.8 }),
      frame({ brk: 0.1, spd: 50, thr: 0.8 }),
    ];
    expect(diagnoseSector(frames)).toBe("heavy_braking");
  });

  test("returns null for clean sector", () => {
    const frames = [
      frame({ spd: 150, thr: 0.8, brk: 0.1 }),
      frame({ spd: 155, thr: 0.85, brk: 0.0 }),
      frame({ spd: 148, thr: 0.75, brk: 0.05 }),
    ];
    expect(diagnoseSector(frames)).toBeNull();
  });

  test("returns null for empty frames", () => {
    expect(diagnoseSector([])).toBeNull();
  });
});
