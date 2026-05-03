import { Router, type IRouter } from "express";
import { db, bookmarksTable, collectionsTable, sessionsTable, userSettingsTable } from "@workspace/db";
import { eq, and, ilike, or, sql, inArray, ne } from "drizzle-orm";
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

/* ─── SSRF Guard ────────────────────────────────────────── */
function isSafeUrl(rawUrl: string): boolean {
  let parsed: URL;
  try { parsed = new URL(rawUrl); } catch { return false; }

  // Only allow http/https
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;

  const host = parsed.hostname.toLowerCase();

  // Block localhost variants
  if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "0.0.0.0") return false;

  // Block link-local (169.254.x.x)
  if (/^169\.254\./.test(host)) return false;

  // Block private IPv4 ranges: 10.x, 172.16-31.x, 192.168.x
  if (/^10\./.test(host)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
  if (/^192\.168\./.test(host)) return false;

  // Block metadata services
  if (host === "169.254.169.254" || host === "metadata.google.internal") return false;

  // Block IPv6 private/loopback (simple heuristic)
  if (host.startsWith("[::") || host.startsWith("[fe80") || host.startsWith("[fc") || host.startsWith("[fd")) return false;

  return true;
}

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
      if (!isSafeUrl(b.url)) {
        return { id: b.id, url: b.url, title: b.title, status: 0, ok: false };
      }
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const r = await fetch(b.url, {
          method: "HEAD",
          signal: controller.signal,
          redirect: "manual",
        });
        clearTimeout(timeoutId);
        const status = r.status;
        const ok = status >= 200 && status < 400;
        return { id: b.id, url: b.url, title: b.title, status, ok };
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
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const resp = await fetch(jinaUrl, {
      headers: { "Accept": "text/plain", "X-No-Cache": "true", "X-Timeout": "25" },
      signal: controller.signal,
    });
    if (!resp.ok) throw new Error(`Jina fetch failed: ${resp.status}`);
    const text = await resp.text();
    return text.slice(0, 12000);
  } finally {
    clearTimeout(timer);
  }
}

async function getActiveAiKey(userId: number): Promise<{ provider: string; key: string; baseUrl?: string; model?: string } | null> {
  const [s] = await db.select().from(userSettingsTable).where(eq(userSettingsTable.userId, userId));
  if (!s) return null;
  if (s.geminiApiKey)               return { provider: "gemini",      key: s.geminiApiKey };
  if ((s as any).openaiApiKey)      return { provider: "openai",      key: (s as any).openaiApiKey,      baseUrl: "https://api.openai.com/v1",           model: "gpt-4o-mini" };
  if ((s as any).openrouterApiKey)  return { provider: "openrouter",  key: (s as any).openrouterApiKey,  baseUrl: "https://openrouter.ai/api/v1",         model: "openai/gpt-4o-mini" };
  if ((s as any).groqApiKey)        return { provider: "groq",        key: (s as any).groqApiKey,        baseUrl: "https://api.groq.com/openai/v1",       model: "llama-3.3-70b-versatile" };
  if ((s as any).mistralApiKey)     return { provider: "mistral",     key: (s as any).mistralApiKey,     baseUrl: "https://api.mistral.ai/v1",            model: "mistral-medium" };
  if ((s as any).togetherApiKey)    return { provider: "together",    key: (s as any).togetherApiKey,    baseUrl: "https://api.together.xyz/v1",          model: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo" };
  if ((s as any).cohereApiKey)      return { provider: "cohere",      key: (s as any).cohereApiKey,      baseUrl: "https://api.cohere.ai/compatibility/v1", model: "command-r-plus" };
  if (s.ollamaBaseUrl) {
    const baseUrl = s.ollamaBaseUrl.replace(/\/$/, "");
    try {
      const r = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
      const j = await r.json() as any;
      const model = j?.models?.[0]?.name || "llama3";
      return { provider: "ollama", key: "", baseUrl, model };
    } catch { return { provider: "ollama", key: "", baseUrl, model: "llama3" }; }
  }
  return null;
}

async function summarizeText(provider: string, key: string, pageText: string, pageTitle: string, opts?: { baseUrl?: string; model?: string }): Promise<string> {
  const prompt = `You are a smart bookmark note-taker. Given the following content, write a concise, well-structured summary note in 3-5 sentences. Focus on: what the page is about, key points, and why it might be useful to save. Be clear and informative. If the content is sparse, use the title as context but do not repeat it unnecessarily.

Title: ${pageTitle}

Content:
${pageText}`;

  if (provider === "gemini") {
    const body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 512 },
    };
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) }
    );
    const data = await resp.json() as any;
    if (!resp.ok) throw new Error(data?.error?.message || "Gemini error");
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }

  if (provider === "ollama") {
    const baseUrl = (opts?.baseUrl || "http://localhost:11434").replace(/\/$/, "");
    const model = opts?.model || "llama3";
    const resp = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false }),
      signal: AbortSignal.timeout(60000),
    });
    const data = await resp.json() as any;
    if (!resp.ok) throw new Error(data?.error || "Ollama error");
    return data?.response ?? "";
  }

  const baseUrl = opts?.baseUrl || "https://api.openai.com/v1";
  const model = opts?.model || "gpt-4o-mini";
  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: 512, temperature: 0.5 }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await resp.json() as any;
  if (!resp.ok) throw new Error(data?.error?.message || "AI provider error");
  return data?.choices?.[0]?.message?.content ?? "";
}

