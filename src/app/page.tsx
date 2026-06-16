import Link from "next/link";
import { auth } from "~/server/auth";
export default async function HomePage() {
  const session = await auth();
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <span className="text-7xl">mic</span>
        <h1 className="text-4xl font-bold">Trello Voice</h1>
        <p className="max-w-sm text-lg text-white/60">
          Speak your idea. Create a Trello card instantly.
        </p>
      </div>
      {session?.user ? (
        <div className="flex w-full max-w-xs flex-col gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/40">Signed in as</p>
            <p className="font-semibold">{session.user.name}</p>
          </div>
          <Link href="/dashboard" className="w-full rounded-xl bg-[#4f6ef7] py-3 text-center font-semibold text-white hover:bg-[#3d5ce0] transition-colors">
            Go to Dashboard
          </Link>
          <Link href="/settings" className="w-full rounded-xl border border-white/10 py-3 text-center text-white/70 hover:bg-white/5 transition-colors">
            Settings
          </Link>
        </div>
      ) : (
        <div className="flex w-full max-w-xs flex-col gap-4">
          <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-left text-sm text-white/60">
            <p>Sign in with Discord or Slack</p>
            <p>Save your Trello board email</p>
            <p>Speak a card idea - done in seconds</p>
          </div>
          <Link href="/api/auth/signin" className="w-full rounded-xl bg-[#4f6ef7] py-3 text-center font-semibold text-white hover:bg-[#3d5ce0] transition-colors">
            Sign In to Get Started
          </Link>
        </div>
      )}
    </div>
  );
}
