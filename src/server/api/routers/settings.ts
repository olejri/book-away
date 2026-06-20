import { z } from "zod";
import { eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { userSettings, trelloBoardEmails, userLabels } from "~/server/db/schema";

export const settingsRouter = createTRPCRouter({
  // ── Legacy single-email (kept for backward compat) ────────────────────────
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

  // ── Multi-board emails ────────────────────────────────────────────────────
  getBoardEmails: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.trelloBoardEmails.findMany({
      where: eq(trelloBoardEmails.userId, ctx.session.user.id),
    });
  }),

  addBoardEmail: protectedProcedure
    .input(
      z.object({
        nickname: z.string().min(1).max(100),
        email: z.string().email("Invalid email address"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(trelloBoardEmails).values({
        userId: ctx.session.user.id,
        nickname: input.nickname,
        email: input.email,
      });
      return { success: true };
    }),

  updateBoardEmail: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        nickname: z.string().min(1).max(100).optional(),
        email: z.string().email("Invalid email address").optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(trelloBoardEmails)
        .set({
          ...(input.nickname && { nickname: input.nickname }),
          ...(input.email && { email: input.email }),
        })
        .where(
          eq(trelloBoardEmails.id, input.id),
        );
      return { success: true };
    }),

  deleteBoardEmail: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(trelloBoardEmails)
        .where(eq(trelloBoardEmails.id, input.id));
      return { success: true };
    }),

  // ── User-defined labels ───────────────────────────────────────────────────
  getLabels: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.userLabels.findMany({
      where: eq(userLabels.userId, ctx.session.user.id),
      orderBy: (t, { asc }) => [asc(t.createdAt)],
    });
  }),

  addLabel: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(userLabels).values({
        userId: ctx.session.user.id,
        name: input.name,
        color: input.color,
      });
      return { success: true };
    }),

  updateLabel: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color").optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(userLabels)
        .set({
          ...(input.name && { name: input.name }),
          ...(input.color && { color: input.color }),
        })
        .where(eq(userLabels.id, input.id));
      return { success: true };
    }),

  deleteLabel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(userLabels).where(eq(userLabels.id, input.id));
      return { success: true };
    }),
});
