import { z } from "zod";
import { eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { userSettings } from "~/server/db/schema";

export const settingsRouter = createTRPCRouter({
  getTrelloEmail: protectedProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.query.userSettings.findFirst({
      where: eq(userSettings.userId, ctx.session.user.id),
    });
    return settings ?? null;
  }),

  upsertTrelloEmail: protectedProcedure
    .input(z.object({ trelloEmail: z.string().email("Invalid email address") }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.userSettings.findFirst({
        where: eq(userSettings.userId, ctx.session.user.id),
      });

      if (existing) {
        await ctx.db
          .update(userSettings)
          .set({ trelloEmail: input.trelloEmail })
          .where(eq(userSettings.userId, ctx.session.user.id));
      } else {
        await ctx.db.insert(userSettings).values({
          userId: ctx.session.user.id,
          trelloEmail: input.trelloEmail,
        });
      }

      return { success: true };
    }),

  deleteTrelloEmail: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .delete(userSettings)
      .where(eq(userSettings.userId, ctx.session.user.id));
    return { success: true };
  }),
});

