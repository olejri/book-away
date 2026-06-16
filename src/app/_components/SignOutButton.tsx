"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/70 hover:border-red-400/50 hover:text-red-400 transition-colors"
    >
      Sign out
    </button>
  );
}

