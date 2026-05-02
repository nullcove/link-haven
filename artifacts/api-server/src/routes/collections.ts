import { Router, type IRouter } from "express";
import { db, usersTable, collectionsTable, bookmarksTable, sessionsTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { CreateCollectionBody, UpdateCollectionBody, GetCollectionParams, UpdateCollectionParams, DeleteCollectionParams } from "@workspace/api-zod";

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

router.get("/collections", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const collections = await db.select().from(collectionsTable).where(eq(collectionsTable.userId, userId));

  const withCounts = await Promise.all(
    collections.map(async (col) => {
      const [{ value }] = await db
        .select({ value: count() })
        .from(bookmarksTable)
        .where(and(eq(bookmarksTable.collectionId, col.id), eq(bookmarksTable.isArchived, false)));
      return { ...col, bookmarkCount: Number(value) };
    })
  );

  res.json(withCounts);
});

router.post("/collections", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const parsed = CreateCollectionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [col] = await db
    .insert(collectionsTable)
    .values({ ...parsed.data, userId })
    .returning();

  res.status(201).json({ ...col, bookmarkCount: 0 });
});

router.get("/collections/:id", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const params = GetCollectionParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [col] = await db
    .select()
    .from(collectionsTable)
    .where(and(eq(collectionsTable.id, params.data.id), eq(collectionsTable.userId, userId)));

  if (!col) { res.status(404).json({ error: "Collection not found" }); return; }

  const [{ value }] = await db
    .select({ value: count() })
    .from(bookmarksTable)
    .where(eq(bookmarksTable.collectionId, col.id));

  res.json({ ...col, bookmarkCount: Number(value) });
});

router.patch("/collections/:id", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const params = UpdateCollectionParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateCollectionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updateData: Record<string, any> = {};
  if (parsed.data.name != null) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.color !== undefined) updateData.color = parsed.data.color;
  if (parsed.data.icon !== undefined) updateData.icon = parsed.data.icon;
  if (parsed.data.isPublic != null) updateData.isPublic = parsed.data.isPublic;

  const [col] = await db
    .update(collectionsTable)
    .set(updateData)
    .where(and(eq(collectionsTable.id, params.data.id), eq(collectionsTable.userId, userId)))
    .returning();

  if (!col) { res.status(404).json({ error: "Collection not found" }); return; }

  const [{ value }] = await db
    .select({ value: count() })
    .from(bookmarksTable)
    .where(eq(bookmarksTable.collectionId, col.id));

  res.json({ ...col, bookmarkCount: Number(value) });
});

router.delete("/collections/:id", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const params = DeleteCollectionParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  await db
    .delete(collectionsTable)
    .where(and(eq(collectionsTable.id, params.data.id), eq(collectionsTable.userId, userId)));

  res.sendStatus(204);
});

export default router;
