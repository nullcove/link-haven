import { Router, type IRouter } from "express";
import { db, sessionsTable, userSettingsTable, bookmarksTable, collectionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

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

/* ── CHAT ─────────────────────────────────────────────── */
router.post("/gemini/chat", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const apiKey = await getGeminiKey(userId);
  if (!apiKey) { res.status(400).json({ error: "No Gemini API key configured. Add it in Settings." }); return; }

  const { message, history = [] } = req.body;
  if (!message) { res.status(400).json({ error: "message required" }); return; }

  // Load user's bookmarks as context
  const bookmarks = await db.select({
    id: bookmarksTable.id,
    title: bookmarksTable.title,
    url: bookmarksTable.url,
    domain: bookmarksTable.domain,
    tags: bookmarksTable.tags,
    isFavorite: bookmarksTable.isFavorite,
    isArchived: bookmarksTable.isArchived,
    isPinned: bookmarksTable.isPinned,
    collectionId: bookmarksTable.collectionId,
    type: bookmarksTable.type,
    note: bookmarksTable.note,
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

    const match = text.match(/\[.*?\]/s);
    const tags = match ? JSON.parse(match[0]) : [];
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
    id: bookmarksTable.id,
    title: bookmarksTable.title,
    domain: bookmarksTable.domain,
    tags: bookmarksTable.tags,
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
