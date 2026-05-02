import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { collectionsTable } from "./collections";

export const bookmarksTable = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  collectionId: integer("collection_id").references(() => collectionsTable.id, { onDelete: "set null" }),
  url: text("url").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  coverImage: text("cover_image"),
  favicon: text("favicon"),
  domain: text("domain"),
  type: text("type").notNull().default("link"),
  tags: text("tags").array().notNull().default([]),
  isFavorite: boolean("is_favorite").notNull().default(false),
  isArchived: boolean("is_archived").notNull().default(false),
  isPinned: boolean("is_pinned").notNull().default(false),
  note: text("note"),
  highlight: text("highlight"),
  readingTime: integer("reading_time"),
  summary: text("summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBookmarkSchema = createInsertSchema(bookmarksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarksTable.$inferSelect;
