"use client";

import { api } from "~/trpc/react";
import dayjs from "dayjs";

export function GetWeeksBySeason( { seasonId } : { seasonId: string }) {
  const { data, isLoading, isError, error } = api.week.getWeeksBySeason.useQuery(+seasonId);

  if (isLoading) {
    return (
      <p>Loading...</p>
    );
  }

  if (isError) {
    return <p>{error?.message}</p>;
  }

  if(data?.length === 0) {
    return <p>No weeks found</p>;
  }

  return (
    <div>
      {data?.map((week, index) => (
        <p key={index}>WeekNr={week.weekNumber}{dayjs(week.from).format("DD.MM.YYYY")} - {dayjs(week.to).format("DD.MM.YYYY")}</p>
      ))}
    </div>
  );
}
