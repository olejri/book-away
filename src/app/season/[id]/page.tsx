import { GetWeeksBySeason } from "~/app/_components/week";

export default async function Page({
                                     params,
                                   }: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  return <GetWeeksBySeason seasonId={id} />
}