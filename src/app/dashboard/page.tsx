import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { VoiceRecorder } from "../_components/VoiceRecorder";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-white/50">
          Hi {session.user.name?.split(" ")[0]} 👋
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-6 text-lg font-semibold">Create a VoiceDraft</h2>
        <VoiceRecorder />
      </div>
    </div>
  );
}
