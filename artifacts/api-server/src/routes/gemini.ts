import { Router, type IRouter } from "express";
import { db, sessionsTable, userSettingsTable, bookmarksTable, collectionsTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";

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

async function getGeminiKey(userId: number): Promise<string | null> {
  const [settings] = await db.select().from(userSettingsTable).where(eq(userSettingsTable.userId, userId));
  return settings?.geminiApiKey ?? null;
}

/* ── Active provider resolution ────────────────────────────── */
type ProviderInfo = {
  provider: "gemini" | "openai" | "openrouter" | "groq" | "mistral" | "together" | "cohere" | "ollama";
  label: string;
  key: string;
  model: string;
  baseUrl?: string;
  models?: string[];
};

async function getOllamaModels(baseUrl: string): Promise<string[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(`${baseUrl.replace(/\/$/, "")}/api/tags`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) return [];
    const data = await r.json() as any;
    return (data?.models ?? []).map((m: any) => (m.name as string)).filter(Boolean);
  } catch { clearTimeout(timer); return []; }
}

async function getActiveProvider(userId: number): Promise<ProviderInfo | null> {
  const [s] = await db.select().from(userSettingsTable).where(eq(userSettingsTable.userId, userId));
  if (!s) return null;
  if (s.geminiApiKey)        return { provider: "gemini",      label: "Gemini",      key: s.geminiApiKey,        model: "gemini-2.0-flash" };
  if ((s as any).openaiApiKey)     return { provider: "openai",      label: "OpenAI",      key: (s as any).openaiApiKey,     model: "gpt-4o-mini",   baseUrl: "https://api.openai.com/v1" };
  if ((s as any).openrouterApiKey) return { provider: "openrouter",  label: "OpenRouter",  key: (s as any).openrouterApiKey, model: "openai/gpt-4o-mini", baseUrl: "https://openrouter.ai/api/v1" };
  if ((s as any).groqApiKey)       return { provider: "groq",        label: "Groq",        key: (s as any).groqApiKey,       model: "llama-3.3-70b-versatile", baseUrl: "https://api.groq.com/openai/v1" };
  if ((s as any).mistralApiKey)    return { provider: "mistral",     label: "Mistral",     key: (s as any).mistralApiKey,    model: "mistral-medium", baseUrl: "https://api.mistral.ai/v1" };
  if ((s as any).togetherApiKey)   return { provider: "together",    label: "Together",    key: (s as any).togetherApiKey,   model: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo", baseUrl: "https://api.together.xyz/v1" };
  if ((s as any).cohereApiKey)     return { provider: "cohere",      label: "Cohere",      key: (s as any).cohereApiKey,     model: "command-r-plus", baseUrl: "https://api.cohere.ai/compatibility/v1" };
  if (s.ollamaBaseUrl) {
    const models = await getOllamaModels(s.ollamaBaseUrl);
    const model = models[0] || "llama3.2";
    return { provider: "ollama", label: "Ollama", key: "", model, baseUrl: s.ollamaBaseUrl, models };
  }
  return null;
}

/* ── OpenAI-compatible streaming helper ────────────────────── */
async function streamOpenAI(
  baseUrl: string, key: string, model: string,
  messages: Array<{ role: string; content: string }>,
  onChunk: (text: string) => void
): Promise<{ inputTokens: number; outputTokens: number }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (key) headers["Authorization"] = `Bearer ${key}`;
  const cleanBase = baseUrl.replace(/\/$/, "");
  const resp = await fetch(`${cleanBase}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ model, messages, stream: true, max_tokens: 3000, temperature: 0.75 }),
  });
  if (!resp.ok) {
    let errMsg = `${model} error ${resp.status}`;
    try {
      const body = await resp.text();
      try {
        const parsed = JSON.parse(body) as any;
        errMsg = parsed?.error?.message || parsed?.error || body || errMsg;
      } catch {
        errMsg = body || errMsg;
      }
    } catch { /* ignore */ }
    throw new Error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
  }
  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let inputTokens = 0, outputTokens = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (!json || json === "[DONE]") continue;
      try {
        const d = JSON.parse(json);
        const chunk = d?.choices?.[0]?.delta?.content;
        if (chunk) onChunk(chunk);
        if (d?.usage) { inputTokens = d.usage.prompt_tokens || 0; outputTokens = d.usage.completion_tokens || 0; }
      } catch { /* ignore parse errors */ }
    }
  }
  return { inputTokens, outputTokens };
}

/* ── Convert Gemini history → OpenAI messages ──────────────── */
function geminiHistoryToOpenAI(history: any[]): Array<{ role: string; content: string }> {
  return history.map(h => ({
    role: h.role === "model" ? "assistant" : "user",
    content: Array.isArray(h.parts) ? h.parts.map((p: any) => p.text || "").join("") : (h.content || ""),
  }));
}

/* ── Ollama native /api/chat streaming ─────────────────────── */
async function streamOllama(
  baseUrl: string, model: string,
  messages: Array<{ role: string; content: string }>,
  onChunk: (text: string) => void
): Promise<{ inputTokens: number; outputTokens: number }> {
  const cleanBase = baseUrl.replace(/\/$/, "");
  const resp = await fetch(`${cleanBase}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: true }),
  });
  if (!resp.ok) {
    let errMsg = `Ollama error ${resp.status}`;
    try {
      const body = await resp.text();
      try { const p = JSON.parse(body) as any; errMsg = p?.error || body || errMsg; }
      catch { errMsg = body || errMsg; }
    } catch { /* ignore */ }
    throw new Error(errMsg);
  }
  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let inputTokens = 0, outputTokens = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const d = JSON.parse(trimmed);
        const chunk = d?.message?.content;
        if (chunk) onChunk(chunk);
        if (d?.done && d?.prompt_eval_count) { inputTokens = d.prompt_eval_count || 0; outputTokens = d.eval_count || 0; }
      } catch { /* ignore */ }
    }
  }
  return { inputTokens, outputTokens };
}

