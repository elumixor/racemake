import type { SectorNumber } from "domain/analysis";

export type { SectorNumber } from "domain/analysis";

export interface TrackConfig {
  name: string;
  /** Track position (0-1) where each sector ends */
  sectorBoundaries: [s1End: number, s2End: number];
  sectorNames: Record<SectorNumber, string>;
}

// Spa-Francorchamps — the only track supported for now.
// Add new tracks here and select via a parameter when multi-track is needed.
export const SPA: TrackConfig = {
  name: "Spa-Francorchamps",
  sectorBoundaries: [0.333, 0.667],
  sectorNames: {
    1: "Sector 1 — Eau Rouge through Kemmel",
    2: "Sector 2 — Les Combes to Fagnes",
    3: "Sector 3 — Stavelot to Bus Stop",
  },
};

const activeTrack = SPA;

export function getSector(pos: number): SectorNumber {
  const [s1End, s2End] = activeTrack.sectorBoundaries;
  if (pos < s1End) return 1;
  if (pos < s2End) return 2;
  return 3;
}

export function getSectorName(sector: SectorNumber): string {
  return activeTrack.sectorNames[sector];
}
