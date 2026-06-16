import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { userSettings } from "~/server/db/schema";
import { sendEmail } from "~/server/email";

export const trelloRouter = createTRPCRouter({
  createCard: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1, "Card text cannot be empty").max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const settings = await ctx.db.query.userSettings.findFirst({
        where: eq(userSettings.userId, ctx.session.user.id),
      });

      if (!settings?.trelloEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "No Trello email configured. Please add your Trello board email in Settings.",
        });
      }

      await sendEmail({
        to: settings.trelloEmail,
        subject: input.text,
        body: input.text,
      });

      return { success: true };
    }),
});

