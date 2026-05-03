import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { apiCall } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Eye, EyeOff, CheckCircle2, XCircle, Loader2, Trash2,
  Zap, ExternalLink, Globe, Clock, Cpu, HardDrive, Key,
  Search, RefreshCw, Sparkles, Shield, Brain, Code2,
  Video, MessageSquare, Activity, Terminal, Gauge, Layers,
  Star, PlugZap, FlaskConical, Database, Server,
} from "lucide-react";

/* ─── Real brand logo images from Simple Icons CDN ─────────── */
const LOGO: Record<string, string> = {
  openai:     "https://cdn.simpleicons.org/openai/10a37f",
  anthropic:  "https://cdn.simpleicons.org/anthropic/d97706",
  gemini:     "https://cdn.simpleicons.org/googlegemini/4285f4",
  mistral:    "https://cdn.simpleicons.org/mistralai/f97316",
  groq:       "https://cdn.simpleicons.org/groq/7c3aed",
  perplexity: "https://cdn.simpleicons.org/perplexity/06b6d4",
  cohere:     "https://cdn.simpleicons.org/cohere/14b8a6",
  openrouter: "https://cdn.simpleicons.org/openrouter/6366f1",
  together:   "https://cdn.simpleicons.org/togetherai/10b981",
  ollama:     "https://cdn.simpleicons.org/ollama/e879f9",
};

function ProviderLogo({ id, size = 30, color }: { id: string; size?: number; color: string }) {
  const [err, setErr] = useState(false);
  if (!err && LOGO[id]) {
    return (
      <img
        src={LOGO[id]} alt={id} width={size} height={size}
        className="object-contain select-none"
        onError={() => setErr(true)}
        draggable={false}
      />
    );
  }
  /* fallback letter mark */
  return (
    <span style={{ fontSize: size * .5, fontWeight: 900, color, lineHeight: 1 }}>
      {id[0].toUpperCase()}
    </span>
  );
}

/* ─── Types ─────────────────────────────────────────────────── */
type ProviderStatus = { connected: boolean; masked: string | null };
type AiKeys = Record<string, ProviderStatus>;
interface Cap { icon: React.ElementType; label: string; color: string }
interface Provider {
  id: string; name: string; short: string; tagline: string; description: string;
  color: string; models: { name: string; note?: string }[];
  docsUrl: string; keyPrefix: string; field: string;
  caps: Cap[]; context: string; speed: "ultra" | "fast" | "standard";
  free?: boolean; badge?: string; recommended?: boolean;
}
interface OllamaModel { name: string; size: string; family: string; parameterSize: string; quantization: string; }
interface OllamaTestResult { success: boolean; message: string; ping?: number; models?: OllamaModel[]; }

/* ─── CSS ────────────────────────────────────────────────────── */
const CSS = `
@keyframes _aurI { 0%,100%{transform:translate(0,0)scale(1);opacity:.12} 50%{transform:translate(50px,-35px)scale(1.18);opacity:.18} }
@keyframes _pulseR { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.3);opacity:0} }
@keyframes _slideUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
@keyframes _pop { 0%{transform:scale(.87);opacity:0} 60%{transform:scale(1.03)} 100%{transform:scale(1);opacity:1} }
@keyframes _glowTxt { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
@keyframes _scanY { 0%{top:0} 100%{top:100%} }
@keyframes _shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
@keyframes _floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
@keyframes _shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }
@keyframes _logoSpin { 0%{transform:scale(.85) rotate(-8deg);opacity:0} 100%{transform:scale(1) rotate(0deg);opacity:1} }

._aurI   { animation: _aurI var(--dur,22s) ease-in-out infinite; }
._slideUp{ animation: _slideUp .35s cubic-bezier(.22,1,.36,1) both; }
._pop    { animation: _pop .3s cubic-bezier(.22,1,.36,1) both; }
._shake  { animation: _shake .4s ease-in-out; }
._floatY { animation: _floatY 3.8s ease-in-out infinite; }
._logoIn { animation: _logoSpin .4s cubic-bezier(.22,1,.36,1) both; }

._glowTxt {
  background: linear-gradient(135deg,#c4b5fd,#818cf8,#38bdf8,#34d399,#c4b5fd);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: _glowTxt 5s ease infinite;
}
._scanning { position:relative; overflow:hidden; }
._scanning::before {
  content:''; position:absolute; left:0; right:0; height:2px;
  background: linear-gradient(90deg,transparent,rgba(139,92,246,.8),transparent);
  animation: _scanY 1.4s linear infinite; z-index:10;
}
._shimmerBg {
  background: linear-gradient(90deg,transparent 0%,rgba(255,255,255,.055) 50%,transparent 100%);
  background-size: 200% 100%;
  animation: _shimmer 1.5s linear infinite;
}

/* Glass card */
._glass {
  background: rgba(255,255,255,0.033);
  border: 1px solid rgba(255,255,255,0.075);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
._glass:hover {
  background: rgba(255,255,255,0.048);
  border-color: rgba(255,255,255,0.12);
}
._card-selected {
  background: rgba(255,255,255,0.055) !important;
}

/* Logo icon box */
._iconBox {
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
  display: flex; align-items:center; justify-content:center;
  border-radius: 14px;
  position: relative;
  overflow: hidden;
}
._iconBox::before {
  content:'';
  position:absolute; top:0; left:0; right:0; height:50%;
  background: linear-gradient(to bottom, rgba(255,255,255,.07), transparent);
  border-radius: 14px 14px 0 0;
  pointer-events: none;
}

/* Live badge pulse */
._liveDot::after {
  content:'';
  position:absolute; inset:-2px;
  border-radius: 50%;
  border: 1.5px solid #34d399;
  animation: _pulseR 2s ease-out infinite;
}
`;

