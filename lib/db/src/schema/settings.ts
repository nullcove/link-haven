import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const userSettingsTable = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
  geminiApiKey: text("gemini_api_key"),
  theme: text("theme").notNull().default("dark"),
  defaultView: text("default_view").notNull().default("grid"),
  language: text("language").notNull().default("en"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type UserSettings = typeof userSettingsTable.$inferSelect;
