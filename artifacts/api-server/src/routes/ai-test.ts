import { Router, type IRouter } from "express";
import { db, sessionsTable, userSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

async function getUserFromToken(token: string): Promise<number | null> {
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.token, token));
  if (!session || session.expiresAt < new Date()) return null;
  return session.userId;
}

async function testOpenAI(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) {
      const data = await res.json() as any;
      const count = data.data?.length ?? 0;
      return { success: true, message: `Connected — ${count} models available` };
    }
    const err = await res.json() as any;
    return { success: false, message: err.error?.message || `HTTP ${res.status}` };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

async function testAnthropic(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      }),
    });
    if (res.ok) return { success: true, message: "Connected — Claude models accessible" };
    const err = await res.json() as any;
    return { success: false, message: err.error?.message || `HTTP ${res.status}` };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

async function testGemini(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] }),
      }
    );
    if (res.ok) return { success: true, message: "Connected — Gemini models accessible" };
    const err = await res.json() as any;
    return { success: false, message: err.error?.message || `HTTP ${res.status}` };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

async function testMistral(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("https://api.mistral.ai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) {
      const data = await res.json() as any;
      const count = data.data?.length ?? 0;
      return { success: true, message: `Connected — ${count} models available` };
    }
    const err = await res.json() as any;
    return { success: false, message: err.message || `HTTP ${res.status}` };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

async function testGroq(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) {
      const data = await res.json() as any;
      const count = data.data?.length ?? 0;
      return { success: true, message: `Connected — ${count} models, ultra-fast inference` };
    }
    const err = await res.json() as any;
    return { success: false, message: err.error?.message || `HTTP ${res.status}` };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

async function testPerplexity(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 1,
      }),
    });
    if (res.ok) return { success: true, message: "Connected — Perplexity with real-time search" };
    const err = await res.json() as any;
    return { success: false, message: err.error?.message || `HTTP ${res.status}` };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

async function testCohere(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("https://api.cohere.com/v2/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) {
      const data = await res.json() as any;
      const count = data.models?.length ?? 0;
      return { success: true, message: `Connected — ${count} models available` };
    }
    const err = await res.json() as any;
    return { success: false, message: err.message || `HTTP ${res.status}` };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

async function testOpenRouter(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) {
      const data = await res.json() as any;
      const count = data.data?.length ?? 0;
      return { success: true, message: `Connected — ${count}+ models via OpenRouter` };
    }
    const err = await res.json() as any;
    return { success: false, message: err.error?.message || `HTTP ${res.status}` };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

async function testTogether(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("https://api.together.xyz/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) {
      const data = await res.json() as any;
      const count = Array.isArray(data) ? data.length : (data.data?.length ?? 0);
      return { success: true, message: `Connected — ${count} open-source models` };
    }
    const err = await res.json() as any;
    return { success: false, message: err.error?.message || `HTTP ${res.status}` };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

const TESTERS: Record<string, (key: string) => Promise<{ success: boolean; message: string }>> = {
  openai: testOpenAI,
  anthropic: testAnthropic,
  gemini: testGemini,
  mistral: testMistral,
  groq: testGroq,
  perplexity: testPerplexity,
  cohere: testCohere,
  openrouter: testOpenRouter,
  together: testTogether,
};

const PROVIDER_FIELD: Record<string, string> = {
  gemini: "geminiApiKey", openai: "openaiApiKey", anthropic: "anthropicApiKey",
  mistral: "mistralApiKey", groq: "groqApiKey", perplexity: "perplexityApiKey",
  cohere: "cohereApiKey", openrouter: "openrouterApiKey", together: "togetherApiKey",
};

router.post("/ai/test", async (req, res): Promise<void> => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Not authenticated" }); return; }
  const token = auth.slice(7);
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.token, token));
  if (!session || session.expiresAt < new Date()) { res.status(401).json({ error: "Invalid session" }); return; }

  const { provider, apiKey: inputKey } = req.body as { provider: string; apiKey?: string };

  const tester = TESTERS[provider];
  if (!tester) { res.status(400).json({ error: "Unknown provider" }); return; }

  let keyToTest = inputKey?.trim();

  if (!keyToTest) {
    const field = PROVIDER_FIELD[provider];
    if (field) {
      const [settings] = await db.select().from(userSettingsTable).where(eq(userSettingsTable.userId, session.userId));
      keyToTest = settings?.[field as keyof typeof settings] as string | undefined;
    }
  }

  if (!keyToTest) {
    res.status(400).json({ success: false, message: "No API key provided or saved" });
    return;
  }

  const result = await tester(keyToTest);
  res.json(result);
});

export default router;
