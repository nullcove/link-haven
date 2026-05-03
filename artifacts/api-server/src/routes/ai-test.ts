import { Router, type IRouter } from "express";
import { db, sessionsTable, userSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

async function getUserSession(token: string) {
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.token, token));
  if (!session || session.expiresAt < new Date()) return null;
  return session;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "unknown";
  const gb = bytes / 1024 / 1024 / 1024;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(0)} MB`;
}

async function fetchWithTimeout(url: string, opts: RequestInit, ms = 15000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function testOllama(baseUrl: string) {
  const url = baseUrl.replace(/\/$/, "");
  const start = Date.now();
  try {
    const res = await fetchWithTimeout(`${url}/api/tags`, {
      headers: { "Content-Type": "application/json" },
    }, 15000);
    const ping = Date.now() - start;
    if (!res.ok) {
      return { success: false, message: `HTTP ${res.status} — check your base URL`, ping };
    }
    const data = await res.json() as any;
    const models = (data.models || []).map((m: any) => ({
      name: m.name,
      size: formatBytes(m.size),
      family: m.details?.family || "unknown",
      parameterSize: m.details?.parameter_size || "",
      quantization: m.details?.quantization_level || "",
    }));
    return {
      success: true,
      message: `Connected — ${ping}ms • ${models.length} model${models.length !== 1 ? "s" : ""} detected`,
      ping,
      models,
    };
  } catch (e: any) {
    const ping = Date.now() - start;
    if (e.name === "AbortError") return { success: false, message: "Connection timed out (15s)", ping };
    return { success: false, message: e.message, ping };
  }
}

async function testOpenAI(apiKey: string) {
  try {
    const res = await fetchWithTimeout("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${apiKey}` } });
    if (res.ok) { const d = await res.json() as any; return { success: true, message: `Connected — ${d.data?.length ?? 0} models available` }; }
    const err = await res.json() as any;
    return { success: false, message: err.error?.message || `HTTP ${res.status}` };
  } catch (e: any) { return { success: false, message: e.message }; }
}

async function testAnthropic(apiKey: string) {
  try {
    const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-3-haiku-20240307", max_tokens: 1, messages: [{ role: "user", content: "hi" }] }),
    });
    if (res.ok) return { success: true, message: "Connected — Claude models accessible" };
    const err = await res.json() as any;
    return { success: false, message: err.error?.message || `HTTP ${res.status}` };
  } catch (e: any) { return { success: false, message: e.message }; }
}

async function testGemini(apiKey: string) {
  try {
    const res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] }) }
    );
    if (res.ok) return { success: true, message: "Connected — Gemini models accessible" };
    const err = await res.json() as any;
    return { success: false, message: err.error?.message || `HTTP ${res.status}` };
  } catch (e: any) { return { success: false, message: e.message }; }
}

async function testMistral(apiKey: string) {
  try {
    const res = await fetchWithTimeout("https://api.mistral.ai/v1/models", { headers: { Authorization: `Bearer ${apiKey}` } });
    if (res.ok) { const d = await res.json() as any; return { success: true, message: `Connected — ${d.data?.length ?? 0} models available` }; }
    const err = await res.json() as any;
    return { success: false, message: err.message || `HTTP ${res.status}` };
  } catch (e: any) { return { success: false, message: e.message }; }
}

async function testGroq(apiKey: string) {
  try {
    const res = await fetchWithTimeout("https://api.groq.com/openai/v1/models", { headers: { Authorization: `Bearer ${apiKey}` } });
    if (res.ok) { const d = await res.json() as any; return { success: true, message: `Connected — ${d.data?.length ?? 0} models, ultra-fast inference` }; }
    const err = await res.json() as any;
    return { success: false, message: err.error?.message || `HTTP ${res.status}` };
  } catch (e: any) { return { success: false, message: e.message }; }
}

async function testPerplexity(apiKey: string) {
  try {
    const res = await fetchWithTimeout("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama-3.1-sonar-small-128k-online", messages: [{ role: "user", content: "hi" }], max_tokens: 1 }),
    });
    if (res.ok) return { success: true, message: "Connected — Perplexity with real-time search" };
    const err = await res.json() as any;
    return { success: false, message: err.error?.message || `HTTP ${res.status}` };
  } catch (e: any) { return { success: false, message: e.message }; }
}

async function testCohere(apiKey: string) {
  try {
    const res = await fetchWithTimeout("https://api.cohere.com/v2/models", { headers: { Authorization: `Bearer ${apiKey}` } });
    if (res.ok) { const d = await res.json() as any; return { success: true, message: `Connected — ${d.models?.length ?? 0} models available` }; }
    const err = await res.json() as any;
    return { success: false, message: err.message || `HTTP ${res.status}` };
  } catch (e: any) { return { success: false, message: e.message }; }
}

async function testOpenRouter(apiKey: string) {
  try {
    const res = await fetchWithTimeout("https://openrouter.ai/api/v1/models", { headers: { Authorization: `Bearer ${apiKey}` } });
    if (res.ok) { const d = await res.json() as any; return { success: true, message: `Connected — ${d.data?.length ?? 0}+ models via OpenRouter` }; }
    const err = await res.json() as any;
    return { success: false, message: err.error?.message || `HTTP ${res.status}` };
  } catch (e: any) { return { success: false, message: e.message }; }
}

async function testTogether(apiKey: string) {
  try {
    const res = await fetchWithTimeout("https://api.together.xyz/v1/models", { headers: { Authorization: `Bearer ${apiKey}` } });
    if (res.ok) { const d = await res.json() as any; const count = Array.isArray(d) ? d.length : (d.data?.length ?? 0); return { success: true, message: `Connected — ${count} open-source models` }; }
    const err = await res.json() as any;
    return { success: false, message: err.error?.message || `HTTP ${res.status}` };
  } catch (e: any) { return { success: false, message: e.message }; }
}

const TESTERS: Record<string, (key: string) => Promise<any>> = {
  openai: testOpenAI, anthropic: testAnthropic, gemini: testGemini,
  mistral: testMistral, groq: testGroq, perplexity: testPerplexity,
  cohere: testCohere, openrouter: testOpenRouter, together: testTogether,
};

const PROVIDER_FIELD: Record<string, string> = {
  gemini: "geminiApiKey", openai: "openaiApiKey", anthropic: "anthropicApiKey",
  mistral: "mistralApiKey", groq: "groqApiKey", perplexity: "perplexityApiKey",
  cohere: "cohereApiKey", openrouter: "openrouterApiKey", together: "togetherApiKey",
  ollama: "ollamaBaseUrl",
};

router.post("/ai/test", async (req, res): Promise<void> => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Not authenticated" }); return; }
  const session = await getUserSession(auth.slice(7));
  if (!session) { res.status(401).json({ error: "Invalid session" }); return; }

  const { provider, apiKey: inputKey, baseUrl: inputUrl } = req.body as { provider: string; apiKey?: string; baseUrl?: string };

  if (provider === "ollama") {
    let url = inputUrl?.trim();
    if (!url) {
      const [settings] = await db.select().from(userSettingsTable).where(eq(userSettingsTable.userId, session.userId));
      url = settings?.ollamaBaseUrl || undefined;
    }
    if (!url) { res.status(400).json({ success: false, message: "No base URL provided or saved" }); return; }
    const result = await testOllama(url);
    res.json(result);
    return;
  }

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
  if (!keyToTest) { res.status(400).json({ success: false, message: "No API key provided or saved" }); return; }
  const result = await tester(keyToTest);
  res.json(result);
});

export default router;
