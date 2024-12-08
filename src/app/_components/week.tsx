"use client";

import { api } from "~/trpc/react";
import dayjs from "dayjs";

export function GetWeeksBySeason({ seasonId }: { seasonId: string }) {
  const { data, isLoading, isError, error } =
    api.week.getWeeksBySeason.useQuery(+seasonId);
  const utils = api.useUtils();

  const book = api.booking.createBooking.useMutation({
    onSuccess: async () => {
      await utils.week.invalidate();
    },
  });

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (isError) {
    return <p>{error?.message}</p>;
  }

  if (data?.length === 0) {
    return <p>No weeks found</p>;
  }

  return (
    <div>
      {data?.map((week) => (
        <div key={week.id} className="flex flex-col gap-2">
          <p key={week.id}>
            WeekNr={week.weekNumber}
            {dayjs(week.from).format("DD.MM.YYYY")} -{" "}
            {dayjs(week.to).format("DD.MM.YYYY")}
          </p>
          <p>status: {week.weekStatus}</p>
          <button
            type="button"
            className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
            onClick={() =>
              book.mutate({
                weekId: week.id,
                pointsSpent: 1,
              })
            }
          >
            {book.isPending ? "Booking..." : "Book"}
          </button>
          <div className="flex flex-row gap-2">
          {week.bookings?.map((booking) => (
            <p key={booking.id}>
              {booking.pointsSpent} points spent by {booking.user.name}
            </p>
          ))}
          </div>
        </div>
      ))}
    </div>
  );
}
