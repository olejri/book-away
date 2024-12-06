import { CreateSeason } from "~/app/_components/season";
import { api, HydrateClient } from "~/trpc/server";

export default async function Page() {
  void api.season.fetchAllSeasonWithStatusDraftOrOpen.prefetch();

  return (
    <HydrateClient>
      <CreateSeason />
    </HydrateClient>
  );
}
