"use client";


import { api } from "~/trpc/react";
import dayjs from "dayjs";

export function CreateSeason() {
  const utils = api.useUtils();

  const createSeason = api.season.createSeason.useMutation({
    onSuccess: async () => {
      await utils.booking.invalidate();
    },
  });

  return (
    <div className="w-full max-w-xs">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createSeason.mutate({
            name: "First season",
            from: dayjs(new Date(2025, 0, 1, 0, 0, 0)).startOf("week").toDate(),
            to: dayjs(new Date(2025, 0, 1, 0, 0, 0)).add(4, "week").endOf("week").toDate()
          });
        }}
        className="flex flex-col gap-2"
      >
        <button
          type="submit"
          className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
          disabled={createSeason.isPending}
        >
          {createSeason.isPending ? "Creating season..." : "Create Season"}
        </button>
      </form>
    </div>
  );
}
