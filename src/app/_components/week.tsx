"use client";

import { api } from "~/trpc/react";
import dayjs from "dayjs";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function GetWeeksBySeason({ seasonId }: { seasonId: string }) {
  const { data, isLoading, isError, error } =
    api.week.getWeeksBySeason.useQuery(+seasonId);

  const {
    data: seasonStatus,
    isLoading: seasonStatusIsLoading,
    isError: seasonStatusIsError,
    error: seasonStatusError,
  } = api.season.getSeasonStatusById.useQuery(+seasonId);

  const utils = api.useUtils();

  const book = api.booking.createBooking.useMutation({
    onSuccess: async () => {
      await utils.week.invalidate();
    },
    onError: (error) => {
      toast.error(error.message,
        {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
        }
        );
    },
  });

  if (isLoading || seasonStatusIsLoading) {
    return <p>Loading...</p>;
  }

  if (isError || seasonStatusIsError) {
    toast.error(error?.message ?? seasonStatusError?.message);
    return <p>Error loading data</p>;
  }

  if (data?.length === 0) {
    return <p>No weeks found</p>;
  }

  if (seasonStatus === undefined) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <ToastContainer />
      {data?.map((week) => (
        <div key={week.id} className="flex flex-col gap-2">
          <p key={week.id}>
            WeekNr={week.weekNumber}
            {dayjs(week.from).format("DD.MM.YYYY")} -{" "}
            {dayjs(week.to).format("DD.MM.YYYY")}
          </p>
          <button
            hidden = {seasonStatus[0]?.status === "CLOSED"}
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
                {booking.pointsSpent} points spent by {booking.name}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
