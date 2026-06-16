import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { VoiceRecorder } from "../_components/VoiceRecorder";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const settings = await api.settings.getTrelloEmail();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-white/50">
          Hi {session.user.name?.split(" ")[0]} 👋
        </p>
      </div>

      {!settings?.trelloEmail ? (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-center">
          <p className="font-semibold text-yellow-400">⚠️ No email configured</p>
          <p className="mt-1 text-sm text-white/60">
            Add your Trello board email (or personal email for testing) before
            creating cards.
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
          <p className="text-xs text-white/40">Sending cards to</p>
          <p className="text-sm font-medium text-green-400">{settings.trelloEmail}</p>
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-6 text-lg font-semibold">Create a Card</h2>
        <VoiceRecorder />
      </div>
    </div>
  );
}
