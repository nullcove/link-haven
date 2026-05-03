import { useState, useEffect, useCallback, useRef } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { apiCall } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Eye, EyeOff, Key, CheckCircle2, XCircle, Loader2, Trash2,
  Zap, ExternalLink, ChevronDown, ChevronUp, Bot, Globe, Clock,
  Cpu, HardDrive, Server, Search, Filter, RefreshCw, Copy,
  Sparkles, Shield, Brain, Code2, Video, MessageSquare, Activity,
  ChevronRight, Terminal, Gauge, Layers, Star, Wifi, WifiOff,
  ChevronsUpDown, SortAsc, PlugZap, FlaskConical,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type ProviderStatus = { connected: boolean; masked: string | null };
type AiKeys = Record<string, ProviderStatus>;
type FilterTab = "all" | "connected" | "cloud" | "local";
type SortMode = "default" | "connected" | "name";

interface OllamaModel {
  name: string; size: string; family: string; parameterSize: string; quantization: string;
}
interface OllamaTestResult {
  success: boolean; message: string; ping?: number; models?: OllamaModel[];
}
interface Capability {
  label: string; icon: React.ElementType; color: string;
}
interface CloudProvider {
  id: string; name: string; badge?: string; tagline: string; description: string;
  color: string; models: ModelEntry[]; docsUrl: string; keyPrefix: string; field: string;
  capabilities: Capability[]; contextWindow: string; speedTier: "standard" | "fast" | "ultra";
  freeTier: boolean; recommended?: boolean;
}
interface ModelEntry { name: string; note?: string; }

// ─── Static CSS ──────────────────────────────────────────────────────────────
const CSS = `
@keyframes ai-glow-pulse {
  0%,100% { box-shadow: 0 0 0 0 var(--glow), 0 0 12px 0 var(--glow); }
  50%      { box-shadow: 0 0 0 4px transparent, 0 0 28px 4px var(--glow); }
}
@keyframes ai-scan {
  0%   { transform: translateY(-100%); }
  100% { transform: translateY(400%); }
}
@keyframes ai-fade-up {
  from { opacity:0; transform:translateY(14px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes ai-shake {
  0%,100%{ transform:translateX(0); }
  20%    { transform:translateX(-6px); }
  40%    { transform:translateX(6px); }
  60%    { transform:translateX(-4px); }
  80%    { transform:translateX(4px); }
}
@keyframes ai-pop {
  0%   { transform:scale(0.92); opacity:0; }
  60%  { transform:scale(1.03); }
  100% { transform:scale(1); opacity:1; }
}
@keyframes ai-border-spin {
  from { --angle:0deg; }
  to   { --angle:360deg; }
}
@keyframes ai-ping-ring {
  0%   { transform:scale(1); opacity:.6; }
  100% { transform:scale(2.4); opacity:0; }
}
@keyframes ai-dot-pulse {
  0%,100% { opacity:1; transform:scale(1); }
  50%     { opacity:.4; transform:scale(.7); }
}
@keyframes ai-gradient-x {
  0%,100% { background-position:0% 50%; }
  50%     { background-position:100% 50%; }
}
@keyframes ai-float {
  0%,100% { transform:translateY(0); }
  50%     { transform:translateY(-3px); }
}
@keyframes ai-testing-shimmer {
  0%   { background-position:-200% 0; }
  100% { background-position:200% 0; }
}
@keyframes ai-counter {
  from { opacity:0; transform:translateY(6px); }
  to   { opacity:1; transform:translateY(0); }
}
.ai-glow-pulse { animation: ai-glow-pulse 2s ease-in-out infinite; }
.ai-fade-up    { animation: ai-fade-up .35s cubic-bezier(.22,1,.36,1) both; }
.ai-shake      { animation: ai-shake .4s ease-in-out; }
.ai-pop        { animation: ai-pop .3s cubic-bezier(.22,1,.36,1) both; }
.ai-float      { animation: ai-float 3s ease-in-out infinite; }
.ai-dot-pulse  { animation: ai-dot-pulse 1.8s ease-in-out infinite; }
.ai-counter    { animation: ai-counter .3s ease both; }
.ai-testing-shimmer {
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.06) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: ai-testing-shimmer 1.4s linear infinite;
}
.ai-gradient-text {
  background: linear-gradient(135deg, #a78bfa 0%, #818cf8 40%, #38bdf8 80%, #34d399 100%);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ai-gradient-x 4s ease infinite;
}
`;

// ─── Provider data ────────────────────────────────────────────────────────────
const cap = (label: string, icon: React.ElementType, color: string): Capability => ({ label, icon, color });

