import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "./middleware/store";

export const ingest = new Hono<Env>().post(
  "/",
  zValidator(
    "json",
    z.array(
      z.object({
        ts: z.number(),
        lap: z.number().int(),
        pos: z.number().min(0).max(1),
        spd: z.number().min(0),
        thr: z.number().min(0).max(1),
        brk: z.number().min(0).max(1),
        str: z.number().min(-1).max(1),
        gear: z.number().int(),
        rpm: z.number().min(0),
        tyres: z.object({
          fl: z.number(),
          fr: z.number(),
          rl: z.number(),
          rr: z.number(),
        }),
      }),
    ),
  ),
  (c) => {
    const store = c.get("store");
    store.frames = c.req.valid("json");
    return c.json({ laps: store.numLaps, frames: store.numFrames });
  },
);