/* ─── Provider data ─────────────────────────────────────────── */
const c = (icon: React.ElementType, label: string, color: string): Cap => ({ icon, label, color });

const PROVIDERS: Provider[] = [
  { id:"openai", name:"OpenAI", short:"GPT-4o · o1 · o3", badge:"Most Popular", recommended:true,
    tagline:"GPT-4o · o1 · o3-mini",
    description:"The world's most-deployed AI. Powers ChatGPT with GPT-4o for vision & code, plus the o-series deep reasoning models.",
    color:"#10a37f", field:"openaiApiKey", keyPrefix:"sk-…", docsUrl:"https://platform.openai.com/api-keys",
    models:[{name:"gpt-4o",note:"Vision+Code"},{name:"gpt-4o-mini",note:"Fast"},{name:"o1",note:"Deep reasoning"},{name:"o3-mini",note:"Fast reasoning"},{name:"gpt-4-turbo"}],
    caps:[c(Video,"Vision","#10a37f"),c(Code2,"Code","#3b82f6"),c(Brain,"Reasoning","#8b5cf6"),c(MessageSquare,"Chat","#06b6d4")],
    context:"128K", speed:"fast" },

  { id:"anthropic", name:"Anthropic", short:"Claude 3.5",
    tagline:"Claude 3.5 Sonnet · Opus · Haiku",
    description:"Safety-first lab. Claude 3.5 Sonnet tops most benchmarks — 200K context and nuanced long-form reasoning.",
    color:"#d97706", field:"anthropicApiKey", keyPrefix:"sk-ant-…", docsUrl:"https://console.anthropic.com/settings/keys",
    models:[{name:"claude-3-5-sonnet",note:"Best overall"},{name:"claude-3-5-haiku",note:"Ultra-fast"},{name:"claude-3-opus",note:"Heavy tasks"},{name:"claude-3-haiku"}],
    caps:[c(Brain,"Reasoning","#d97706"),c(Shield,"Safety","#10b981"),c(Code2,"Code","#3b82f6"),c(MessageSquare,"Chat","#06b6d4")],
    context:"200K", speed:"fast" },

  { id:"gemini", name:"Gemini", short:"2.0 Flash · 1.5 Pro", badge:"Free Tier", recommended:true,
    tagline:"Gemini 2.0 Flash · 1.5 Pro · Ultra",
    description:"Google's multimodal AI with 1M-token context. Native vision, audio & video understanding, plus a generous free tier.",
    color:"#4285f4", field:"geminiApiKey", keyPrefix:"AIzaSy…", docsUrl:"https://aistudio.google.com/app/apikey",
    models:[{name:"gemini-2.0-flash",note:"Fastest"},{name:"gemini-1.5-pro",note:"1M ctx"},{name:"gemini-1.5-flash",note:"Balanced"},{name:"gemini-ultra",note:"Flagship"}],
    caps:[c(Video,"Vision","#4285f4"),c(Brain,"Reasoning","#8b5cf6"),c(Code2,"Code","#3b82f6"),c(Zap,"Ultra","#fbbf24")],
    context:"1M", speed:"ultra", free:true },

  { id:"mistral", name:"Mistral AI", short:"Large · Codestral",
    tagline:"Mistral Large · Codestral · Nemo",
    description:"European open-weight champion. Best price-to-performance ratio. Codestral is the industry's #1 code model.",
    color:"#f97316", field:"mistralApiKey", keyPrefix:"(any string)", docsUrl:"https://console.mistral.ai/api-keys",
    models:[{name:"mistral-large",note:"Flagship"},{name:"mistral-small",note:"Efficient"},{name:"codestral",note:"Code #1"},{name:"mistral-nemo",note:"12B open"}],
    caps:[c(Code2,"Code","#f97316"),c(Brain,"Reasoning","#8b5cf6"),c(MessageSquare,"Chat","#06b6d4")],
    context:"128K", speed:"fast" },

  { id:"groq", name:"Groq", short:"Llama · 300+ tok/s", badge:"⚡ Ultra-fast",
    tagline:"Llama 3.1 · Mixtral · LPU Hardware",
    description:"Custom LPU chips deliver Llama and Mixtral at 300+ tokens/sec — up to 10× faster than GPU inference.",
    color:"#7c3aed", field:"groqApiKey", keyPrefix:"gsk_…", docsUrl:"https://console.groq.com/keys",
    models:[{name:"llama-3.1-70b",note:"Best open"},{name:"llama-3.1-8b",note:"Fastest"},{name:"mixtral-8x7b",note:"MoE"},{name:"gemma2-9b"}],
    caps:[c(Zap,"Ultra-fast","#7c3aed"),c(Code2,"Code","#3b82f6"),c(MessageSquare,"Chat","#06b6d4")],
    context:"32K", speed:"ultra", free:true },

  { id:"perplexity", name:"Perplexity", short:"Sonar · Web Search",
    tagline:"Sonar · Real-time web grounding",
    description:"Every answer grounded in live web data with inline citations. Best for research, news and factual queries.",
    color:"#06b6d4", field:"perplexityApiKey", keyPrefix:"pplx-…", docsUrl:"https://www.perplexity.ai/settings/api",
    models:[{name:"sonar-large",note:"Deep research"},{name:"sonar-small",note:"Fast search"},{name:"sonar-reasoning",note:"Think+search"},{name:"r1-1776",note:"Uncensored"}],
    caps:[c(Search,"Web Search","#06b6d4"),c(Brain,"Reasoning","#8b5cf6"),c(Globe,"Live web","#06b6d4")],
    context:"128K", speed:"standard" },

  { id:"cohere", name:"Cohere", short:"Command R+ · RAG",
    tagline:"Command R+ · Embed · Rerank",
    description:"Enterprise retrieval AI. Best-in-class embeddings and reranking for production RAG pipelines at scale.",
    color:"#14b8a6", field:"cohereApiKey", keyPrefix:"(any string)", docsUrl:"https://dashboard.cohere.com/api-keys",
    models:[{name:"command-r+",note:"RAG flagship"},{name:"command-r",note:"Efficient"},{name:"embed-v3",note:"Embeddings"},{name:"rerank-v3.5",note:"Reranking"}],
    caps:[c(Database,"RAG","#14b8a6"),c(Search,"Retrieval","#06b6d4"),c(MessageSquare,"Chat","#06b6d4")],
    context:"128K", speed:"standard" },

  { id:"openrouter", name:"OpenRouter", short:"100+ models", badge:"Universal",
    tagline:"One API key · 100+ models",
    description:"Unified gateway — swap between OpenAI, Claude, Gemini and 100+ models without changing code. Often cheaper than direct.",
    color:"#6366f1", field:"openrouterApiKey", keyPrefix:"sk-or-…", docsUrl:"https://openrouter.ai/keys",
    models:[{name:"openai/gpt-4o"},{name:"anthropic/claude-3.5-sonnet"},{name:"meta/llama-3.1-70b"},{name:"deepseek/deepseek-r1"}],
    caps:[c(Layers,"100+ models","#6366f1"),c(Code2,"Code","#3b82f6"),c(Video,"Vision","#4285f4")],
    context:"Varies", speed:"fast" },

  { id:"together", name:"Together AI", short:"DeepSeek · Qwen",
    tagline:"DeepSeek · Llama · Qwen · Open models",
    description:"Open-source frontier models at competitive prices — DeepSeek R1, Llama 3.1 70B and Qwen 2.5 72B without restrictions.",
    color:"#10b981", field:"togetherApiKey", keyPrefix:"(any string)", docsUrl:"https://api.together.ai/settings/api-keys",
    models:[{name:"llama-3.1-70b",note:"Meta"},{name:"deepseek-r1",note:"Reasoning"},{name:"qwen2.5-72b",note:"Alibaba"},{name:"mistral-7b"}],
    caps:[c(Code2,"Code","#10b981"),c(Brain,"Reasoning","#8b5cf6"),c(MessageSquare,"Chat","#06b6d4")],
    context:"128K", speed:"fast" },
];