const CLOUD_PROVIDERS: CloudProvider[] = [
  {
    id:"openai", name:"OpenAI", badge:"Most Popular", tagline:"GPT-4o · o1 · o3",
    description:"The world's most-used AI platform. Unmatched ecosystem, vision, code, and reasoning across the o-series.",
    color:"#10a37f", field:"openaiApiKey", keyPrefix:"sk-...", docsUrl:"https://platform.openai.com/api-keys",
    models:[{name:"gpt-4o",note:"Vision+Code"},{name:"gpt-4o-mini",note:"Fast & cheap"},{name:"o1",note:"Reasoning"},{name:"o3-mini",note:"Fast reasoning"},{name:"gpt-4-turbo",note:"Legacy"}],
    capabilities:[cap("Vision",Video,"#10a37f"),cap("Code",Code2,"#3b82f6"),cap("Reasoning",Brain,"#8b5cf6"),cap("Chat",MessageSquare,"#06b6d4")],
    contextWindow:"128K", speedTier:"fast", freeTier:false, recommended:true,
  },
  {
    id:"anthropic", name:"Anthropic", tagline:"Claude 3.5 · Opus · Haiku",
    description:"Safety-first lab. Claude 3.5 Sonnet beats GPT-4o on most benchmarks. Unrivalled 200K context.",
    color:"#d97706", field:"anthropicApiKey", keyPrefix:"sk-ant-...", docsUrl:"https://console.anthropic.com/settings/keys",
    models:[{name:"claude-3-5-sonnet",note:"Best overall"},{name:"claude-3-5-haiku",note:"Ultra fast"},{name:"claude-3-opus",note:"Heavy tasks"},{name:"claude-3-haiku",note:"Lightweight"}],
    capabilities:[cap("Reasoning",Brain,"#d97706"),cap("Code",Code2,"#3b82f6"),cap("Safety",Shield,"#10b981"),cap("Chat",MessageSquare,"#06b6d4")],
    contextWindow:"200K", speedTier:"fast", freeTier:false,
  },
  {
    id:"gemini", name:"Google Gemini", badge:"Free Tier", tagline:"2.0 Flash · 1.5 Pro · Ultra",
    description:"Google's multimodal powerhouse. Native vision, audio, video. Generous free tier via AI Studio.",
    color:"#4285f4", field:"geminiApiKey", keyPrefix:"AIzaSy...", docsUrl:"https://aistudio.google.com/app/apikey",
    models:[{name:"gemini-2.0-flash",note:"Fastest"},{name:"gemini-1.5-pro",note:"Long context"},{name:"gemini-1.5-flash",note:"Balanced"},{name:"gemini-ultra",note:"Most capable"}],
    capabilities:[cap("Vision",Video,"#4285f4"),cap("Reasoning",Brain,"#8b5cf6"),cap("Code",Code2,"#3b82f6"),cap("Chat",MessageSquare,"#06b6d4")],
    contextWindow:"1M", speedTier:"ultra", freeTier:true, recommended:true,
  },
  {
    id:"mistral", name:"Mistral AI", tagline:"Large · Small · Codestral",
    description:"Europe's open-weight champion. Best price-performance. Codestral is the top code model.",
    color:"#f97316", field:"mistralApiKey", keyPrefix:"...", docsUrl:"https://console.mistral.ai/api-keys",
    models:[{name:"mistral-large",note:"Flagship"},{name:"mistral-small",note:"Efficient"},{name:"mistral-nemo",note:"12B open"},{name:"codestral",note:"Code specialist"}],
    capabilities:[cap("Code",Code2,"#f97316"),cap("Chat",MessageSquare,"#06b6d4"),cap("Reasoning",Brain,"#8b5cf6")],
    contextWindow:"128K", speedTier:"fast", freeTier:false,
  },
  {
    id:"groq", name:"Groq", badge:"⚡ Ultra-fast", tagline:"Llama 3.1 · Mixtral · 300+ tok/s",
    description:"Custom LPU chips deliver 300+ tokens/sec. Same models as Together/Replicate, 10× faster.",
    color:"#7c3aed", field:"groqApiKey", keyPrefix:"gsk_...", docsUrl:"https://console.groq.com/keys",
    models:[{name:"llama-3.1-70b",note:"Best open"},{name:"llama-3.1-8b",note:"Fast"},{name:"mixtral-8x7b",note:"MoE"},{name:"gemma2-9b",note:"Google open"}],
    capabilities:[cap("Chat",MessageSquare,"#7c3aed"),cap("Code",Code2,"#3b82f6"),cap("Reasoning",Brain,"#8b5cf6")],
    contextWindow:"32K", speedTier:"ultra", freeTier:true,
  },
  {
    id:"perplexity", name:"Perplexity", tagline:"Sonar · Real-time web search",
    description:"AI with live internet access. Every answer is grounded in current web sources with citations.",
    color:"#06b6d4", field:"perplexityApiKey", keyPrefix:"pplx-...", docsUrl:"https://www.perplexity.ai/settings/api",
    models:[{name:"sonar-large",note:"Web search"},{name:"sonar-small",note:"Fast search"},{name:"sonar-reasoning",note:"Deep research"},{name:"r1-1776",note:"No censorship"}],
    capabilities:[cap("Search",Search,"#06b6d4"),cap("Reasoning",Brain,"#8b5cf6"),cap("Chat",MessageSquare,"#06b6d4")],
    contextWindow:"128K", speedTier:"standard", freeTier:false,
  },
  {
    id:"cohere", name:"Cohere", tagline:"Command R+ · Embed · Rerank",
    description:"Enterprise retrieval AI. Best-in-class embeddings and reranking for production RAG pipelines.",
    color:"#14b8a6", field:"cohereApiKey", keyPrefix:"...", docsUrl:"https://dashboard.cohere.com/api-keys",
    models:[{name:"command-r+",note:"RAG flagship"},{name:"command-r",note:"Efficient"},{name:"embed-v3",note:"Embeddings"},{name:"rerank-v3.5",note:"Reranking"}],
    capabilities:[cap("Reasoning",Brain,"#14b8a6"),cap("Search",Search,"#06b6d4"),cap("Chat",MessageSquare,"#06b6d4")],
    contextWindow:"128K", speedTier:"standard", freeTier:false,
  },
  {
    id:"openrouter", name:"OpenRouter", badge:"100+ models", tagline:"One API for every provider",
    description:"Unified gateway: swap providers without code changes. Access every model at often-cheaper rates.",
    color:"#6366f1", field:"openrouterApiKey", keyPrefix:"sk-or-...", docsUrl:"https://openrouter.ai/keys",
    models:[{name:"openai/gpt-4o"},{name:"anthropic/claude-3.5-sonnet"},{name:"meta/llama-3.1-70b"},{name:"google/gemini-flash-1.5"},{name:"deepseek/deepseek-r1"}],
    capabilities:[cap("Chat",MessageSquare,"#6366f1"),cap("Code",Code2,"#3b82f6"),cap("Vision",Video,"#4285f4"),cap("Reasoning",Brain,"#8b5cf6")],
    contextWindow:"Varies", speedTier:"fast", freeTier:false,
  },
  {
    id:"together", name:"Together AI", tagline:"Llama · DeepSeek · Qwen at scale",
    description:"Open-source frontier models at competitive pricing. DeepSeek R1 and Llama 3.1 at their best.",
    color:"#10b981", field:"togetherApiKey", keyPrefix:"...", docsUrl:"https://api.together.ai/settings/api-keys",
    models:[{name:"llama-3.1-70b",note:"Meta flagship"},{name:"deepseek-r1",note:"Reasoning"},{name:"qwen2.5-72b",note:"Alibaba"},{name:"mistral-7b",note:"Efficient"}],
    capabilities:[cap("Code",Code2,"#10b981"),cap("Reasoning",Brain,"#8b5cf6"),cap("Chat",MessageSquare,"#06b6d4")],
    contextWindow:"128K", speedTier:"fast", freeTier:false,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SPEED_LABELS: Record<string, string> = { ultra:"⚡ Ultra-fast", fast:"Fast", standard:"Standard" };
const SPEED_COLORS: Record<string, string> = { ultra:"#a78bfa", fast:"#34d399", standard:"#94a3b8" };

function PingBadge({ ping }: { ping: number }) {
  const color = ping < 100 ? "#34d399" : ping < 500 ? "#fbbf24" : "#f87171";
  const label = ping < 100 ? "Excellent" : ping < 500 ? "Good" : "Slow";
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border"
      style={{ color, borderColor: color + "40", backgroundColor: color + "12" }}>
      <Gauge className="size-2.5" />{ping}ms · {label}
    </span>
  );
}

function CapBadge({ cap }: { cap: Capability }) {
  const Icon = cap.icon;
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium border transition-all hover:scale-105"
      style={{ color: cap.color, borderColor: cap.color + "35", backgroundColor: cap.color + "12" }}>
      <Icon className="size-2.5" />{cap.label}
    </span>
  );
}

