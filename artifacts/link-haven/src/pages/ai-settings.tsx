import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { apiCall } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Eye, EyeOff, Key, CheckCircle2, XCircle, Loader2,
  Trash2, Zap, ExternalLink, ChevronDown, ChevronUp, Bot,
} from "lucide-react";

type ProviderStatus = { connected: boolean; masked: string | null };
type AiKeys = Record<string, ProviderStatus>;

interface Provider {
  id: string;
  name: string;
  tagline: string;
  description: string;
  color: string;
  gradient: string;
  models: string[];
  docsUrl: string;
  keyPrefix: string;
  field: string;
}

const PROVIDERS: Provider[] = [
  {
    id: "openai",
    name: "OpenAI",
    tagline: "GPT-4o, o1, o3",
    description: "The most widely-used AI provider. Powers ChatGPT and is the industry standard for language models.",
    color: "#10a37f",
    gradient: "from-[#10a37f]/15 to-[#10a37f]/5",
    models: ["gpt-4o", "gpt-4o-mini", "o1", "o3-mini", "gpt-4-turbo"],
    docsUrl: "https://platform.openai.com/api-keys",
    keyPrefix: "sk-...",
    field: "openaiApiKey",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    tagline: "Claude 3.5, Opus, Haiku",
    description: "Safety-focused AI research lab known for nuanced reasoning and 200K context windows.",
    color: "#d97706",
    gradient: "from-[#d97706]/15 to-[#d97706]/5",
    models: ["claude-3-5-sonnet", "claude-3-5-haiku", "claude-3-opus", "claude-3-haiku"],
    docsUrl: "https://console.anthropic.com/settings/keys",
    keyPrefix: "sk-ant-...",
    field: "anthropicApiKey",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    tagline: "2.0 Flash, 1.5 Pro, Ultra",
    description: "Google's multimodal AI powerhouse with vision, audio, and code capabilities. Free tier available.",
    color: "#4285f4",
    gradient: "from-[#4285f4]/15 to-[#4285f4]/5",
    models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash", "gemini-ultra"],
    docsUrl: "https://aistudio.google.com/app/apikey",
    keyPrefix: "AIzaSy...",
    field: "geminiApiKey",
  },
  {
    id: "mistral",
    name: "Mistral AI",
    tagline: "Large, Small, Nemo",
    description: "European open-weight champion. Best performance-per-cost ratio in its class.",
    color: "#f97316",
    gradient: "from-[#f97316]/15 to-[#f97316]/5",
    models: ["mistral-large", "mistral-small", "mistral-nemo", "codestral"],
    docsUrl: "https://console.mistral.ai/api-keys",
    keyPrefix: "...",
    field: "mistralApiKey",
  },
  {
    id: "groq",
    name: "Groq",
    tagline: "Llama 3.1, Mixtral — 300+ tok/s",
    description: "Ultra-fast inference using custom LPU chips. Run Llama & Mixtral at 300+ tokens/sec.",
    color: "#7c3aed",
    gradient: "from-[#7c3aed]/15 to-[#7c3aed]/5",
    models: ["llama-3.1-70b", "llama-3.1-8b", "mixtral-8x7b", "gemma2-9b"],
    docsUrl: "https://console.groq.com/keys",
    keyPrefix: "gsk_...",
    field: "groqApiKey",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    tagline: "Sonar, real-time web search",
    description: "AI with live internet access. Answers are grounded in up-to-date web sources with citations.",
    color: "#06b6d4",
    gradient: "from-[#06b6d4]/15 to-[#06b6d4]/5",
    models: ["sonar-large", "sonar-small", "sonar-reasoning", "r1-1776"],
    docsUrl: "https://www.perplexity.ai/settings/api",
    keyPrefix: "pplx-...",
    field: "perplexityApiKey",
  },
  {
    id: "cohere",
    name: "Cohere",
    tagline: "Command R+, Embed, Rerank",
    description: "Enterprise-focused retrieval AI. Best-in-class embedding and reranking for RAG pipelines.",
    color: "#14b8a6",
    gradient: "from-[#14b8a6]/15 to-[#14b8a6]/5",
    models: ["command-r+", "command-r", "embed-v3", "rerank-v3.5"],
    docsUrl: "https://dashboard.cohere.com/api-keys",
    keyPrefix: "...",
    field: "cohereApiKey",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    tagline: "100+ models, one API",
    description: "Unified API gateway for every major provider. Switch models without changing code.",
    color: "#6366f1",
    gradient: "from-[#6366f1]/15 to-[#6366f1]/5",
    models: ["openai/gpt-4o", "anthropic/claude-3.5-sonnet", "meta/llama-3.1-70b", "google/gemini-flash-1.5"],
    docsUrl: "https://openrouter.ai/keys",
    keyPrefix: "sk-or-...",
    field: "openrouterApiKey",
  },
  {
    id: "together",
    name: "Together AI",
    tagline: "Llama, DeepSeek, Qwen",
    description: "Open-source models at scale. Run 50+ frontier open weights with competitive pricing.",
    color: "#10b981",
    gradient: "from-[#10b981]/15 to-[#10b981]/5",
    models: ["llama-3.1-70b", "deepseek-v2.5", "qwen2.5-72b", "mistral-7b"],
    docsUrl: "https://api.together.ai/settings/api-keys",
    keyPrefix: "...",
    field: "togetherApiKey",
  },
];

