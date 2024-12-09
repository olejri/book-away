"use client"


import { api } from "~/trpc/react";
import dayjs from "dayjs";

export function UserView()  {
  const [pointsSpent] = api.user.getUsedPoints.useSuspenseQuery();
  const [nextBookedWeek] = api.user.getNextBookedWeek.useSuspenseQuery();

  //dayjs format from and to
  const from = dayjs(nextBookedWeek?.from).format("DD.MM.YYYY");
  const to = dayjs(nextBookedWeek?.to).format("DD.MM.YYYY");

  //calculate of long until your next booked week starts from now in days
  const daysUntilNextBookedWeek = dayjs(nextBookedWeek?.from).diff(dayjs(), "day");

  return <>
    <p>Points spent: {pointsSpent}</p>
    <p>Your next booked week is from {from} to {to} in week {nextBookedWeek?.weekNumber}</p>
    <p>{daysUntilNextBookedWeek} days until relaxing starts</p>
  </>
}