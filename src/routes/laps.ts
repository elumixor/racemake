import { Hono } from "hono";
import { computeLapSummaries } from "services/compute-lap-summaries";
import type { Env } from "./middleware/store";

export const laps = new Hono<Env>().get("/", (c) => {
  const store = c.get("store");
  return c.json(computeLapSummaries(store.frames).summaries);
});
