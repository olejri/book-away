import { z } from "zod";

import { adminProcedure, createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { eq, inArray } from "drizzle-orm";
import { bookings, users, weeks } from "~/server/db/schema";

export const weekRouter = createTRPCRouter({
  getWeeksBySeason: protectedProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      const weekRes = await ctx.db
        .select({
          id: weeks.id,
          weekNumber: weeks.weekNumber,
          from: weeks.from,
          to: weeks.to,
          weekStatus: weeks.weekStatus,
          notBookableDays: weeks.notBookableDays,
        })
        .from(weeks)
        .where(eq(weeks.seasonId, input));

      const weekIds = weekRes.map((week) => week.id);
      const bookingRes = await ctx.db
        .select({
          bookingId: bookings.id,
          weekId: bookings.weekId,
          pointsSpent: bookings.pointsSpent,
          priority: bookings.priority,
          status: bookings.status,
          name: users.name,
          userId: users.id,
          image: users.image,
        })
        .from(bookings)
        .innerJoin(users, eq(bookings.createdById, users.id))
        .where(inArray(bookings.weekId, weekIds));

      const weekIdMap = new Map<number, BookingResponse[]>();
      bookingRes.forEach((b) => {
        const weekId = b.weekId ?? 0;
        if (weekIdMap.has(weekId)) {
          weekIdMap.get(weekId)?.push({
            id: b.bookingId,
            pointsSpent: b.pointsSpent,
            priority: b.priority,
            bookingByUser: b.userId === ctx.session.user.id,
            status: b.status,
            name: b.name,
            image: b.image,
          });
        } else {
          weekIdMap.set(weekId, [{
            id: b.bookingId,
            pointsSpent: b.pointsSpent,
            priority: b.priority,
            bookingByUser: b.userId === ctx.session.user.id,
            status: b.status,
            name: b.name,
            image: b.image,
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

  markWeekAsUnavailable: adminProcedure
    .input(z.object({
      weekId: z.number(),
      weekStatus: z.enum(["FULLY_BOOKABLE",
        "PARTIALLY_BOOKABLE",
        "NOT_BOOKABLE"]),
      notBookableDays: z.array(z.date()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(weeks)
        .set({
          weekStatus: input.weekStatus,
          notBookableDays: input.notBookableDays ?? null,
        })
        .where(eq(weeks.id, input.weekId))
    }),
});

export type BookingResponse = {
  id: number;
  pointsSpent: number;
  bookingByUser: boolean;
  priority: "PRIORITY_1" | "PRIORITY_2";
  status: "APPLIED" | "BOOKED" | "CANCELLED" | null;
  name: string | null
  image: string | null;
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
