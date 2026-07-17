import Link from "next/link";
import { auth } from "~/server/auth";
import { SignOutButton } from "./SignOutButton";

export async function Navbar() {
  const session = await auth();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="text-xl">🎙️</span>
          <span>VoiceDraft</span>
        </Link>
        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <Link href="/dashboard" className="text-sm text-white/70 hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link href="/trainer" className="text-sm text-white/70 hover:text-white transition-colors">
                Trainer
              </Link>
              <Link href="/settings" className="text-sm text-white/70 hover:text-white transition-colors">
                Settings
              </Link>
              <SignOutButton />
            </>
          ) : (
            <Link
              href="/api/auth/signin"
              className="rounded-lg bg-[#4f6ef7] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#3d5ce0] transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

