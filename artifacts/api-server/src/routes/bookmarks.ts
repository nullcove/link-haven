import { Router, type IRouter } from "express";
import { db, bookmarksTable, collectionsTable, sessionsTable, userSettingsTable } from "@workspace/db";
import { eq, and, ilike, or, sql, inArray } from "drizzle-orm";
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
  try { return new URL(url).hostname.replace("www.", ""); } catch { return ""; }
}

function getFavicon(url: string): string {
  try {
    const { protocol, hostname } = new URL(url);
    return `${protocol}//${hostname}/favicon.ico`;
  } catch { return ""; }
}

async function withCollectionName(bookmark: any): Promise<any> {
  if (!bookmark.collectionId) return { ...bookmark, collectionName: null };
  const [col] = await db
    .select({ name: collectionsTable.name })
    .from(collectionsTable)
    .where(eq(collectionsTable.id, bookmark.collectionId));
  return { ...bookmark, collectionName: col?.name ?? null };
}

/* ─── LIST ─────────────────────────────────────────────── */
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
        ilike(bookmarksTable.url, `%${search}%`),
        ilike(bookmarksTable.note, `%${search}%`),
        sql`${bookmarksTable.tags}::text ilike ${`%${search}%`}`
      )!
    );
  }
  if (tag) {
    conditions.push(sql`${bookmarksTable.tags} @> ARRAY[${tag}]::text[]`);
  }

  const sortBy = (req.query.sortBy as string) || "date";
  const sortOrder = (req.query.sortOrder as string) || "desc";

  let orderClause: any;
  if (sortBy === "title") {
    orderClause = sortOrder === "asc"
      ? sql`${bookmarksTable.title} ASC`
      : sql`${bookmarksTable.title} DESC`;
  } else if (sortBy === "domain") {
    orderClause = sortOrder === "asc"
      ? sql`${bookmarksTable.domain} ASC`
      : sql`${bookmarksTable.domain} DESC`;
  } else {
    orderClause = sortOrder === "asc"
      ? sql`${bookmarksTable.createdAt} ASC`
      : sql`${bookmarksTable.createdAt} DESC`;
  }

  const bookmarks = await db
    .select()
    .from(bookmarksTable)
    .where(and(...conditions))
    .orderBy(orderClause);

  const withNames = await Promise.all(bookmarks.map(withCollectionName));
  res.json(withNames);
});

/* ─── DUPLICATES ────────────────────────────────────────── */
router.get("/bookmarks/duplicates", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const bookmarks = await db
    .select()
    .from(bookmarksTable)
    .where(eq(bookmarksTable.userId, userId));

  const groups: Record<string, typeof bookmarks> = {};
  for (const b of bookmarks) {
    const normalised = b.url.replace(/\/$/, "").toLowerCase();
    if (!groups[normalised]) groups[normalised] = [];
    groups[normalised].push(b);
  }

  const duplicateGroups = Object.values(groups).filter(g => g.length > 1);
  res.json(duplicateGroups);
});

/* ─── BROKEN LINKS ──────────────────────────────────────── */
router.post("/bookmarks/broken-check", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const { ids } = req.body as { ids: number[] };
  if (!Array.isArray(ids) || ids.length === 0) { res.json([]); return; }

  const bookmarks = await db
    .select({ id: bookmarksTable.id, url: bookmarksTable.url, title: bookmarksTable.title })
    .from(bookmarksTable)
    .where(and(eq(bookmarksTable.userId, userId), inArray(bookmarksTable.id, ids)));

  const results = await Promise.all(
    bookmarks.map(async (b) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const r = await fetch(b.url, {
          method: "HEAD",
          signal: controller.signal,
          redirect: "follow",
        });
        clearTimeout(timeoutId);
        return { id: b.id, url: b.url, title: b.title, status: r.status, ok: r.ok };
      } catch {
        return { id: b.id, url: b.url, title: b.title, status: 0, ok: false };
      }
    })
  );

  res.json(results);
});

/* ─── IMPORT ────────────────────────────────────────────── */
router.post("/bookmarks/import", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const { bookmarks: items } = req.body as {
    bookmarks: Array<{ url: string; title?: string; tags?: string[]; description?: string; collectionId?: number }>;
  };

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "No bookmarks provided" });
    return;
  }

  const values = items.filter(b => b.url).map(b => ({
    userId,
    url: b.url,
    title: b.title || extractDomain(b.url) || b.url,
    description: b.description ?? null,
    coverImage: null,
    favicon: getFavicon(b.url),
    domain: extractDomain(b.url),
    type: "link" as const,
    tags: b.tags ?? [],
    collectionId: b.collectionId ?? null,
    note: null,
  }));

  const inserted = await db.insert(bookmarksTable).values(values).returning({ id: bookmarksTable.id });
  res.status(201).json({ imported: inserted.length });
});

/* ─── BULK DELETE ────────────────────────────────────────── */
router.post("/bookmarks/bulk-delete", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const { ids } = req.body as { ids: number[] };
  if (!Array.isArray(ids) || ids.length === 0) { res.json({ deleted: 0 }); return; }

  await db
    .delete(bookmarksTable)
    .where(and(eq(bookmarksTable.userId, userId), inArray(bookmarksTable.id, ids)));

  res.json({ deleted: ids.length });
});

