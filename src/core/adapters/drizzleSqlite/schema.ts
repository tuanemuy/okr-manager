import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { v7 as uuidv7 } from "uuid";

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  hashedPassword: text("hashed_password").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

export const teams = sqliteTable("teams", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  name: text("name").notNull(),
  description: text("description"),
  reviewFrequency: text("review_frequency", {
    enum: ["weekly", "biweekly", "monthly"],
  })
    .notNull()
    .default("monthly"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

export const teamMembers = sqliteTable("team_members", {
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["admin", "member", "viewer"] }).notNull(),
  joinedAt: integer("joined_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const invitations = sqliteTable("invitations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  invitedEmail: text("invited_email").notNull(),
  invitedById: text("invited_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["admin", "member", "viewer"] }).notNull(),
  status: text("status", { enum: ["pending", "accepted", "rejected"] })
    .notNull()
    .default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

export const okrs = sqliteTable("okrs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type", { enum: ["team", "personal"] }).notNull(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").references(() => users.id, { onDelete: "cascade" }),
  quarterYear: integer("quarter_year").notNull(),
  quarterQuarter: integer("quarter_quarter").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

export const keyResults = sqliteTable("key_results", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  okrId: text("okr_id")
    .notNull()
    .references(() => okrs.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  targetValue: real("target_value").notNull(),
  currentValue: real("current_value").notNull().default(0),
  unit: text("unit"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

export const reviews = sqliteTable("reviews", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  okrId: text("okr_id")
    .notNull()
    .references(() => okrs.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["progress", "final"] }).notNull(),
  content: text("content").notNull(),
  reviewerId: text("reviewer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});
