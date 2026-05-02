import { Router, type IRouter } from "express";
import { db, bookmarksTable, collectionsTable, sessionsTable } from "@workspace/db";
import { eq, and, ilike, or, sql } from "drizzle-orm";
import {
  CreateBookmarkBody,
  UpdateBookmarkBody,
  GetBookmarkParams,
  UpdateBookmarkParams,
  DeleteBookmarkParams,
  ToggleFavoriteParams,
  ToggleArchiveParams,
  ListBookmarksQueryParams,
} from "@workspace/api-zod";

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

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "";
  }
}

function getFavicon(url: string): string {
  try {
    const { protocol, hostname } = new URL(url);
    return `${protocol}//${hostname}/favicon.ico`;
  } catch {
    return "";
  }
}

async function withCollectionName(bookmark: any): Promise<any> {
  if (!bookmark.collectionId) return { ...bookmark, collectionName: null };
  const [col] = await db
    .select({ name: collectionsTable.name })
    .from(collectionsTable)
    .where(eq(collectionsTable.id, bookmark.collectionId));
  return { ...bookmark, collectionName: col?.name ?? null };
}

router.get("/bookmarks", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const qp = ListBookmarksQueryParams.safeParse(req.query);
  if (!qp.success) { res.status(400).json({ error: qp.error.message }); return; }

  const { collectionId, tag, search, isFavorite, isArchived, type } = qp.data;

  const conditions = [eq(bookmarksTable.userId, userId)];

  if (collectionId != null) conditions.push(eq(bookmarksTable.collectionId, collectionId));
  if (isFavorite != null) conditions.push(eq(bookmarksTable.isFavorite, isFavorite));
  if (isArchived != null) {
    conditions.push(eq(bookmarksTable.isArchived, isArchived));
  } else {
    conditions.push(eq(bookmarksTable.isArchived, false));
  }
  if (type != null) conditions.push(eq(bookmarksTable.type, type));
  if (search) {
    conditions.push(
      or(
        ilike(bookmarksTable.title, `%${search}%`),
        ilike(bookmarksTable.description, `%${search}%`),
        ilike(bookmarksTable.url, `%${search}%`)
      )!
    );
  }
  if (tag) {
    conditions.push(sql`${bookmarksTable.tags} @> ARRAY[${tag}]::text[]`);
  }

  const bookmarks = await db
    .select()
    .from(bookmarksTable)
    .where(and(...conditions))
    .orderBy(sql`${bookmarksTable.createdAt} DESC`);

  const withNames = await Promise.all(bookmarks.map(withCollectionName));
  res.json(withNames);
});

router.post("/bookmarks", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const parsed = CreateBookmarkBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { url, title, description, coverImage, collectionId, tags, type, note } = parsed.data;

  const domain = extractDomain(url);
  const favicon = getFavicon(url);
  const finalTitle = title || domain || url;
  const finalType = type || "link";

  const [bookmark] = await db
    .insert(bookmarksTable)
    .values({
      userId,
      url,
      title: finalTitle,
      description: description ?? null,
      coverImage: coverImage ?? null,
      favicon,
      domain,
      type: finalType,
      tags: tags ?? [],
      collectionId: collectionId ?? null,
      note: note ?? null,
    })
    .returning();

  const result = await withCollectionName(bookmark);
  res.status(201).json(result);
});

router.get("/bookmarks/:id", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const params = GetBookmarkParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [bookmark] = await db
    .select()
    .from(bookmarksTable)
    .where(and(eq(bookmarksTable.id, params.data.id), eq(bookmarksTable.userId, userId)));

  if (!bookmark) { res.status(404).json({ error: "Bookmark not found" }); return; }

  const result = await withCollectionName(bookmark);
  res.json(result);
});

router.patch("/bookmarks/:id", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const params = UpdateBookmarkParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateBookmarkBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updateData: Record<string, any> = {};
  const d = parsed.data;
  if (d.title != null) updateData.title = d.title;
  if (d.description !== undefined) updateData.description = d.description;
  if (d.coverImage !== undefined) updateData.coverImage = d.coverImage;
  if (d.collectionId !== undefined) updateData.collectionId = d.collectionId;
  if (d.tags !== undefined) updateData.tags = d.tags;
  if (d.type != null) updateData.type = d.type;
  if (d.note !== undefined) updateData.note = d.note;
  if (d.highlight !== undefined) updateData.highlight = d.highlight;
  if (d.isFavorite != null) updateData.isFavorite = d.isFavorite;
  if (d.isArchived != null) updateData.isArchived = d.isArchived;

  const [bookmark] = await db
    .update(bookmarksTable)
    .set(updateData)
    .where(and(eq(bookmarksTable.id, params.data.id), eq(bookmarksTable.userId, userId)))
    .returning();

  if (!bookmark) { res.status(404).json({ error: "Bookmark not found" }); return; }

  const result = await withCollectionName(bookmark);
  res.json(result);
});

router.delete("/bookmarks/:id", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const params = DeleteBookmarkParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  await db
    .delete(bookmarksTable)
    .where(and(eq(bookmarksTable.id, params.data.id), eq(bookmarksTable.userId, userId)));

  res.sendStatus(204);
});

router.patch("/bookmarks/:id/favorite", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const params = ToggleFavoriteParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [existing] = await db
    .select()
    .from(bookmarksTable)
    .where(and(eq(bookmarksTable.id, params.data.id), eq(bookmarksTable.userId, userId)));

  if (!existing) { res.status(404).json({ error: "Bookmark not found" }); return; }

  const [bookmark] = await db
    .update(bookmarksTable)
    .set({ isFavorite: !existing.isFavorite })
    .where(eq(bookmarksTable.id, params.data.id))
    .returning();

  const result = await withCollectionName(bookmark);
  res.json(result);
});

router.patch("/bookmarks/:id/archive", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const params = ToggleArchiveParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [existing] = await db
    .select()
    .from(bookmarksTable)
    .where(and(eq(bookmarksTable.id, params.data.id), eq(bookmarksTable.userId, userId)));

  if (!existing) { res.status(404).json({ error: "Bookmark not found" }); return; }

  const [bookmark] = await db
    .update(bookmarksTable)
    .set({ isArchived: !existing.isArchived })
    .where(eq(bookmarksTable.id, params.data.id))
    .returning();

  const result = await withCollectionName(bookmark);
  res.json(result);
});

export default router;
