"use client";

import { api } from "~/trpc/react";
import dayjs from "dayjs";
import { useState } from "react";
import { SeasonCard } from "~/app/_components/seasonCard";

export function CreateSeason() {
  const {data: seasons, isLoading, isError, error} = api.season.fetchAllSeasonWithStatusDraftOrOpen.useQuery();
  const utils = api.useUtils();

  const createSeason = api.season.createSeason.useMutation({
    onSuccess: async () => {
      await utils.season.invalidate();
    },
  });

  type SeasonType = {
    name: string;
    seasonCost: number;
  };
  const seasonsWithCost: SeasonType[] = [
    { name: "Winter", seasonCost: 2 },
    { name: "Summer", seasonCost: 1 },
    { name: "Fall", seasonCost: 1 },
  ];

  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [seasonType, setSeasonType] = useState<SeasonType | undefined>();


  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (isError) {
    return <p>{error?.message}</p>;
  }

  return (
    <div className="mx-auto w-full max-w-xs p-4 text-black">
      {/* Trigger button for the modal */}
      <button
        className="rounded-full bg-blue-500 px-5 py-2 font-semibold text-white transition hover:bg-blue-600"
        onClick={() => setIsModalOpen(true)}
      >
        Create Season
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">Create New Season</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!name || !from || !to || !seasonType?.seasonCost) {
                  alert("Please fill in all fields");
                  return;
                }
                createSeason.mutate({
                  name,
                  from: dayjs(from).toDate(),
                  to: dayjs(to).toDate(),
                  seasonCost: seasonType?.seasonCost ?? 0,
                });
                setIsModalOpen(false);
              }}
              className="flex flex-col gap-4"
            >
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Season Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter season name"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="seasonCost"
                  className="block text-sm font-medium text-gray-700"
                >
                  Season Type
                </label>
                <select
                  id="seasonCost"
                  onChange={(e) => {
                    const selectedSeason = seasonsWithCost.find(
                      (season) => season.name === e.target.value,
                    );
                    setSeasonType(selectedSeason);
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                >
                  <option value="" disabled>
                    Select a season
                  </option>
                  {seasonsWithCost.map((season) => (
                    <option key={season.name} value={season.name}>
                      {season.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="from"
                  className="block text-sm font-medium text-gray-700"
                >
                  From
                </label>
                <input
                  type="date"
                  id="from"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="to"
                  className="block text-sm font-medium text-gray-700"
                >
                  To
                </label>
                <input
                  type="date"
                  id="to"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-full bg-gray-300 px-5 py-2 font-semibold text-gray-800 transition hover:bg-gray-400"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-blue-500 px-5 py-2 font-semibold text-white transition hover:bg-blue-600 disabled:bg-gray-300"
                  disabled={createSeason.isPending}
                >
                  {createSeason.isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Seasons List */}
      {seasons?.map((season) => <SeasonCard key={season.id} season={season} />)}
    </div>
  );
}
