import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { settingsRouter } from "~/server/api/routers/settings";
import { trelloRouter } from "~/server/api/routers/trello";
import { speechRouter } from "~/server/api/routers/speech";
import { fastingRouter } from "~/server/api/routers/fasting";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  settings: settingsRouter,
  trello: trelloRouter,
  speech: speechRouter,
  fasting: fastingRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
