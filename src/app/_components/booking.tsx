"use client";

import { useState } from "react";

import { api, type RouterInputs } from "~/trpc/react";

export function CreateBooking() {
  const [pointsSpent] = api.booking.getNumberOfPointsSpent.useSuspenseQuery();
  const utils = api.useUtils();
  type Booking = RouterInputs["booking"]["createBooking"];
  const [bookingData, setBookingData] = useState<Booking>({
    from: new Date(),
    to: new Date(),
    pointsSpent: 1
  });

  const createBooking = api.booking.createBooking.useMutation({
    onSuccess: async () => {
      await utils.booking.invalidate();
    },
  });

  return (
    <div className="w-full max-w-xs">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createBooking.mutate({
            from: bookingData.from,
            to: bookingData.to,
            pointsSpent: bookingData.pointsSpent
          });
        }}
        className="flex flex-col gap-2"
      >
        <button
          type="submit"
          className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
          disabled={createBooking.isPending}
        >
          {createBooking.isPending ? "Submitting..." : "Submit"}
        </button>
        {pointsSpent && pointsSpent.length > 0 ? (
          <p className="truncate">Points spent by you: {pointsSpent.map((point) => point.pointsSpent).reduce((a, b) => a + b)}</p>
        ) : (
          <p>You have spent no points yet.</p>
        )}
      </form>
    </div>
  );
}
