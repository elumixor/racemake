import { test, expect, describe } from "bun:test";
import { generateCoaching } from "services/generate-coaching";

describe("generateCoaching", () => {
  test("includes sector name for tyre_overheat", () => {
    const msg = generateCoaching(1, "tyre_overheat", 3);
    expect(msg).toContain("Eau Rouge");
    expect(msg).toContain("lap 3");
    expect(msg.toLowerCase()).toContain("tyre");
  });

  test("includes sector name for heavy_braking", () => {
    const msg = generateCoaching(2, "heavy_braking", 5);
    expect(msg).toContain("Combes");
    expect(msg).toContain("brak");
  });

  test("includes sector name for low_throttle", () => {
    const msg = generateCoaching(3, "low_throttle", 2);
    expect(msg).toContain("Stavelot");
    expect(msg.toLowerCase()).toContain("throttle");
  });

  test("includes sector name for inconsistency", () => {
    const msg = generateCoaching(1, "inconsistency", 4);
    expect(msg).toContain("Eau Rouge");
    expect(msg.toLowerCase()).toContain("smooth");
  });

  test("provides a message even when issue is null", () => {
    const msg = generateCoaching(2, null, 1);
    expect(msg.length).toBeGreaterThan(0);
    expect(msg).toContain("Combes");
  });
});