async function enrichWithAi(provider: string, key: string, pageText: string, pageTitle: string, pageUrl: string, opts?: { baseUrl?: string; model?: string }): Promise<{
  author: string | null;
  publishedAt: string | null;
  wordCount: number | null;
  language: string | null;
  topics: string[];
  keyPoints: string[];
  sentiment: string | null;
  summary: string | null;
}> {
  const prompt = `Analyze the following webpage content and extract structured metadata. Return ONLY valid JSON, no explanation.

URL: ${pageUrl}
Title: ${pageTitle}

Content:
${pageText.slice(0, 8000)}

Return this exact JSON structure:
{
  "author": "Author name or null if not found",
  "publishedAt": "ISO 8601 date string or null if not found",
  "wordCount": estimated_word_count_as_number,
  "language": "Language name in English (e.g. English, Bengali, Spanish) or null",
  "topics": ["topic1", "topic2", "topic3"],
  "keyPoints": ["key point 1", "key point 2", "key point 3", "key point 4", "key point 5"],
  "sentiment": "positive" or "negative" or "neutral" or "mixed",
  "summary": "3-5 sentence summary of the content"
}

Rules:
- topics: 3-7 short topic labels (e.g. "Machine Learning", "TypeScript", "Web Development")
- keyPoints: 3-6 bullet points, each under 120 chars, starting with a verb or noun
- wordCount: estimate from the content length (rough estimate is fine)
- If content is minimal, still provide your best estimates based on URL and title`;

  let rawText = "";

  if (provider === "gemini") {
    const body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    };
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(40000) }
    );
    const data = await resp.json() as any;
    if (!resp.ok) throw new Error(data?.error?.message || "Gemini error");
    rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  } else if (provider === "ollama") {
    const baseUrl = (opts?.baseUrl || "http://localhost:11434").replace(/\/$/, "");
    const model = opts?.model || "llama3";
    const resp = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false }),
      signal: AbortSignal.timeout(90000),
    });
    const data = await resp.json() as any;
    if (!resp.ok) throw new Error(data?.error || "Ollama error");
    rawText = data?.response ?? "";
  } else {
    const baseUrl = opts?.baseUrl || "https://api.openai.com/v1";
    const model = opts?.model || "gpt-4o-mini";
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024, temperature: 0.3,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(40000),
    });
    const data = await resp.json() as any;
    if (!resp.ok) throw new Error(data?.error?.message || "AI provider error");
    rawText = data?.choices?.[0]?.message?.content ?? "";
  }

  // Parse JSON from response
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI returned no JSON");
  const parsed = JSON.parse(jsonMatch[0]);
  return {
    author: parsed.author || null,
    publishedAt: parsed.publishedAt || null,
    wordCount: typeof parsed.wordCount === "number" ? parsed.wordCount : null,
    language: parsed.language || null,
    topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 8) : [],
    keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.slice(0, 8) : [],
    sentiment: parsed.sentiment || null,
    summary: parsed.summary || null,
  };
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
        let pageText = "";
        try { pageText = await scrapeWithJina(url); } catch { /* fall back to title-only */ }
        const contextForAi = pageText && pageText.length >= 100
          ? pageText
          : `URL: ${url}\n\n(Page content could not be fetched. Write a helpful note based on the URL and title alone.)`;
        const summary = await summarizeText(aiCreds.provider, aiCreds.key, contextForAi, finalTitle, { baseUrl: aiCreds.baseUrl, model: aiCreds.model });
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

