import Link from "next/link";

import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { UserRole } from "~/server/auth/config";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    void api.booking.getNumberOfPointsSpent.prefetch();
  }

  return (
    <HydrateClient>
      <main className="container mx-auto sm:px-6 lg:px-8">
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
          <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
            <div className="flex flex-col items-center gap-2">
              <div className="flex flex-col items-center justify-center gap-4">
                <p className="text-center text-2xl text-white">
                  {session && <span>Logged in as {session.user?.name}</span>}
                </p>
                <Link
                  href={session ? "/api/auth/signout" : "/api/auth/signin"}
                  className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
                >
                  {session ? "Sign out" : "Sign in"}
                </Link>
              </div>
            </div>
            {/*link to admin/season/create-season*/}
            {session?.user && session.user.role === UserRole.ADMIN && <Link href="/admin/dashboard/create-season" className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20">Create Season</Link>}
            {/*link to user*/}
            {session?.user && <Link href="/user" className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20">My profile</Link>}
            {/*link to book*/}
            {session?.user && <Link href="/book" className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20">Book</Link>}
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
