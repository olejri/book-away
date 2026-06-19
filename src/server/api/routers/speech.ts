import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { env } from "~/env";

export const speechRouter = createTRPCRouter({
  /**
   * Returns the Cloudflare Worker URL and API key.
   * Only available to authenticated users — keeps the API key off the client
   * until the user has a valid session.
   */
  getWorkerConfig: protectedProcedure.query(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const workerUrl: string = env.CLOUDFLARE_WORKER_URL;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const apiKey: string = env.CLOUDFLARE_WORKER_API_KEY;
    return { workerUrl, apiKey };
  }),
});

