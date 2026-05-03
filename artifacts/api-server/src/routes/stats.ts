import { Router, type IRouter } from "express";
import { db, bookmarksTable, collectionsTable, sessionsTable } from "@workspace/db";
import { eq, and, sql, count, gte, desc } from "drizzle-orm";
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

  const [totalResult] = await db.select({ value: count() }).from(bookmarksTable).where(eq(bookmarksTable.userId, userId));
  const [favResult] = await db.select({ value: count() }).from(bookmarksTable).where(and(eq(bookmarksTable.userId, userId), eq(bookmarksTable.isFavorite, true)));
  const [archResult] = await db.select({ value: count() }).from(bookmarksTable).where(and(eq(bookmarksTable.userId, userId), eq(bookmarksTable.isArchived, true)));
  const [colResult] = await db.select({ value: count() }).from(collectionsTable).where(eq(collectionsTable.userId, userId));
  const [weekResult] = await db.select({ value: count() }).from(bookmarksTable).where(and(eq(bookmarksTable.userId, userId), gte(bookmarksTable.createdAt, weekAgo)));
  const [monthResult] = await db.select({ value: count() }).from(bookmarksTable).where(and(eq(bookmarksTable.userId, userId), gte(bookmarksTable.createdAt, monthAgo)));

  const tagsResult = await db.execute(sql`SELECT COUNT(DISTINCT unnest) as count FROM (SELECT unnest(tags) FROM bookmarks WHERE user_id = ${userId}) t`);
  const pinnedResult = await db.execute(sql`SELECT COUNT(*) as count FROM bookmarks WHERE user_id = ${userId} AND is_pinned = true`);
  const notedResult = await db.execute(sql`SELECT COUNT(*) as count FROM bookmarks WHERE user_id = ${userId} AND note IS NOT NULL AND note != ''`);

  res.json({
    totalBookmarks: Number(totalResult.value),
    totalCollections: Number(colResult.value),
    totalFavorites: Number(favResult.value),
    totalArchived: Number(archResult.value),
    totalTags: Number((tagsResult.rows[0] as any)?.count ?? 0),
    totalPinned: Number((pinnedResult.rows[0] as any)?.count ?? 0),
    totalNoted: Number((notedResult.rows[0] as any)?.count ?? 0),
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

  const bookmarks = await db.select().from(bookmarksTable)
    .where(and(eq(bookmarksTable.userId, userId), eq(bookmarksTable.isArchived, false)))
    .orderBy(sql`${bookmarksTable.createdAt} DESC`)
    .limit(limit);

  res.json(bookmarks.map(b => ({ ...b, collectionName: null })));
});

router.get("/stats/by-type", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const result = await db.execute(sql`
    SELECT type, COUNT(*) as count FROM bookmarks WHERE user_id = ${userId} GROUP BY type ORDER BY count DESC
  `);
  res.json((result.rows as any[]).map(r => ({ type: r.type, count: Number(r.count) })));
});

router.get("/stats/daily", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const days = Number((req.query as any).days) || 30;
  const result = await db.execute(sql`
    SELECT
      DATE(created_at AT TIME ZONE 'UTC') as date,
      COUNT(*) as count
    FROM bookmarks
    WHERE user_id = ${userId}
      AND created_at >= NOW() - INTERVAL '${sql.raw(String(days))} days'
    GROUP BY date
    ORDER BY date ASC
  `);

  const dataMap: Record<string, number> = {};
  for (const row of result.rows as any[]) {
    dataMap[row.date.toISOString().slice(0, 10)] = Number(row.count);
  }

  const out: { date: string; count: number; day: string }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, count: dataMap[key] || 0, day: d.toLocaleDateString("en", { month: "short", day: "numeric" }) });
  }
  res.json(out);
});

router.get("/stats/top-domains", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const limit = Number((req.query as any).limit) || 10;
  const result = await db.execute(sql`
    SELECT domain, COUNT(*) as count
    FROM bookmarks
    WHERE user_id = ${userId} AND domain IS NOT NULL AND domain != ''
    GROUP BY domain
    ORDER BY count DESC
    LIMIT ${limit}
  `);

  res.json((result.rows as any[]).map((r, i) => ({
    domain: r.domain,
    count: Number(r.count),
    rank: i + 1,
    favicon: `https://${r.domain}/favicon.ico`,
  })));
});

router.get("/stats/top-tags", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const limit = Number((req.query as any).limit) || 30;
  const result = await db.execute(sql`
    SELECT unnest(tags) as tag, COUNT(*) as count
    FROM bookmarks
    WHERE user_id = ${userId}
    GROUP BY tag
    ORDER BY count DESC
    LIMIT ${limit}
  `);

  res.json((result.rows as any[]).map(r => ({ tag: r.tag, count: Number(r.count) })));
});

router.get("/stats/heatmap", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const result = await db.execute(sql`
    SELECT
      DATE(created_at AT TIME ZONE 'UTC') as date,
      COUNT(*) as count
    FROM bookmarks
    WHERE user_id = ${userId}
      AND created_at >= NOW() - INTERVAL '364 days'
    GROUP BY date
    ORDER BY date ASC
  `);

  const map: Record<string, number> = {};
  for (const r of result.rows as any[]) {
    map[r.date.toISOString().slice(0, 10)] = Number(r.count);
  }
  res.json(map);
});

export default router;
