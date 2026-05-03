import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { apiCall } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Eye, EyeOff, Key, CheckCircle2, XCircle, Loader2, Trash2,
  Zap, ExternalLink, ChevronDown, ChevronUp, Bot, Globe, Clock,
  Cpu, HardDrive, Server,
} from "lucide-react";

type ProviderStatus = { connected: boolean; masked: string | null };
type AiKeys = Record<string, ProviderStatus>;

interface OllamaModel {
  name: string;
  size: string;
  family: string;
  parameterSize: string;
  quantization: string;
}

interface OllamaTestResult {
  success: boolean;
  message: string;
  ping?: number;
  models?: OllamaModel[];
}

interface CloudProvider {
  type: "apikey";
  id: string;
  name: string;
  tagline: string;
  description: string;
  color: string;
  models: string[];
  docsUrl: string;
  keyPrefix: string;
  field: string;
}

const CLOUD_PROVIDERS: CloudProvider[] = [
  { type: "apikey", id: "openai", name: "OpenAI", tagline: "GPT-4o, o1, o3", description: "The most widely-used AI provider. Powers ChatGPT and is the industry standard for language models.", color: "#10a37f", models: ["gpt-4o", "gpt-4o-mini", "o1", "o3-mini", "gpt-4-turbo"], docsUrl: "https://platform.openai.com/api-keys", keyPrefix: "sk-...", field: "openaiApiKey" },
  { type: "apikey", id: "anthropic", name: "Anthropic", tagline: "Claude 3.5 Sonnet, Opus, Haiku", description: "Safety-focused AI lab known for nuanced reasoning and 200K context windows.", color: "#d97706", models: ["claude-3-5-sonnet", "claude-3-5-haiku", "claude-3-opus", "claude-3-haiku"], docsUrl: "https://console.anthropic.com/settings/keys", keyPrefix: "sk-ant-...", field: "anthropicApiKey" },
  { type: "apikey", id: "gemini", name: "Google Gemini", tagline: "2.0 Flash, 1.5 Pro, Ultra", description: "Google's multimodal AI powerhouse with vision, audio, and code capabilities. Free tier available.", color: "#4285f4", models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash", "gemini-ultra"], docsUrl: "https://aistudio.google.com/app/apikey", keyPrefix: "AIzaSy...", field: "geminiApiKey" },
  { type: "apikey", id: "mistral", name: "Mistral AI", tagline: "Large, Small, Nemo, Codestral", description: "European open-weight champion. Best performance-per-cost ratio in its class.", color: "#f97316", models: ["mistral-large", "mistral-small", "mistral-nemo", "codestral"], docsUrl: "https://console.mistral.ai/api-keys", keyPrefix: "...", field: "mistralApiKey" },
  { type: "apikey", id: "groq", name: "Groq", tagline: "Llama 3.1, Mixtral — 300+ tok/s", description: "Ultra-fast inference using custom LPU chips. Run Llama & Mixtral at 300+ tokens/sec.", color: "#7c3aed", models: ["llama-3.1-70b", "llama-3.1-8b", "mixtral-8x7b", "gemma2-9b"], docsUrl: "https://console.groq.com/keys", keyPrefix: "gsk_...", field: "groqApiKey" },
  { type: "apikey", id: "perplexity", name: "Perplexity", tagline: "Sonar, real-time web search", description: "AI with live internet access. Answers grounded in up-to-date web sources with citations.", color: "#06b6d4", models: ["sonar-large", "sonar-small", "sonar-reasoning", "r1-1776"], docsUrl: "https://www.perplexity.ai/settings/api", keyPrefix: "pplx-...", field: "perplexityApiKey" },
  { type: "apikey", id: "cohere", name: "Cohere", tagline: "Command R+, Embed, Rerank", description: "Enterprise-focused retrieval AI. Best-in-class embedding and reranking for RAG pipelines.", color: "#14b8a6", models: ["command-r+", "command-r", "embed-v3", "rerank-v3.5"], docsUrl: "https://dashboard.cohere.com/api-keys", keyPrefix: "...", field: "cohereApiKey" },
  { type: "apikey", id: "openrouter", name: "OpenRouter", tagline: "100+ models, one API", description: "Unified API gateway for every major provider. Switch models without changing code.", color: "#6366f1", models: ["openai/gpt-4o", "anthropic/claude-3.5-sonnet", "meta/llama-3.1-70b", "google/gemini-flash-1.5"], docsUrl: "https://openrouter.ai/keys", keyPrefix: "sk-or-...", field: "openrouterApiKey" },
  { type: "apikey", id: "together", name: "Together AI", tagline: "Llama, DeepSeek, Qwen at scale", description: "Open-source models at scale. Run 50+ frontier open weights with competitive pricing.", color: "#10b981", models: ["llama-3.1-70b", "deepseek-v2.5", "qwen2.5-72b", "mistral-7b"], docsUrl: "https://api.together.ai/settings/api-keys", keyPrefix: "...", field: "togetherApiKey" },
];

function CloudProviderCard({ provider, status, onSave, onTest, onRemove }: {
  provider: CloudProvider;
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
      setKeyInput(""); setTestResult(null);
      toast({ title: `${provider.name} key saved` });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    try { setTestResult(await onTest(provider.id, keyInput.trim() || undefined)); }
    catch (e: any) { setTestResult({ success: false, message: e.message }); }
    finally { setTesting(false); }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try { await onRemove(provider.id); setTestResult(null); toast({ title: `${provider.name} key removed` }); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setRemoving(false); }
  };

  return (
    <div className={cn("rounded-2xl border transition-all duration-200", connected ? "border-white/10 bg-[#141419]" : "border-white/[0.06] bg-[#111116]", expanded && "border-white/15")}>
      <button className="w-full flex items-center gap-4 p-4 text-left" onClick={() => setExpanded(v => !v)}>
        <div className="size-9 rounded-xl flex items-center justify-center shrink-0 border" style={{ backgroundColor: provider.color + "18", borderColor: provider.color + "30" }}>
          <Bot className="size-4" style={{ color: provider.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[13px] text-white">{provider.name}</span>
            {connected && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium">
                <CheckCircle2 className="size-2.5" /> Connected
              </span>
            )}
          </div>
          <p className="text-[11px] text-white/30 mt-0.5 truncate">{provider.tagline}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {connected && <span className="text-[10px] font-mono text-white/20 hidden sm:block">{status?.masked}</span>}
          {expanded ? <ChevronUp className="size-3.5 text-white/20" /> : <ChevronDown className="size-3.5 text-white/20" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/[0.05]">
          <div className="p-3 rounded-xl mt-3" style={{ background: `linear-gradient(135deg, ${provider.color}10, ${provider.color}05)` }}>
            <p className="text-[11px] text-white/50 leading-relaxed">{provider.description}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {provider.models.map(m => (
                <span key={m} className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.07] text-[10px] font-mono text-white/35">{m}</span>
              ))}
            </div>
          </div>

          {connected && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/15">
              <Key className="size-3.5 text-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-emerald-400">Key configured</p>
                <p className="text-[10px] text-white/30 font-mono">{status?.masked}</p>
              </div>
              <button onClick={handleRemove} disabled={removing} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40">
                {removing ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />} Remove
              </button>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] text-white/40">{connected ? "Update API key" : "API key"}</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-white/15 pointer-events-none" />
              <input
                type={showKey ? "text" : "password"}
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSave()}
                placeholder={provider.keyPrefix}
                className="w-full pl-8 pr-9 py-2 bg-black/50 border border-white/[0.08] rounded-xl text-[12px] font-mono text-white/70 placeholder:text-white/12 outline-none focus:border-white/18 transition-colors"
              />
              <button type="button" onClick={() => setShowKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/45 transition-colors">
                {showKey ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
              </button>
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <a href={provider.docsUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/20 hover:text-indigo-400 transition-colors flex items-center gap-1">
                <ExternalLink className="size-2.5" /> Get API key
              </a>
              <span className="text-[10px] text-white/15">Stored server-side, never exposed</span>
            </div>
          </div>

          {testResult && (
            <div className={cn("flex items-start gap-2 p-2.5 rounded-xl border text-[11px]", testResult.success ? "bg-emerald-500/[0.06] border-emerald-500/15 text-emerald-400" : "bg-red-500/[0.06] border-red-500/15 text-red-400")}>
              {testResult.success ? <CheckCircle2 className="size-3.5 shrink-0 mt-px" /> : <XCircle className="size-3.5 shrink-0 mt-px" />}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button onClick={handleTest} disabled={testing || (!keyInput.trim() && !connected)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.07] text-[11px] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              {testing ? <Loader2 className="size-3 animate-spin" /> : <Zap className="size-3" style={{ color: provider.color }} />}
              Test connection
            </button>
            <button onClick={handleSave} disabled={saving || !keyInput.trim()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[11px] font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed" style={{ backgroundColor: provider.color + "bb" }}>
              {saving ? <Loader2 className="size-3 animate-spin" /> : <Key className="size-3" />}
              Save key
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OllamaCard({ status, ollamaUrl, onSave, onRemove }: {
  status: ProviderStatus | undefined;
  ollamaUrl: string | null;
  onSave: (field: string, value: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [testResult, setTestResult] = useState<OllamaTestResult | null>(null);
  const { toast } = useToast();
  const connected = status?.connected ?? false;

  const handleSave = async () => {
    const val = urlInput.trim();
    if (!val) return;
    setSaving(true);
    try {
      await onSave("ollamaBaseUrl", val);
      setUrlInput("");
      toast({ title: "Ollama URL saved", description: "Your Ollama instance is now configured." });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    const urlToTest = urlInput.trim() || ollamaUrl || "";
    if (!urlToTest) { setTesting(false); return; }
    try {
      const result = await apiCall("/ai/test", {
        method: "POST",
        body: JSON.stringify({ provider: "ollama", baseUrl: urlToTest }),
      }) as OllamaTestResult;
      setTestResult(result);
    } catch (e: any) { setTestResult({ success: false, message: e.message }); }
    finally { setTesting(false); }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try { await onRemove("ollama"); setTestResult(null); toast({ title: "Ollama URL removed" }); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setRemoving(false); }
  };

  return (
    <div className={cn(
      "rounded-2xl border transition-all duration-200",
      connected ? "border-[#e879f9]/25 bg-[#130d18]" : "border-white/[0.06] bg-[#111116]",
      expanded && "border-[#e879f9]/35",
    )}>
      <button className="w-full flex items-center gap-4 p-4 text-left" onClick={() => setExpanded(v => !v)}>
        <div className="size-9 rounded-xl flex items-center justify-center shrink-0 border border-[#e879f9]/25 bg-[#e879f9]/10">
          <Cpu className="size-4 text-[#e879f9]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[13px] text-white">Ollama</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] border border-[#e879f9]/20 text-[#e879f9]/70 bg-[#e879f9]/8 font-medium">Local / Cloud GPU</span>
            {connected && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium">
                <CheckCircle2 className="size-2.5" /> Connected
              </span>
            )}
          </div>
          <p className="text-[11px] text-white/30 mt-0.5 truncate">
            {connected && ollamaUrl ? ollamaUrl : "Self-hosted models via base URL — local or Cloudflare tunnel"}
          </p>
        </div>
        <div className="shrink-0">
          {expanded ? <ChevronUp className="size-3.5 text-white/20" /> : <ChevronDown className="size-3.5 text-white/20" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/[0.05]">
          {/* Description */}
          <div className="p-3 rounded-xl mt-3 bg-gradient-to-br from-[#e879f9]/10 to-[#e879f9]/4">
            <p className="text-[11px] text-white/50 leading-relaxed">
              Run any Ollama model on your local machine or cloud GPU and connect via base URL.
              Works with direct localhost, Cloudflare tunnel, ngrok, or any reverse proxy.
              No API key needed — just the URL.
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {["llama3.2", "deepseek-r1", "qwen2.5", "gemma3", "mistral", "phi4", "codellama"].map(m => (
                <span key={m} className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.07] text-[10px] font-mono text-white/35">{m}</span>
              ))}
              <span className="px-1.5 py-0.5 rounded bg-[#e879f9]/10 border border-[#e879f9]/20 text-[10px] font-mono text-[#e879f9]/60">+ any model</span>
            </div>
          </div>

          {/* Current URL */}
          {connected && ollamaUrl && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/15">
              <Globe className="size-3.5 text-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-emerald-400">URL configured</p>
                <p className="text-[10px] text-white/35 font-mono truncate">{ollamaUrl}</p>
              </div>
              <button onClick={handleRemove} disabled={removing} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40">
                {removing ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />} Remove
              </button>
            </div>
          )}

          {/* URL Input */}
          <div className="space-y-1">
            <label className="text-[11px] text-white/40">{connected ? "Update base URL" : "Base URL"}</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-white/15 pointer-events-none" />
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSave()}
                placeholder="https://your-ollama.trycloudflare.com"
                className="w-full pl-8 pr-3 py-2 bg-black/50 border border-white/[0.08] rounded-xl text-[12px] font-mono text-white/70 placeholder:text-white/12 outline-none focus:border-[#e879f9]/25 transition-colors"
              />
            </div>
            <p className="text-[10px] text-white/18 leading-relaxed">
              Local: <span className="font-mono text-white/25">http://localhost:11434</span> · Cloudflare: <span className="font-mono text-white/25">https://xyz.trycloudflare.com</span>
            </p>
          </div>

          {/* Test result — simple or rich model list */}
          {testResult && (
            <div className={cn("rounded-xl border overflow-hidden", testResult.success ? "border-emerald-500/15" : "border-red-500/15")}>
              {/* Header */}
              <div className={cn("flex items-center gap-2 px-3 py-2", testResult.success ? "bg-emerald-500/[0.07]" : "bg-red-500/[0.07]")}>
                {testResult.success
                  ? <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                  : <XCircle className="size-3.5 text-red-400 shrink-0" />
                }
                <span className={cn("text-[11px] font-semibold flex-1", testResult.success ? "text-emerald-400" : "text-red-400")}>{testResult.message}</span>
                {testResult.ping !== undefined && (
                  <span className="flex items-center gap-1 text-[10px] text-white/30">
                    <Clock className="size-2.5" />{testResult.ping}ms
                  </span>
                )}
              </div>

              {/* Model list */}
              {testResult.success && testResult.models && testResult.models.length > 0 && (
                <div className="bg-black/30">
                  <div className="px-3 py-1.5 border-b border-white/[0.05] flex items-center gap-1.5">
                    <Server className="size-2.5 text-white/20" />
                    <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">Detected Models ({testResult.models.length})</span>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {testResult.models.map((m) => (
                      <div key={m.name} className="flex items-center gap-3 px-3 py-2 hover:bg-white/[0.02] transition-colors">
                        <div className="size-1.5 rounded-full bg-[#e879f9]/50 shrink-0 mt-px" />
                        <span className="flex-1 text-[11px] font-mono text-white/65 truncate">{m.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          {m.parameterSize && (
                            <span className="text-[10px] text-white/25">{m.parameterSize}</span>
                          )}
                          {m.size && m.size !== "unknown" && (
                            <span className="flex items-center gap-0.5 text-[10px] text-white/25">
                              <HardDrive className="size-2.5" />{m.size}
                            </span>
                          )}
                          {m.family && m.family !== "unknown" && (
                            <span className="px-1.5 py-px rounded text-[9px] font-mono bg-[#e879f9]/10 text-[#e879f9]/60 border border-[#e879f9]/15">{m.family}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {testResult.success && testResult.models && testResult.models.length === 0 && (
                <div className="px-3 py-3 text-[11px] text-white/30 text-center">
                  No models pulled yet — run <span className="font-mono text-white/45">ollama pull llama3.2</span> to get started
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleTest}
              disabled={testing || (!urlInput.trim() && !connected)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.07] text-[11px] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {testing ? <Loader2 className="size-3 animate-spin" /> : <Zap className="size-3 text-[#e879f9]" />}
              {testing ? "Detecting models…" : "Test & detect models"}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !urlInput.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e879f9]/80 text-white text-[11px] font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#e879f9]"
            >
              {saving ? <Loader2 className="size-3 animate-spin" /> : <Globe className="size-3" />}
              Save URL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AISettingsPage() {
  const [aiKeys, setAiKeys] = useState<AiKeys>({});
  const [ollamaUrl, setOllamaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await apiCall("/settings") as any;
      setAiKeys(data.aiKeys || {});
      setOllamaUrl(data.ollamaBaseUrl || null);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const connectedCount = Object.values(aiKeys).filter(v => v.connected).length;
  const totalProviders = CLOUD_PROVIDERS.length + 1; // +1 for Ollama

  const handleSave = async (field: string, key: string) => {
    const data = await apiCall("/settings", { method: "PUT", body: JSON.stringify({ [field]: key }) }) as any;
    setAiKeys(data.aiKeys || {});
    setOllamaUrl(data.ollamaBaseUrl || null);
  };

  const handleTest = async (providerId: string, apiKey?: string) => {
    const result = await apiCall("/ai/test", { method: "POST", body: JSON.stringify({ provider: providerId, apiKey }) }) as any;
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
            <span className="text-[12px] text-white/30">{connectedCount} / {totalProviders} connected</span>
          )}
          {connectedCount > 0 && (
            <div className="flex gap-0.5">
              {Array.from({ length: Math.min(connectedCount, totalProviders) }).map((_, i) => <div key={i} className="size-1.5 rounded-full bg-emerald-400" />)}
              {Array.from({ length: Math.max(0, totalProviders - connectedCount) }).map((_, i) => <div key={i} className="size-1.5 rounded-full bg-white/10" />)}
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0c]">
        <div className="max-w-2xl mx-auto space-y-3">

          {/* Info banner */}
          <div className="p-4 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/[0.07] to-violet-500/[0.04] mb-5">
            <div className="flex items-start gap-3">
              <div className="size-8 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Bot className="size-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white/75">Connect your AI providers</p>
                <p className="text-[11px] text-white/35 mt-0.5 leading-relaxed">
                  API keys are stored securely server-side and never exposed to the browser after saving. Connected models power smart tagging, summaries, and the AI assistant. For Ollama, just provide your base URL — no key needed.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-white/25">
              <Loader2 className="size-5 animate-spin mr-2" /> Loading…
            </div>
          ) : (
            <>
              {/* Ollama — top of the list, special */}
              <div className="mb-1">
                <p className="text-[10px] font-semibold text-white/15 uppercase tracking-widest px-1 mb-2">Local / Self-hosted</p>
                <OllamaCard
                  status={aiKeys["ollamaBaseUrl"]}
                  ollamaUrl={ollamaUrl}
                  onSave={handleSave}
                  onRemove={handleRemove}
                />
              </div>

              {/* Cloud providers */}
              <p className="text-[10px] font-semibold text-white/15 uppercase tracking-widest px-1 pt-2 pb-1">Cloud Providers</p>
              {CLOUD_PROVIDERS.map(provider => (
                <CloudProviderCard
                  key={provider.id}
                  provider={provider}
                  status={aiKeys[provider.field]}
                  onSave={handleSave}
                  onTest={handleTest}
                  onRemove={handleRemove}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
