import { createMiddleware } from "hono/factory";

export const logger = createMiddleware(async (c, next) => {
  const start = performance.now();
  await next();
  const ms = (performance.now() - start).toFixed(1);
  console.log(`${c.req.method} ${c.req.path} → ${c.res.status} (${ms}ms)`);
});