async function callGemini(apiKey: string, contents: any[], systemInstruction?: string) {
  const body: any = { contents };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }
  body.generationConfig = { temperature: 0.7, maxOutputTokens: 2048 };

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  const data = await resp.json() as any;
  if (!resp.ok) throw new Error(data?.error?.message || "Gemini API error");
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

function extractDomainLocal(url: string): string {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return ""; }
}

async function executeAction(userId: number, action: any): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    switch (action.action) {
      case "add_bookmark": {
        if (!action.url) return { success: false, message: "URL is required" };
        const domain = extractDomainLocal(action.url);
        const favicon = domain ? `https://${domain}/favicon.ico` : "";
        const [bm] = await db.insert(bookmarksTable).values({
          userId,
          url: action.url,
          title: action.title || domain || action.url,
          description: action.description ?? null,
          coverImage: null,
          favicon,
          domain,
          type: (action.type as any) || "link",
          tags: action.tags ?? [],
          collectionId: action.collectionId ?? null,
          note: action.note ?? null,
        }).returning();
        return { success: true, message: `Added "${bm.title}"`, data: bm };
      }

      case "delete_bookmark": {
        const id = Number(action.id);
        if (!id) return { success: false, message: "Bookmark ID required" };
        await db.delete(bookmarksTable).where(and(eq(bookmarksTable.id, id), eq(bookmarksTable.userId, userId)));
        return { success: true, message: `Deleted bookmark #${id}` };
      }

      case "delete_bookmarks": {
        const ids = (action.ids as number[]).map(Number).filter(Boolean);
        if (!ids.length) return { success: false, message: "No IDs provided" };
        await db.delete(bookmarksTable).where(and(eq(bookmarksTable.userId, userId), inArray(bookmarksTable.id, ids)));
        return { success: true, message: `Deleted ${ids.length} bookmark${ids.length > 1 ? "s" : ""}` };
      }

      case "update_bookmark": {
        const id = Number(action.id);
        if (!id) return { success: false, message: "Bookmark ID required" };
        const changes = action.changes || {};
        const updateData: Record<string, any> = {};
        if (changes.title != null) updateData.title = changes.title;
        if (changes.tags !== undefined) updateData.tags = changes.tags;
        if (changes.note !== undefined) updateData.note = changes.note;
        if (changes.isFavorite != null) updateData.isFavorite = changes.isFavorite;
        if (changes.isArchived != null) updateData.isArchived = changes.isArchived;
        if (changes.isPinned != null) updateData.isPinned = changes.isPinned;
        if (changes.collectionId !== undefined) updateData.collectionId = changes.collectionId;
        if (changes.type != null) updateData.type = changes.type;
        if (!Object.keys(updateData).length) return { success: false, message: "No changes provided" };
        const [bm] = await db.update(bookmarksTable).set(updateData)
          .where(and(eq(bookmarksTable.id, id), eq(bookmarksTable.userId, userId))).returning();
        return { success: !!bm, message: bm ? `Updated "${bm.title}"` : "Bookmark not found" };
      }

      case "bulk_tag": {
        const ids = (action.ids as number[]).map(Number).filter(Boolean);
        const newTags = (action.tags as string[]) || [];
        if (!ids.length || !newTags.length) return { success: false, message: "IDs and tags required" };
        const bms = await db.select({ id: bookmarksTable.id, tags: bookmarksTable.tags })
          .from(bookmarksTable).where(and(eq(bookmarksTable.userId, userId), inArray(bookmarksTable.id, ids)));
        await Promise.all(bms.map(b =>
          db.update(bookmarksTable)
            .set({ tags: [...new Set([...(b.tags || []), ...newTags])] })
            .where(eq(bookmarksTable.id, b.id))
        ));
        return { success: true, message: `Tagged ${ids.length} bookmark${ids.length > 1 ? "s" : ""} with [${newTags.join(", ")}]` };
      }

      case "remove_tags": {
        const ids = (action.ids as number[]).map(Number).filter(Boolean);
        const removeTags = (action.tags as string[]) || [];
        if (!ids.length) return { success: false, message: "IDs required" };
        const bms = await db.select({ id: bookmarksTable.id, tags: bookmarksTable.tags })
          .from(bookmarksTable).where(and(eq(bookmarksTable.userId, userId), inArray(bookmarksTable.id, ids)));
        await Promise.all(bms.map(b =>
          db.update(bookmarksTable)
            .set({ tags: (b.tags || []).filter((t: string) => !removeTags.includes(t)) })
            .where(eq(bookmarksTable.id, b.id))
        ));
        return { success: true, message: `Removed tags [${removeTags.join(", ")}] from ${ids.length} bookmark${ids.length > 1 ? "s" : ""}` };
      }

      case "create_collection": {
        if (!action.name) return { success: false, message: "Collection name required" };
        const [col] = await db.insert(collectionsTable).values({
          userId,
          name: action.name,
          color: action.color || "#6366f1",
          icon: action.icon || "folder",
          description: action.description ?? null,
        }).returning();
        return { success: true, message: `Created collection "${col.name}"`, data: col };
      }

      case "move_collection": {
        const ids = (action.ids as number[]).map(Number).filter(Boolean);
        if (!ids.length) return { success: false, message: "No IDs provided" };
        const colId = action.collectionId ? Number(action.collectionId) : null;
        await db.update(bookmarksTable).set({ collectionId: colId })
          .where(and(eq(bookmarksTable.userId, userId), inArray(bookmarksTable.id, ids)));
        return { success: true, message: `Moved ${ids.length} bookmark${ids.length > 1 ? "s" : ""} to ${colId ? "collection" : "root"}` };
      }

      case "toggle_favorite": {
        const ids = (action.ids as number[]).map(Number).filter(Boolean);
        const val = action.value !== false;
        if (!ids.length) return { success: false, message: "No IDs provided" };
        await db.update(bookmarksTable).set({ isFavorite: val })
          .where(and(eq(bookmarksTable.userId, userId), inArray(bookmarksTable.id, ids)));
        return { success: true, message: `${val ? "Starred" : "Unstarred"} ${ids.length} bookmark${ids.length > 1 ? "s" : ""}` };
      }

      case "toggle_archive": {
        const ids = (action.ids as number[]).map(Number).filter(Boolean);
        const val = action.value !== false;
        if (!ids.length) return { success: false, message: "No IDs provided" };
        await db.update(bookmarksTable).set({ isArchived: val })
          .where(and(eq(bookmarksTable.userId, userId), inArray(bookmarksTable.id, ids)));
        return { success: true, message: `${val ? "Archived" : "Unarchived"} ${ids.length} bookmark${ids.length > 1 ? "s" : ""}` };
      }

      case "toggle_pin": {
        const ids = (action.ids as number[]).map(Number).filter(Boolean);
        const val = action.value !== false;
        if (!ids.length) return { success: false, message: "No IDs provided" };
        await db.update(bookmarksTable).set({ isPinned: val })
          .where(and(eq(bookmarksTable.userId, userId), inArray(bookmarksTable.id, ids)));
        return { success: true, message: `${val ? "Pinned" : "Unpinned"} ${ids.length} bookmark${ids.length > 1 ? "s" : ""}` };
      }

      case "set_note": {
        const id = Number(action.id);
        if (!id) return { success: false, message: "Bookmark ID required" };
        const [bm] = await db.update(bookmarksTable).set({ note: action.note ?? null })
          .where(and(eq(bookmarksTable.id, id), eq(bookmarksTable.userId, userId))).returning();
        return { success: !!bm, message: bm ? `Note updated for "${bm.title}"` : "Bookmark not found" };
      }

      default:
        return { success: false, message: `Unknown action: "${action.action}"` };
    }
  } catch (e: any) {
    return { success: false, message: e.message || "Action failed" };
  }
}