const SPEED_LABEL = { ultra: "⚡ Ultra", fast: "Fast", standard: "Std" } as const;
const SPEED_COLOR = { ultra: "#a78bfa", fast: "#34d399", standard: "#94a3b8" } as const;

/* ─── Provider card (left grid) ─────────────────────────────── */
function ProviderCard({ p, status, selected, onClick }: {
  p: Provider; status: ProviderStatus | undefined; selected: boolean; onClick: () => void;
}) {
  const live = status?.connected ?? false;
  return (
    <button
      onClick={onClick}
      className={cn("_glass group relative text-left rounded-2xl transition-all duration-200 overflow-hidden p-4 flex flex-col gap-3",
        selected && "_card-selected")}
      style={{
        borderColor: selected ? `${p.color}45` : undefined,
        boxShadow: selected
          ? `0 0 0 1px ${p.color}35, 0 8px 28px ${p.color}15, inset 0 1px 0 rgba(255,255,255,.07)`
          : live ? `0 0 0 1px ${p.color}22` : undefined,
      }}>

      {/* Top color accent */}
      <div className="absolute top-0 inset-x-0 h-0.5 rounded-t-2xl transition-all duration-300"
        style={{ background: selected ? `linear-gradient(90deg,${p.color},${p.color}55)` : live ? `linear-gradient(90deg,${p.color}70,transparent)` : "transparent" }} />

      {/* Provider-colored ambient glow behind icon when selected */}
      {selected && (
        <div className="absolute top-0 left-0 size-24 rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: p.color + "20" }} />
      )}

      {/* Icon + badges row */}
      <div className="flex items-start justify-between gap-2 relative">
        <div className={cn("_iconBox size-12 shrink-0 transition-transform duration-200",
          selected ? "_floatY" : "group-hover:scale-105")}
          style={{ background: `linear-gradient(145deg, ${p.color}22, ${p.color}0e)`, borderColor: `${p.color}30` }}>
          <ProviderLogo id={p.id} size={26} color={p.color} />
          {live && (
            <span className="_liveDot relative flex size-2.5 rounded-full bg-emerald-400 border border-[#07070f]"
              style={{ position: "absolute", top: -3, right: -3 }} />
          )}
        </div>

        <div className="flex flex-col items-end gap-1 pt-0.5">
          {live && (
            <span className="text-[8.5px] font-black tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: `${p.color}22`, color: p.color, border: `1px solid ${p.color}45` }}>
              ● LIVE
            </span>
          )}
          {p.badge && (
            <span className="text-[8px] font-bold px-1.5 py-px rounded-md"
              style={{ background: `${p.color}15`, color: p.color + "cc", border: `1px solid ${p.color}25` }}>
              {p.badge}
            </span>
          )}
          {p.free && <span className="text-[8px] font-bold px-1.5 py-px rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-400/20">FREE</span>}
        </div>
      </div>

      {/* Name + tagline */}
      <div className="relative">
        <div className="flex items-center gap-1.5">
          <span className={cn("text-[13px] font-black leading-none transition-colors",
            selected ? "text-white" : "text-white/75 group-hover:text-white/95")}>
            {p.name}
          </span>
          {p.recommended && <Star className="size-2.5 shrink-0 text-amber-400 opacity-80" fill="currentColor" />}
        </div>
        <p className="text-[9.5px] text-white/28 mt-1 leading-tight">{p.short}</p>
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-1.5 mt-auto">
        <span className="text-[9px] font-semibold" style={{ color: SPEED_COLOR[p.speed] }}>{SPEED_LABEL[p.speed]}</span>
        <span className="text-white/12 text-[9px]">·</span>
        <span className="text-[9px] text-white/22">{p.context}</span>
      </div>
    </button>
  );
}