/* ─── BULK UPDATE (move collection / add tag) ───────────── */
router.post("/bookmarks/bulk-update", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const { ids, update } = req.body as { ids: number[]; update: { collectionId?: number | null; isFavorite?: boolean; isArchived?: boolean } };
  if (!Array.isArray(ids) || ids.length === 0) { res.json({ updated: 0 }); return; }

  const updateData: Record<string, any> = {};
  if (update.collectionId !== undefined) updateData.collectionId = update.collectionId;
  if (update.isFavorite !== undefined) updateData.isFavorite = update.isFavorite;
  if (update.isArchived !== undefined) updateData.isArchived = update.isArchived;

  await db
    .update(bookmarksTable)
    .set(updateData)
    .where(and(eq(bookmarksTable.userId, userId), inArray(bookmarksTable.id, ids)));

  res.json({ updated: ids.length });
});

/* ─── AUTO-SUMMARIZE HELPERS ────────────────────────────── */
async function scrapeWithJina(url: string): Promise<string> {
  const jinaUrl = `https://r.jina.ai/${url}`;
  const resp = await fetch(jinaUrl, {
    headers: { "Accept": "text/plain", "X-No-Cache": "true" },
    signal: AbortSignal.timeout(15000),
  });
  if (!resp.ok) throw new Error(`Jina fetch failed: ${resp.status}`);
  const text = await resp.text();
  return text.slice(0, 12000);
}

async function getActiveAiKey(userId: number): Promise<{ provider: string; key: string } | null> {
  const [s] = await db.select().from(userSettingsTable).where(eq(userSettingsTable.userId, userId));
  if (!s) return null;
  if (s.geminiApiKey) return { provider: "gemini", key: s.geminiApiKey };
  if ((s as any).openaiApiKey) return { provider: "openai", key: (s as any).openaiApiKey };
  if ((s as any).openrouterApiKey) return { provider: "openrouter", key: (s as any).openrouterApiKey };
  return null;
}

async function summarizeText(provider: string, key: string, pageText: string, pageTitle: string): Promise<string> {
  const prompt = `You are a smart bookmark note-taker. Given the following web page content, write a concise, well-structured summary note in 3-5 sentences. Focus on: what the page is about, key points, and why it might be useful to save. Be clear and informative. Page title: "${pageTitle}"\n\nContent:\n${pageText}`;

  if (provider === "gemini") {
    const body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 512 },
    };
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) }
    );
    const data = await resp.json() as any;
    if (!resp.ok) throw new Error(data?.error?.message || "Gemini error");
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }

  if (provider === "openai" || provider === "openrouter") {
    const baseUrl = provider === "openrouter" ? "https://openrouter.ai/api/v1" : "https://api.openai.com/v1";
    const model = provider === "openrouter" ? "openai/gpt-4o-mini" : "gpt-4o-mini";
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: 512, temperature: 0.5 }),
      signal: AbortSignal.timeout(20000),
    });
    const data = await resp.json() as any;
    if (!resp.ok) throw new Error(data?.error?.message || "OpenAI error");
    return data?.choices?.[0]?.message?.content ?? "";
  }

  return "";
}

/* ─── CREATE ────────────────────────────────────────────── */
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
  const autoSummarize = (req.body as any).autoSummarize === true;

  const [bookmark] = await db
    .insert(bookmarksTable)
    .values({ userId, url, title: finalTitle, description: description ?? null, coverImage: coverImage ?? null, favicon, domain, type: finalType, tags: tags ?? [], collectionId: collectionId ?? null, note: note ?? null })
    .returning();

  const result = await withCollectionName(bookmark);
  res.status(201).json(result);

  // ── Background: scrape + summarize (non-blocking) ──────
  if (autoSummarize && !note) {
    (async () => {
      try {
        const aiCreds = await getActiveAiKey(userId);
        if (!aiCreds) return;
        const pageText = await scrapeWithJina(url);
        if (!pageText || pageText.length < 100) return;
        const summary = await summarizeText(aiCreds.provider, aiCreds.key, pageText, finalTitle);
        if (!summary) return;
        await db.update(bookmarksTable)
          .set({ note: summary.trim(), updatedAt: new Date() })
          .where(eq(bookmarksTable.id, bookmark.id));
      } catch {
        // silent fail — summary is best-effort
      }
    })();
  }
});

/* ─── GET ONE ───────────────────────────────────────────── */
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
  res.json(await withCollectionName(bookmark));
});

/* ─── UPDATE ────────────────────────────────────────────── */
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
  res.json(await withCollectionName(bookmark));
});

/* ─── DELETE ────────────────────────────────────────────── */
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

/* ─── TOGGLE FAVORITE ────────────────────────────────────── */
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

  res.json(await withCollectionName(bookmark));
});

/* ─── TOGGLE ARCHIVE ─────────────────────────────────────── */
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

  res.json(await withCollectionName(bookmark));
});

export default router;
