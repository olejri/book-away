"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import dayjs from "dayjs";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FirstPriorityButton,
  SecondPriorityButton,
} from "~/app/_components/button";
import { type BookingResponse } from "~/server/api/routers/weeks";
import Image from "next/image";

export function GetWeeksBySeason({ seasonId }: { seasonId: string }) {
  const [showModal, setShowModal] = useState(false);
  const [checked, setChecked] = useState(false);

  const { data, isLoading, isError, error } =
    api.week.getWeeksBySeason.useQuery(+seasonId);

  const {
    data: seasonStatus,
    isLoading: seasonStatusIsLoading,
    isError: seasonStatusIsError,
    error: seasonStatusError,
  } = api.season.getSeasonStatusById.useQuery(+seasonId);

  const {
    data: info,
    isLoading: infoIsLoading,
    isError: infoIsError,
    error: infoError,
  } = api.info.getInfo.useQuery();

  const utils = api.useUtils();
  const updateInfo = api.info.markAsSeen.useMutation({
    onSuccess: () => setShowModal(false),
  }); // Add a mutation to update the hasSeen property.

  const createBooking = api.booking.createBooking.useMutation({
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

  useEffect(() => {
    if (infoIsLoading) {
      return;
    }
    if (
      info?.filter((info) => info.type === "BOOKING_INFO")?.length === 0 ||
      info?.some((info) => info.type === "BOOKING_INFO" && !info.hasSeen)
    ) {
      setShowModal(true);
    }
  }, [info, infoIsLoading]);

  const handleModalClose = () => {
    console.log("checked", checked);
    if (checked) {
      updateInfo.mutate({ type: "BOOKING_INFO" });
    }
    setShowModal(false);
  };

  if (isLoading || seasonStatusIsLoading || infoIsLoading) {
    return <p>Loading...</p>;
  }

  if (isError || seasonStatusIsError || infoIsError) {
    toast.error(
      error?.message ?? seasonStatusError?.message ?? infoError?.message,
    );
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

  function getStatus(bookings: BookingResponse[], priority: string) {
    if (bookings.some((b) => b.bookingByUser && b.priority === priority)) {
      return "USER";
    } else if (bookings.some((b) => b.priority === priority)) {
      return "OTHER";
    } else {
      return "NONE";
    }
  }

  return (
    <div>
      <ToastContainer />
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-auto max-w-md rounded bg-white p-6 shadow-lg">
            <h2 className="font-semibold text-black">
              Welcome to Book Away!
            </h2>
            <div className="text-black">
              Here’s some information about bookings.
              Everyone gets to choose one first
              priority and one second priority <strong>per season</strong>.
            </div>
            <div className="mt-4 flex flex-col items-start gap-2 text-sm text-gray-700">
              <div className={"flex items-center gap-2"}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={`h-6 w-6 text-black transition-colors duration-300`}
                >
                  <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
                  <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
                </svg>
                <p>Bookable</p>
              </div>
              <div className={"flex items-center gap-2"}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={`h-6 w-6 text-green-500 transition-colors duration-300`}
                >
                  <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
                  <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
                </svg>
                <p>First priority</p>
              </div>
              <div className={"flex items-center gap-2"}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={`h-4 w-6 text-green-500 transition-colors duration-300`}
                >
                  <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
                  <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
                </svg>
                <p>Second priority</p>
              </div>
              <div className={"flex items-center gap-2"}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={`h-6 w-6 text-blue-500 transition-colors duration-300`}
                >
                  <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
                  <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
                </svg>
                <p>Others have also applied for this week</p>
              </div>
              <div className={"flex items-center gap-2"}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={`h-6 w-6 text-red-500 transition-colors duration-300`}
                >
                  <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
                  <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
                </svg>
                <p>Not bookable</p>
              </div>
            </div>
            <div className="flex flex-row gap-3">
              <button
                onClick={handleModalClose}
                className="mt-6 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Got it!
              </button>
              <div className="mt-4 flex items-center">
                <input
                  type="checkbox"
                  onChange={() => setChecked(!checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-600">
                  Don&#39;t show again
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <div className="mt-4 flex-shrink-0 sm:ml-5 sm:mt-0">
                  <div className="flex -space-x-1 overflow-hidden">
                    {week.bookings.map((booking) => (
                      <Image
                        width={300}
                        height={300}
                        key={booking.id}
                        className="inline-block h-6 w-6 rounded-full border-0"
                        src={booking.image ?? "hei"}
                        alt={booking.name ?? ""}
                        title={booking.name ?? ""}
                      />
                    ))}
                  </div>
                </div>
              </td>
              <td
                className={classNames(
                  weekIdx !== data.length - 1 ? "border-b border-gray-300" : "",
                  "font-smale w-6 py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6 lg:pl-8",
                )}
              >
                <div className="flex flex-row gap-2" key={week.id}>
                  <FirstPriorityButton
                    status={getStatus(week.bookings, "PRIORITY_1")}
                    onClickAction={() =>
                      createBooking.mutate({
                        weekId: week.id,
                        priority: "PRIORITY_1",
                      })
                    }
                  />
                  <SecondPriorityButton
                    status={getStatus(week.bookings, "PRIORITY_2")}
                    onClickAction={() =>
                      createBooking.mutate({
                        weekId: week.id,
                        priority: "PRIORITY_2",
                      })
                    }
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
