import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { bookings } from "~/server/db/schema";

export const bookingRouter = createTRPCRouter({
  getNumberOfPointsSpent: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(bookings);
  }),

  createBooking: protectedProcedure
    .input(
      z.object({
        weekId: z.number(),
        pointsSpent: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db.insert(bookings).values({
        weekId: input.weekId,
        pointsSpent: input.pointsSpent,
        from: new Date(),
        to: new Date(),
        createdById: ctx.session.user.id,
      });
    }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
