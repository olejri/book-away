import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { eq, inArray } from "drizzle-orm";
import { bookings, users, weeks } from "~/server/db/schema";

export const weekRouter = createTRPCRouter({
  getWeeksBySeason: protectedProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      const weekRes = await ctx.db
        .select()
        .from(weeks)
        .where(eq(weeks.seasonId, input));

      const weekIds = weekRes.map((week) => week.id);

      const bookingRes = await ctx.db
        .select()
        .from(bookings)
        .innerJoin(users, eq(bookings.createdById, users.id))
        .where(inArray(bookings.weekId, weekIds));

      const weekIdMap = new Map<number, BookingResponse[]>();
      bookingRes.forEach((bookingPlusUser) => {
        const weekId = bookingPlusUser.booking.weekId ?? 0;
        if (weekIdMap.has(weekId)) {
          weekIdMap.get(weekId)?.push({
            id: bookingPlusUser.booking.id,
            pointsSpent: bookingPlusUser.booking.pointsSpent,
            status: bookingPlusUser.booking.status,
            user: {
              name: bookingPlusUser.user.name,
            },
          });
        } else {
          weekIdMap.set(weekId, [{
            id: bookingPlusUser.booking.id,
            pointsSpent: bookingPlusUser.booking.pointsSpent,
            status: bookingPlusUser.booking.status,
            user: {
              name: bookingPlusUser.user.name,
            },
          }]);
        }
      });

      return weekRes.map((week) => {
        const bookings = weekIdMap.get(week.id) ?? [];
        return {
          id: week.id,
          weekNumber: week.weekNumber,
          from: week.from,
          to: week.to,
          weekStatus: week.weekStatus,
          notBookableDays: week.notBookableDays,
          bookings,
        } as WeekResponse;
      });
    }),
});

export type BookingResponse = {
  id: number;
  pointsSpent: number;
  status: "APPLIED" | "BOOKED" | "CANCELLED" | null;
  user: {
    name: string | null;
  };
};

export type WeekResponse = {
  id: number;
  weekNumber: number;
  from: Date;
  to: Date;
  weekStatus: "FULLY_BOOKABLE" | "PARTIALLY_BOOKABLE" | "NOT_BOOKABLE";
  notBookableDays: Date[];
  bookings: BookingResponse[];
};