/* ─── MANUAL SUMMARIZE ──────────────────────────────────── */
router.post("/bookmarks/:id/summarize", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid bookmark id" }); return; }

  const [bookmark] = await db.select().from(bookmarksTable)
    .where(and(eq(bookmarksTable.id, id), eq(bookmarksTable.userId, userId)));
  if (!bookmark) { res.status(404).json({ error: "Bookmark not found" }); return; }

  const aiCreds = await getActiveAiKey(userId);
  if (!aiCreds) { res.status(400).json({ error: "No AI provider configured. Please add an API key in Settings." }); return; }

  try {
    let pageText = "";
    try { pageText = await scrapeWithJina(bookmark.url); } catch { /* Scraping failed */ }

    const contextForAi = pageText && pageText.length >= 100
      ? pageText
      : `URL: ${bookmark.url}\n\n(Page content could not be fetched. Write a helpful note based on the URL and title alone.)`;

    const summary = await summarizeText(aiCreds.provider, aiCreds.key, contextForAi, bookmark.title || bookmark.url, { baseUrl: aiCreds.baseUrl, model: aiCreds.model });
    if (!summary) { res.status(422).json({ error: "AI returned empty summary." }); return; }
    const [updated] = await db.update(bookmarksTable)
      .set({ note: summary.trim(), updatedAt: new Date() })
      .where(eq(bookmarksTable.id, id))
      .returning();
    res.json(await withCollectionName(updated));
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Summarization failed." });
  }
});

/* ─── FULL AI ENRICH ────────────────────────────────────── */
router.post("/bookmarks/:id/enrich", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid bookmark id" }); return; }

  const [bookmark] = await db.select().from(bookmarksTable)
    .where(and(eq(bookmarksTable.id, id), eq(bookmarksTable.userId, userId)));
  if (!bookmark) { res.status(404).json({ error: "Bookmark not found" }); return; }

  const aiCreds = await getActiveAiKey(userId);
  if (!aiCreds) { res.status(400).json({ error: "No AI provider configured. Please add an API key in Settings." }); return; }

  try {
    let pageText = "";
    try { pageText = await scrapeWithJina(bookmark.url); } catch { /* scraping failed */ }

    const contextForAi = pageText && pageText.length >= 100
      ? pageText
      : `URL: ${bookmark.url}\nTitle: ${bookmark.title}\n(Page could not be fetched — infer from URL and title)`;

    const enriched = await enrichWithAi(aiCreds.provider, aiCreds.key, contextForAi, bookmark.title || bookmark.url, bookmark.url, { baseUrl: aiCreds.baseUrl, model: aiCreds.model });

    const updatePayload: Record<string, any> = {
      updatedAt: new Date(),
      topics: enriched.topics,
      keyPoints: enriched.keyPoints.length > 0 ? JSON.stringify(enriched.keyPoints) : null,
      sentiment: enriched.sentiment,
      language: enriched.language,
    };
    if (enriched.author) updatePayload.author = enriched.author;
    if (enriched.publishedAt) {
      try { updatePayload.publishedAt = new Date(enriched.publishedAt); } catch { /* ignore bad dates */ }
    }
    if (enriched.wordCount) updatePayload.wordCount = enriched.wordCount;
    if (enriched.summary && !bookmark.note) updatePayload.note = enriched.summary.trim();
    // Estimate reading time from word count
    if (enriched.wordCount) updatePayload.readingTime = Math.max(1, Math.round(enriched.wordCount / 200));

    const [updated] = await db.update(bookmarksTable)
      .set(updatePayload)
      .where(eq(bookmarksTable.id, id))
      .returning();

    res.json(await withCollectionName(updated));
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Enrichment failed." });
  }
});

/* ─── RELATED BOOKMARKS ─────────────────────────────────── */
router.get("/bookmarks/:id/related", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid bookmark id" }); return; }

  const [bookmark] = await db.select().from(bookmarksTable)
    .where(and(eq(bookmarksTable.id, id), eq(bookmarksTable.userId, userId)));
  if (!bookmark) { res.status(404).json({ error: "Bookmark not found" }); return; }

  // Find bookmarks sharing tags, domain, or topics
  const allBookmarks = await db.select().from(bookmarksTable)
    .where(and(eq(bookmarksTable.userId, userId), ne(bookmarksTable.id, id), eq(bookmarksTable.isArchived, false)))
    .limit(200);

  const tags = bookmark.tags || [];
  const topics = (bookmark as any).topics || [];
  const domain = bookmark.domain || "";

  // Score each bookmark by relevance
  const scored = allBookmarks.map(b => {
    let score = 0;
    const bTags = b.tags || [];
    const bTopics = (b as any).topics || [];
    const sharedTags = tags.filter((t: string) => bTags.includes(t)).length;
    const sharedTopics = topics.filter((t: string) => bTopics.includes(t)).length;
    score += sharedTags * 3;
    score += sharedTopics * 2;
    if (b.domain === domain && domain) score += 1;
    return { ...b, _score: score };
  });

  const related = scored
    .filter(b => b._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 8)
    .map(({ _score, ...b }) => b);

  const withNames = await Promise.all(related.map(withCollectionName));
  res.json(withNames);
});

