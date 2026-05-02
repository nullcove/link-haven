import { Router, type IRouter } from "express";
import { db, sessionsTable, userSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

router.get("/settings", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  const settings = await getOrCreateSettings(userId);

  res.json({
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

  const { geminiApiKey, theme, defaultView, language } = req.body;

  const settings = await getOrCreateSettings(userId);

  const updateData: any = {};
  if (geminiApiKey !== undefined) updateData.geminiApiKey = geminiApiKey || null;
  if (theme !== undefined) updateData.theme = theme;
  if (defaultView !== undefined) updateData.defaultView = defaultView;
  if (language !== undefined) updateData.language = language;

  await db.update(userSettingsTable).set(updateData).where(eq(userSettingsTable.userId, userId));

  const updated = await getOrCreateSettings(userId);
  res.json({
    hasGeminiKey: !!updated.geminiApiKey,
    geminiKeyMasked: updated.geminiApiKey ? maskKey(updated.geminiApiKey) : null,
    theme: updated.theme,
    defaultView: updated.defaultView,
    language: updated.language,
  });
});

router.delete("/settings/gemini-key", async (req, res): Promise<void> => {
  const token = getToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = await getUserFromToken(token);
  if (!userId) { res.status(401).json({ error: "Invalid session" }); return; }

  await db.update(userSettingsTable)
    .set({ geminiApiKey: null })
    .where(eq(userSettingsTable.userId, userId));

  res.json({ success: true });
});

export default router;
