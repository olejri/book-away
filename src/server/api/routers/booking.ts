import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { bookings } from "~/server/db/schema";

export const bookingRouter = createTRPCRouter({
  getNumberOfPointsSpent: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.db.select().from(bookings)
    return result
  }),

  createBooking: protectedProcedure
    .input(
      z.object({
        from: z.date(),
        to: z.date(),
        pointsSpent: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db.insert(bookings).values({
        from: input.from,
        to: input.to,
        pointsSpent: input.pointsSpent,
        createdById: ctx.session.user.id,
      });
    }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
