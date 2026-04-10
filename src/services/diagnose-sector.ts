import type { Issue } from "domain/analysis";
import type { TelemetryFrame } from "domain/telemetry";

// Diagnostic thresholds — tune these to adjust sensitivity
const TYRE_TEMP_MAX = 110; // °C, any tyre above this = overheat
const HEAVY_BRAKE_THRESHOLD = 0.8; // brake input (0-1)
const HEAVY_BRAKE_MIN_SPEED = 200; // km/h, braking only counts as "heavy" at high speed
const SPEED_STDDEV_MAX = 40; // km/h, above this = inconsistent
const THROTTLE_AVG_MIN = 0.6; // mean throttle below this = too timid

/**
 * Diagnose the primary issue in a sector's telemetry.
 *
 * Returns the most severe issue found, or null if the sector looks clean.
 * Severity order: tyre_overheat > heavy_braking > inconsistency > low_throttle.
 *
 * Aggregates are collected in a single pass; only the variance computation
 * requires a second pass (needs the mean first).
 */
export function diagnoseSector(frames: TelemetryFrame[]): Issue | null {
  if (frames.length === 0) return null;

  let hasTyreOverheat = false;
  let hasHeavyBraking = false;
  let totalSpeed = 0;
  let totalThrottle = 0;

  for (const f of frames) {
    const { fl, fr, rl, rr } = f.tyres;
    if (fl > TYRE_TEMP_MAX || fr > TYRE_TEMP_MAX || rl > TYRE_TEMP_MAX || rr > TYRE_TEMP_MAX)
      hasTyreOverheat = true;
    if (f.brk > HEAVY_BRAKE_THRESHOLD && f.spd > HEAVY_BRAKE_MIN_SPEED)
      hasHeavyBraking = true;
    totalSpeed += f.spd;
    totalThrottle += f.thr;
  }

  if (hasTyreOverheat) return "tyre_overheat";
  if (hasHeavyBraking) return "heavy_braking";

  // Second pass: variance requires the mean computed above
  const mean = totalSpeed / frames.length;
  let variance = 0;
  for (const f of frames) variance += (f.spd - mean) ** 2;

  if (Math.sqrt(variance / frames.length) > SPEED_STDDEV_MAX) return "inconsistency";
  if (totalThrottle / frames.length < THROTTLE_AVG_MIN) return "low_throttle";

  return null;
}
