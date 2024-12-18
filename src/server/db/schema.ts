import { relations, sql } from "drizzle-orm";
import {
  index,
  integer, json,
  pgEnum,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  varchar
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `book-away_${name}`);

export const bookingStatus = pgEnum("booking_status", [
  "APPLIED",
  "BOOKED",
  "CANCELLED",
]);

export const bookingPriority = pgEnum("booking_priority", [
  "PRIORITY_1",
  "PRIORITY_2",
]);

export const seasonStatus = pgEnum("season_status", [
  "DRAFT",
  "OPEN",
  "CLOSED",
  "DELETED",
]);
export const userRole = pgEnum("role", [
  "USER",
  "SUPERUSER",
  "ADMIN"
]);
export const weekStatus = pgEnum("week_status", [
  "FULLY_BOOKABLE",
  "PARTIALLY_BOOKABLE",
  "NOT_BOOKABLE",
]);

export const users = createTable("user", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("email_verified", {
    mode: "date",
    withTimezone: true,
  }).default(sql`CURRENT_TIMESTAMP`),
  image: varchar("image", { length: 255 }),
  role: userRole("role").default("USER"),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const accounts = createTable(
  "account",
  {
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_user_id_idx").on(account.userId),
  }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  {
    sessionToken: varchar("session_token", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_user_id_idx").on(session.userId),
  }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

export const bookings = createTable(
  "booking",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    weekId: integer("week_id"),
    from: timestamp("from", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    to: timestamp("to", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    pointsSpent: integer("points_spent").notNull(),
    status: bookingStatus("booking_status").default("APPLIED"),
    priority: bookingPriority("booking_priority").notNull(),
    createdById: varchar("created_by", { length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
);

export const bookingRelations = relations(bookings, ({ one }) => ({
  user: one(users, { fields: [bookings.createdById], references: [users.id] }),
  week: one(weeks, { fields: [bookings.weekId], references: [weeks.id] }),
}));

export const weeks = createTable("week", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  seasonId: integer("season_id")
    .notNull()
    .references(() => seasons.id),
  weekNumber: integer("week_number").notNull(),
  notBookableDays: json("not_bookable_days"),
  weekStatus: weekStatus("week_status").default("FULLY_BOOKABLE").notNull(),
  from: timestamp("from", {
    mode: "date",
    withTimezone: false,
  }).notNull(),
  to: timestamp("to", {
    mode: "date",
    withTimezone: false,
  }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const weekRelations = relations(weeks, ({ one }) => ({
  season: one(seasons, { fields: [weeks.seasonId], references: [seasons.id] }),
}));

export const seasons = createTable("season", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name", { length: 255 }),
  from: timestamp("from", {
    mode: "date",
    withTimezone: true,
  }).notNull(),
  to: timestamp("to", {
    mode: "date",
    withTimezone: true,
  }).notNull(),
  seasonStatus: seasonStatus("season_status").default("DRAFT"),
  createdAt: timestamp("created_at", { withTimezone: true }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
  createdById: varchar("created_by", { length: 255 })
    .notNull()
    .references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const seasonRelations = relations(seasons, ({ one }) => ({
  user: one(users, { fields: [seasons.createdById], references: [users.id] }),
}));
