import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { VoiceRecorder } from "../_components/VoiceRecorder";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const boards = await api.settings.getBoardEmails();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-white/50">
          Hi {session.user.name?.split(" ")[0]} 👋
        </p>
      </div>

      {boards.length === 0 ? (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-center">
          <p className="font-semibold text-yellow-400">⚠️ No boards configured</p>
          <p className="mt-1 text-sm text-white/60">
            Add a Trello board email in Settings before creating cards.
          </p>
          <Link
            href="/settings"
            className="mt-3 inline-block rounded-lg bg-yellow-500/20 px-4 py-2 text-sm font-semibold text-yellow-400 hover:bg-yellow-500/30 transition-colors"
          >
            Go to Settings →
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-2 text-center">
          <p className="text-xs text-white/40">Boards configured</p>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            {boards.map((b) => (
              <span key={b.id} className="text-sm font-medium text-green-400">
                {b.nickname}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-6 text-lg font-semibold">Create a Card</h2>
        <VoiceRecorder />
      </div>
    </div>
  );
}
