import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { type NextAuthConfig } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";
import SlackProvider from "next-auth/providers/slack";

import { db } from "~/server/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "~/server/db/schema";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
    };
  }
}

export const authConfig = {
  providers: [DiscordProvider, SlackProvider, GoogleProvider],
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
} satisfies NextAuthConfig;
