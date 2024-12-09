import { UserView } from "~/app/_components/userView";
import { api, HydrateClient } from "~/trpc/server";
import { auth } from "~/server/auth";
import React from "react";

export default async function Page() {
  const session = await auth();
  if (session?.user) {
    void api.user.getUsedPoints.prefetch();
    void api.user.getNextBookedWeek.prefetch();
  }
  return (
    <HydrateClient>
      <UserView/>
    </HydrateClient>
  )
}
