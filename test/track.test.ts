import { test, expect, describe } from "bun:test";
import { getSector, getSectorName } from "services/track";

describe("getSector", () => {
  test("pos 0.0 is sector 1", () => expect(getSector(0.0)).toBe(1));
  test("pos 0.2 is sector 1", () => expect(getSector(0.2)).toBe(1));
  test("pos 0.333 is sector 2 (boundary is exclusive for S1)", () => expect(getSector(0.333)).toBe(2));
  test("pos 0.5 is sector 2", () => expect(getSector(0.5)).toBe(2));
  test("pos 0.667 is sector 3 (boundary is exclusive for S2)", () => expect(getSector(0.667)).toBe(3));
  test("pos 0.9 is sector 3", () => expect(getSector(0.9)).toBe(3));
});

describe("getSectorName", () => {
  test("returns names for all sectors", () => {
    expect(getSectorName(1)).toContain("Eau Rouge");
    expect(getSectorName(2)).toContain("Combes");
    expect(getSectorName(3)).toContain("Stavelot");
  });
});
