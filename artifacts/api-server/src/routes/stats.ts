import { Router, type IRouter } from "express";
import { db, bookmarksTable, collectionsTable, sessionsTable } from "@workspace/db";
import { eq, and, sql, count, gte } from "drizzle-orm";
import { GetRecentBookmarksQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

async function getUserFromToken(token: string): Promise<number | null> {
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.token, token));
  if (!session || session.expiresAt < new Date()) return null;
  return session.userId;
}

function getToken(req: any): string | null {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

router.get("/stats", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalResult] = await db
    .select({ value: count() })
    .from(bookmarksTable)
    .where(eq(bookmarksTable.userId, userId));

  const [favResult] = await db
    .select({ value: count() })
    .from(bookmarksTable)
    .where(and(eq(bookmarksTable.userId, userId), eq(bookmarksTable.isFavorite, true)));

  const [archResult] = await db
    .select({ value: count() })
    .from(bookmarksTable)
    .where(and(eq(bookmarksTable.userId, userId), eq(bookmarksTable.isArchived, true)));

  const [colResult] = await db
    .select({ value: count() })
    .from(collectionsTable)
    .where(eq(collectionsTable.userId, userId));

  const [weekResult] = await db
    .select({ value: count() })
    .from(bookmarksTable)
    .where(and(eq(bookmarksTable.userId, userId), gte(bookmarksTable.createdAt, weekAgo)));

  const [monthResult] = await db
    .select({ value: count() })
    .from(bookmarksTable)
    .where(and(eq(bookmarksTable.userId, userId), gte(bookmarksTable.createdAt, monthAgo)));

  const tagsResult = await db.execute(sql`
    SELECT COUNT(DISTINCT unnest) as count
    FROM (SELECT unnest(tags) FROM bookmarks WHERE user_id = ${userId}) t
  `);

  res.json({
    totalBookmarks: Number(totalResult.value),
    totalCollections: Number(colResult.value),
    totalFavorites: Number(favResult.value),
    totalArchived: Number(archResult.value),
    totalTags: Number((tagsResult.rows[0] as any)?.count ?? 0),
    bookmarksThisWeek: Number(weekResult.value),
    bookmarksThisMonth: Number(monthResult.value),
  });
});

router.get("/stats/recent", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const qp = GetRecentBookmarksQueryParams.safeParse(req.query);
  const limit = qp.success && qp.data.limit ? qp.data.limit : 10;

  const bookmarks = await db
    .select()
    .from(bookmarksTable)
    .where(and(eq(bookmarksTable.userId, userId), eq(bookmarksTable.isArchived, false)))
    .orderBy(sql`${bookmarksTable.createdAt} DESC`)
    .limit(limit);

  res.json(bookmarks.map((b) => ({ ...b, collectionName: null })));
});

router.get("/stats/by-type", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const result = await db.execute(sql`
    SELECT type, COUNT(*) as count
    FROM bookmarks
    WHERE user_id = ${userId}
    GROUP BY type
    ORDER BY count DESC
  `);

  const types = (result.rows as any[]).map((row) => ({
    type: row.type,
    count: Number(row.count),
  }));

  res.json(types);
});

export default router;
