import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { and, eq, sql } from "drizzle-orm";
import { bookings, weeks } from "~/server/db/schema";

export const userRouter = createTRPCRouter({
    getUsedPoints: protectedProcedure
        .query(async ({ ctx }) => {
           const res = await ctx.db
            .select(
              {
                pointSpent: bookings.pointsSpent
              }
            )
            .from(bookings)
            .where(
              and(
                eq(bookings.createdById, ctx.session.user.id),
                eq(bookings.status, "BOOKED")
              )
            );
           // sum of points spent by all bookings
            return res.reduce((acc, cur) => acc + cur.pointSpent, 0);
        }),

  //get next upcoming booked week
  getNextBookedWeek: protectedProcedure
    .query(async ({ ctx }) => {
      const weekRes = await ctx.db
        .select({
          weekNumber: weeks.weekNumber,
          from: weeks.from,
          to: weeks.to,
        })
        .from(bookings)
        .innerJoin(weeks, eq(bookings.weekId, weeks.id))
        .where(
          and(eq(bookings.createdById, ctx.session.user.id),
            eq(bookings.status, "BOOKED"))
        ).orderBy(sql`${bookings.from} asc limit 1`);

      if(weekRes.length === 0) {
        return [];
      }
      return weekRes[0];
    }),
});

