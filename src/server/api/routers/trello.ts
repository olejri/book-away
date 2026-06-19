import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { trelloBoardEmails } from "~/server/db/schema";
import { sendEmail } from "~/server/email";

export const trelloRouter = createTRPCRouter({
  createCard: protectedProcedure
    .input(
      z.object({
        boardEmailId: z.string(),
        title: z.string().min(1, "Card title cannot be empty").max(500),
        description: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const board = await ctx.db.query.trelloBoardEmails.findFirst({
        where: eq(trelloBoardEmails.id, input.boardEmailId),
      });

      if (!board || board.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Board not found. Please select a valid board in Settings.",
        });
      }

      await sendEmail({
        to: board.email,
        subject: input.title,
        body: input.description ?? input.title,
      });

      return { success: true };
    }),
});
