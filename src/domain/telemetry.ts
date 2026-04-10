export interface TelemetryFrame {
  ts: number;
  lap: number;
  pos: number; // trackPosition 0.0 - 1.0
  spd: number; // km/h
  thr: number; // 0-1
  brk: number; // 0-1
  str: number; // -1 to 1
  gear: number;
  rpm: number;
  tyres: { fl: number; fr: number; rl: number; rr: number };
}
