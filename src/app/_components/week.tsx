"use client";

import { api } from "~/trpc/react";
import dayjs from "dayjs";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PrioOneButton, PrioTwoButton } from "~/app/_components/button";

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
      toast.error(error.message, {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
      });
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

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
  }

  return (
    <div>
      <ToastContainer />
      <table className="min-w-full border-separate border-spacing-0">
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky top-0 z-10 border-b border-gray-300 bg-white bg-opacity-75 py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter sm:pl-6 lg:pl-8"
            >
              Week
            </th>
            <th
              scope="col"
              className="sticky top-0 z-10 border-b border-gray-300 bg-white bg-opacity-75 py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter sm:pl-6 lg:pl-8"
            >
              Date
            </th>
            <th
              scope="col"
              className="sticky top-0 z-10 border-b border-gray-300 bg-white bg-opacity-75 py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter sm:pl-6 lg:pl-8"
            >
              Applied by users
            </th>
            <th
              scope="col"
              className="sticky top-0 z-10 border-b border-gray-300 bg-white bg-opacity-75 py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter sm:pl-6 lg:pl-8"
            >
              Priority
            </th>
          </tr>
        </thead>
        <tbody>
          {data?.map((week, weekIdx) => (
            <tr key={week.id}>
              <td
                className={classNames(
                  weekIdx !== data.length - 1 ? "border-b border-gray-300" : "",
                  "font-smale w-6 py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6 lg:pl-8",
                )}
              >
                {week.weekNumber}
              </td>
              <td
                className={classNames(
                  weekIdx !== data.length - 1 ? "border-b border-gray-300" : "",
                  "font-smale w-6 py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6 lg:pl-8",
                )}
              >
                <div className="flex flex-col gap-2" key={week.id}>
                  {dayjs(week.from).format("DD.MM.YYYY")} -{" "}
                  {dayjs(week.to).format("DD.MM.YYYY")}
                </div>
              </td>
              <td
                className={classNames(
                  weekIdx !== data.length - 1 ? "border-b border-gray-300" : "",
                  "font-smale w-6 py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6 lg:pl-8",
                )}
              >
                USERS
              </td>
              <td
                className={classNames(
                  weekIdx !== data.length - 1 ? "border-b border-gray-300" : "",
                  "font-smale w-6 py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6 lg:pl-8",
                )}
              >
                <div className="flex flex-row gap-2" key={week.id}>
                <PrioOneButton
                  isSelected={week.bookings.filter((booking) => booking.bookingByUser)
                    .some((booking) => booking.priority === "PRIORITY_1")}
                  onClick={() => book.mutate({
                    weekId: week.id,
                    pointsSpent: 1,
                    priority: "PRIORITY_1",
                  })}
                />
                <PrioTwoButton
                  isSelected={week.bookings.filter((booking) => booking.bookingByUser)
                    .some((booking) => booking.priority === "PRIORITY_2")}
                  onClick={() => book.mutate({
                    weekId: week.id,
                    pointsSpent: 1,
                    priority: "PRIORITY_2",
                  })}
                />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
