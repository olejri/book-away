import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { FastingTracker } from "./_components/FastingTracker";

export const metadata = { title: "Personal Trainer | VoiceDraft" };

export default async function TrainerPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">🥗 Personal Trainer</h1>
        <p className="text-sm text-white/50">
          Hi {session.user.name?.split(" ")[0]} — track your fasting journey
        </p>
      </div>

      <FastingTracker />
    </div>
  );
}
