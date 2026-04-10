import { test, expect, describe } from "bun:test";
import { generateCoaching } from "services/generate-coaching";

describe("generateCoaching", () => {
  test("tyre_overheat references the hot tyre and temperature", () => {
    const msg = generateCoaching(1, { issue: "tyre_overheat", peakTyreTemp: { tyre: "FL", temp: 114 } }, 3);
    expect(msg).toContain("Eau Rouge");
    expect(msg).toContain("lap 3");
    expect(msg).toContain("FL");
    expect(msg).toContain("114°C");
  });

  test("heavy_braking references brake percentage and speed", () => {
    const msg = generateCoaching(2, { issue: "heavy_braking", peakBrake: { brake: 0.92, speed: 248 } }, 5);
    expect(msg).toContain("Combes");
    expect(msg).toContain("92%");
    expect(msg).toContain("248");
  });

  test("low_throttle references throttle percentage", () => {
    const msg = generateCoaching(3, { issue: "low_throttle", avgThrottle: 0.42 }, 2);
    expect(msg).toContain("Stavelot");
    expect(msg).toContain("42%");
  });

  test("inconsistency references speed stddev", () => {
    const msg = generateCoaching(1, { issue: "inconsistency", speedStddev: 55.3 }, 4);
    expect(msg).toContain("Eau Rouge");
    expect(msg).toContain("55.3");
  });
});
