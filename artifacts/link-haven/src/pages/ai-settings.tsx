import { useState, useEffect, useCallback, useRef } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { apiCall } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Eye, EyeOff, CheckCircle2, XCircle, Loader2, Trash2,
  Zap, ExternalLink, Bot, Globe, Clock, Cpu, HardDrive,
  Server, Search, RefreshCw, Sparkles, Shield, Brain,
  Code2, Video, MessageSquare, Activity, Terminal, Gauge,
  Layers, Star, PlugZap, FlaskConical, ChevronRight, Key,
  Wifi, WifiOff, Database, ArrowRight,
} from "lucide-react";

/* ─── Types ───────────────────────────────────────────────── */
type ProviderStatus = { connected: boolean; masked: string | null };
type AiKeys = Record<string, ProviderStatus>;
interface OllamaModel { name: string; size: string; family: string; parameterSize: string; quantization: string; }
interface OllamaTestResult { success: boolean; message: string; ping?: number; models?: OllamaModel[]; }
interface Cap { icon: React.ElementType; label: string; color: string }
interface Provider {
  id: string; name: string; tagline: string; description: string;
  color: string; bg: string; models: { name: string; note?: string }[];
  docsUrl: string; keyPrefix: string; field: string;
  caps: Cap[]; context: string; speed: "ultra" | "fast" | "standard";
  free?: boolean; badge?: string; recommended?: boolean;
}

/* ─── CSS ─────────────────────────────────────────────────── */
const STYLES = `
@keyframes _aurora {
  0%,100% { transform: translate(0,0) scale(1) rotate(0deg); }
  33%      { transform: translate(40px,-30px) scale(1.15) rotate(8deg); }
  66%      { transform: translate(-20px,20px) scale(0.9) rotate(-5deg); }
}
@keyframes _pulse-ring {
  0%   { transform:scale(1); opacity:.7; }
  100% { transform:scale(2.2); opacity:0; }
}
@keyframes _scan-line {
  0%   { top:-2px; }
  100% { top:100%; }
}
@keyframes _slide-in {
  from { opacity:0; transform:translateX(16px); }
  to   { opacity:1; transform:translateX(0); }
}
@keyframes _pop {
  0%  { transform:scale(.85); opacity:0; }
  60% { transform:scale(1.04); }
  100%{ transform:scale(1); opacity:1; }
}
@keyframes _shimmer {
  0%   { background-position:-200% 0; }
  100% { background-position:200% 0; }
}
@keyframes _float {
  0%,100%{ transform:translateY(0px) rotate(0deg); }
  50%    { transform:translateY(-5px) rotate(2deg); }
}
@keyframes _glow-text {
  0%,100%{ background-position:0% 50%; }
  50%    { background-position:100% 50%; }
}
@keyframes _shake {
  0%,100%{ transform:translateX(0); }
  20%    { transform:translateX(-5px); }
  40%    { transform:translateX(5px); }
  60%    { transform:translateX(-3px); }
  80%    { transform:translateX(3px); }
}
@keyframes _tile-pop {
  0%  { transform:scale(1); }
  50% { transform:scale(.97); }
  100%{ transform:scale(1); }
}

._aurora-blob { animation: _aurora var(--dur,18s) ease-in-out infinite; }
._slide-in    { animation: _slide-in .3s cubic-bezier(.22,1,.36,1) both; }
._pop         { animation: _pop .35s cubic-bezier(.22,1,.36,1) both; }
._shake       { animation: _shake .4s ease-in-out; }
._float       { animation: _float 4s ease-in-out infinite; }
._tile-pop    { animation: _tile-pop .15s ease-in-out; }

._shimmer-bar {
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.07) 50%, transparent 100%);
  background-size:200% 100%;
  animation: _shimmer 1.4s linear infinite;
}
._glow-text {
  background: linear-gradient(135deg,#a78bfa,#818cf8,#38bdf8,#34d399,#a78bfa);
  background-size:300% 300%;
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  background-clip:text;
  animation: _glow-text 5s ease infinite;
}
._glow-border-connected {
  box-shadow: 0 0 0 1px var(--c,#34d399), 0 0 24px -4px var(--c,#34d399);
}
._status-ring-live::after {
  content:'';
  position:absolute;
  inset:-3px;
  border-radius:inherit;
  border:1.5px solid currentColor;
  animation: _pulse-ring 1.6s ease-out infinite;
  pointer-events:none;
}
._scan-overlay {
  position:absolute;
  inset:0;
  overflow:hidden;
  pointer-events:none;
  z-index:1;
}
._scan-overlay::before {
  content:'';
  position:absolute;
  left:0; right:0;
  height:2px;
  background:linear-gradient(90deg,transparent,rgba(139,92,246,.6),transparent);
  animation: _scan-line 1.6s linear infinite;
}
._scan-overlay::after {
  content:'';
  position:absolute;
  inset:0;
  background:linear-gradient(90deg,transparent 0%,rgba(139,92,246,.04) 50%,transparent 100%);
  background-size:200% 100%;
  animation: _shimmer 1.4s linear infinite;
}
`;

