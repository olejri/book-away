import { z } from "zod";

import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import utc from "dayjs/plugin/utc";
import { adminProcedure, createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { bookings, seasons, weeks } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";
import { eq, inArray, or } from "drizzle-orm";

dayjs.extend(weekOfYear);
dayjs.extend(utc);

export const seasonRouter = createTRPCRouter({
  changeSeasonStatus: adminProcedure
    .input(
      z.object({
        seasonId: z.number(),
        status: z.enum(["DRAFT", "OPEN", "CLOSED", "DELETED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(seasons)
        .set({ seasonStatus: input.status })
        .where(eq(seasons.id, input.seasonId));

      if(input.status === "CLOSED") {
        const weekRes = await ctx.db
          .select({
            id: weeks.id,
          })
          .from(weeks)
          .where(eq(weeks.seasonId, input.seasonId));

        await ctx.db
          .update(bookings)
          .set({
            status: "BOOKED",
            updatedAt: new Date(),
          })
          .where(inArray(bookings.weekId, weekRes.map((week) => week.id)));
      }
      if(input.status === "DELETED") {
        //delete all weeks
        await ctx.db.delete(weeks).where(eq(weeks.seasonId, input.seasonId));
        await ctx.db.delete(seasons).where(eq(seasons.id, input.seasonId));
      }
    }),

  createSeason: adminProcedure
    .input(
      z.object({
        name: z.string(),
        seasonCost: z.number(),
        from: z.date(),
        to: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const season = await ctx.db
        .insert(seasons)
        .values({
          from: input.from,
          to: input.to,
          name: input.name,
          seasonCost: input.seasonCost,
          createdById: ctx.session.user.id,
        })
        .returning({
          id: seasons.id,
        });

      const seasonId = season[0]?.id;
      if (seasonId === undefined) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create season",
        });
      }

      const firstWeek = dayjs(input.from).week();
      const lastWeek = dayjs(input.to).week();

      const weekInputs: Array<WeekInput> = [];

      for (let i = firstWeek; i <= lastWeek; i++) {
        const startOfWeek = dayjs(input.from).startOf("week");
        const from = startOfWeek
          .add(i - 1, "week")
          .add(1, "day")
          .toDate();
        const to = dayjs(input.from)
          .startOf("week")
          .add(i - 1, "week")
          .add(7, "day")
          .toDate();
        weekInputs.push({
          seasonId: seasonId,
          weekNumber: i,
          notBookableDays: [],
          weekStatus: "FULLY_BOOKABLE",
          from: from,
          to: to,
        });
      }
      await ctx.db.insert(weeks).values(weekInputs);

      return {
        seasonId: seasonId,
      };
    }),

  getSeasonStatusById: protectedProcedure.input(z.number()).query(async ({ ctx, input }) => {
    return await ctx.db
      .select({
        status: seasons.seasonStatus
      })
      .from(seasons)
      .where(eq(seasons.id, input));
  }),


  fetchAllSeasonWithStatusDraftOrOpen: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select()
      .from(seasons)
      .where(
        or(eq(seasons.seasonStatus, "DRAFT"), eq(seasons.seasonStatus, "OPEN")),
      );
  }),

  removeSeason: adminProcedure
    .input(
      z.object({
        seasonId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(weeks).where(eq(weeks.seasonId, input.seasonId));
      await ctx.db.delete(seasons).where(eq(seasons.id, input.seasonId));
    }),

  fetchAllOpenOrClosedSeasons: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select()
      .from(seasons)
      .where(
        or(eq(seasons.seasonStatus, "OPEN"), eq(seasons.seasonStatus, "CLOSED")),
      );
  }),
});

export type WeekInput = {
  seasonId: number;
  weekNumber: number;
  notBookableDays: Array<Date>;
  weekStatus: "FULLY_BOOKABLE" | "PARTIALLY_BOOKABLE" | "NOT_BOOKABLE";
  from: Date;
  to: Date;
};