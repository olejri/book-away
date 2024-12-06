import dayjs from "dayjs";
import { api } from "~/trpc/react";

interface SeasonCardProps {
  season: {
    id: number;
    name: string | null;
    from: Date;
    to: Date;
    seasonStatus: "DRAFT" | "OPEN" | "CLOSED" | "DELETED";
    createdById: string;
    createdAt: Date | null;
    updatedAt: Date | null;
  };
}

export function SeasonCard({ season }: SeasonCardProps) {
  const utils = api.useUtils();

  const onDelete = api.season.removeSeason.useMutation({
    onSuccess: async () => {
      await utils.season.invalidate();
    },
  });

  const onChangeStatus = api.season.changeSeasonStatus.useMutation({
    onSuccess: async () => {
      await utils.season.invalidate();
    },
  });

  return (
    <div className="flex flex-col gap-2 mt-4 bg-282E33 p-4 rounded-md">
      <p className="text-CA9B6C font-semibold">{season.name ?? "Untitled Season"}</p>
      <p className="text-black">
        From: {dayjs(season.from).format("DD.MM.YYYY")}
      </p>
      <p className="text-black">
        To: {dayjs(season.to).format("DD.MM.YYYY")}
      </p>
      <div className="flex items-center gap-2">
        <span>Status:</span>
        <select
          value={season.seasonStatus}
          onChange={(e) =>
            onChangeStatus.mutate({
              seasonId: season.id,
              status: e.target.value as "DRAFT" | "OPEN" | "CLOSED" | "DELETED",
            })
          }
          className="bg-282E33 border border-E0E0E0 text-black rounded px-2 py-1 focus:ring-CA9B6C focus:border-CA9B6C"
        >
          <option value="DRAFT">DRAFT</option>
          <option value="OPEN">OPEN</option>
          <option value="CLOSED">CLOSED</option>
          <option value="DELETED">DELETED</option>
        </select>
      </div>
      <button
        type="button"
        className="rounded-full bg-CD2553 text-black px-5 py-2 font-semibold transition hover:bg-CA9B6C"
        onClick={() => onDelete.mutate({ seasonId: season.id })}
      >
        Delete
      </button>
    </div>
  );
}