/* ─── Provider data ───────────────────────────────────────── */
const c = (icon: React.ElementType, label: string, color: string): Cap => ({ icon, label, color });

const PROVIDERS: Provider[] = [
  { id:"openai", name:"OpenAI", badge:"Most Popular", recommended:true,
    tagline:"GPT-4o · o1 · o3-mini", description:"The world's most-deployed AI platform. Unmatched tooling, vision, code, and the o-series reasoning models.",
    color:"#10a37f", bg:"#10a37f", field:"openaiApiKey", keyPrefix:"sk-…", docsUrl:"https://platform.openai.com/api-keys",
    models:[{name:"gpt-4o",note:"Vision + Code"},{name:"gpt-4o-mini",note:"Fast & cheap"},{name:"o1",note:"Deep reasoning"},{name:"o3-mini",note:"Fast reasoning"},{name:"gpt-4-turbo",note:"Legacy"}],
    caps:[c(Video,"Vision","#10a37f"),c(Code2,"Code","#3b82f6"),c(Brain,"Reasoning","#8b5cf6"),c(MessageSquare,"Chat","#06b6d4")],
    context:"128K", speed:"fast", free:false },
  { id:"anthropic", name:"Anthropic", tagline:"Claude 3.5 · Opus · Haiku",
    description:"Safety-first lab behind Claude. Beats GPT-4o on most benchmarks with a generous 200K context window.",
    color:"#d97706", bg:"#d97706", field:"anthropicApiKey", keyPrefix:"sk-ant-…", docsUrl:"https://console.anthropic.com/settings/keys",
    models:[{name:"claude-3-5-sonnet",note:"Best overall"},{name:"claude-3-5-haiku",note:"Ultra-fast"},{name:"claude-3-opus",note:"Heavy tasks"},{name:"claude-3-haiku",note:"Lightweight"}],
    caps:[c(Brain,"Reasoning","#d97706"),c(Code2,"Code","#3b82f6"),c(Shield,"Safety","#10b981"),c(MessageSquare,"Chat","#06b6d4")],
    context:"200K", speed:"fast" },
  { id:"gemini", name:"Gemini", badge:"Free Tier", recommended:true,
    tagline:"2.0 Flash · 1.5 Pro · Ultra",
    description:"Google's multimodal powerhouse. Native vision, audio, video understanding with a 1M-token context and a generous free tier.",
    color:"#4285f4", bg:"#4285f4", field:"geminiApiKey", keyPrefix:"AIzaSy…", docsUrl:"https://aistudio.google.com/app/apikey",
    models:[{name:"gemini-2.0-flash",note:"Fastest"},{name:"gemini-1.5-pro",note:"1M context"},{name:"gemini-1.5-flash",note:"Balanced"},{name:"gemini-ultra",note:"Flagship"}],
    caps:[c(Video,"Vision","#4285f4"),c(Brain,"Reasoning","#8b5cf6"),c(Code2,"Code","#3b82f6"),c(MessageSquare,"Chat","#06b6d4")],
    context:"1M", speed:"ultra", free:true },
  { id:"mistral", name:"Mistral AI", tagline:"Large · Codestral · Nemo",
    description:"Europe's open-weight champion. Best price-to-performance ratio, and Codestral is the industry's top code model.",
    color:"#f97316", bg:"#f97316", field:"mistralApiKey", keyPrefix:"(any string)", docsUrl:"https://console.mistral.ai/api-keys",
    models:[{name:"mistral-large",note:"Flagship"},{name:"mistral-small",note:"Efficient"},{name:"codestral",note:"Code specialist"},{name:"mistral-nemo",note:"12B open-weight"}],
    caps:[c(Code2,"Code","#f97316"),c(MessageSquare,"Chat","#06b6d4"),c(Brain,"Reasoning","#8b5cf6")],
    context:"128K", speed:"fast" },
  { id:"groq", name:"Groq", badge:"⚡ 300+ tok/s", tagline:"Llama 3.1 · Mixtral · Ultra-fast",
    description:"Custom LPU hardware pushes Llama and Mixtral to 300+ tokens/sec — 10× faster than GPU-based inference.",
    color:"#7c3aed", bg:"#7c3aed", field:"groqApiKey", keyPrefix:"gsk_…", docsUrl:"https://console.groq.com/keys",
    models:[{name:"llama-3.1-70b",note:"Best open model"},{name:"llama-3.1-8b",note:"Fastest"},{name:"mixtral-8x7b",note:"MoE"},{name:"gemma2-9b",note:"Google open"}],
    caps:[c(Zap,"Ultra-fast","#7c3aed"),c(Code2,"Code","#3b82f6"),c(MessageSquare,"Chat","#06b6d4")],
    context:"32K", speed:"ultra", free:true },
  { id:"perplexity", name:"Perplexity", tagline:"Sonar · Real-time web search",
    description:"Every answer grounded in live web data with inline citations. Best for research, news, and factual queries.",
    color:"#06b6d4", bg:"#06b6d4", field:"perplexityApiKey", keyPrefix:"pplx-…", docsUrl:"https://www.perplexity.ai/settings/api",
    models:[{name:"sonar-large",note:"Web search"},{name:"sonar-small",note:"Fast search"},{name:"sonar-reasoning",note:"Deep research"},{name:"r1-1776",note:"Uncensored"}],
    caps:[c(Search,"Search","#06b6d4"),c(Brain,"Reasoning","#8b5cf6"),c(Globe,"Web","#06b6d4")],
    context:"128K", speed:"standard" },
  { id:"cohere", name:"Cohere", tagline:"Command R+ · Embed · Rerank",
    description:"Enterprise retrieval AI — best-in-class embeddings and reranking for production RAG pipelines at scale.",
    color:"#14b8a6", bg:"#14b8a6", field:"cohereApiKey", keyPrefix:"(any string)", docsUrl:"https://dashboard.cohere.com/api-keys",
    models:[{name:"command-r+",note:"RAG flagship"},{name:"command-r",note:"Efficient"},{name:"embed-v3",note:"Embeddings"},{name:"rerank-v3.5",note:"Reranking"}],
    caps:[c(Database,"RAG","#14b8a6"),c(Brain,"Reasoning","#8b5cf6"),c(MessageSquare,"Chat","#06b6d4")],
    context:"128K", speed:"standard" },
  { id:"openrouter", name:"OpenRouter", badge:"100+ models", tagline:"One API · Every provider",
    description:"Unified gateway — swap between OpenAI, Claude, Gemini, and 100+ others without changing a single line of code.",
    color:"#6366f1", bg:"#6366f1", field:"openrouterApiKey", keyPrefix:"sk-or-…", docsUrl:"https://openrouter.ai/keys",
    models:[{name:"openai/gpt-4o"},{name:"anthropic/claude-3.5-sonnet"},{name:"meta/llama-3.1-70b"},{name:"deepseek/deepseek-r1"}],
    caps:[c(Layers,"Multi-model","#6366f1"),c(Code2,"Code","#3b82f6"),c(Video,"Vision","#4285f4")],
    context:"Varies", speed:"fast" },
  { id:"together", name:"Together AI", tagline:"Llama · DeepSeek · Qwen at scale",
    description:"Open-source frontier models at competitive pricing. Run DeepSeek R1, Llama 3.1, and Qwen 2.5 without restrictions.",
    color:"#10b981", bg:"#10b981", field:"togetherApiKey", keyPrefix:"(any string)", docsUrl:"https://api.together.ai/settings/api-keys",
    models:[{name:"llama-3.1-70b",note:"Meta flagship"},{name:"deepseek-r1",note:"Reasoning"},{name:"qwen2.5-72b",note:"Alibaba"},{name:"mistral-7b",note:"Efficient"}],
    caps:[c(Code2,"Code","#10b981"),c(Brain,"Reasoning","#8b5cf6"),c(MessageSquare,"Chat","#06b6d4")],
    context:"128K", speed:"fast" },
];

