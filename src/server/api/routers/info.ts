import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { info } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";


export const infoRouter = createTRPCRouter({
  getInfo: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.select({
      type: info.type,
      hasSeen: info.hasSeen,
    }).from(info)
      .where(eq(info.userId, ctx.session.user.id));
  }),

  markAsSeen: protectedProcedure
    .input(
      z.object({
        type: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db.insert(info)
        .values({
          type: input.type,
          hasSeen: true,
          userId: ctx.session.user.id,
        }).onConflictDoUpdate({
          target: [info.userId, info.type],
          set: {
            hasSeen: true,
          },
        });
    }),
});

