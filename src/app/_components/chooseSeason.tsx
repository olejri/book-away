"use client";

import { api } from "~/trpc/react";
import Link from "next/link";

export function GetSeasons() {
  const { data: seasons, isLoading: seasonIsLoad, isError: seasonIsEror, error: seasonError } = api.season.fetchAllOpenOrClosedSeasons.useQuery();

  if (seasonIsLoad) {
    return (
      <p>Loading...</p>
    );
  }

  if (seasonIsEror) {
    return <p>{seasonError?.message}</p>;
  }

  if(seasons?.length === 0) {
    return <p>No seasons found</p>;
  }

  return (
    //center all the links in the middle
    <div className="flex flex-col items-center justify-center gap-2">
      {seasons?.map((season, index) => (
        <Link
          className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
          key={index}
          href={`/book/season/${season.id}`}
          >
          <>
          {season.seasonStatus}
          {season.name} - {season.id} - {season.from.toDateString()} - {season.to.toDateString()}
          {season.seasonStatus}
          </>
        </Link>
      ))}
    </div>
  );
}
