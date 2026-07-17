import { z } from "zod";
import { eq, desc, and, isNull } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { fastingSessions } from "~/server/db/schema";

export const fastingRouter = createTRPCRouter({
  getActiveFast: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.fastingSessions.findFirst({
      where: and(
        eq(fastingSessions.userId, ctx.session.user.id),
        isNull(fastingSessions.endedAt),
      ),
      orderBy: (t, { desc }) => [desc(t.startedAt)],
    });
  }),

  startFast: protectedProcedure
    .input(
      z.object({
        startedAt: z.string().datetime(),
        goalHours: z.number().int().min(1).max(240),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // End any lingering active fasts first
      await ctx.db
        .update(fastingSessions)
        .set({ endedAt: new Date() })
        .where(
          and(
            eq(fastingSessions.userId, ctx.session.user.id),
            isNull(fastingSessions.endedAt),
          ),
        );

      const [session] = await ctx.db
        .insert(fastingSessions)
        .values({
          userId: ctx.session.user.id,
          startedAt: new Date(input.startedAt),
          goalHours: input.goalHours,
        })
        .returning();

      return session;
    }),

  endFast: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(fastingSessions)
        .set({ endedAt: new Date() })
        .where(
          and(
            eq(fastingSessions.id, input.id),
            eq(fastingSessions.userId, ctx.session.user.id),
          ),
        );
      return { success: true };
    }),

  getHistory: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.fastingSessions.findMany({
        where: eq(fastingSessions.userId, ctx.session.user.id),
        orderBy: [desc(fastingSessions.startedAt)],
        limit: input.limit,
      });
    }),
});
