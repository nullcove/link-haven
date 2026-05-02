import { Router, type IRouter } from "express";
import { db, bookmarksTable, sessionsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { DeleteTagParams } from "@workspace/api-zod";

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

router.get("/tags", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const result = await db.execute(sql`
    SELECT unnest(tags) as name, COUNT(*) as count
    FROM bookmarks
    WHERE user_id = ${userId}
    GROUP BY name
    ORDER BY count DESC, name ASC
  `);

  const tags = (result.rows as any[]).map((row) => ({
    name: row.name,
    count: Number(row.count),
  }));

  res.json(tags);
});

router.delete("/tags/:name", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const params = DeleteTagParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const tagName = params.data.name;

  await db.execute(sql`
    UPDATE bookmarks
    SET tags = array_remove(tags, ${tagName})
    WHERE user_id = ${userId} AND ${tagName} = ANY(tags)
  `);

  res.sendStatus(204);
});

export default router;
