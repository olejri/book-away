import { z } from "zod";

import dayjs from "dayjs";
import weekOfYear from 'dayjs/plugin/weekOfYear'
import utc from 'dayjs/plugin/utc'
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { seasons, weeks } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";

dayjs.extend(weekOfYear)
dayjs.extend(utc)

export const seasonRouter = createTRPCRouter({
  createSeason: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        from: z.date(),
        to: z.date()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const season = await ctx.db.insert(seasons).values({
        from: input.from,
        to: input.to,
        name: input.name,
        createdById: ctx.session.user.id,
      }).returning({
        id: seasons.id,
      });

      const seasonId = season[0]?.id;
      if (seasonId === undefined) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create season"
        });
      }

      const firstWeek = dayjs(input.from).week();
      const lastWeek = dayjs(input.to).week();

      const weekInputs: Array<WeekInput> = [];

      for (let i = firstWeek; i <= lastWeek; i++) {
        const startOfWeek = dayjs(input.from).startOf("week");
        const from = startOfWeek.add(i-1, "week").add(1, "day").toDate();
        const to = dayjs(input.from).startOf("week").add(i-1, "week").add(7,"day").toDate();
        console.log(startOfWeek.toDate(), from, to);
        weekInputs.push({
          seasonId: seasonId,
          weekNumber: i,
          notBookableDays: [],
          weekStatus: "FULLY_BOOKABLE",
          from: from,
          to: to,
        });
      }
      await ctx.db.insert(weeks).values(weekInputs)

      return {
        seasonId: seasonId
      };
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