/* ─── Ollama card ─────────────────────────────────────────────── */
function OllamaCard({ status, ollamaUrl, selected, onClick }: {
  status: ProviderStatus | undefined; ollamaUrl: string | null; selected: boolean; onClick: () => void;
}) {
  const live = status?.connected ?? false;
  const FC = "#e879f9";
  return (
    <button onClick={onClick}
      className={cn("_glass group relative text-left rounded-2xl transition-all duration-200 overflow-hidden p-4 flex flex-col gap-3",
        selected && "_card-selected")}
      style={{
        borderColor: selected ? `${FC}45` : undefined,
        boxShadow: selected ? `0 0 0 1px ${FC}35, 0 8px 28px ${FC}12, inset 0 1px 0 rgba(255,255,255,.07)` : live ? `0 0 0 1px ${FC}20` : undefined,
      }}>
      <div className="absolute top-0 inset-x-0 h-0.5 rounded-t-2xl"
        style={{ background: selected ? `linear-gradient(90deg,${FC},#7c3aed80)` : live ? `linear-gradient(90deg,${FC}70,transparent)` : "transparent" }} />
      {selected && <div className="absolute top-0 left-0 size-24 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: FC + "18" }} />}

      <div className="flex items-start justify-between gap-2 relative">
        <div className={cn("_iconBox size-12 shrink-0 transition-transform duration-200", selected ? "_floatY" : "group-hover:scale-105")}
          style={{ background: `linear-gradient(145deg, ${FC}22, #7c3aed10)`, borderColor: `${FC}30` }}>
          <ProviderLogo id="ollama" size={26} color={FC} />
          {live && <span className="_liveDot relative flex size-2.5 rounded-full bg-emerald-400 border border-[#07070f]" style={{ position: "absolute", top: -3, right: -3 }} />}
        </div>
        <div className="flex flex-col items-end gap-1 pt-0.5">
          {live
            ? <span className="text-[8.5px] font-black tracking-wider px-2 py-0.5 rounded-full" style={{ background: `${FC}22`, color: FC, border: `1px solid ${FC}45` }}>● LIVE</span>
            : <span className="text-[8px] font-bold px-1.5 py-px rounded-md" style={{ background: `${FC}15`, color: FC + "cc", border: `1px solid ${FC}25` }}>GPU</span>
          }
          <span className="text-[8px] font-bold px-1.5 py-px rounded-md bg-violet-500/15 text-violet-300 border border-violet-400/20">LOCAL</span>
          <span className="text-[8px] font-bold px-1.5 py-px rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-400/20">FREE</span>
        </div>
      </div>

      <div className="relative">
        <div className={cn("text-[13px] font-black leading-none transition-colors", selected ? "text-white" : "text-white/75 group-hover:text-white/95")}>Ollama</div>
        <p className="text-[9.5px] text-white/28 mt-1 leading-tight">Self-hosted GPU</p>
        {live && ollamaUrl && <p className="text-[8.5px] font-mono text-white/20 mt-0.5 truncate">{ollamaUrl}</p>}
      </div>

      <div className="flex items-center gap-1.5 mt-auto">
        <span className="text-[9px] font-semibold text-fuchsia-400">⚡ Ultra</span>
        <span className="text-white/12 text-[9px]">·</span>
        <span className="text-[9px] text-white/22">∞ Unlimited</span>
      </div>
    </button>
  );
}

/* ─── Detail panel helpers ────────────────────────────────────── */
function DetailHeader({ id, name, color, live, badge, recommended, tagline, context, speed, free, docsUrl, description, caps }:{
  id: string; name: string; color: string; live: boolean; badge?: string; recommended?: boolean;
  tagline: string; context: string; speed: "ultra"|"fast"|"standard"; free?: boolean;
  docsUrl: string; description: string; caps: Cap[];
}) {
  return (
    <div className="relative shrink-0 p-6 pb-5 overflow-hidden">
      {/* Mesh ambient */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 85% 20%, ${color}22 0%, transparent 55%), radial-gradient(ellipse at 10% 90%, ${color}0e 0%, transparent 45%)`,
      }}/>
      <div className="absolute top-2 right-8 size-48 rounded-full blur-[60px] pointer-events-none" style={{ backgroundColor: color + "1a" }} />

      <div className="relative flex items-start gap-5">
        {/* Hero logo */}
        <div className="relative shrink-0 rounded-2xl p-3.5 border-2 transition-all _logoIn"
          style={{ background: `linear-gradient(145deg, ${color}28, ${color}10)`, borderColor: `${color}45`, boxShadow: live ? `0 0 28px ${color}35, inset 0 1px 0 rgba(255,255,255,.08)` : `inset 0 1px 0 rgba(255,255,255,.06)` }}>
          <ProviderLogo id={id} size={44} color={color} />
          {live && (
            <>
              <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full border-2 border-[#07070f] bg-emerald-400" />
              <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-emerald-400 opacity-40 animate-ping" />
            </>
          )}
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[22px] font-black text-white leading-none">{name}</h2>
            {badge && <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full" style={{ background: `${color}22`, color, border: `1px solid ${color}45` }}>{badge}</span>}
            {recommended && <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/25"><Star className="size-2.5" fill="currentColor" />Top pick</span>}
            {live && <span className="ml-0.5 text-[9.5px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/18 text-emerald-300 border border-emerald-400/30">● CONNECTED</span>}
          </div>
          <p className="text-[11.5px] text-white/35 mt-1.5">{tagline}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] font-semibold" style={{ color: SPEED_COLOR[speed] }}>{SPEED_LABEL[speed]}</span>
            <span className="text-[10px] text-white/22">{context} context</span>
            {free && <span className="text-[10px] text-emerald-400">Free tier ✓</span>}
            <a href={docsUrl} target="_blank" rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-[10px] text-white/20 hover:text-indigo-400 transition-colors">
              <ExternalLink className="size-2.5" />Get API key
            </a>
          </div>
        </div>
      </div>

      <p className="relative text-[11.5px] text-white/40 leading-relaxed mt-5">{description}</p>

      <div className="relative flex flex-wrap gap-1.5 mt-3.5">
        {caps.map(cap => {
          const Icon = cap.icon;
          return (
            <span key={cap.label} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border"
              style={{ background: `${cap.color}14`, borderColor: `${cap.color}33`, color: cap.color }}>
              <Icon className="size-2.5" />{cap.label}
            </span>
          );
        })}
      </div>

      <div className="relative h-px mt-5" style={{ background: `linear-gradient(90deg, ${color}35, transparent)` }} />
    </div>
  );
}

/* ─── Cloud provider detail panel ─────────────────────────────── */
function CloudDetail({ p, status, onSave, onTest, onRemove }: {
  p: Provider; status: ProviderStatus | undefined;
  onSave: (field: string, key: string) => Promise<void>;
  onTest: (id: string, key?: string) => Promise<{ success: boolean; message: string }>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [shake, setShake] = useState(false);
  const [lastTest, setLastTest] = useState<Date | null>(null);
  const { toast } = useToast();
  const live = status?.connected ?? false;

  const doSave = async () => {
    if (!key.trim()) return; setSaving(true);
    try { await onSave(p.field, key.trim()); setKey(""); setResult(null); toast({ title: `${p.name} connected` }); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };
  const doTest = async () => {
    setTesting(true); setResult(null);
    try {
      const r = await onTest(p.id, key.trim() || undefined);
      setResult({ ok: r.success, msg: r.message }); setLastTest(new Date());
      if (!r.success) { setShake(true); setTimeout(() => setShake(false), 500); }
    } catch (e: any) { setResult({ ok: false, msg: e.message }); }
    finally { setTesting(false); }
  };
  const doRemove = async () => {
    setRemoving(true);
    try { await onRemove(p.id); setResult(null); toast({ title: `${p.name} disconnected` }); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setRemoving(false); }
  };

  return (
    <div className={cn("_slideUp h-full flex flex-col", shake && "_shake", testing && "_scanning")} style={{ position: "relative" }}>
      <DetailHeader id={p.id} name={p.name} color={p.color} live={live} badge={p.badge} recommended={p.recommended}
        tagline={p.tagline} context={p.context} speed={p.speed} free={p.free} docsUrl={p.docsUrl}
        description={p.description} caps={p.caps} />

      <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-5">
        {/* Models */}
        <div>
          <p className="text-[9px] font-black text-white/18 uppercase tracking-widest mb-2.5">Available Models</p>
          <div className="flex flex-wrap gap-1.5">
            {p.models.map(m => (
              <span key={m.name} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-colors cursor-default"
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = p.color + "40"; (e.currentTarget as HTMLElement).style.color = p.color; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; }}>
                <span className="size-1 rounded-full" style={{ backgroundColor: p.color }} />
                {m.name}{m.note && <span style={{ color: "rgba(255,255,255,0.22)" }}> · {m.note}</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Connected status */}
        {live && (
          <div className="_pop flex items-center gap-3 p-3.5 rounded-xl border"
            style={{ background: "#34d39910", borderColor: "#34d39928" }}>
            <div className="size-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#34d39920" }}>
              <CheckCircle2 className="size-4.5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-emerald-400">API Key Active</p>
              <p className="text-[10px] font-mono text-white/28 mt-0.5">{status?.masked}</p>
            </div>
            {lastTest && <span className="shrink-0 flex items-center gap-1 text-[9px] text-white/18"><Clock className="size-2.5" />{lastTest.toLocaleTimeString()}</span>}
          </div>
        )}

        {/* Key input */}
        <div className="space-y-2">
          <label className="text-[9px] font-black text-white/18 uppercase tracking-widest">{live ? "Update API Key" : "Connect with API Key"}</label>
          <div className="relative group/input">
            <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-white/15 pointer-events-none transition-colors group-focus-within/input:text-white/30" />
            <input
              type={show ? "text" : "password"}
              value={key} onChange={e => setKey(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") doSave(); }}
              placeholder={p.keyPrefix}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl text-[12px] font-mono text-white/80 placeholder:text-white/10 outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)" }}
              onFocus={e => e.currentTarget.style.borderColor = p.color + "55"}
              onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
            />
            <button type="button" onClick={() => setShow(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/18 hover:text-white/45 transition-colors">
              {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
          <p className="text-[9px] text-white/12">Stored encrypted server-side · Enter ↵ to save · never sent to browser</p>
        </div>

        {/* Test result */}
        {result && (
          <div className={cn("_pop flex items-start gap-2.5 p-3.5 rounded-xl border text-[11px]",
            result.ok ? "bg-emerald-500/[0.07] border-emerald-400/18 text-emerald-400" : "bg-red-500/[0.07] border-red-400/18 text-red-400")}>
            {result.ok ? <CheckCircle2 className="size-4 shrink-0 mt-px" /> : <XCircle className="size-4 shrink-0 mt-px" />}
            <span>{result.msg}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button onClick={doTest} disabled={testing || (!key.trim() && !live)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-semibold border transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30"
            style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" }}>
            {testing ? <Loader2 className="size-3.5 animate-spin" /> : <FlaskConical className="size-3.5" style={{ color: p.color }} />}
            {testing ? "Testing…" : "Test connection"}
          </button>

          <button onClick={doSave} disabled={saving || !key.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30"
            style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}aa)`, boxShadow: `0 2px 18px ${p.color}40` }}>
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <PlugZap className="size-3.5" />}
            {live ? "Update key" : "Connect"}
          </button>

          {live && (
            <button onClick={doRemove} disabled={removing}
              className="ml-auto flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] text-red-400/45 hover:text-red-400 hover:bg-red-500/[0.08] border border-transparent hover:border-red-400/15 transition-all">
              {removing ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              Disconnect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Ollama detail panel ─────────────────────────────────────── */
function OllamaDetail({ status, ollamaUrl, onSave, onRemove }: {
  status: ProviderStatus | undefined; ollamaUrl: string | null;
  onSave: (f: string, v: string) => Promise<void>;
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

  const ollCaps: Cap[] = [
    c(Cpu, "GPU Accelerated", FC), c(Server, "Self-hosted", "#818cf8"),
    c(Layers, "Any model", "#94a3b8"), c(Shield, "Private", "#34d399"),
  ];

  const doSave = async () => {
    if (!url.trim()) return; setSaving(true);
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
    <div className={cn("_slideUp h-full flex flex-col", shake && "_shake", testing && "_scanning")} style={{ position: "relative" }}>
      <DetailHeader id="ollama" name="Ollama" color={FC} live={live} badge="GPU Local"
        tagline="Self-hosted · Any model · No API costs" context="Unlimited ∞" speed="ultra" free
        docsUrl="https://ollama.com" description="Run any model on your own GPU. Connect directly at localhost:11434 or expose remotely through a Cloudflare tunnel — zero API cost, zero rate limits, total privacy."
        caps={ollCaps} />

      <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-5">
        {/* Popular models */}
        <div>
          <p className="text-[9px] font-black text-white/18 uppercase tracking-widest mb-2.5">Popular models to pull</p>
          <div className="flex flex-wrap gap-1.5">
            {["llama3.2","deepseek-r1","qwen2.5","gemma3","phi4","mistral","codellama","llava","nomic-embed-text"].map(m => (
              <span key={m}
                className="px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-colors cursor-default"
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = FC + "40"; (e.currentTarget as HTMLElement).style.color = FC; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; }}>
                {m}
              </span>
            ))}
          </div>
          <p className="text-[9px] text-white/14 mt-2 font-mono">$ <span className="text-white/30">ollama pull llama3.2</span></p>
        </div>

        {live && ollamaUrl && (
          <div className="_pop flex items-center gap-3 p-3.5 rounded-xl border" style={{ background: "#34d39910", borderColor: "#34d39928" }}>
            <div className="size-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#34d39920" }}>
              <Globe className="size-4.5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-emerald-400">Instance connected</p>
              <p className="text-[10px] font-mono text-white/28 mt-0.5 truncate">{ollamaUrl}</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[9px] font-black text-white/18 uppercase tracking-widest">{live ? "Update Base URL" : "Base URL"}</label>
          <div className="relative group/input">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-white/15 pointer-events-none transition-colors group-focus-within/input:text-white/30" />
            <input type="url" value={url} onChange={e => setUrl(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") doSave(); }}
              placeholder="https://your-gpu.trycloudflare.com"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl text-[12px] font-mono text-white/80 placeholder:text-white/10 outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)" }}
              onFocus={e => e.currentTarget.style.borderColor = FC + "55"}
              onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
            />
          </div>
          <div className="flex gap-4 text-[9px] text-white/14">
            <span>Local: <span className="font-mono text-white/28">http://localhost:11434</span></span>
            <span>Remote: <span className="font-mono text-white/28">https://xyz.trycloudflare.com</span></span>
          </div>
        </div>

        {result && (
          <div className={cn("_pop rounded-xl border overflow-hidden", result.success ? "border-emerald-400/15" : "border-red-400/15")}>
            <div className={cn("flex items-center gap-2.5 px-4 py-3", result.success ? "bg-emerald-500/[0.07]" : "bg-red-500/[0.07]")}>
              {result.success ? <CheckCircle2 className="size-4 text-emerald-400 shrink-0" /> : <XCircle className="size-4 text-red-400 shrink-0" />}
              <span className={cn("flex-1 text-[11px] font-semibold", result.success ? "text-emerald-400" : "text-red-400")}>{result.message}</span>
              {result.ping !== undefined && (
                <span className="shrink-0 text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full border"
                  style={{ color: result.ping < 100 ? "#34d399" : result.ping < 500 ? "#fbbf24" : "#f87171", borderColor: (result.ping < 100 ? "#34d399" : result.ping < 500 ? "#fbbf24" : "#f87171") + "40", background: (result.ping < 100 ? "#34d399" : result.ping < 500 ? "#fbbf24" : "#f87171") + "12" }}>
                  <Gauge className="size-2.5" />{result.ping}ms
                </span>
              )}
            </div>
            {result.success && result.models !== undefined && (
              <div className="bg-black/40">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2"><Terminal className="size-3 text-white/18" /><span className="text-[9px] font-black text-white/22 uppercase tracking-widest">Detected models</span></div>
                  <span className="text-[9px] text-white/18">{result.models.length} pulled</span>
                </div>
                {result.models.length === 0 ? (
                  <div className="px-4 py-5 text-center">
                    <span className="text-[10px] text-white/28">No models yet — </span>
                    <span className="font-mono text-[10px] text-white/45 bg-white/[0.06] px-2 py-0.5 rounded">ollama pull llama3.2</span>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.03] max-h-48 overflow-y-auto">
                    {result.models.map((m, i) => (
                      <div key={m.name} className="_pop flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors" style={{ animationDelay: `${i * 28}ms` }}>
                        <Activity className="size-3 shrink-0" style={{ color: FC + "70" }} />
                        <span className="flex-1 text-[11px] font-mono text-white/55 truncate">{m.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {m.quantization && <span className="text-[8px] font-mono bg-white/[0.05] px-1.5 py-px rounded text-white/28">{m.quantization}</span>}
                          {m.parameterSize && <span className="text-[9px] text-white/28">{m.parameterSize}</span>}
                          {m.size && m.size !== "unknown" && <span className="text-[9px] text-white/22 flex items-center gap-1"><HardDrive className="size-2.5" />{m.size}</span>}
                          {m.family && m.family !== "unknown" && <span className="text-[8px] font-mono px-1.5 py-px rounded border" style={{ background: FC + "10", color: FC + "a0", borderColor: FC + "22" }}>{m.family}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2.5">
          <button onClick={doTest} disabled={testing || (!url.trim() && !live)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-semibold border transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30"
            style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" }}>
            {testing ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5" style={{ color: FC }} />}
            {testing ? "Detecting…" : "Test & detect models"}
          </button>
          <button onClick={doSave} disabled={saving || !url.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30"
            style={{ background: `linear-gradient(135deg, ${FC}, #7c3aedcc)`, boxShadow: `0 2px 18px ${FC}40` }}>
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Globe className="size-3.5" />}
            {live ? "Update URL" : "Connect Ollama"}
          </button>
          {live && (
            <button onClick={doRemove} disabled={removing}
              className="ml-auto flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] text-red-400/45 hover:text-red-400 hover:bg-red-500/[0.08] border border-transparent hover:border-red-400/15 transition-all">
              {removing ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              Disconnect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────── */
export default function AISettingsPage() {
  const [aiKeys, setAiKeys] = useState<AiKeys>({});
  const [ollamaUrl, setOllamaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    try {
      const d = await apiCall("/settings") as any;
      setAiKeys(d.aiKeys || {}); setOllamaUrl(d.ollamaBaseUrl || null);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const connectedCount = Object.values(aiKeys).filter(v => v.connected).length + (aiKeys["ollamaBaseUrl"]?.connected ? 1 : 0);

  const handleSave = async (field: string, key: string) => {
    const d = await apiCall("/settings", { method: "PUT", body: JSON.stringify({ [field]: key }) }) as any;
    setAiKeys(d.aiKeys || {}); setOllamaUrl(d.ollamaBaseUrl || null);
  };
  const handleTest = async (id: string, apiKey?: string) => {
    const r = await apiCall("/ai/test", { method: "POST", body: JSON.stringify({ provider: id, apiKey }) }) as any;
    return { success: r.success ?? false, message: r.message || r.error || "Unknown" };
  };
  const handleRemove = async (id: string) => {
    await apiCall(`/settings/ai-key/${id}`, { method: "DELETE" }); await fetchSettings();
  };

  const filteredProviders = PROVIDERS.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.tagline.toLowerCase().includes(search.toLowerCase())
  );
  const showOllama = !search || "ollama gpu local".includes(search.toLowerCase());
  const selectedProvider = selected && selected !== "ollama" ? PROVIDERS.find(p => p.id === selected) : null;

  return (
    <AppLayout>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="relative flex flex-col h-full overflow-hidden" style={{ background: "#07070f" }}>

        {/* Aurora blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="_aurI absolute -top-40 -left-10 size-[520px] rounded-full blur-[140px]" style={{ backgroundColor: "#6366f1", "--dur": "24s" } as any} />
          <div className="_aurI absolute -bottom-28 right-4 size-96 rounded-full blur-[110px]" style={{ backgroundColor: "#8b5cf6", "--dur": "30s" } as any} />
          <div className="_aurI absolute top-1/3 left-2/5 size-72 rounded-full blur-[90px]" style={{ backgroundColor: "#06b6d4", "--dur": "38s" } as any} />
          {/* Dynamic color based on selected provider */}
          <div className="absolute inset-0 pointer-events-none transition-all duration-700"
            style={{ background: selected && selected !== "ollama" && selectedProvider
              ? `radial-gradient(ellipse at 72% 50%, ${selectedProvider.color}0c 0%, transparent 52%)`
              : selected === "ollama"
                ? "radial-gradient(ellipse at 72% 50%, #e879f90a 0%, transparent 52%)"
                : "none" }} />
        </div>

        {/* Header */}
        <header className="relative z-10 shrink-0 flex items-center gap-4 px-5 h-14 border-b border-white/[0.055]"
          style={{ backdropFilter: "blur(24px)", background: "rgba(7,7,15,0.78)" }}>
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(145deg,rgba(99,102,241,.25),rgba(139,92,246,.12))", border: "1px solid rgba(99,102,241,.25)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.07)" }}>
              <Sparkles className="size-4 text-indigo-400" />
            </div>
            <div>
              <h1 className="font-black text-[15px] _glowTxt leading-none">AI Models</h1>
              <p className="text-[9px] text-white/18 font-medium mt-px">{connectedCount} / 10 providers active</p>
            </div>
          </div>

          {/* Connected count dots */}
          <div className="flex items-center gap-1 ml-2">
            {[...Array(10)].map((_, i) => (
              <span key={i} className="size-1.5 rounded-full transition-all duration-300"
                style={{ backgroundColor: i < connectedCount ? "#34d399" : "rgba(255,255,255,0.1)" }} />
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-white/18 pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search providers…"
                className="pl-7 pr-3 py-1.5 rounded-lg text-[11px] text-white/70 placeholder:text-white/18 outline-none w-36 transition-all"
                style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.08)" }}
                onFocus={e => e.currentTarget.style.borderColor = "rgba(99,102,241,.4)"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
              />
            </div>
            <button onClick={() => fetchSettings()}
              className="p-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.07] text-white/28 hover:text-white/60 transition-all hover:scale-105 active:scale-95">
              <RefreshCw className="size-3.5" />
            </button>
          </div>
        </header>

        {/* 2-column layout */}
        <div className="relative z-10 flex flex-1 min-h-0">

          {/* Left: provider grid */}
          <aside className="w-[308px] shrink-0 overflow-y-auto p-3.5 space-y-4 border-r border-white/[0.05]"
            style={{ background: "rgba(0,0,0,0.22)", backdropFilter: "blur(8px)" }}>
            {loading ? (
              <div className="grid grid-cols-2 gap-2">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-36 rounded-2xl _shimmerBg" style={{ animationDelay: `${i * 80}ms` }} />
                ))}
              </div>
            ) : (
              <>
                {showOllama && (
                  <section>
                    <p className="text-[8px] font-black text-white/14 uppercase tracking-[.18em] px-1 mb-2">Local GPU</p>
                    <OllamaCard status={aiKeys["ollamaBaseUrl"]} ollamaUrl={ollamaUrl}
                      selected={selected === "ollama"} onClick={() => setSelected("ollama")} />
                  </section>
                )}
                {filteredProviders.length > 0 && (
                  <section>
                    <p className="text-[8px] font-black text-white/14 uppercase tracking-[.18em] px-1 mb-2">Cloud Providers</p>
                    <div className="grid grid-cols-2 gap-2">
                      {filteredProviders.map(p => (
                        <ProviderCard key={p.id} p={p} status={aiKeys[p.field]}
                          selected={selected === p.id} onClick={() => setSelected(p.id)} />
                      ))}
                    </div>
                  </section>
                )}
                {filteredProviders.length === 0 && !showOllama && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <span className="text-[32px]">🔍</span>
                    <p className="text-[11px] text-white/25">No providers match</p>
                    <button onClick={() => setSearch("")} className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors">Clear search</button>
                  </div>
                )}
              </>
            )}
          </aside>

          {/* Right: detail */}
          <main className="flex-1 min-w-0 overflow-hidden relative">
            {!selected && (
              <div className="h-full flex flex-col items-center justify-center gap-6 p-8 text-center select-none">
                <div className="relative">
                  <div className="size-24 rounded-3xl border border-white/[0.06] flex items-center justify-center"
                    style={{ background: "linear-gradient(145deg,rgba(255,255,255,.04),rgba(255,255,255,.01))", boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)" }}>
                    <Sparkles className="size-10 text-white/[0.07]" />
                  </div>
                  <div className="absolute inset-0 rounded-3xl blur-2xl bg-indigo-500/[0.07] -z-10" />
                </div>
                <div>
                  <p className="text-[18px] font-black text-white/25">Select a provider</p>
                  <p className="text-[12px] text-white/14 mt-1.5 max-w-xs leading-relaxed">Pick any provider from the grid to configure your API key and unlock AI features</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-white/12">
                  <span>10 providers available</span>
                  <span>·</span>
                  <span>1 local GPU + 9 cloud</span>
                </div>
              </div>
            )}
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
