import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { bookings, seasons, users, weeks } from "~/server/db/schema";
import { and, eq, inArray } from "drizzle-orm";
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
      const seasonForGivenWeek = await ctx.db.select({
        seasonId: weeks.seasonId,
      }).from(weeks)
        .where(eq(weeks.id, input.weekId));

      if(seasonForGivenWeek.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const seasonId = seasonForGivenWeek[0]?.seasonId ?? 0;
      const bookingIdsToRemove = await ctx.db.select({
        bookingId: bookings.id,
      }).from(weeks)
        .innerJoin(seasons, eq(weeks.seasonId, seasons.id))
        .innerJoin(bookings, eq(weeks.id, bookings.weekId))
        .innerJoin(users, eq(bookings.createdById, users.id))
        .where(and(
          eq(users.id, ctx.session.user.id ),
          eq(bookings.priority, input.priority),
          eq(bookings.status, "APPLIED"),
          eq(weeks.seasonId, seasonId),
        ));

      await ctx.db.delete(bookings).where(inArray(bookings.id, bookingIdsToRemove.map((b) => b.bookingId)));
      await ctx.db.insert(bookings).values({
        weekId: input.weekId,
        pointsSpent: input.pointsSpent,
        priority: input.priority,
        from: new Date(),
        to: new Date(),
        createdById: ctx.session.user.id,
      });
    }),
});