/* ── ACTIVE PROVIDER INFO ─────────────────────────────────── */
router.get("/ai/active", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }
  const info = await getActiveProvider(userId);
  if (!info) { res.json({ provider: null, label: null, model: null, models: [] }); return; }
  res.json({ provider: info.provider, label: info.label, model: info.model, models: info.models ?? [] });
});

/* ── TEST ─────────────────────────────────────────────── */
router.post("/gemini/test", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const apiKey = (req.body?.apiKey) || (await getGeminiKey(userId));
  if (!apiKey) { res.status(400).json({ error: "No Gemini API key" }); return; }

  try {
    const text = await callGemini(apiKey, [
      { role: "user", parts: [{ text: "Reply with exactly: Gemini is connected!" }] }
    ]);
    res.json({ success: true, message: text.trim() });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

/* ── CHAT (legacy) ─────────────────────────────────────────── */
router.post("/gemini/chat", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const apiKey = await getGeminiKey(userId);
  if (!apiKey) { res.status(400).json({ error: "No Gemini API key configured. Add it in Settings." }); return; }

  const { message, history = [] } = req.body;
  if (!message) { res.status(400).json({ error: "message required" }); return; }

  const bookmarks = await db.select({
    id: bookmarksTable.id, title: bookmarksTable.title, url: bookmarksTable.url,
    domain: bookmarksTable.domain, tags: bookmarksTable.tags, isFavorite: bookmarksTable.isFavorite,
    isArchived: bookmarksTable.isArchived, isPinned: bookmarksTable.isPinned,
    collectionId: bookmarksTable.collectionId, type: bookmarksTable.type, note: bookmarksTable.note,
  }).from(bookmarksTable).where(eq(bookmarksTable.userId, userId)).limit(500);

  const collections = await db.select().from(collectionsTable).where(eq(collectionsTable.userId, userId));

  const bookmarkContext = bookmarks.slice(0, 200).map(b =>
    `[ID:${b.id}] "${b.title}" (${b.domain}) tags:[${(b.tags || []).join(",")}]${b.isFavorite ? " ⭐" : ""}${b.isPinned ? " 📌" : ""}${b.isArchived ? " 📦" : ""}`
  ).join("\n");

  const collectionContext = collections.map(c => `[COL:${c.id}] "${c.name}"`).join(", ");

  const systemInstruction = `You are an intelligent AI assistant for Link Haven, a bookmark manager. You have FULL POWER to help the user manage their bookmarks.

USER'S LIBRARY (${bookmarks.length} bookmarks, ${collections.length} collections):
Collections: ${collectionContext}

Bookmarks (first 200):
${bookmarkContext}

You can help the user:
- Search and find bookmarks by topic, domain, tag, or content
- Suggest organization strategies (collections, tags)
- Analyze their reading habits and bookmark patterns
- Answer questions about their saved content
- Suggest actions like "archive old bookmarks", "tag untagged bookmarks", etc.
- Generate summaries, insights, and reports about their library

When suggesting specific actions on bookmarks, format them as JSON at the end of your response:
<actions>
[{"type":"add_tags","ids":[1,2,3],"tags":["tag1"]},{"type":"move_collection","ids":[4,5],"collectionId":1},{"type":"favorite","ids":[6]},{"type":"archive","ids":[7,8]}]
</actions>

Always be helpful, concise, and specific. Reference bookmark titles and IDs when relevant.`;

  try {
    const contents = [
      ...history,
      { role: "user", parts: [{ text: message }] },
    ];
    const text = await callGemini(apiKey, contents, systemInstruction);
    res.json({ text, bookmarkCount: bookmarks.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── FULL-POWER ASSISTANT (SSE Streaming + Action Execution, multi-provider) ── */
router.post("/gemini/assistant", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const { message, history = [], model: requestedModel } = req.body;
  if (!message) { send("error", { error: "message required" }); res.end(); return; }

  const providerInfo = await getActiveProvider(userId);
  if (!providerInfo) {
    send("error", { error: "No AI provider configured. Add an API key or Ollama URL in Settings → AI Settings." });
    res.end();
    return;
  }

  const activeModel = requestedModel || providerInfo.model;
  const start = Date.now();

  try {
    const [bookmarks, collections] = await Promise.all([
      db.select({
        id: bookmarksTable.id, title: bookmarksTable.title, url: bookmarksTable.url,
        domain: bookmarksTable.domain, tags: bookmarksTable.tags, isFavorite: bookmarksTable.isFavorite,
        isArchived: bookmarksTable.isArchived, isPinned: bookmarksTable.isPinned,
        collectionId: bookmarksTable.collectionId, type: bookmarksTable.type, note: bookmarksTable.note,
        createdAt: bookmarksTable.createdAt,
      }).from(bookmarksTable).where(eq(bookmarksTable.userId, userId)).limit(500),
      db.select().from(collectionsTable).where(eq(collectionsTable.userId, userId)),
    ]);

    const bookmarkCtx = bookmarks.slice(0, 300).map(b => {
      const cols = b.collectionId ? ` col:${b.collectionId}` : "";
      const tags = b.tags?.length ? ` tags:[${b.tags.join(",")}]` : "";
      const flags = `${b.isFavorite ? " ⭐" : ""}${b.isPinned ? " 📌" : ""}${b.isArchived ? " 📦" : ""}`;
      return `[ID:${b.id}] "${b.title}" (${b.domain || "?"})${tags}${cols}${flags}`;
    }).join("\n");

    const colCtx = collections.map(c => `[COL:${c.id}] "${c.name}" color:${c.color}`).join(" | ");

    const systemInstruction = `You are Haven AI — a powerful AI assistant embedded in Link Haven, a bookmark manager. You have COMPLETE CONTROL over the user's bookmarks.

EXECUTION SYSTEM:
When the user wants to DO something (add, delete, edit, tag, organize, archive, favorite, pin bookmarks), you EXECUTE it directly by including execute commands in your response. These will be automatically run on the server.

EXECUTE COMMANDS (include these in your response to perform actions):
• Add bookmark:       <execute>{"action":"add_bookmark","url":"https://...","title":"Title","tags":["tag1","tag2"],"collectionId":null,"type":"link"}</execute>
• Delete one:         <execute>{"action":"delete_bookmark","id":123}</execute>
• Delete many:        <execute>{"action":"delete_bookmarks","ids":[1,2,3]}</execute>
• Update bookmark:    <execute>{"action":"update_bookmark","id":123,"changes":{"title":"New Title","tags":["tag"],"isFavorite":true,"isArchived":false,"note":"my note","collectionId":5}}</execute>
• Add tags to many:   <execute>{"action":"bulk_tag","ids":[1,2,3],"tags":["tag1","tag2"]}</execute>
• Remove tags:        <execute>{"action":"remove_tags","ids":[1,2,3],"tags":["old-tag"]}</execute>
• Create collection:  <execute>{"action":"create_collection","name":"Collection Name","color":"#6366f1"}</execute>
• Move to collection: <execute>{"action":"move_collection","ids":[1,2,3],"collectionId":5}</execute>
• Star/unstar:        <execute>{"action":"toggle_favorite","ids":[1,2,3],"value":true}</execute>
• Archive/unarchive:  <execute>{"action":"toggle_archive","ids":[1,2,3],"value":true}</execute>
• Pin/unpin:          <execute>{"action":"toggle_pin","ids":[1,2,3],"value":true}</execute>
• Set note:           <execute>{"action":"set_note","id":123,"note":"My note about this"}</execute>

IMPORTANT RULES:
1. Use REAL IDs from the bookmark/collection context below
2. Be conversational — explain what you're doing naturally, then include the execute tag
3. For searches and analysis, just describe findings from the context (no execute needed)
4. You can include MULTIPLE execute commands in one response
5. Always confirm what actions you're taking
6. If the user asks to add a URL, make sure to include the full URL starting with https://

USER'S LIBRARY (${bookmarks.length} bookmarks across ${collections.length} collections):
Collections: ${colCtx || "none"}

Bookmarks (most recent ${Math.min(300, bookmarks.length)}):
${bookmarkCtx || "Library is empty"}`;

    let fullText = "";
    let inputTokens = 0;
    let outputTokens = 0;

    if (providerInfo.provider === "gemini") {
      const contents = [
        ...history,
        { role: "user", parts: [{ text: message }] },
      ];
      const geminiBody = {
        contents,
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: { temperature: 0.75, maxOutputTokens: 3000 },
      };
      const streamResp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:streamGenerateContent?key=${providerInfo.key}&alt=sse`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(geminiBody) }
      );
      if (!streamResp.ok) {
        const errData = await streamResp.json() as any;
        send("error", { error: errData?.error?.message || `Gemini error ${streamResp.status}` });
        res.end(); return;
      }
      const reader = streamResp.body!.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split("\n"); sseBuffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json || json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json);
            const chunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (chunk) { fullText += chunk; send("chunk", { text: chunk }); }
            const usage = parsed?.usageMetadata;
            if (usage) { inputTokens = usage.promptTokenCount || 0; outputTokens = usage.candidatesTokenCount || 0; }
          } catch { /* ignore */ }
        }
      }
    } else if (providerInfo.provider === "ollama") {
      const ollamaMessages = [
        { role: "system", content: systemInstruction },
        ...geminiHistoryToOpenAI(history),
        { role: "user", content: message },
      ];
      const usage = await streamOllama(
        providerInfo.baseUrl!, activeModel, ollamaMessages,
        (chunk) => { fullText += chunk; send("chunk", { text: chunk }); }
      );
      inputTokens = usage.inputTokens;
      outputTokens = usage.outputTokens;
    } else {
      const oaiMessages = [
        { role: "system" as const, content: systemInstruction },
        ...geminiHistoryToOpenAI(history),
        { role: "user" as const, content: message },
      ];
      const usage = await streamOpenAI(
        providerInfo.baseUrl!, providerInfo.key, activeModel, oaiMessages,
        (chunk) => { fullText += chunk; send("chunk", { text: chunk }); }
      );
      inputTokens = usage.inputTokens;
      outputTokens = usage.outputTokens;
    }

    const execRegex = /<execute>([\s\S]*?)<\/execute>/g;
    let match;
    while ((match = execRegex.exec(fullText)) !== null) {
      try {
        const action = JSON.parse(match[1].trim());
        send("action_start", { action });
        const result = await executeAction(userId, action);
        send("action_result", { action, result });
      } catch {
        send("action_result", { action: { action: "parse_error" }, result: { success: false, message: "Could not parse action" } });
      }
    }

    send("done", {
      stats: { model: activeModel, inputTokens, outputTokens, latency: Date.now() - start }
    });
  } catch (e: any) {
    send("error", { error: e.message || "Internal server error" });
  }

  res.end();
});

/* ── SUMMARIZE ────────────────────────────────────────── */
router.post("/gemini/summarize", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const apiKey = await getGeminiKey(userId);
  if (!apiKey) { res.status(400).json({ error: "No Gemini API key configured." }); return; }

  const { title, url, description } = req.body;

  try {
    const text = await callGemini(apiKey, [
      {
        role: "user",
        parts: [{
          text: `Summarize this bookmark in 2-3 sentences. Be concise and informative.

Title: ${title}
URL: ${url}
Description: ${description || "N/A"}

Provide a clear, useful summary that helps the user remember why they saved this.`
        }]
      }
    ]);
    res.json({ summary: text.trim() });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── AUTO-TAG ─────────────────────────────────────────── */
router.post("/gemini/auto-tag", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const apiKey = await getGeminiKey(userId);
  if (!apiKey) { res.status(400).json({ error: "No Gemini API key configured." }); return; }

  const { title, url, description } = req.body;

  try {
    const text = await callGemini(apiKey, [
      {
        role: "user",
        parts: [{
          text: `Generate 3-6 relevant tags for this bookmark. Return ONLY a JSON array of lowercase strings, no explanation.

Title: ${title}
URL: ${url}
Description: ${description || "N/A"}

Example output: ["javascript","tutorial","react","frontend"]`
        }]
      }
    ]);

    const m = text.match(/\[.*?\]/s);
    const tags = m ? JSON.parse(m[0]) : [];
    res.json({ tags: tags.filter((t: any) => typeof t === "string").slice(0, 6) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── ORGANIZE ─────────────────────────────────────────── */
router.post("/gemini/organize", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const apiKey = await getGeminiKey(userId);
  if (!apiKey) { res.status(400).json({ error: "No Gemini API key configured." }); return; }

  const bookmarks = await db.select({
    id: bookmarksTable.id, title: bookmarksTable.title,
    domain: bookmarksTable.domain, tags: bookmarksTable.tags,
  }).from(bookmarksTable)
    .where(and(eq(bookmarksTable.userId, userId), eq(bookmarksTable.isArchived, false)))
    .limit(100);

  try {
    const text = await callGemini(apiKey, [
      {
        role: "user",
        parts: [{
          text: `Analyze these bookmarks and suggest an organization strategy with collection names and which bookmarks go where. Be specific and actionable.

Bookmarks:
${bookmarks.map(b => `- [ID:${b.id}] "${b.title}" (${b.domain}) tags:[${(b.tags || []).join(",")}]`).join("\n")}

Suggest 3-5 collection names and which bookmark IDs should go in each.`
        }]
      }
    ]);
    res.json({ suggestion: text });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
