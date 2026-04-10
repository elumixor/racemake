import { test, expect, describe } from "bun:test";
import { generateCoaching } from "services/generate-coaching";
import type { DiagnosticDetails } from "domain/analysis";

function diag(overrides: Partial<DiagnosticDetails> & Pick<DiagnosticDetails, "issue">): DiagnosticDetails {
  return {
    peakTyreTemp: { tyre: "FL", temp: 90 },
    peakBrake: { brake: 0.5, speed: 150 },
    avgThrottle: 0.7,
    speedStddev: 20,
    ...overrides,
  };
}

describe("generateCoaching", () => {
  test("tyre_overheat references the hot tyre, temperature, and delta", () => {
    const msg = generateCoaching(1, diag({ issue: "tyre_overheat", peakTyreTemp: { tyre: "FL", temp: 114 } }), 3, 2.5);
    expect(msg).toContain("Eau Rouge");
    expect(msg).toContain("lap 3");
    expect(msg).toContain("FL");
    expect(msg).toContain("114°C");
    expect(msg).toContain("+2.5s");
  });

  test("heavy_braking references brake percentage, speed, and delta", () => {
    const msg = generateCoaching(
      2,
      diag({ issue: "heavy_braking", peakBrake: { brake: 0.92, speed: 248 } }),
      5,
      1.8,
    );
    expect(msg).toContain("Combes");
    expect(msg).toContain("92%");
    expect(msg).toContain("248");
    expect(msg).toContain("+1.8s");
  });

  test("low_throttle references throttle percentage and delta", () => {
    const msg = generateCoaching(3, diag({ issue: "low_throttle", avgThrottle: 0.42 }), 2, 3.1);
    expect(msg).toContain("Stavelot");
    expect(msg).toContain("42%");
    expect(msg).toContain("+3.1s");
  });

  test("inconsistency references speed stddev and delta", () => {
    const msg = generateCoaching(1, diag({ issue: "inconsistency", speedStddev: 55.3 }), 4, 0.9);
    expect(msg).toContain("Eau Rouge");
    expect(msg).toContain("55.3");
    expect(msg).toContain("+0.9s");
  });
});
