import { createMiddleware } from "hono/factory";
import type { Store } from "store";

export type Env = {
  Variables: {
    store: Store;
  };
};

export function useStore(store: Store) {
  return createMiddleware<Env>(async (c, next) => {
    c.set("store", store);
    await next();
  });
}
