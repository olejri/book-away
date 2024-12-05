import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { eq } from "drizzle-orm";
import { weeks } from "~/server/db/schema";

export const weekRouter = createTRPCRouter({
  getWeeksBySeason: protectedProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      return await ctx.db.select().from(weeks).where(eq(weeks.seasonId, input));
    }),
});
