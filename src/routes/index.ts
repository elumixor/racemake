import { Hono } from "hono";
import { Store } from "store";
import { analysis } from "./analysis";
import { ingest } from "./ingest";
import { laps } from "./laps";
import { logger } from "./middleware/logger";
import { useStore } from "./middleware/store";

export const app = new Hono()
  .use("*", logger)
  .use("*", useStore(new Store()))
  .route("/ingest", ingest)
  .route("/laps", laps)
  .route("/analysis", analysis);
