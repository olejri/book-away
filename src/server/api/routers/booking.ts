import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { bookings } from "~/server/db/schema";
import {  eq, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const bookingRouter = createTRPCRouter({
  getNumberOfPointsSpent: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(bookings);
  }),

  createBooking: protectedProcedure
    .input(
      z.object({
        weekId: z.number(),
        pointsSpent: z.number(),
        priority: z.enum(["PRIORITY_1", "PRIORITY_2"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      //check if user has booked for this week and if the week is not booked
      const booking = await ctx.db
        .select({
          bookingId: bookings.id,
        })
        .from(bookings)
        .where(
          or(
            eq(bookings.weekId, input.weekId),
            eq(bookings.status, "BOOKED"),
          ),
        );

      if(booking.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You have already booked for this week",
        });
      }

      await ctx.db.insert(bookings).values({
        weekId: input.weekId,
        pointsSpent: input.pointsSpent,
        priority: input.priority,
        from: new Date(),
        to: new Date(),
        createdById: ctx.session.user.id,
      });
    }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