/* ─── TRACK VISIT ───────────────────────────────────────── */
router.patch("/bookmarks/:id/visit", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid bookmark id" }); return; }

  const [existing] = await db.select().from(bookmarksTable)
    .where(and(eq(bookmarksTable.id, id), eq(bookmarksTable.userId, userId)));
  if (!existing) { res.status(404).json({ error: "Bookmark not found" }); return; }

  const [updated] = await db.update(bookmarksTable)
    .set({
      visitCount: ((existing as any).visitCount || 0) + 1,
      lastVisitedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(bookmarksTable.id, id))
    .returning();

  res.json(await withCollectionName(updated));
});

/* ─── LINK STATUS CHECK ─────────────────────────────────── */
router.post("/bookmarks/:id/check-link", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid bookmark id" }); return; }

  const [bookmark] = await db.select().from(bookmarksTable)
    .where(and(eq(bookmarksTable.id, id), eq(bookmarksTable.userId, userId)));
  if (!bookmark) { res.status(404).json({ error: "Bookmark not found" }); return; }

  if (!isSafeUrl(bookmark.url)) {
    res.status(400).json({ error: "URL is not allowed (blocked: private/internal address)" });
    return;
  }

  let status = 0;
  let ok = false;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 10000);
    const r = await fetch(bookmark.url, { method: "HEAD", signal: controller.signal, redirect: "manual" });
    clearTimeout(t);
    status = r.status;
    ok = status >= 200 && status < 400;
  } catch { /* link unreachable */ }

  const [updated] = await db.update(bookmarksTable)
    .set({ linkStatus: status, lastCheckedAt: new Date(), updatedAt: new Date() })
    .where(eq(bookmarksTable.id, id))
    .returning();

  res.json({ ...(await withCollectionName(updated)), linkOk: ok });
});

/* ─── BULK ENRICH ───────────────────────────────────────── */
router.post("/bookmarks/bulk-enrich", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const aiCreds = await getActiveAiKey(userId);
  if (!aiCreds) { res.status(400).json({ error: "No AI provider configured." }); return; }

  const { ids } = req.body as { ids: number[] };
  if (!Array.isArray(ids) || ids.length === 0) { res.json({ enriched: 0 }); return; }

  const bookmarks = await db.select().from(bookmarksTable)
    .where(and(eq(bookmarksTable.userId, userId), inArray(bookmarksTable.id, ids)));

  // Process sequentially to avoid rate limits
  let enriched = 0;
  for (const bookmark of bookmarks) {
    try {
      let pageText = "";
      try { pageText = await scrapeWithJina(bookmark.url); } catch { /* ignore */ }
      const contextForAi = pageText && pageText.length >= 100
        ? pageText
        : `URL: ${bookmark.url}\nTitle: ${bookmark.title}`;
      const result = await enrichWithAi(aiCreds.provider, aiCreds.key, contextForAi, bookmark.title, bookmark.url, { baseUrl: aiCreds.baseUrl, model: aiCreds.model });
      const updatePayload: Record<string, any> = { updatedAt: new Date(), topics: result.topics };
      if (result.keyPoints.length) updatePayload.keyPoints = JSON.stringify(result.keyPoints);
      if (result.sentiment) updatePayload.sentiment = result.sentiment;
      if (result.language) updatePayload.language = result.language;
      if (result.author) updatePayload.author = result.author;
      if (result.wordCount) { updatePayload.wordCount = result.wordCount; updatePayload.readingTime = Math.max(1, Math.round(result.wordCount / 200)); }
      if (result.summary && !bookmark.note) updatePayload.note = result.summary.trim();
      await db.update(bookmarksTable).set(updatePayload).where(eq(bookmarksTable.id, bookmark.id));
      enriched++;
    } catch { /* continue on error */ }
  }

  res.json({ enriched });
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
  // Extra fields allowed via body
  const body = req.body as any;
  if (body.isPinned != null) updateData.isPinned = body.isPinned;
  if (body.author !== undefined) updateData.author = body.author;
  if (body.topics !== undefined) updateData.topics = body.topics;
  if (body.keyPoints !== undefined) updateData.keyPoints = body.keyPoints;
  if (body.sentiment !== undefined) updateData.sentiment = body.sentiment;
  if (body.language !== undefined) updateData.language = body.language;

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
