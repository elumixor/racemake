import { Hono } from "hono";
import { analyze } from "services/analyze";
import type { Env } from "./middleware/store";

export const analysis = new Hono<Env>().get("/", (c) => {
  const store = c.get("store");
  const result = analyze(store.frames);
  if (!result) return c.json({ error: "Not enough completed laps for analysis" }, 400);
  return c.json(result);
});