function ProviderCard({
  provider,
  status,
  onSave,
  onTest,
  onRemove,
}: {
  provider: Provider;
  status: ProviderStatus | undefined;
  onSave: (field: string, key: string) => Promise<void>;
  onTest: (id: string, key?: string) => Promise<{ success: boolean; message: string }>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  const connected = status?.connected ?? false;

  const handleSave = async () => {
    if (!keyInput.trim()) return;
    setSaving(true);
    try {
      await onSave(provider.field, keyInput.trim());
      setKeyInput("");
      setTestResult(null);
      toast({ title: `${provider.name} key saved`, description: "API key stored securely." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await onTest(provider.id, keyInput.trim() || undefined);
      setTestResult(result);
    } catch (e: any) {
      setTestResult({ success: false, message: e.message });
    } finally {
      setTesting(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await onRemove(provider.id);
      setTestResult(null);
      toast({ title: `${provider.name} key removed` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className={cn(
      "rounded-2xl border transition-all duration-200",
      connected
        ? "border-white/10 bg-[#141419]"
        : "border-white/[0.06] bg-[#111116]",
      expanded && "border-white/15"
    )}>
      {/* Header */}
      <button
        className="w-full flex items-center gap-4 p-5 text-left"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Color dot / logo area */}
        <div
          className="size-10 rounded-xl flex items-center justify-center shrink-0 border"
          style={{
            backgroundColor: provider.color + "18",
            borderColor: provider.color + "30",
          }}
        >
          <Bot className="size-5" style={{ color: provider.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[14px] text-white">{provider.name}</span>
            {connected && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium">
                <CheckCircle2 className="size-2.5" /> Connected
              </span>
            )}
          </div>
          <p className="text-[11px] text-white/35 mt-0.5 truncate">{provider.tagline}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {connected && (
            <span className="text-[10px] font-mono text-white/25 hidden sm:block">
              {status?.masked}
            </span>
          )}
          {expanded
            ? <ChevronUp className="size-4 text-white/25" />
            : <ChevronDown className="size-4 text-white/25" />
          }
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/[0.05]">
          <div className={cn("p-3 rounded-xl mt-4", `bg-gradient-to-br ${provider.gradient}`)}>
            <p className="text-[12px] text-white/55 leading-relaxed">{provider.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {provider.models.map(m => (
                <span key={m} className="px-1.5 py-0.5 rounded bg-white/[0.07] border border-white/[0.08] text-[10px] font-mono text-white/40">
                  {m}
                </span>
              ))}
            </div>
          </div>

          {connected && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/15">
              <Key className="size-4 text-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-emerald-400">Key configured</p>
                <p className="text-[10px] text-white/35 font-mono mt-0.5">{status?.masked}</p>
              </div>
              <button
                onClick={handleRemove}
                disabled={removing}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
              >
                {removing ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                Remove
              </button>
            </div>
          )}

          {/* Key input */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-white/45">
              {connected ? "Update API key" : "Enter API key"}
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-white/20 pointer-events-none" />
              <input
                type={showKey ? "text" : "password"}
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSave()}
                placeholder={provider.keyPrefix}
                className="w-full pl-9 pr-10 py-2.5 bg-black/50 border border-white/[0.08] rounded-xl text-[12px] font-mono text-white/80 placeholder:text-white/15 outline-none focus:border-white/20 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
              >
                {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <a
                href={provider.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-white/25 hover:text-indigo-400 transition-colors flex items-center gap-1"
              >
                <ExternalLink className="size-2.5" />
                Get API key
              </a>
              <span className="text-[10px] text-white/20">Stored encrypted, never exposed</span>
            </div>
          </div>

          {/* Test result */}
          {testResult && (
            <div className={cn(
              "flex items-start gap-2 p-3 rounded-xl border text-[12px]",
              testResult.success
                ? "bg-emerald-500/[0.07] border-emerald-500/20 text-emerald-400"
                : "bg-red-500/[0.07] border-red-500/20 text-red-400"
            )}>
              {testResult.success
                ? <CheckCircle2 className="size-4 shrink-0 mt-px" />
                : <XCircle className="size-4 shrink-0 mt-px" />
              }
              <span className="leading-relaxed">{testResult.message}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleTest}
              disabled={testing || (!keyInput.trim() && !connected)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-white/55 hover:text-white hover:bg-white/[0.07] text-[12px] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {testing
                ? <Loader2 className="size-3.5 animate-spin" />
                : <Zap className="size-3.5" style={{ color: provider.color }} />
              }
              Test connection
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !keyInput.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[12px] font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ backgroundColor: provider.color + "cc" }}
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Key className="size-3.5" />}
              Save key
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AISettingsPage() {
  const [aiKeys, setAiKeys] = useState<AiKeys>({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await apiCall("/settings") as any;
      setAiKeys(data.aiKeys || {});
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const connectedCount = Object.values(aiKeys).filter(v => v.connected).length;

  const handleSave = async (field: string, key: string) => {
    const data = await apiCall("/settings", {
      method: "PUT",
      body: JSON.stringify({ [field]: key }),
    }) as any;
    setAiKeys(data.aiKeys || {});
  };

  const handleTest = async (providerId: string, apiKey?: string) => {
    const result = await apiCall("/ai/test", {
      method: "POST",
      body: JSON.stringify({ provider: providerId, apiKey }),
    }) as any;
    return { success: result.success ?? false, message: result.message || result.error || "Unknown result" };
  };

  const handleRemove = async (providerId: string) => {
    await apiCall(`/settings/ai-key/${providerId}`, { method: "DELETE" });
    await fetchSettings();
  };

  return (
    <AppLayout>
      <header className="h-14 shrink-0 border-b border-white/5 flex items-center px-6 bg-background/95 backdrop-blur z-10 sticky top-0">
        <Bot className="size-4 text-indigo-400 mr-2" />
        <h1 className="font-semibold text-[15px]">AI Models</h1>
        <div className="ml-auto flex items-center gap-3">
          {!loading && (
            <span className="text-[12px] text-white/30">
              {connectedCount} / {PROVIDERS.length} connected
            </span>
          )}
          {connectedCount > 0 && (
            <div className="flex gap-0.5">
              {Array.from({ length: connectedCount }).map((_, i) => (
                <div key={i} className="size-1.5 rounded-full bg-emerald-400" />
              ))}
              {Array.from({ length: PROVIDERS.length - connectedCount }).map((_, i) => (
                <div key={i} className="size-1.5 rounded-full bg-white/10" />
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0c]">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Banner */}
          <div className="p-4 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/[0.08] to-violet-500/[0.05]">
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Bot className="size-4.5 text-indigo-400" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white/80">Connect your AI providers</p>
                <p className="text-[12px] text-white/40 mt-0.5 leading-relaxed">
                  Add API keys for any provider below. Keys are stored securely server-side and never exposed to the browser after saving.
                  Connected models power smart tagging, summaries, and the AI chat assistant.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-white/25">
              <Loader2 className="size-5 animate-spin mr-2" />
              Loading…
            </div>
          ) : (
            PROVIDERS.map(provider => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                status={aiKeys[provider.field]}
                onSave={handleSave}
                onTest={handleTest}
                onRemove={handleRemove}
              />
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