const SPEED_MAP = { ultra:"⚡ Ultra", fast:"Fast", standard:"Std" } as const;
const SPEED_COLOR = { ultra:"#a78bfa", fast:"#34d399", standard:"#94a3b8" } as const;

/* ─── Subcomponents ───────────────────────────────────────── */
function ProviderTile({ p, status, selected, onClick }: {
  p: Provider; status: ProviderStatus | undefined;
  selected: boolean; onClick: () => void;
}) {
  const live = status?.connected ?? false;
  return (
    <button onClick={onClick}
      className={cn(
        "group relative w-full text-left rounded-xl border transition-all duration-200 overflow-hidden p-3",
        selected
          ? "border-white/20 bg-white/[0.07]"
          : "border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
      )}
      style={selected ? { boxShadow: `0 0 0 1.5px ${p.color}60, 0 4px 20px ${p.color}18` } : {}}>

      {/* Active indicator strip */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl transition-all duration-200"
        style={{ backgroundColor: selected ? p.color : live ? p.color + "80" : "transparent" }} />

      <div className="flex items-center gap-2.5 pl-1">
        {/* Icon */}
        <div className="relative size-8 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-200"
          style={{ backgroundColor: p.color + (selected ? "25" : "15"), borderColor: p.color + (selected ? "50" : "25") }}>
          <Bot className="size-3.5 transition-all" style={{ color: p.color }} />
          {live && (
            <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full border border-[#050508]"
              style={{ backgroundColor: "#34d399" }} />
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={cn("text-[12px] font-semibold leading-none transition-colors",
              selected ? "text-white" : "text-white/70 group-hover:text-white/90")}>
              {p.name}
            </span>
            {p.free && (
              <span className="text-[8px] font-bold px-1 py-px rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/25">FREE</span>
            )}
          </div>
          <p className="text-[10px] text-white/30 truncate mt-0.5 leading-none">{p.tagline}</p>
        </div>

        {/* Status */}
        <div className="shrink-0">
          {live ? (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">Live</span>
          ) : (
            <ChevronRight className={cn("size-3 transition-all", selected ? "text-white/50" : "text-white/15 group-hover:text-white/30")} />
          )}
        </div>
      </div>
    </button>
  );
}

function OllamaTile({ status, selected, onClick }: {
  status: ProviderStatus | undefined; selected: boolean; onClick: () => void;
}) {
  const live = status?.connected ?? false;
  return (
    <button onClick={onClick}
      className={cn("group relative w-full text-left rounded-xl border transition-all duration-200 overflow-hidden p-3",
        selected ? "border-fuchsia-500/30 bg-fuchsia-500/[0.08]" : "border-white/[0.06] bg-white/[0.02] hover:border-fuchsia-500/20 hover:bg-fuchsia-500/[0.04]"
      )}
      style={selected ? { boxShadow: "0 0 0 1.5px rgba(232,121,249,0.35), 0 4px 24px rgba(232,121,249,0.12)" } : {}}>
      <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl" style={{ backgroundColor: selected ? "#e879f9" : live ? "#e879f980" : "transparent" }} />
      <div className="flex items-center gap-2.5 pl-1">
        <div className="relative size-8 rounded-lg flex items-center justify-center shrink-0 border"
          style={{ backgroundColor: selected ? "#e879f925" : "#e879f915", borderColor: selected ? "#e879f950" : "#e879f925" }}>
          <Cpu className={cn("size-3.5 _float")} style={{ color: "#e879f9" }} />
          {live && <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full border border-[#050508] bg-emerald-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={cn("text-[12px] font-semibold leading-none", selected ? "text-white" : "text-white/70 group-hover:text-white/90")}>Ollama</span>
            <span className="text-[8px] font-bold px-1 py-px rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/25">GPU</span>
          </div>
          <p className="text-[10px] text-white/30 truncate mt-0.5 leading-none">Local · No API key needed</p>
        </div>
        <div className="shrink-0">
          {live ? <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">Live</span>
            : <ChevronRight className={cn("size-3", selected ? "text-white/50" : "text-white/15 group-hover:text-white/30")} />}
        </div>
      </div>
    </button>
  );
}

/* ─── Right panel: Cloud provider detail ──────────────────── */
function CloudDetail({ p, status, onSave, onTest, onRemove }: {
  p: Provider; status: ProviderStatus | undefined;
  onSave: (field: string, key: string) => Promise<void>;
  onTest: (id: string, key?: string) => Promise<{ success: boolean; message: string }>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [shake, setShake] = useState(false);
  const [lastTested, setLastTested] = useState<Date | null>(null);
  const { toast } = useToast();
  const live = status?.connected ?? false;

  const doSave = async () => {
    if (!key.trim()) return;
    setSaving(true);
    try { await onSave(p.field, key.trim()); setKey(""); setResult(null); toast({ title: `${p.name} connected` }); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };
  const doTest = async () => {
    setTesting(true); setResult(null);
    try {
      const r = await onTest(p.id, key.trim() || undefined);
      setResult(r); setLastTested(new Date());
      if (!r.success) { setShake(true); setTimeout(() => setShake(false), 500); }
    } catch (e: any) { setResult({ success: false, message: e.message }); }
    finally { setTesting(false); }
  };
  const doRemove = async () => {
    setRemoving(true);
    try { await onRemove(p.id); setResult(null); toast({ title: `${p.name} disconnected` }); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setRemoving(false); }
  };

  return (
    <div className={cn("relative h-full flex flex-col _slide-in overflow-hidden", shake && "_shake")}>
      {testing && <div className="_scan-overlay" />}

      {/* Header strip */}
      <div className="relative z-10 shrink-0 p-6 pb-5"
        style={{ background: `linear-gradient(135deg, ${p.color}18 0%, ${p.color}06 60%, transparent 100%)` }}>

        {/* Floating orb behind icon */}
        <div className="absolute top-4 right-6 size-24 rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: p.color + "18" }} />

        <div className="flex items-start gap-4 relative z-10">
          {/* Big icon */}
          <div className="relative size-14 rounded-2xl flex items-center justify-center shrink-0 border-2"
            style={{ backgroundColor: p.color + "20", borderColor: p.color + "40",
              boxShadow: live ? `0 0 24px ${p.color}40` : "none" }}>
            <Bot className="size-7" style={{ color: p.color }} />
            {live && (
              <>
                <span className="absolute inset-0 rounded-2xl _status-ring-live" style={{ color: p.color }} />
                <span className="absolute -top-1 -right-1 size-3.5 rounded-full border-2 border-[#080810] bg-emerald-400" />
              </>
            )}
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[20px] font-black text-white leading-none">{p.name}</h2>
              {p.badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: p.color + "25", color: p.color, border: `1px solid ${p.color}40` }}>
                  {p.badge}
                </span>
              )}
              {p.recommended && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  <Star className="size-2.5" fill="currentColor" /> Recommended
                </span>
              )}
            </div>
            <p className="text-[12px] text-white/40 mt-1">{p.tagline}</p>

            {/* Stats row */}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] text-white/30 flex items-center gap-1">
                <Layers className="size-2.5" />{p.context} ctx
              </span>
              <span className="text-[10px]" style={{ color: SPEED_COLOR[p.speed] }}>{SPEED_MAP[p.speed]}</span>
              {p.free && <span className="text-[10px] text-emerald-400">Free tier ✓</span>}
              <a href={p.docsUrl} target="_blank" rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 text-[10px] text-white/20 hover:text-indigo-400 transition-colors">
                <ExternalLink className="size-2.5" />Get API key
              </a>
            </div>
          </div>
        </div>

        <p className="text-[12px] text-white/45 leading-relaxed mt-4">{p.description}</p>

        {/* Capability pills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {p.caps.map(cap => {
            const Icon = cap.icon;
            return (
              <span key={cap.label} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border"
                style={{ backgroundColor: cap.color + "15", borderColor: cap.color + "35", color: cap.color }}>
                <Icon className="size-2.5" />{cap.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px shrink-0" style={{ background: `linear-gradient(90deg, ${p.color}30, transparent)` }} />

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Models grid */}
        <div>
          <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">Available Models</p>
          <div className="flex flex-wrap gap-1.5">
            {p.models.map(m => (
              <span key={m.name}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono border bg-white/[0.03] border-white/[0.07] text-white/50 hover:border-white/15 hover:text-white/70 transition-colors cursor-default">
                <span className="size-1 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                {m.name}
                {m.note && <span className="text-white/20">· {m.note}</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Connected key status */}
        {live && (
          <div className="_pop rounded-xl border p-3 flex items-center gap-3"
            style={{ backgroundColor: "#34d39910", borderColor: "#34d39928" }}>
            <div className="relative size-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#34d39920" }}>
              <CheckCircle2 className="size-4 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-emerald-400">API Key Active</p>
              <p className="text-[10px] font-mono text-white/30 mt-0.5">{status?.masked}</p>
            </div>
            {lastTested && (
              <span className="shrink-0 flex items-center gap-1 text-[9px] text-white/20">
                <Clock className="size-2.5" />{lastTested.toLocaleTimeString()}
              </span>
            )}
          </div>
        )}

        {/* Key input */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-white/25 uppercase tracking-widest">
            {live ? "Update API Key" : "API Key"}
          </label>
          <div className="relative">
            <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-white/15 pointer-events-none" />
            <input
              type={showKey ? "text" : "password"}
              value={key} onChange={e => setKey(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") doSave(); if (e.key === "Escape") setKey(""); }}
              placeholder={p.keyPrefix}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl text-[12px] font-mono text-white/80 placeholder:text-white/12 outline-none transition-all"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)" }}
              onFocus={e => e.currentTarget.style.borderColor = p.color + "60"}
              onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
            />
            <button type="button" onClick={() => setShowKey(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors">
              {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
          <p className="text-[9px] text-white/12">Encrypted server-side · Enter ↵ to save · never stored in browser</p>
        </div>

        {/* Test result */}
        {result && (
          <div className={cn("_pop rounded-xl border px-4 py-3 flex items-start gap-2.5 text-[11px]",
            result.success ? "bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-400"
              : "bg-red-500/[0.08] border-red-500/20 text-red-400")}>
            {result.success ? <CheckCircle2 className="size-4 shrink-0 mt-px" /> : <XCircle className="size-4 shrink-0 mt-px" />}
            <span>{result.message}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          <button onClick={doTest} disabled={testing || (!key.trim() && !live)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-semibold border transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" }}>
            {testing ? <Loader2 className="size-3.5 animate-spin" /> : <FlaskConical className="size-3.5" style={{ color: p.color }} />}
            {testing ? "Testing…" : "Test connection"}
          </button>

          <button onClick={doSave} disabled={saving || !key.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-[11px] font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}cc)`, boxShadow: `0 2px 16px ${p.color}50` }}>
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <PlugZap className="size-3.5" />}
            {live ? "Update key" : "Connect"}
          </button>

          {live && (
            <button onClick={doRemove} disabled={removing}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] text-red-400/50 hover:text-red-400 hover:bg-red-500/[0.08] border border-transparent hover:border-red-500/15 transition-all">
              {removing ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              Disconnect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Right panel: Ollama detail ──────────────────────────── */
function OllamaDetail({ status, ollamaUrl, onSave, onRemove }: {
  status: ProviderStatus | undefined; ollamaUrl: string | null;
  onSave: (field: string, v: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [result, setResult] = useState<OllamaTestResult | null>(null);
  const [shake, setShake] = useState(false);
  const { toast } = useToast();
  const live = status?.connected ?? false;
  const FC = "#e879f9";

  const doSave = async () => {
    if (!url.trim()) return;
    setSaving(true);
    try { await onSave("ollamaBaseUrl", url.trim()); setUrl(""); setResult(null); toast({ title: "Ollama connected" }); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };
  const doTest = async () => {
    setTesting(true); setResult(null);
    const target = url.trim() || ollamaUrl || "";
    if (!target) { setTesting(false); return; }
    try {
      const r = await apiCall("/ai/test", { method: "POST", body: JSON.stringify({ provider: "ollama", baseUrl: target }) }) as OllamaTestResult;
      setResult(r);
      if (!r.success) { setShake(true); setTimeout(() => setShake(false), 500); }
    } catch (e: any) { setResult({ success: false, message: e.message }); }
    finally { setTesting(false); }
  };
  const doRemove = async () => {
    setRemoving(true);
    try { await onRemove("ollama"); setResult(null); toast({ title: "Ollama disconnected" }); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setRemoving(false); }
  };

  return (
    <div className={cn("relative h-full flex flex-col _slide-in overflow-hidden", shake && "_shake")}>
      {testing && <div className="_scan-overlay" />}

      {/* Header */}
      <div className="relative z-10 shrink-0 p-6 pb-5"
        style={{ background: `linear-gradient(135deg, ${FC}18, ${FC}06 60%, transparent)` }}>
        <div className="absolute top-4 right-6 size-28 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: FC + "15" }} />
        <div className="absolute top-16 right-20 size-16 rounded-full blur-2xl pointer-events-none" style={{ backgroundColor: "#7c3aed18" }} />

        <div className="flex items-start gap-4 relative z-10">
          <div className="relative size-14 rounded-2xl flex items-center justify-center shrink-0 border-2"
            style={{ backgroundColor: FC + "20", borderColor: FC + "40", boxShadow: live ? `0 0 24px ${FC}40` : "none" }}>
            <Cpu className="size-7 _float" style={{ color: FC }} />
            {live && (
              <>
                <span className="absolute inset-0 rounded-2xl _status-ring-live" style={{ color: FC }} />
                <span className="absolute -top-1 -right-1 size-3.5 rounded-full border-2 border-[#080810] bg-emerald-400" />
              </>
            )}
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[20px] font-black text-white leading-none">Ollama</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">GPU Local</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25">CF Tunnel</span>
            </div>
            <p className="text-[12px] text-white/40 mt-1">Self-hosted · No API costs · Any model</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[10px] text-emerald-400">Free ✓</span>
              <span className="text-[10px]" style={{ color: "#a78bfa" }}>⚡ Ultra-fast</span>
              <span className="text-[10px] text-white/30">Unlimited ∞</span>
            </div>
          </div>
        </div>
        <p className="text-[12px] text-white/45 leading-relaxed mt-4">
          Run any model locally on your GPU via Ollama — llama3, deepseek, qwen, phi, gemma and more.
          Connect directly at <span className="font-mono text-white/60">localhost:11434</span> or expose remotely using a Cloudflare tunnel.
        </p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {[
            { icon: Cpu, label: "GPU Accelerated", color: FC },
            { icon: Server, label: "Self-hosted", color: "#818cf8" },
            { icon: Layers, label: "Any model", color: "#94a3b8" },
            { icon: Shield, label: "Private", color: "#34d399" },
          ].map(cap => (
            <span key={cap.label} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border"
              style={{ backgroundColor: cap.color + "15", borderColor: cap.color + "35", color: cap.color }}>
              <cap.icon className="size-2.5" />{cap.label}
            </span>
          ))}
        </div>
      </div>

      <div className="h-px shrink-0" style={{ background: `linear-gradient(90deg, ${FC}30, transparent)` }} />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Popular models */}
        <div>
          <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">Popular models to pull</p>
          <div className="flex flex-wrap gap-1.5">
            {["llama3.2","deepseek-r1","qwen2.5","gemma3","phi4","mistral","codellama","llava","nomic-embed-text"].map(m => (
              <span key={m} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono border bg-white/[0.03] border-white/[0.07] text-white/45 hover:border-fuchsia-500/30 hover:text-fuchsia-300 transition-colors cursor-default">
                <span className="size-1 rounded-full shrink-0" style={{ backgroundColor: FC }} />{m}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono border bg-fuchsia-500/10 border-fuchsia-500/25 text-fuchsia-400">+ any model</span>
          </div>
          <p className="text-[9px] text-white/20 mt-2 font-mono">Run: <span className="text-white/40">ollama pull llama3.2</span></p>
        </div>

        {live && ollamaUrl && (
          <div className="_pop rounded-xl border p-3 flex items-center gap-3"
            style={{ backgroundColor: "#34d39910", borderColor: "#34d39928" }}>
            <div className="size-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#34d39920" }}>
              <Globe className="size-4 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-emerald-400">Instance connected</p>
              <p className="text-[10px] font-mono text-white/30 truncate mt-0.5">{ollamaUrl}</p>
            </div>
          </div>
        )}

        {/* URL input */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-white/25 uppercase tracking-widest">
            {live ? "Update Base URL" : "Base URL"}
          </label>
          <div className="relative">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-white/15 pointer-events-none" />
            <input type="url" value={url} onChange={e => setUrl(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") doSave(); }}
              placeholder="https://your-gpu.trycloudflare.com"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl text-[12px] font-mono text-white/80 placeholder:text-white/12 outline-none transition-all"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)" }}
              onFocus={e => e.currentTarget.style.borderColor = FC + "60"}
              onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
            />
          </div>
          <div className="flex gap-3 text-[9px] text-white/20">
            <span>Local: <span className="font-mono text-white/35">http://localhost:11434</span></span>
            <span>Remote: <span className="font-mono text-white/35">https://xyz.trycloudflare.com</span></span>
          </div>
        </div>

        {/* Ollama test result */}
        {result && (
          <div className={cn("_pop rounded-xl border overflow-hidden", result.success ? "border-emerald-500/15" : "border-red-500/15")}>
            <div className={cn("flex items-center gap-2.5 px-4 py-3", result.success ? "bg-emerald-500/[0.08]" : "bg-red-500/[0.08]")}>
              {result.success ? <CheckCircle2 className="size-4 text-emerald-400 shrink-0" /> : <XCircle className="size-4 text-red-400 shrink-0" />}
              <span className={cn("text-[11px] font-semibold flex-1", result.success ? "text-emerald-400" : "text-red-400")}>{result.message}</span>
              {result.ping !== undefined && (
                <span className="shrink-0 text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full border"
                  style={{
                    color: result.ping < 100 ? "#34d399" : result.ping < 500 ? "#fbbf24" : "#f87171",
                    borderColor: (result.ping < 100 ? "#34d399" : result.ping < 500 ? "#fbbf24" : "#f87171") + "40",
                    backgroundColor: (result.ping < 100 ? "#34d399" : result.ping < 500 ? "#fbbf24" : "#f87171") + "12",
                  }}>
                  <Gauge className="size-2.5" />{result.ping}ms
                </span>
              )}
            </div>

            {result.success && result.models !== undefined && (
              <div className="bg-black/40">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <Terminal className="size-3 text-white/20" />
                    <span className="text-[9px] font-bold text-white/25 uppercase tracking-widest">Detected Models</span>
                  </div>
                  <span className="text-[9px] text-white/20">{result.models.length} pulled</span>
                </div>
                {result.models.length === 0 ? (
                  <div className="px-4 py-4 text-center">
                    <span className="text-[11px] text-white/30">No models found — run </span>
                    <span className="font-mono text-[11px] text-white/50 bg-white/[0.06] px-2 py-0.5 rounded">ollama pull llama3.2</span>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.03] max-h-52 overflow-y-auto">
                    {result.models.map((m, i) => (
                      <div key={m.name} className="_pop flex items-center gap-3 px-4 py-2 hover:bg-white/[0.02] transition-colors"
                        style={{ animationDelay: `${i * 25}ms` }}>
                        <Activity className="size-3 shrink-0" style={{ color: FC + "70" }} />
                        <span className="flex-1 text-[11px] font-mono text-white/60 truncate">{m.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          {m.quantization && <span className="text-[8px] font-mono bg-white/[0.05] px-1.5 py-px rounded text-white/30">{m.quantization}</span>}
                          {m.parameterSize && <span className="text-[10px] text-white/30">{m.parameterSize}</span>}
                          {m.size && m.size !== "unknown" && (
                            <span className="text-[9px] text-white/25 flex items-center gap-1"><HardDrive className="size-2.5" />{m.size}</span>
                          )}
                          {m.family && m.family !== "unknown" && (
                            <span className="text-[8px] font-mono px-1.5 py-px rounded border"
                              style={{ backgroundColor: FC + "10", color: FC + "a0", borderColor: FC + "20" }}>
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
        <div className="flex items-center gap-2.5 pt-1">
          <button onClick={doTest} disabled={testing || (!url.trim() && !live)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-semibold border transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" }}>
            {testing ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5" style={{ color: FC }} />}
            {testing ? "Detecting…" : "Test & detect models"}
          </button>
          <button onClick={doSave} disabled={saving || !url.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-[11px] font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: `linear-gradient(135deg, ${FC}, #7c3aedcc)`, boxShadow: `0 2px 16px ${FC}40` }}>
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Globe className="size-3.5" />}
            {live ? "Update URL" : "Connect Ollama"}
          </button>
          {live && (
            <button onClick={doRemove} disabled={removing}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] text-red-400/50 hover:text-red-400 hover:bg-red-500/[0.08] border border-transparent hover:border-red-500/15 transition-all">
              {removing ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              Disconnect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Empty state ─────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="relative">
        <div className="size-16 rounded-2xl border border-white/[0.07] bg-white/[0.03] flex items-center justify-center">
          <Sparkles className="size-7 text-white/15" />
        </div>
        <div className="absolute inset-0 rounded-2xl blur-xl bg-indigo-500/10 -z-10" />
      </div>
      <div>
        <p className="text-[14px] font-semibold text-white/40">Select a provider</p>
        <p className="text-[11px] text-white/20 mt-1">Choose from the list to connect your API keys</p>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-white/15">
        <ArrowRight className="size-3" />
        <span>10 providers available — 1 local GPU, 9 cloud</span>
      </div>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────── */
export default function AISettingsPage() {
  const [aiKeys, setAiKeys] = useState<AiKeys>({});
  const [ollamaUrl, setOllamaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const fetch = useCallback(async () => {
    try {
      const d = await apiCall("/settings") as any;
      setAiKeys(d.aiKeys || {});
      setOllamaUrl(d.ollamaBaseUrl || null);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const connectedCount = Object.values(aiKeys).filter(v => v.connected).length
    + (aiKeys["ollamaBaseUrl"]?.connected ? 1 : 0);

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
    await fetch();
  };

  const filteredProviders = PROVIDERS.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.tagline.toLowerCase().includes(search.toLowerCase())
  );

  const selectedProvider = selected === "ollama" ? null : PROVIDERS.find(p => p.id === selected);
  const showOllama = !search || "ollama".includes(search.toLowerCase()) || "gpu local".includes(search.toLowerCase());

  return (
    <AppLayout>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="relative flex flex-col h-full overflow-hidden" style={{ background: "#060610" }}>

        {/* Aurora background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="_aurora-blob absolute -top-32 -left-32 size-96 rounded-full blur-[120px] opacity-20"
            style={{ backgroundColor: "#6366f1", "--dur": "20s" } as any} />
          <div className="_aurora-blob absolute -bottom-20 right-0 size-80 rounded-full blur-[100px] opacity-15"
            style={{ backgroundColor: "#8b5cf6", "--dur": "25s" } as any} />
          <div className="_aurora-blob absolute top-1/2 left-1/3 size-64 rounded-full blur-[80px] opacity-10"
            style={{ backgroundColor: "#06b6d4", "--dur": "30s" } as any} />
        </div>

        {/* Header */}
        <header className="relative z-10 shrink-0 flex items-center gap-4 px-5 h-14 border-b border-white/[0.06]"
          style={{ backdropFilter: "blur(16px)", backgroundColor: "rgba(6,6,16,0.7)" }}>
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg flex items-center justify-center border border-indigo-500/20 bg-indigo-500/10">
              <Bot className="size-3.5 text-indigo-400" />
            </div>
            <h1 className="font-black text-[15px] _glow-text">AI Models</h1>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <div className="size-1.5 rounded-full bg-emerald-400" style={{ animation: connectedCount > 0 ? "_pulse-ring 2s ease-out infinite" : "none", backgroundColor: connectedCount > 0 ? "#34d399" : "#374151" }} />
            <span className="text-[11px] text-white/40 font-medium">{connectedCount} / 10 connected</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-white/20 pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search providers…"
                className="pl-7 pr-3 py-1.5 rounded-lg text-[11px] text-white/70 placeholder:text-white/20 outline-none w-40"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
            </div>
            <button onClick={() => fetch()} className="p-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.07] text-white/30 hover:text-white/60 transition-colors">
              <RefreshCw className="size-3.5" />
            </button>
          </div>
        </header>

        {/* 2-column split */}
        <div className="relative z-10 flex flex-1 min-h-0">

          {/* Left: provider list */}
          <aside className="w-64 shrink-0 border-r border-white/[0.06] flex flex-col overflow-hidden"
            style={{ backgroundColor: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)" }}>
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {loading ? (
                <div className="flex flex-col gap-2 pt-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-14 rounded-xl _shimmer-bar" style={{ animationDelay: `${i * 100}ms` }} />
                  ))}
                </div>
              ) : (
                <>
                  {/* Local section */}
                  {showOllama && (
                    <div>
                      <p className="text-[8.5px] font-black text-white/20 uppercase tracking-[.15em] px-1 mb-1.5">Local / GPU</p>
                      <OllamaTile status={aiKeys["ollamaBaseUrl"]} selected={selected === "ollama"} onClick={() => setSelected("ollama")} />
                    </div>
                  )}

                  {/* Cloud section */}
                  {filteredProviders.length > 0 && (
                    <div>
                      <p className="text-[8.5px] font-black text-white/20 uppercase tracking-[.15em] px-1 mb-1.5">Cloud Providers</p>
                      <div className="space-y-1">
                        {filteredProviders.map(p => (
                          <ProviderTile key={p.id} p={p} status={aiKeys[p.field]}
                            selected={selected === p.id} onClick={() => setSelected(p.id)} />
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredProviders.length === 0 && !showOllama && (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                      <WifiOff className="size-7 text-white/10" />
                      <span className="text-[11px] text-white/25">No results</span>
                      <button onClick={() => setSearch("")} className="text-[10px] text-indigo-400 hover:text-indigo-300">Clear</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>

          {/* Right: detail panel */}
          <main className="flex-1 min-w-0 overflow-hidden relative">
            {/* Provider color tint overlay */}
            {selected && selected !== "ollama" && selectedProvider && (
              <div className="absolute inset-0 pointer-events-none transition-all duration-500"
                style={{ background: `radial-gradient(ellipse at top right, ${selectedProvider.color}08, transparent 60%)` }} />
            )}
            {selected === "ollama" && (
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at top right, #e879f908, transparent 60%)" }} />
            )}

            {!selected && <EmptyState />}
            {selected === "ollama" && (
              <OllamaDetail status={aiKeys["ollamaBaseUrl"]} ollamaUrl={ollamaUrl} onSave={handleSave} onRemove={handleRemove} />
            )}
            {selected && selected !== "ollama" && selectedProvider && (
              <CloudDetail key={selected} p={selectedProvider} status={aiKeys[selectedProvider.field]}
                onSave={handleSave} onTest={handleTest} onRemove={handleRemove} />
            )}
          </main>
        </div>
      </div>
    </AppLayout>
  );
}
