import { auth } from "~/server/auth";
import { NextResponse, type NextRequest } from "next/server";
import type { Session } from "next-auth";

const PROTECTED_ROUTES = ["/dashboard", "/settings"];

export default auth(
  (req: NextRequest & { auth: Session | null }) => {
    const isProtected = PROTECTED_ROUTES.some((route) =>
      req.nextUrl.pathname.startsWith(route),
    );

    if (isProtected && !req.auth) {
      const signInUrl = new URL("/", req.nextUrl.origin);
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
  },
);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|sw.js).*)",
  ],
};
