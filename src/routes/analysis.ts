import { Hono } from "hono";
import { analyze } from "services/analyze";
import type { Env } from "./middleware/store";

export const analysis = new Hono<Env>().get("/", (c) => {
  const store = c.get("store");

  if (store.numFrames === 0) {
    return c.json({ error: "No telemetry data — POST to /ingest first" }, 400);
  }

  const result = analyze(store.frames);

  if (!result) {
    return c.json({ error: "Not enough completed laps for comparison (need at least 2 distinct lap times)" }, 400);
  }

  return c.json(result);
});
