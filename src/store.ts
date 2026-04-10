import type { TelemetryFrame } from "domain/telemetry";

export class Store {
  private _frames: TelemetryFrame[] = [];
  private _laps: number[] = [];

  get frames() {
    return this._frames;
  }

  set frames(data) {
    this._frames = data;
    this._laps = Array.from(new Set(data.map((f) => f.lap))).sort((a, b) => a - b);
  }

  get numFrames() {
    return this._frames.length;
  }

  get laps() {
    return this._laps;
  }

  get numLaps() {
    return this._laps.length;
  }
}