function StatusDot({ connected }: { connected: boolean }) {
  return (
    <span className="relative inline-flex size-2">
      {connected && <span className="absolute inline-flex size-full rounded-full opacity-75 ai-dot-pulse" style={{ backgroundColor: "#34d399" }} />}
      <span className="relative inline-flex size-2 rounded-full" style={{ backgroundColor: connected ? "#34d399" : "#374151" }} />
    </span>
  );
}

function TestingOverlay() {
  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 ai-testing-shimmer" />
      <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent"
        style={{ animation: "ai-scan 1.8s linear infinite", top: "0" }} />
    </div>
  );
}

// ─── Cloud Provider Card ───────────────────────────────────────────────────────
function CloudProviderCard({ provider, status, index, onSave, onTest, onRemove, forceOpen }: {
  provider: CloudProvider;
  status: ProviderStatus | undefined;
  index: number;
  onSave: (field: string, key: string) => Promise<void>;
  onTest: (id: string, key?: string) => Promise<{ success: boolean; message: string }>;
  onRemove: (id: string) => Promise<void>;
  forceOpen?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [shake, setShake] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastTested, setLastTested] = useState<Date | null>(null);
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const connected = status?.connected ?? false;

  useEffect(() => { if (forceOpen !== undefined) setExpanded(forceOpen); }, [forceOpen]);

  const handleSave = async () => {
    if (!keyInput.trim()) return;
    setSaving(true);
    try {
      await onSave(provider.field, keyInput.trim());
      setKeyInput(""); setTestResult(null); setExpanded(false);
      toast({ title: `${provider.name} connected`, description: "API key stored securely." });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      const r = await onTest(provider.id, keyInput.trim() || undefined);
      setTestResult(r); setLastTested(new Date());
      if (!r.success) { setShake(true); setTimeout(() => setShake(false), 500); }
    } catch (e: any) { setTestResult({ success: false, message: e.message }); }
    finally { setTesting(false); }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try { await onRemove(provider.id); setTestResult(null); toast({ title: `${provider.name} disconnected` }); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setRemoving(false); }
  };

  const copyKey = () => {
    if (status?.masked) { navigator.clipboard.writeText(status.masked); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  };

  const glowColor = provider.color + "55";

  return (
    <div
      ref={cardRef}
      className={cn("relative rounded-2xl border transition-all duration-300 overflow-hidden", shake && "ai-shake")}
      style={{
        animationDelay: `${index * 40}ms`,
        "--glow": glowColor,
        borderColor: connected ? provider.color + "40" : "rgba(255,255,255,0.06)",
        backgroundColor: connected ? provider.color + "06" : "#0d0d12",
        boxShadow: connected ? `0 0 0 1px ${provider.color}20, 0 4px 24px ${provider.color}12` : "none",
      } as any}
    >
      {testing && <TestingOverlay />}

      {/* Connected glow border */}
      {connected && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ boxShadow: `inset 0 0 40px ${provider.color}08` }} />
      )}

      {/* Header */}
      <button
        className="relative w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.02] z-10"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Provider icon */}
        <div className="relative size-9 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300"
          style={{ backgroundColor: provider.color + "15", borderColor: provider.color + "35" }}>
          <Bot className={cn("size-4", connected && "ai-float")} style={{ color: provider.color }} />
          {connected && (
            <>
              <span className="absolute -top-0.5 -right-0.5 z-10"><StatusDot connected={true} /></span>
              <span className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity"
                style={{ boxShadow: `0 0 16px ${provider.color}` }} />
            </>
          )}
        </div>

        {/* Name + info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-[13px] text-white">{provider.name}</span>
            {provider.badge && (
              <span className="px-1.5 py-px rounded text-[9px] font-bold uppercase tracking-wide"
                style={{ backgroundColor: provider.color + "25", color: provider.color }}>
                {provider.badge}
              </span>
            )}
            {provider.recommended && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-px rounded text-[9px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/25">
                <Star className="size-2" fill="currentColor" /> Recommended
              </span>
            )}
            {connected && (
              <span className="inline-flex items-center gap-1 px-1.5 py-px rounded-full text-[9px] font-semibold"
                style={{ backgroundColor: "#34d39920", color: "#34d399", border: "1px solid #34d39940" }}>
                <CheckCircle2 className="size-2.5" /> Live
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] text-white/30">{provider.tagline}</span>
            <span className="text-white/10">·</span>
            <span className="text-[9px]" style={{ color: SPEED_COLORS[provider.speedTier] }}>{SPEED_LABELS[provider.speedTier]}</span>
            <span className="text-white/10">·</span>
            <span className="text-[9px] text-white/30">{provider.contextWindow} ctx</span>
            {provider.freeTier && <span className="px-1 py-px rounded text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">FREE TIER</span>}
          </div>
        </div>

        {/* Right info */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden sm:flex gap-1">
            {provider.capabilities.slice(0, 3).map(c => <CapBadge key={c.label} cap={c} />)}
          </div>
          {connected && status?.masked && (
            <span className="hidden md:block text-[9px] font-mono text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded">{status.masked}</span>
          )}
          {expanded ? <ChevronUp className="size-3.5 text-white/20" /> : <ChevronDown className="size-3.5 text-white/20" />}
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="relative z-10 px-4 pb-4 space-y-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          {/* Description + models */}
          <div className="p-3 rounded-xl mt-3" style={{ background: `linear-gradient(135deg, ${provider.color}0d, ${provider.color}05)`, border: `1px solid ${provider.color}18` }}>
            <p className="text-[11px] text-white/50 leading-relaxed mb-2">{provider.description}</p>
            <div className="grid grid-cols-2 gap-1">
              {provider.models.map(m => (
                <div key={m.name} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.05] group hover:border-white/10 transition-colors">
                  <div className="size-1 rounded-full shrink-0" style={{ backgroundColor: provider.color }} />
                  <span className="text-[10px] font-mono text-white/60 truncate flex-1">{m.name}</span>
                  {m.note && <span className="text-[9px] text-white/25 hidden group-hover:block">{m.note}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Connected key row */}
          {connected && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl border"
              style={{ backgroundColor: "#34d39910", borderColor: "#34d39928" }}>
              <Key className="size-3.5 text-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-semibold text-emerald-400">API Key Active</span>
                <span className="text-[9px] text-white/30 font-mono ml-2">{status?.masked}</span>
              </div>
              {lastTested && (
                <span className="text-[9px] text-white/20 flex items-center gap-1">
                  <Clock className="size-2.5" />{lastTested.toLocaleTimeString()}
                </span>
              )}
              <button onClick={copyKey} className="p-1 rounded hover:bg-white/10 transition-colors" title="Copy masked key">
                <Copy className="size-3" style={{ color: copied ? "#34d399" : "rgba(255,255,255,0.3)" }} />
              </button>
              <button onClick={handleRemove} disabled={removing}
                className="flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                {removing ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />} Remove
              </button>
            </div>
          )}

          {/* Key input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-white/35">{connected ? "Update API key" : "API key"}</label>
              <a href={provider.docsUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-white/20 hover:text-indigo-400 transition-colors">
                <ExternalLink className="size-2.5" />Get key
              </a>
            </div>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-white/15 pointer-events-none" />
              <input
                type={showKey ? "text" : "password"}
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setExpanded(false); }}
                placeholder={provider.keyPrefix}
                className="w-full pl-8 pr-9 py-2 rounded-xl text-[11px] font-mono text-white/70 placeholder:text-white/10 outline-none transition-all"
                style={{ backgroundColor: "rgba(0,0,0,0.5)", border: `1px solid rgba(255,255,255,0.08)` }}
                onFocus={e => e.currentTarget.style.borderColor = provider.color + "50"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
              />
              <button type="button" onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors">
                {showKey ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
              </button>
            </div>
            <p className="text-[9px] text-white/15 text-right">Stored encrypted server-side · never exposed to browser</p>
          </div>

          {/* Test result */}
          {testResult && (
            <div className={cn("ai-pop flex items-start gap-2 p-2.5 rounded-xl border text-[11px]",
              testResult.success ? "bg-emerald-500/[0.07] border-emerald-500/15 text-emerald-400" : "bg-red-500/[0.07] border-red-500/15 text-red-400")}>
              {testResult.success ? <CheckCircle2 className="size-3.5 shrink-0 mt-px" /> : <XCircle className="size-3.5 shrink-0 mt-px" />}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-0.5">
            <button onClick={handleTest} disabled={testing || (!keyInput.trim() && !connected)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] border transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)" }}>
              {testing ? <Loader2 className="size-3 animate-spin" /> : <FlaskConical className="size-3" style={{ color: provider.color }} />}
              {testing ? "Testing…" : "Test connection"}
            </button>
            <button onClick={handleSave} disabled={saving || !keyInput.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: `linear-gradient(135deg, ${provider.color}dd, ${provider.color}99)`, boxShadow: `0 2px 12px ${provider.color}40` }}>
              {saving ? <Loader2 className="size-3 animate-spin" /> : <PlugZap className="size-3" />}
              {connected ? "Update" : "Connect"}
            </button>
            <span className="ml-auto text-[9px] text-white/15 hidden sm:block">Enter ↵ to save · Esc to close</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Ollama Card ──────────────────────────────────────────────────────────────
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
  const [shake, setShake] = useState(false);
  const { toast } = useToast();
  const connected = status?.connected ?? false;
  const FUCHSIA = "#e879f9";

  const handleSave = async () => {
    const val = urlInput.trim();
    if (!val) return;
    setSaving(true);
    try {
      await onSave("ollamaBaseUrl", val);
      setUrlInput(""); setTestResult(null); setExpanded(false);
      toast({ title: "Ollama connected", description: "Your GPU instance is ready." });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    const url = urlInput.trim() || ollamaUrl || "";
    if (!url) { setTesting(false); return; }
    try {
      const r = await apiCall("/ai/test", { method: "POST", body: JSON.stringify({ provider: "ollama", baseUrl: url }) }) as OllamaTestResult;
      setTestResult(r);
      if (!r.success) { setShake(true); setTimeout(() => setShake(false), 500); }
    } catch (e: any) { setTestResult({ success: false, message: e.message }); }
    finally { setTesting(false); }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try { await onRemove("ollama"); setTestResult(null); toast({ title: "Ollama disconnected" }); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setRemoving(false); }
  };

  return (
    <div className={cn("relative rounded-2xl border transition-all duration-300 overflow-hidden", shake && "ai-shake")}
      style={{
        borderColor: connected ? FUCHSIA + "40" : "rgba(255,255,255,0.07)",
        backgroundColor: connected ? FUCHSIA + "06" : "#0d0d12",
        boxShadow: connected ? `0 0 0 1px ${FUCHSIA}20, 0 4px 32px ${FUCHSIA}15` : "none",
        "--glow": FUCHSIA + "55",
      } as any}>
      {testing && <TestingOverlay />}
      {connected && <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: `inset 0 0 60px ${FUCHSIA}06` }} />}

      {/* Header */}
      <button className="relative z-10 w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors" onClick={() => setExpanded(v => !v)}>
        <div className="relative size-9 rounded-xl flex items-center justify-center shrink-0 border transition-all"
          style={{ backgroundColor: FUCHSIA + "15", borderColor: FUCHSIA + "35" }}>
          <Cpu className={cn("size-4", connected && "ai-float")} style={{ color: FUCHSIA }} />
          {connected && <span className="absolute -top-0.5 -right-0.5"><StatusDot connected /></span>}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-[13px] text-white">Ollama</span>
            <span className="px-1.5 py-px rounded text-[9px] font-bold uppercase tracking-wide" style={{ backgroundColor: FUCHSIA + "25", color: FUCHSIA }}>GPU Local</span>
            <span className="px-1 py-px rounded text-[9px] font-bold uppercase tracking-wide bg-violet-500/20 text-violet-300 border border-violet-500/25">CF Tunnel</span>
            {connected && (
              <span className="inline-flex items-center gap-1 px-1.5 py-px rounded-full text-[9px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="size-2.5" /> Live
              </span>
            )}
          </div>
          <p className="text-[10px] text-white/30 mt-0.5 truncate">
            {connected && ollamaUrl ? ollamaUrl : "Self-hosted · Cloudflare tunnel · localhost:11434"}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {[cap("GPU",Cpu,FUCHSIA), cap("Local",Server,"#818cf8"), cap("Any model",Layers,"#94a3b8")].map(c => (
            <CapBadge key={c.label} cap={c} />
          ))}
          {expanded ? <ChevronUp className="size-3.5 text-white/20" /> : <ChevronDown className="size-3.5 text-white/20" />}
        </div>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="relative z-10 px-4 pb-4 space-y-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="p-3 rounded-xl mt-3 border" style={{ background: `linear-gradient(135deg, ${FUCHSIA}0d, #7c3aed08)`, borderColor: FUCHSIA + "18" }}>
            <p className="text-[11px] text-white/50 leading-relaxed mb-2">
              Run any model on your GPU via Ollama. Connect with a direct local URL or expose remotely using a Cloudflare tunnel — no API key required.
            </p>
            <div className="flex flex-wrap gap-1">
              {["llama3.2","deepseek-r1","qwen2.5","gemma3","mistral","phi4","codellama","llava","nomic-embed"].map(m => (
                <span key={m} className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/[0.05] border border-white/[0.07] text-white/40">{m}</span>
              ))}
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono border text-[#e879f9]/60" style={{ backgroundColor: FUCHSIA + "10", borderColor: FUCHSIA + "25" }}>+ any model</span>
            </div>
          </div>

          {connected && ollamaUrl && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl border" style={{ backgroundColor: "#34d39910", borderColor: "#34d39928" }}>
              <Globe className="size-3.5 text-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-semibold text-emerald-400">Instance connected</span>
                <span className="text-[9px] text-white/30 font-mono ml-2 truncate">{ollamaUrl}</span>
              </div>
              <button onClick={handleRemove} disabled={removing}
                className="flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                {removing ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />} Disconnect
              </button>
            </div>
          )}

          {/* URL input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-white/35">{connected ? "Update base URL" : "Base URL"}</label>
              <span className="text-[9px] text-white/15">No API key needed</span>
            </div>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-white/15 pointer-events-none" />
              <input
                type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setExpanded(false); }}
                placeholder="https://your-gpu.trycloudflare.com"
                className="w-full pl-8 pr-3 py-2 rounded-xl text-[11px] font-mono text-white/70 placeholder:text-white/12 outline-none transition-all"
                style={{ backgroundColor: "rgba(0,0,0,0.5)", border: `1px solid rgba(255,255,255,0.08)` }}
                onFocus={e => e.currentTarget.style.borderColor = FUCHSIA + "50"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
              />
            </div>
            <div className="flex gap-2 text-[9px] text-white/15">
              <span>Local: <span className="font-mono text-white/25">http://localhost:11434</span></span>
              <span>·</span>
              <span>Remote: <span className="font-mono text-white/25">https://xyz.trycloudflare.com</span></span>
            </div>
          </div>

          {/* Ollama test result */}
          {testResult && (
            <div className={cn("rounded-xl border overflow-hidden ai-pop", testResult.success ? "border-emerald-500/15" : "border-red-500/15")}>
              <div className={cn("flex items-center gap-2 px-3 py-2", testResult.success ? "bg-emerald-500/[0.07]" : "bg-red-500/[0.07]")}>
                {testResult.success ? <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" /> : <XCircle className="size-3.5 text-red-400 shrink-0" />}
                <span className={cn("text-[11px] font-semibold flex-1", testResult.success ? "text-emerald-400" : "text-red-400")}>{testResult.message}</span>
                {testResult.ping !== undefined && <PingBadge ping={testResult.ping} />}
              </div>

              {testResult.success && testResult.models && (
                <div className="bg-black/30">
                  <div className="px-3 py-1.5 border-b border-white/[0.04] flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Terminal className="size-2.5 text-white/20" />
                      <span className="text-[9px] font-bold text-white/25 uppercase tracking-wider">Detected Models</span>
                    </div>
                    <span className="text-[9px] text-white/20">{testResult.models.length} total</span>
                  </div>
                  {testResult.models.length === 0 ? (
                    <div className="px-3 py-3 text-center">
                      <span className="text-[10px] text-white/30">No models pulled — run </span>
                      <span className="text-[10px] font-mono text-white/50 bg-white/[0.06] px-1.5 py-0.5 rounded">ollama pull llama3.2</span>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.03] max-h-52 overflow-y-auto">
                      {testResult.models.map((m, i) => (
                        <div key={m.name} className="flex items-center gap-2 px-3 py-2 hover:bg-white/[0.02] transition-colors ai-fade-up"
                          style={{ animationDelay: `${i * 30}ms` }}>
                          <Activity className="size-2.5 shrink-0" style={{ color: FUCHSIA + "80" }} />
                          <span className="flex-1 text-[10px] font-mono text-white/65 truncate">{m.name}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {m.quantization && (
                              <span className="text-[8px] font-mono bg-white/[0.05] px-1 py-px rounded text-white/25">{m.quantization}</span>
                            )}
                            {m.parameterSize && <span className="text-[9px] text-white/25">{m.parameterSize}</span>}
                            {m.size && m.size !== "unknown" && (
                              <span className="flex items-center gap-0.5 text-[9px] text-white/25">
                                <HardDrive className="size-2.5" />{m.size}
                              </span>
                            )}
                            {m.family && m.family !== "unknown" && (
                              <span className="px-1.5 py-px rounded text-[8px] font-mono border"
                                style={{ backgroundColor: FUCHSIA + "10", color: FUCHSIA + "a0", borderColor: FUCHSIA + "20" }}>
                                {m.family}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-0.5">
            <button onClick={handleTest} disabled={testing || (!urlInput.trim() && !connected)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] border transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)" }}>
              {testing ? <Loader2 className="size-3 animate-spin" /> : <Zap className="size-3" style={{ color: FUCHSIA }} />}
              {testing ? "Detecting models…" : "Test & detect models"}
            </button>
            <button onClick={handleSave} disabled={saving || !urlInput.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: `linear-gradient(135deg, ${FUCHSIA}cc, #7c3aedcc)`, boxShadow: `0 2px 12px ${FUCHSIA}40` }}>
              {saving ? <Loader2 className="size-3 animate-spin" /> : <Globe className="size-3" />}
              {connected ? "Update URL" : "Connect Ollama"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AISettingsPage() {
  const [aiKeys, setAiKeys] = useState<AiKeys>({});
  const [ollamaUrl, setOllamaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [sort, setSort] = useState<SortMode>("default");
  const [expandAll, setExpandAll] = useState<boolean | undefined>(undefined);
  const [bulkTesting, setBulkTesting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    try {
      const d = await apiCall("/settings") as any;
      setAiKeys(d.aiKeys || {});
      setOllamaUrl(d.ollamaBaseUrl || null);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const connectedCount = Object.values(aiKeys).filter(v => v.connected).length;
  const totalProviders = CLOUD_PROVIDERS.length + 1;

  const handleSave = async (field: string, key: string) => {
    const d = await apiCall("/settings", { method: "PUT", body: JSON.stringify({ [field]: key }) }) as any;
    setAiKeys(d.aiKeys || {});
    setOllamaUrl(d.ollamaBaseUrl || null);
  };

  const handleTest = async (id: string, apiKey?: string) => {
    const r = await apiCall("/ai/test", { method: "POST", body: JSON.stringify({ provider: id, apiKey }) }) as any;
    return { success: r.success ?? false, message: r.message || r.error || "Unknown" };
  };

  const handleRemove = async (id: string) => {
    await apiCall(`/settings/ai-key/${id}`, { method: "DELETE" });
    await fetchSettings();
  };

  const handleBulkTest = async () => {
    const providers = CLOUD_PROVIDERS.filter(p => aiKeys[p.field]?.connected);
    if (providers.length === 0) { toast({ title: "No connected providers to test" }); return; }
    setBulkTesting(true); setBulkProgress(0); setBulkTotal(providers.length);
    let passed = 0;
    for (const p of providers) {
      try { const r = await handleTest(p.id); if (r.success) passed++; } catch {}
      setBulkProgress(prev => prev + 1);
    }
    setBulkTesting(false);
    toast({ title: `Bulk test complete`, description: `${passed}/${providers.length} providers responding` });
  };

  // Filter + sort
  const filteredProviders = CLOUD_PROVIDERS
    .filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.tagline.toLowerCase().includes(q);
      const matchFilter =
        filter === "all" ? true :
        filter === "connected" ? aiKeys[p.field]?.connected :
        filter === "cloud" ? true : false;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (sort === "connected") {
        const ac = aiKeys[a.field]?.connected ? 0 : 1;
        const bc = aiKeys[b.field]?.connected ? 0 : 1;
        return ac - bc;
      }
      if (sort === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  const showOllama = filter === "all" || filter === "local" ||
    (filter === "connected" && aiKeys["ollamaBaseUrl"]?.connected);

  return (
    <AppLayout>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Header */}
      <header className="shrink-0 border-b border-white/[0.06] sticky top-0 z-20"
        style={{ background: "rgba(5,5,10,0.92)", backdropFilter: "blur(16px)" }}>
        <div className="flex items-center gap-3 px-6 h-14">
          <div className="relative size-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366f120, #8b5cf620)", border: "1px solid #6366f130" }}>
            <Bot className="size-3.5 text-indigo-400" />
          </div>
          <div>
            <h1 className="font-bold text-[14px] ai-gradient-text">AI Models</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {/* Stats pills */}
            {!loading && (
              <>
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/[0.07] bg-white/[0.03]">
                  <div className="size-1.5 rounded-full bg-emerald-400 ai-dot-pulse" />
                  <span className="text-[11px] text-white/50 font-medium">{connectedCount} connected</span>
                </div>
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/[0.07] bg-white/[0.03]">
                  <Layers className="size-3 text-indigo-400" />
                  <span className="text-[11px] text-white/50 font-medium">{totalProviders} providers</span>
                </div>
              </>
            )}
            <button onClick={() => fetchSettings()}
              className="p-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.07] transition-colors text-white/40 hover:text-white/70">
              <RefreshCw className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Controls bar */}
        <div className="flex items-center gap-2 px-6 pb-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-36 max-w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-white/20 pointer-events-none" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search providers…"
              className="w-full pl-7 pr-3 py-1.5 rounded-lg text-[11px] text-white/70 placeholder:text-white/20 outline-none transition-all"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {(["all","connected","cloud","local"] as FilterTab[]).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-2.5 py-1 rounded-md text-[10px] font-medium transition-all capitalize"
                style={{
                  backgroundColor: filter === f ? "rgba(99,102,241,0.25)" : "transparent",
                  color: filter === f ? "#a5b4fc" : "rgba(255,255,255,0.35)",
                  border: filter === f ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
                }}>
                {f === "connected" ? `✓ Connected` : f === "local" ? "⚡ Local" : f}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer text-[10px] text-white/30 border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
            onClick={() => setSort(s => s === "default" ? "connected" : s === "connected" ? "name" : "default")}>
            <SortAsc className="size-3" />
            {sort === "default" ? "Default" : sort === "connected" ? "Connected ↑" : "Name A-Z"}
          </div>

          {/* Expand all */}
          <button onClick={() => setExpandAll(v => v === true ? false : true)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] text-white/30 border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
            <ChevronsUpDown className="size-3" />
            {expandAll ? "Collapse all" : "Expand all"}
          </button>

          {/* Bulk test */}
          {connectedCount > 0 && (
            <button onClick={handleBulkTest} disabled={bulkTesting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #6366f1cc, #8b5cf6cc)", color: "white", boxShadow: "0 2px 12px rgba(99,102,241,0.35)" }}>
              {bulkTesting ? (
                <><Loader2 className="size-3 animate-spin" />{bulkProgress}/{bulkTotal}</>
              ) : (
                <><FlaskConical className="size-3" />Test all</>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto" style={{ background: "#050508" }}>
        {/* Subtle dot grid */}
        <div className="absolute inset-0 pointer-events-none opacity-30"
          style={{ backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.15) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        <div className="relative max-w-2xl mx-auto p-5 space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="relative size-10">
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500/10" />
                <div className="absolute inset-0 rounded-full border-2 border-t-indigo-500 animate-spin" />
              </div>
              <span className="text-[11px] text-white/25 font-mono tracking-widest">INITIALIZING</span>
            </div>
          ) : (
            <>
              {/* Local section */}
              {showOllama && (
                <div className="ai-fade-up">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-px flex-1 bg-white/[0.05]" />
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-1">
                      <Wifi className="size-2.5" />Local / Self-hosted
                    </span>
                    <div className="h-px flex-1 bg-white/[0.05]" />
                  </div>
                  <OllamaCard status={aiKeys["ollamaBaseUrl"]} ollamaUrl={ollamaUrl} onSave={handleSave} onRemove={handleRemove} />
                </div>
              )}

              {/* Cloud section */}
              {filteredProviders.length > 0 && (filter !== "local") && (
                <div>
                  <div className="flex items-center gap-2 mt-4 mb-2">
                    <div className="h-px flex-1 bg-white/[0.05]" />
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-1">
                      <Sparkles className="size-2.5" />Cloud Providers
                    </span>
                    <div className="h-px flex-1 bg-white/[0.05]" />
                  </div>
                  <div className="space-y-2">
                    {filteredProviders.map((provider, i) => (
                      <div key={provider.id} className="ai-fade-up" style={{ animationDelay: `${i * 35}ms` }}>
                        <CloudProviderCard
                          provider={provider}
                          status={aiKeys[provider.field]}
                          index={i}
                          onSave={handleSave}
                          onTest={handleTest}
                          onRemove={handleRemove}
                          forceOpen={expandAll}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredProviders.length === 0 && filter !== "local" && (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <WifiOff className="size-8 text-white/10" />
                  <span className="text-[12px] text-white/25">No providers match your filter</span>
                  <button onClick={() => { setFilter("all"); setSearch(""); }} className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors">Clear filters</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
