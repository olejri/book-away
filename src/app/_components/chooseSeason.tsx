"use client";

import { api } from "~/trpc/react";
import Link from "next/link";

export function GetSeasons() {
//fetxh all open seasons and display them with a button to got to /book/season/[id]

  const { data, isLoading, isError, error } = api.season.fetchAllOpenSeasons.useQuery();

  if (isLoading) {
    return (
      <p>Loading...</p>
    );
  }

  if (isError) {
    return <p>{error?.message}</p>;
  }

  if(data?.length === 0) {
    return <p>No seasons found</p>;
  }

  return (
    //center all the links in the middle
    <div className="flex flex-col items-center justify-center gap-2">
      {data?.map((season, index) => (
        <Link
          className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
          key={index}
          href={`/book/season/${season.id}`}
          >
          {season.name} - {season.id} - {season.from.toDateString()} - {season.to.toDateString()}
        </Link>
      ))}
    </div>
  );
}
