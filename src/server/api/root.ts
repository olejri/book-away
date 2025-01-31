import { bookingRouter } from "~/server/api/routers/booking";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { seasonRouter } from "~/server/api/routers/season";
import { weekRouter } from "~/server/api/routers/weeks";
import { userRouter } from "~/server/api/routers/user";
import { infoRouter } from "~/server/api/routers/info";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  booking: bookingRouter,
  season: seasonRouter,
  week: weekRouter,
  user: userRouter,
  info: infoRouter,
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
