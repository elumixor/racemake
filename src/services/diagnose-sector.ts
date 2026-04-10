import type { DiagnosticDetails } from "domain/analysis";
import type { TelemetryFrame } from "domain/telemetry";

// Diagnostic thresholds — tune these to adjust sensitivity
const TYRE_TEMP_MAX = 110; // °C, any tyre above this = overheat
const HEAVY_BRAKE_THRESHOLD = 0.8; // brake input (0-1)
const HEAVY_BRAKE_MIN_SPEED = 200; // km/h, braking only counts as "heavy" at high speed
const SPEED_STDDEV_MAX = 40; // km/h, above this = inconsistent
const THROTTLE_AVG_MIN = 0.6; // mean throttle below this = too timid

const TYRE_NAMES = ["FL", "FR", "RL", "RR"] as const;
const TYRE_KEYS = ["fl", "fr", "rl", "rr"] as const;

type TyreKey = (typeof TYRE_KEYS)[number];
type TyreName = (typeof TYRE_NAMES)[number];

/**
 * Diagnose the primary issue in a sector's telemetry.
 * Always computes all metrics so coaching messages can reference secondary data.
 *
 * Returns null if the sector has no frames or no threshold is exceeded.
 * Severity order: tyre_overheat > heavy_braking > inconsistency > low_throttle.
 */
export function diagnoseSector(frames: TelemetryFrame[]): DiagnosticDetails | null {
  if (frames.length === 0) return null;

  let peakTyre = { tyre: "FL" as string, temp: 0 };
  let peakBrake = { brake: 0, speed: 0 };
  let totalSpeed = 0;
  let totalThrottle = 0;

  for (const f of frames) {
    for (let t = 0; t < TYRE_KEYS.length; t++) {
      const temp = f.tyres[TYRE_KEYS[t] as TyreKey];
      if (temp > peakTyre.temp) peakTyre = { tyre: TYRE_NAMES[t] as TyreName, temp };
    }
    if (f.brk > peakBrake.brake && f.spd > HEAVY_BRAKE_MIN_SPEED) {
      peakBrake = { brake: f.brk, speed: f.spd };
    }
    totalSpeed += f.spd;
    totalThrottle += f.thr;
  }

  const avgThrottle = Math.round((totalThrottle / frames.length) * 100) / 100;

  const mean = totalSpeed / frames.length;
  let variance = 0;
  for (const f of frames) variance += (f.spd - mean) ** 2;
  const speedStddev = Math.round(Math.sqrt(variance / frames.length) * 10) / 10;

  // Determine the primary issue by severity order
  let issue: DiagnosticDetails["issue"] | null = null;
  if (peakTyre.temp > TYRE_TEMP_MAX) issue = "tyre_overheat";
  else if (peakBrake.brake > HEAVY_BRAKE_THRESHOLD) issue = "heavy_braking";
  else if (speedStddev > SPEED_STDDEV_MAX) issue = "inconsistency";
  else if (avgThrottle < THROTTLE_AVG_MIN) issue = "low_throttle";

  if (!issue) return null;

  return { issue, peakTyreTemp: peakTyre, peakBrake, avgThrottle, speedStddev };
}
