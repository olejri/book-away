import { CreateSeason } from "~/app/_components/season";
import { HydrateClient } from "~/trpc/server";

export default async function Page() {
  return (
    <HydrateClient>
      <CreateSeason />
    </HydrateClient>
  );
}
