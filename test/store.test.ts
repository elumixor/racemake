import { test, expect, describe } from "bun:test";
import { Store } from "store";
import { frame } from "./helpers";

describe("Store", () => {
  test("starts empty", () => {
    const store = new Store();
    expect(store.numFrames).toBe(0);
    expect(store.numLaps).toBe(0);
    expect(store.frames).toEqual([]);
    expect(store.laps).toEqual([]);
  });

  test("tracks frames and unique sorted lap numbers", () => {
    const store = new Store();
    store.frames = [
      frame({ lap: 2 }),
      frame({ lap: 1 }),
      frame({ lap: 2 }),
      frame({ lap: 3 }),
    ];

    expect(store.numFrames).toBe(4);
    expect(store.numLaps).toBe(3);
    expect(store.laps).toEqual([1, 2, 3]);
  });

  test("replacing frames recomputes laps", () => {
    const store = new Store();
    store.frames = [frame({ lap: 1 }), frame({ lap: 2 })];
    expect(store.numLaps).toBe(2);

    store.frames = [frame({ lap: 5 })];
    expect(store.numLaps).toBe(1);
    expect(store.laps).toEqual([5]);
  });
});
