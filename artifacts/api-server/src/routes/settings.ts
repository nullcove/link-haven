import { Router, type IRouter } from "express";
import { db, sessionsTable, userSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const AI_KEY_FIELDS = [
  "geminiApiKey", "openaiApiKey", "anthropicApiKey", "mistralApiKey",
  "groqApiKey", "perplexityApiKey", "cohereApiKey", "openrouterApiKey", "togetherApiKey",
] as const;

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

function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return key.slice(0, 6) + "..." + key.slice(-4).replace(/./g, "*");
}

async function getOrCreateSettings(userId: number) {
  const [existing] = await db.select().from(userSettingsTable).where(eq(userSettingsTable.userId, userId));
  if (existing) return existing;
  const [created] = await db.insert(userSettingsTable).values({ userId }).returning();
  return created;
}

function buildAiKeyStatus(settings: any) {
  const result: Record<string, { connected: boolean; masked: string | null }> = {};
  for (const field of AI_KEY_FIELDS) {
    const val = settings[field];
    result[field] = { connected: !!val, masked: val ? maskKey(val) : null };
  }
  return result;
}

router.get("/settings", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const settings = await getOrCreateSettings(userId);

  res.json({
    aiKeys: buildAiKeyStatus(settings),
    hasGeminiKey: !!settings.geminiApiKey,
    geminiKeyMasked: settings.geminiApiKey ? maskKey(settings.geminiApiKey) : null,
    theme: settings.theme,
    defaultView: settings.defaultView,
    language: settings.language,
  });
});

router.put("/settings", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  await getOrCreateSettings(userId);

  const body = req.body;
  const updateData: any = {};

  for (const field of AI_KEY_FIELDS) {
    if (body[field] !== undefined) updateData[field] = body[field] || null;
  }
  if (body.theme !== undefined) updateData.theme = body.theme;
  if (body.defaultView !== undefined) updateData.defaultView = body.defaultView;
  if (body.language !== undefined) updateData.language = body.language;

  await db.update(userSettingsTable).set(updateData).where(eq(userSettingsTable.userId, userId));
  const updated = await getOrCreateSettings(userId);

  res.json({
    aiKeys: buildAiKeyStatus(updated),
    hasGeminiKey: !!updated.geminiApiKey,
    geminiKeyMasked: updated.geminiApiKey ? maskKey(updated.geminiApiKey) : null,
    theme: updated.theme,
    defaultView: updated.defaultView,
    language: updated.language,
  });
});

router.delete("/settings/ai-key/:provider", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const fieldMap: Record<string, string> = {
    gemini: "geminiApiKey", openai: "openaiApiKey", anthropic: "anthropicApiKey",
    mistral: "mistralApiKey", groq: "groqApiKey", perplexity: "perplexityApiKey",
    cohere: "cohereApiKey", openrouter: "openrouterApiKey", together: "togetherApiKey",
  };
  const field = fieldMap[req.params.provider];
  if (!field) { res.status(400).json({ error: "Unknown provider" }); return; }

  await db.update(userSettingsTable).set({ [field]: null } as any).where(eq(userSettingsTable.userId, userId));
  res.json({ success: true });
});

router.delete("/settings/gemini-key", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }
  await db.update(userSettingsTable).set({ geminiApiKey: null }).where(eq(userSettingsTable.userId, userId));
  res.json({ success: true });
});

export default router;
