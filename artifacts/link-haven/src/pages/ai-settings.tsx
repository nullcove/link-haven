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
  Star, PlugZap, FlaskConical, Database, ArrowRight,
  ChevronDown, WifiOff, Server,
} from "lucide-react";

/* ─── Provider SVG icons ──────────────────────────────────── */
const ProviderIcon = ({ id, size = 28, color }: { id: string; size?: number; color: string }) => {
  const s = size;
  const props = { width: s, height: s, viewBox: "0 0 32 32", fill: "none" };

  const icons: Record<string, React.ReactNode> = {
    ollama: (
      <svg {...props}>
        {/* Llama head silhouette */}
        <ellipse cx="16" cy="20" rx="8" ry="7" fill={color} opacity=".15"/>
        <path d="M10 27 C10 21 9 17 10 14 C11 11 13 9 14 7 C15 5 14 3 16 3 C18 3 17 5 18 7 C19 9 21 11 22 14 C23 17 22 21 22 27" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>
        {/* Head */}
        <ellipse cx="16" cy="6" rx="3.5" ry="3" fill={color}/>
        {/* Ear */}
        <path d="M13.5 4 L12 2 L14 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        {/* Eye */}
        <circle cx="15" cy="6" r=".8" fill="#fff"/>
        {/* Body shine */}
        <path d="M12 20 Q16 18 20 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity=".5" fill="none"/>
      </svg>
    ),
    openai: (
      <svg {...props}>
        {/* OpenAI-inspired interlocked hexagram/flower */}
        <g fill={color}>
          <path d="M16 4 L19 10 L25 10 L21 15 L23 21 L17 18 L11 21 L13 15 L9 10 L15 10 Z" opacity=".25"/>
          <path d="M16 7 L18.5 12 L24 12 L20 16 L21.5 21 L16 18.5 L10.5 21 L12 16 L8 12 L13.5 12 Z" opacity=".5"/>
        </g>
        <circle cx="16" cy="16" r="4" fill={color}/>
        <circle cx="16" cy="16" r="2" fill="white" opacity=".3"/>
      </svg>
    ),
    anthropic: (
      <svg {...props}>
        {/* Anthropic - ascending triangle A */}
        <path d="M16 5 L28 27 H4 Z" fill={color} opacity=".2"/>
        <path d="M16 8 L26 26 H6 Z" fill={color} opacity=".15"/>
        <path d="M16 11 L24 25 H8 Z" fill={color} opacity=".12"/>
        <path d="M16 6 L27.5 27 H4.5 Z" stroke={color} strokeWidth="2" fill="none" strokeLinejoin="round"/>
        <path d="M10 21 H22" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    gemini: (
      <svg {...props}>
        {/* Gemini - 4-pointed star sparkle */}
        <path d="M16 3 C16 3 17 10 24 16 C17 16 17 16 17 16 C17 16 16 23 16 29 C16 29 15 22 8 16 C15 16 15 16 15 16 C15 16 16 9 16 3Z" fill={color}/>
        <path d="M16 3 C16 3 17 10 24 16 C17 16 17 16 17 16 C17 16 16 23 16 29 C16 29 15 22 8 16 C15 16 15 16 15 16 C15 16 16 9 16 3Z" fill="white" opacity=".2"/>
        <circle cx="16" cy="16" r="2.5" fill="white" opacity=".6"/>
      </svg>
    ),
    mistral: (
      <svg {...props}>
        {/* Mistral - stylized M with wind */}
        <rect x="5" y="8" width="5" height="16" rx="1.5" fill={color}/>
        <rect x="22" y="8" width="5" height="16" rx="1.5" fill={color}/>
        <rect x="5" y="8" width="5" height="7" rx="1.5" fill={color}/>
        <rect x="13.5" y="8" width="5" height="7" rx="1.5" fill={color}/>
        <rect x="22" y="8" width="5" height="7" rx="1.5" fill={color}/>
        <path d="M10 12 L13.5 12 M18.5 12 L22 12" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        {/* Wind swoosh */}
        <path d="M6 27 Q13 25 16 28 Q19 31 26 27" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity=".5"/>
      </svg>
    ),
    groq: (
      <svg {...props}>
        {/* Groq - G with lightning bolt */}
        <path d="M26 12 A11 11 0 1 0 26 20 H17 V16 H26" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19 9 L14 17 H18 L13 23" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    perplexity: (
      <svg {...props}>
        {/* Perplexity - compass rose / helix */}
        <circle cx="16" cy="16" r="11" stroke={color} strokeWidth="2" fill="none" opacity=".3"/>
        <circle cx="16" cy="16" r="7" stroke={color} strokeWidth="1.5" fill="none" opacity=".5"/>
        <circle cx="16" cy="16" r="3" fill={color}/>
        <path d="M16 5 V11 M16 21 V27 M5 16 H11 M21 16 H27" stroke={color} strokeWidth="2" strokeLinecap="round" opacity=".6"/>
        <path d="M9 9 L13 13 M19 19 L23 23 M9 23 L13 19 M19 13 L23 9" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity=".4"/>
      </svg>
    ),
    cohere: (
      <svg {...props}>
        {/* Cohere - nested C arcs / coral */}
        <path d="M22 10 A9 9 0 1 0 22 22" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M20 13 A6 6 0 1 0 20 19" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d="M18 15.5 A3 3 0 1 0 18 16.5" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <circle cx="18.5" cy="16" r="1.5" fill={color}/>
      </svg>
    ),
    openrouter: (
      <svg {...props}>
        {/* OpenRouter - diverging paths (routing) */}
        <circle cx="6" cy="16" r="3" fill={color}/>
        <circle cx="26" cy="8" r="3" fill={color}/>
        <circle cx="26" cy="24" r="3" fill={color}/>
        <path d="M9 16 L23 8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M9 16 L23 24" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        {/* Middle node */}
        <circle cx="16" cy="12" r="2" fill={color} opacity=".5"/>
        <circle cx="16" cy="20" r="2" fill={color} opacity=".5"/>
      </svg>
    ),
    together: (
      <svg {...props}>
        {/* Together - three overlapping circles */}
        <circle cx="12" cy="13" r="7" fill={color} opacity=".25"/>
        <circle cx="20" cy="13" r="7" fill={color} opacity=".25"/>
        <circle cx="16" cy="20" r="7" fill={color} opacity=".25"/>
        <circle cx="12" cy="13" r="7" stroke={color} strokeWidth="1.5" fill="none"/>
        <circle cx="20" cy="13" r="7" stroke={color} strokeWidth="1.5" fill="none"/>
        <circle cx="16" cy="20" r="7" stroke={color} strokeWidth="1.5" fill="none"/>
        <circle cx="16" cy="16" r="2.5" fill={color}/>
      </svg>
    ),
  };

  return (
    <div style={{ width: s, height: s }}>
      {icons[id] ?? (
        <svg {...props}>
          <circle cx="16" cy="16" r="12" fill={color} opacity=".2"/>
          <text x="16" y="21" textAnchor="middle" fontSize="14" fontWeight="900" fill={color}>{id[0].toUpperCase()}</text>
        </svg>
      )}
    </div>
  );
};

/* ─── Types ───────────────────────────────────────────────── */
type ProviderStatus = { connected: boolean; masked: string | null };
type AiKeys = Record<string, ProviderStatus>;

interface Cap { icon: React.ElementType; label: string; color: string }
interface Provider {
  id: string; name: string; tagline: string; description: string;
  color: string; models: { name: string; note?: string }[];
  docsUrl: string; keyPrefix: string; field: string;
  caps: Cap[]; context: string; speed: "ultra" | "fast" | "standard";
  free?: boolean; badge?: string; recommended?: boolean;
}
interface OllamaModel { name: string; size: string; family: string; parameterSize: string; quantization: string; }
interface OllamaTestResult { success: boolean; message: string; ping?: number; models?: OllamaModel[]; }

/* ─── CSS ─────────────────────────────────────────────────── */
const CSS = `
@keyframes sh-aurora {
  0%,100% { transform:translate(0,0) scale(1); opacity:.18; }
  50%      { transform:translate(60px,-40px) scale(1.2); opacity:.22; }
}
@keyframes sh-pulse-ring {
  0%   { transform:scale(1); opacity:.6; }
  100% { transform:scale(2.4); opacity:0; }
}
@keyframes sh-slide-up {
  from { opacity:0; transform:translateY(20px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes sh-pop {
  0%  { transform:scale(.88); opacity:0; }
  60% { transform:scale(1.03); }
  100%{ transform:scale(1); opacity:1; }
}
@keyframes sh-glow-text {
  0%,100%{ background-position:0% 50%; }
  50%    { background-position:100% 50%; }
}
@keyframes sh-scan {
  0%  { top:0; }
  100%{ top:100%; }
}
@keyframes sh-shimmer {
  0%  { background-position:-200% 0; }
  100%{ background-position: 200% 0; }
}
@keyframes sh-float-icon {
  0%,100%{ transform:translateY(0) rotate(0deg); }
  50%    { transform:translateY(-4px) rotate(3deg); }
}
@keyframes sh-badge-glow {
  0%,100%{ box-shadow:0 0 6px var(--c); }
  50%    { box-shadow:0 0 18px var(--c), 0 0 6px var(--c); }
}
@keyframes sh-shake {
  0%,100%{transform:translateX(0)}
  20%{transform:translateX(-5px)}
  40%{transform:translateX(5px)}
  60%{transform:translateX(-3px)}
  80%{transform:translateX(3px)}
}
.sh-aurora { animation: sh-aurora var(--dur,20s) ease-in-out infinite; }
.sh-slide-up { animation: sh-slide-up .35s cubic-bezier(.22,1,.36,1) both; }
.sh-pop      { animation: sh-pop .3s cubic-bezier(.22,1,.36,1) both; }
.sh-shake    { animation: sh-shake .4s ease-in-out; }
.sh-float    { animation: sh-float-icon 3.5s ease-in-out infinite; }

.sh-glow-text {
  background:linear-gradient(135deg,#c4b5fd,#818cf8,#38bdf8,#34d399,#c4b5fd);
  background-size:300% 300%;
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  background-clip:text;
  animation:sh-glow-text 5s ease infinite;
}
.sh-scanning {
  position:relative;
  overflow:hidden;
}
.sh-scanning::before {
  content:'';
  position:absolute;
  left:0;right:0;height:1.5px;
  background:linear-gradient(90deg,transparent,rgba(139,92,246,.7),transparent);
  animation:sh-scan 1.5s linear infinite;
  z-index:10;
}
.sh-shimmer-bg {
  background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.05) 50%,transparent 100%);
  background-size:200% 100%;
  animation:sh-shimmer 1.4s linear infinite;
}
.sh-card-connected {
  animation: sh-badge-glow 2.5s ease-in-out infinite;
}
`;

/* ─── Provider data ───────────────────────────────────────── */
const c = (icon: React.ElementType, label: string, color: string): Cap => ({ icon, label, color });

const PROVIDERS: Provider[] = [
  { id:"openai", name:"OpenAI", badge:"Most Popular", recommended:true,
    tagline:"GPT-4o · o1 · o3-mini",
    description:"The world's most-deployed AI platform powering ChatGPT. Unmatched tooling, vision, code, and the o-series deep reasoning models.",
    color:"#10a37f", field:"openaiApiKey", keyPrefix:"sk-…", docsUrl:"https://platform.openai.com/api-keys",
    models:[{name:"gpt-4o",note:"Vision+Code"},{name:"gpt-4o-mini",note:"Fast & cheap"},{name:"o1",note:"Deep reasoning"},{name:"o3-mini",note:"Fast reasoning"},{name:"gpt-4-turbo"}],
    caps:[c(Video,"Vision","#10a37f"),c(Code2,"Code","#3b82f6"),c(Brain,"Reasoning","#8b5cf6"),c(MessageSquare,"Chat","#06b6d4")],
    context:"128K", speed:"fast" },

  { id:"anthropic", name:"Anthropic", tagline:"Claude 3.5 · Opus · Haiku",
    description:"Safety-first AI lab. Claude 3.5 Sonnet leads most benchmarks with a 200K context window and exceptional nuanced reasoning.",
    color:"#d97706", field:"anthropicApiKey", keyPrefix:"sk-ant-…", docsUrl:"https://console.anthropic.com/settings/keys",
    models:[{name:"claude-3-5-sonnet",note:"Best overall"},{name:"claude-3-5-haiku",note:"Ultra-fast"},{name:"claude-3-opus",note:"Heavy tasks"},{name:"claude-3-haiku",note:"Lightweight"}],
    caps:[c(Brain,"Reasoning","#d97706"),c(Shield,"Safety","#10b981"),c(Code2,"Code","#3b82f6"),c(MessageSquare,"Chat","#06b6d4")],
    context:"200K", speed:"fast" },

  { id:"gemini", name:"Gemini", badge:"Free Tier", recommended:true,
    tagline:"2.0 Flash · 1.5 Pro · Ultra",
    description:"Google's multimodal flagship. Native vision, audio and video with a 1M-token window — and a very generous free tier via AI Studio.",
    color:"#4285f4", field:"geminiApiKey", keyPrefix:"AIzaSy…", docsUrl:"https://aistudio.google.com/app/apikey",
    models:[{name:"gemini-2.0-flash",note:"Fastest"},{name:"gemini-1.5-pro",note:"1M context"},{name:"gemini-1.5-flash",note:"Balanced"},{name:"gemini-ultra",note:"Flagship"}],
    caps:[c(Video,"Vision","#4285f4"),c(Brain,"Reasoning","#8b5cf6"),c(Code2,"Code","#3b82f6"),c(Zap,"Ultra","#fbbf24")],
    context:"1M", speed:"ultra", free:true },

  { id:"mistral", name:"Mistral AI", tagline:"Large · Codestral · Nemo",
    description:"European open-weight champion. Best price-to-performance ratio, and Codestral is the industry's #1 code specialist model.",
    color:"#f97316", field:"mistralApiKey", keyPrefix:"(any string)", docsUrl:"https://console.mistral.ai/api-keys",
    models:[{name:"mistral-large",note:"Flagship"},{name:"mistral-small",note:"Efficient"},{name:"codestral",note:"Code #1"},{name:"mistral-nemo",note:"12B open"}],
    caps:[c(Code2,"Code","#f97316"),c(Brain,"Reasoning","#8b5cf6"),c(MessageSquare,"Chat","#06b6d4")],
    context:"128K", speed:"fast" },

  { id:"groq", name:"Groq", badge:"⚡ 300+ tok/s", tagline:"Llama 3.1 · Mixtral · LPU",
    description:"Custom LPU chips run Llama and Mixtral at 300+ tokens/sec — up to 10× faster than GPU-based inference providers.",
    color:"#7c3aed", field:"groqApiKey", keyPrefix:"gsk_…", docsUrl:"https://console.groq.com/keys",
    models:[{name:"llama-3.1-70b",note:"Best open model"},{name:"llama-3.1-8b",note:"Fastest"},{name:"mixtral-8x7b",note:"MoE"},{name:"gemma2-9b",note:"Google open"}],
    caps:[c(Zap,"Ultra-fast","#7c3aed"),c(Code2,"Code","#3b82f6"),c(MessageSquare,"Chat","#06b6d4")],
    context:"32K", speed:"ultra", free:true },

  { id:"perplexity", name:"Perplexity", tagline:"Sonar · Real-time web",
    description:"AI answers grounded in live web data with inline citations. Best for research, news and factual accuracy. Sonar searches the web live.",
    color:"#06b6d4", field:"perplexityApiKey", keyPrefix:"pplx-…", docsUrl:"https://www.perplexity.ai/settings/api",
    models:[{name:"sonar-large",note:"Deep research"},{name:"sonar-small",note:"Fast search"},{name:"sonar-reasoning",note:"Think+search"},{name:"r1-1776",note:"Uncensored"}],
    caps:[c(Search,"Web Search","#06b6d4"),c(Brain,"Reasoning","#8b5cf6"),c(Globe,"Live web","#06b6d4")],
    context:"128K", speed:"standard" },

  { id:"cohere", name:"Cohere", tagline:"Command R+ · Embed · Rerank",
    description:"Enterprise retrieval AI. Best-in-class embeddings and reranking for production RAG pipelines. The go-to for serious search.",
    color:"#14b8a6", field:"cohereApiKey", keyPrefix:"(any string)", docsUrl:"https://dashboard.cohere.com/api-keys",
    models:[{name:"command-r+",note:"RAG flagship"},{name:"command-r",note:"Efficient"},{name:"embed-v3",note:"Embeddings"},{name:"rerank-v3.5",note:"Reranking"}],
    caps:[c(Database,"RAG","#14b8a6"),c(Search,"Retrieval","#06b6d4"),c(MessageSquare,"Chat","#06b6d4")],
    context:"128K", speed:"standard" },

  { id:"openrouter", name:"OpenRouter", badge:"100+ models", tagline:"One key · Every provider",
    description:"Unified API gateway — swap between OpenAI, Claude, Gemini and 100+ models without changing code. Often cheaper than direct APIs.",
    color:"#6366f1", field:"openrouterApiKey", keyPrefix:"sk-or-…", docsUrl:"https://openrouter.ai/keys",
    models:[{name:"openai/gpt-4o"},{name:"anthropic/claude-3.5-sonnet"},{name:"meta/llama-3.1-70b"},{name:"deepseek/deepseek-r1"}],
    caps:[c(Layers,"100+ models","#6366f1"),c(Code2,"Code","#3b82f6"),c(Video,"Vision","#4285f4")],
    context:"Varies", speed:"fast" },

  { id:"together", name:"Together AI", tagline:"DeepSeek · Llama · Qwen",
    description:"Open-source frontier models at competitive pricing. DeepSeek R1, Llama 3.1 70B and Qwen 2.5 72B without restrictions.",
    color:"#10b981", field:"togetherApiKey", keyPrefix:"(any string)", docsUrl:"https://api.together.ai/settings/api-keys",
    models:[{name:"llama-3.1-70b",note:"Meta flagship"},{name:"deepseek-r1",note:"Top reasoning"},{name:"qwen2.5-72b",note:"Alibaba"},{name:"mistral-7b",note:"Efficient"}],
    caps:[c(Code2,"Code","#10b981"),c(Brain,"Reasoning","#8b5cf6"),c(MessageSquare,"Chat","#06b6d4")],
    context:"128K", speed:"fast" },
];

const SPEED_LABEL = { ultra:"⚡ Ultra", fast:"Fast", standard:"Std" } as const;
const SPEED_COLOR = { ultra:"#a78bfa", fast:"#34d399", standard:"#94a3b8" } as const;

/* ─── Provider grid card ──────────────────────────────────── */
function ProviderCard({ p, status, selected, onClick }: {
  p: Provider; status: ProviderStatus | undefined; selected: boolean; onClick: () => void;
}) {
  const live = status?.connected ?? false;
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative text-left rounded-2xl border transition-all duration-200 overflow-hidden p-4 flex flex-col gap-3",
        selected ? "border-white/25" : "border-white/[0.07] hover:border-white/15"
      )}
      style={{
        background: selected
          ? `linear-gradient(145deg, ${p.color}20, ${p.color}08)`
          : live
            ? `linear-gradient(145deg, ${p.color}10, transparent)`
            : "rgba(255,255,255,0.02)",
        boxShadow: selected
          ? `0 0 0 1px ${p.color}40, 0 8px 32px ${p.color}18`
          : live
            ? `0 0 0 1px ${p.color}25`
            : "none",
        "--c": p.color + "60",
      } as any}
    >
      {/* Selected accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl transition-all duration-300"
        style={{ background: selected ? `linear-gradient(90deg, ${p.color}, ${p.color}40)` : live ? `linear-gradient(90deg, ${p.color}60, transparent)` : "transparent" }} />

      {/* Icon row */}
      <div className="flex items-start justify-between">
        <div className={cn("relative rounded-xl p-2 border transition-all duration-300",
          selected || live ? "border-white/10" : "border-white/[0.06]")}
          style={{ background: `linear-gradient(135deg, ${p.color}20, ${p.color}08)` }}>
          <div className={cn(selected && "sh-float")}>
            <ProviderIcon id={p.id} size={30} color={p.color} />
          </div>
          {live && <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[#07070f] bg-emerald-400" />}
        </div>

        <div className="flex flex-col items-end gap-1">
          {live && (
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: `${p.color}20`, color: p.color, border: `1px solid ${p.color}40`, "--c": p.color + "60" } as any}>
              LIVE
            </span>
          )}
          {p.badge && !live && (
            <span className="text-[9px] font-bold px-1.5 py-px rounded-md"
              style={{ background: `${p.color}18`, color: p.color, border: `1px solid ${p.color}30` }}>
              {p.badge}
            </span>
          )}
          {p.free && (
            <span className="text-[8px] font-bold px-1.5 py-px rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">FREE</span>
          )}
        </div>
      </div>

      {/* Name + tagline */}
      <div>
        <div className="flex items-center gap-1.5">
          <span className={cn("text-[13px] font-black leading-none transition-colors",
            selected ? "text-white" : "text-white/80 group-hover:text-white")}>
            {p.name}
          </span>
          {p.recommended && <Star className="size-2.5 shrink-0 text-amber-400" fill="currentColor" />}
        </div>
        <p className="text-[10px] text-white/30 mt-1 leading-snug">{p.tagline}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1.5 mt-auto">
        <span className="text-[9px] font-semibold" style={{ color: SPEED_COLOR[p.speed] }}>{SPEED_LABEL[p.speed]}</span>
        <span className="text-white/10">·</span>
        <span className="text-[9px] text-white/25">{p.context}</span>
      </div>
    </button>
  );
}

/* ─── Ollama card ─────────────────────────────────────────── */
function OllamaCard({ status, ollamaUrl, selected, onClick }: {
  status: ProviderStatus | undefined; ollamaUrl: string | null; selected: boolean; onClick: () => void;
}) {
  const live = status?.connected ?? false;
  const FC = "#e879f9";
  return (
    <button onClick={onClick}
      className={cn("group relative text-left rounded-2xl border transition-all duration-200 overflow-hidden p-4 flex flex-col gap-3",
        selected ? "border-fuchsia-400/30" : "border-white/[0.07] hover:border-fuchsia-400/20")}
      style={{
        background: selected ? `linear-gradient(145deg, ${FC}20, #7c3aed10)` : live ? `linear-gradient(145deg, ${FC}10, transparent)` : "rgba(255,255,255,0.02)",
        boxShadow: selected ? `0 0 0 1px ${FC}40, 0 8px 32px ${FC}15` : live ? `0 0 0 1px ${FC}20` : "none",
      }}>
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: selected ? `linear-gradient(90deg, ${FC}, #7c3aed80)` : live ? `linear-gradient(90deg, ${FC}50, transparent)` : "transparent" }} />

      <div className="flex items-start justify-between">
        <div className={cn("relative rounded-xl p-2 border", selected || live ? "border-fuchsia-400/20" : "border-white/[0.06]")}
          style={{ background: `linear-gradient(135deg, ${FC}20, #7c3aed10)` }}>
          <div className={cn(selected && "sh-float")}>
            <ProviderIcon id="ollama" size={30} color={FC} />
          </div>
          {live && <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[#07070f] bg-emerald-400" />}
        </div>
        <div className="flex flex-col items-end gap-1">
          {live
            ? <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full" style={{ background: `${FC}20`, color: FC, border: `1px solid ${FC}40` }}>LIVE</span>
            : <span className="text-[9px] font-bold px-1.5 py-px rounded-md" style={{ background: `${FC}15`, color: FC, border: `1px solid ${FC}30` }}>GPU</span>
          }
          <span className="text-[8px] font-bold px-1.5 py-px rounded-md bg-violet-500/15 text-violet-300 border border-violet-500/25">LOCAL</span>
          <span className="text-[8px] font-bold px-1.5 py-px rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">FREE</span>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className={cn("text-[13px] font-black leading-none", selected ? "text-white" : "text-white/80 group-hover:text-white")}>Ollama</span>
        </div>
        <p className="text-[10px] text-white/30 mt-1 leading-snug">Self-hosted GPU · No API cost</p>
        {live && ollamaUrl && <p className="text-[9px] font-mono text-white/20 mt-0.5 truncate">{ollamaUrl}</p>}
      </div>
      <div className="flex items-center gap-1.5 mt-auto">
        <span className="text-[9px] font-semibold text-fuchsia-400">⚡ Ultra</span>
        <span className="text-white/10">·</span>
        <span className="text-[9px] text-white/25">Unlimited ∞</span>
      </div>
    </button>
  );
}

/* ─── Detail panel: cloud ─────────────────────────────────── */
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
    <div className={cn("sh-slide-up h-full flex flex-col", shake && "sh-shake", testing && "sh-scanning")} style={{ position: "relative" }}>
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 size-64 rounded-full blur-[80px] pointer-events-none opacity-20"
        style={{ backgroundColor: p.color }} />

      {/* Header */}
      <div className="shrink-0 p-6 pb-0">
        <div className="flex items-center gap-4">
          <div className="relative rounded-2xl p-3 border-2"
            style={{ background: `linear-gradient(135deg, ${p.color}25, ${p.color}10)`, borderColor: `${p.color}40`, boxShadow: live ? `0 0 24px ${p.color}40` : "none" }}>
            <ProviderIcon id={p.id} size={40} color={p.color} />
            {live && (
              <>
                <span className="absolute -top-1 -right-1 size-3.5 rounded-full border-2 border-[#07070f] bg-emerald-400" />
                <span className="absolute inset-0 rounded-2xl"
                  style={{ boxShadow: `0 0 0 4px ${p.color}15, 0 0 20px ${p.color}25` }} />
              </>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[22px] font-black text-white leading-none">{p.name}</h2>
              {p.badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${p.color}25`, color: p.color, border: `1px solid ${p.color}40` }}>{p.badge}</span>}
              {p.recommended && <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/25"><Star className="size-2.5" fill="currentColor" />Recommended</span>}
              {live && <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">● CONNECTED</span>}
            </div>
            <p className="text-[12px] text-white/35 mt-1">{p.tagline}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] font-semibold" style={{ color: SPEED_COLOR[p.speed] }}>{SPEED_LABEL[p.speed]}</span>
              <span className="text-[10px] text-white/25">{p.context} context</span>
              {p.free && <span className="text-[10px] text-emerald-400">Free tier ✓</span>}
              <a href={p.docsUrl} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-[10px] text-white/20 hover:text-indigo-400 transition-colors">
                <ExternalLink className="size-2.5" />Get key
              </a>
            </div>
          </div>
        </div>

        <p className="text-[12px] text-white/40 leading-relaxed mt-4">{p.description}</p>

        {/* Capability pills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {p.caps.map(cap => {
            const Icon = cap.icon;
            return (
              <span key={cap.label} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border"
                style={{ background: `${cap.color}15`, borderColor: `${cap.color}35`, color: cap.color }}>
                <Icon className="size-2.5" />{cap.label}
              </span>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-px mt-5" style={{ background: `linear-gradient(90deg, ${p.color}30, transparent)` }} />
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-5">
        {/* Models */}
        <div>
          <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">Models</p>
          <div className="flex flex-wrap gap-1.5">
            {p.models.map(m => (
              <span key={m.name} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono border bg-white/[0.03] border-white/[0.07] text-white/50 hover:border-white/15 hover:text-white/75 transition-colors">
                <span className="size-1 rounded-full" style={{ backgroundColor: p.color }} />
                {m.name}{m.note && <span className="text-white/20">· {m.note}</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Current key status */}
        {live && (
          <div className="sh-pop flex items-center gap-3 p-3 rounded-xl border"
            style={{ background: "#34d39910", borderColor: "#34d39928" }}>
            <div className="size-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#34d39920" }}>
              <CheckCircle2 className="size-4 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-emerald-400">API Key Active</p>
              <p className="text-[10px] font-mono text-white/30 mt-0.5">{status?.masked}</p>
            </div>
            {lastTested && <span className="shrink-0 flex items-center gap-1 text-[9px] text-white/20"><Clock className="size-2.5" />{lastTested.toLocaleTimeString()}</span>}
          </div>
        )}

        {/* Key input */}
        <div className="space-y-2">
          <label className="text-[9px] font-black text-white/20 uppercase tracking-widest">{live ? "Update API Key" : "API Key"}</label>
          <div className="relative">
            <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-white/15 pointer-events-none" />
            <input
              type={showKey ? "text" : "password"}
              value={key} onChange={e => setKey(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") doSave(); }}
              placeholder={p.keyPrefix}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl text-[12px] font-mono text-white/80 placeholder:text-white/12 outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)" }}
              onFocus={e => e.currentTarget.style.borderColor = p.color + "60"}
              onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
            />
            <button type="button" onClick={() => setShowKey(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors">
              {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
          <p className="text-[9px] text-white/12">Encrypted server-side · Enter ↵ to save</p>
        </div>

        {/* Test result */}
        {result && (
          <div className={cn("sh-pop flex items-start gap-2.5 p-3 rounded-xl border text-[11px]",
            result.success ? "bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-400" : "bg-red-500/[0.08] border-red-500/20 text-red-400")}>
            {result.success ? <CheckCircle2 className="size-4 shrink-0 mt-px" /> : <XCircle className="size-4 shrink-0 mt-px" />}
            <span>{result.message}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button onClick={doTest} disabled={testing || (!key.trim() && !live)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-semibold border transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30"
            style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" }}>
            {testing ? <Loader2 className="size-3.5 animate-spin" /> : <FlaskConical className="size-3.5" style={{ color: p.color }} />}
            {testing ? "Testing…" : "Test"}
          </button>
          <button onClick={doSave} disabled={saving || !key.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-[11px] font-black text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30"
            style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}aa)`, boxShadow: `0 2px 16px ${p.color}45` }}>
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <PlugZap className="size-3.5" />}
            {live ? "Update" : "Connect"}
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

/* ─── Detail panel: Ollama ────────────────────────────────── */
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
    <div className={cn("sh-slide-up h-full flex flex-col", shake && "sh-shake", testing && "sh-scanning")} style={{ position: "relative" }}>
      <div className="absolute top-0 right-0 size-72 rounded-full blur-[90px] pointer-events-none opacity-15" style={{ backgroundColor: FC }} />
      <div className="absolute bottom-0 left-0 size-48 rounded-full blur-[70px] pointer-events-none opacity-10" style={{ backgroundColor: "#7c3aed" }} />

      {/* Header */}
      <div className="shrink-0 p-6 pb-0">
        <div className="flex items-center gap-4">
          <div className="relative rounded-2xl p-3 border-2"
            style={{ background: `linear-gradient(135deg, ${FC}25, #7c3aed15)`, borderColor: `${FC}40`, boxShadow: live ? `0 0 24px ${FC}40` : "none" }}>
            <ProviderIcon id="ollama" size={40} color={FC} />
            {live && <span className="absolute -top-1 -right-1 size-3.5 rounded-full border-2 border-[#07070f] bg-emerald-400" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[22px] font-black text-white leading-none">Ollama</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${FC}20`, color: FC, border: `1px solid ${FC}40` }}>GPU LOCAL</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-400/25">CF TUNNEL</span>
              {live && <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">● CONNECTED</span>}
            </div>
            <p className="text-[12px] text-white/35 mt-1">Self-hosted · No API costs · Any model</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] font-semibold text-fuchsia-400">⚡ Ultra-fast</span>
              <span className="text-[10px] text-white/25">Unlimited ∞</span>
              <span className="text-[10px] text-emerald-400">Free ✓</span>
            </div>
          </div>
        </div>
        <p className="text-[12px] text-white/40 leading-relaxed mt-4">
          Run any model on your own GPU via Ollama. Connect directly at <span className="font-mono text-white/55">localhost:11434</span> or expose remotely through a Cloudflare tunnel — zero API cost, zero rate limits.
        </p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {[
            { icon: Cpu, label: "GPU Accelerated", color: FC },
            { icon: Server, label: "Self-hosted", color: "#818cf8" },
            { icon: Layers, label: "Any model", color: "#94a3b8" },
            { icon: Shield, label: "Private", color: "#34d399" },
          ].map(cap => (
            <span key={cap.label} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border"
              style={{ background: `${cap.color}15`, borderColor: `${cap.color}35`, color: cap.color }}>
              <cap.icon className="size-2.5" />{cap.label}
            </span>
          ))}
        </div>
        <div className="h-px mt-5" style={{ background: `linear-gradient(90deg, ${FC}30, transparent)` }} />
      </div>

      <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-5">
        {/* Popular models */}
        <div>
          <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">Popular models to pull</p>
          <div className="flex flex-wrap gap-1.5">
            {["llama3.2","deepseek-r1","qwen2.5","gemma3","phi4","mistral","codellama","llava","nomic-embed-text"].map(m => (
              <span key={m} className="px-2.5 py-1 rounded-lg text-[10px] font-mono border bg-white/[0.03] border-white/[0.07] text-white/40 hover:border-fuchsia-400/30 hover:text-fuchsia-300 transition-colors cursor-default">{m}</span>
            ))}
          </div>
          <p className="text-[9px] text-white/15 mt-2 font-mono">$ <span className="text-white/35">ollama pull llama3.2</span></p>
        </div>

        {live && ollamaUrl && (
          <div className="sh-pop flex items-center gap-3 p-3 rounded-xl border" style={{ background: "#34d39910", borderColor: "#34d39928" }}>
            <div className="size-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#34d39920" }}>
              <Globe className="size-4 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-emerald-400">Instance connected</p>
              <p className="text-[10px] font-mono text-white/30 mt-0.5 truncate">{ollamaUrl}</p>
            </div>
          </div>
        )}

        {/* URL input */}
        <div className="space-y-2">
          <label className="text-[9px] font-black text-white/20 uppercase tracking-widest">{live ? "Update Base URL" : "Base URL"}</label>
          <div className="relative">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-white/15 pointer-events-none" />
            <input type="url" value={url} onChange={e => setUrl(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") doSave(); }}
              placeholder="https://your-gpu.trycloudflare.com"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl text-[12px] font-mono text-white/80 placeholder:text-white/12 outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)" }}
              onFocus={e => e.currentTarget.style.borderColor = FC + "60"}
              onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
            />
          </div>
          <div className="flex gap-3 text-[9px] text-white/15">
            <span>Local: <span className="font-mono text-white/30">http://localhost:11434</span></span>
            <span>·</span>
            <span>Remote: <span className="font-mono text-white/30">https://xyz.trycloudflare.com</span></span>
          </div>
        </div>

        {/* Ollama test result */}
        {result && (
          <div className={cn("sh-pop rounded-xl border overflow-hidden", result.success ? "border-emerald-500/15" : "border-red-500/15")}>
            <div className={cn("flex items-center gap-2.5 px-4 py-3", result.success ? "bg-emerald-500/[0.08]" : "bg-red-500/[0.08]")}>
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
                  <div className="flex items-center gap-2">
                    <Terminal className="size-3 text-white/20" />
                    <span className="text-[9px] font-bold text-white/25 uppercase tracking-widest">Detected</span>
                  </div>
                  <span className="text-[9px] text-white/20">{result.models.length} models pulled</span>
                </div>
                {result.models.length === 0 ? (
                  <div className="px-4 py-4 text-center">
                    <span className="text-[10px] text-white/30">No models yet — </span>
                    <span className="font-mono text-[10px] text-white/50 bg-white/[0.06] px-2 py-0.5 rounded">ollama pull llama3.2</span>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.03] max-h-44 overflow-y-auto">
                    {result.models.map((m, i) => (
                      <div key={m.name} className="sh-pop flex items-center gap-3 px-4 py-2 hover:bg-white/[0.02] transition-colors"
                        style={{ animationDelay: `${i * 25}ms` }}>
                        <Activity className="size-3 shrink-0" style={{ color: FC + "70" }} />
                        <span className="flex-1 text-[11px] font-mono text-white/60 truncate">{m.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {m.quantization && <span className="text-[8px] font-mono bg-white/[0.05] px-1.5 py-px rounded text-white/30">{m.quantization}</span>}
                          {m.parameterSize && <span className="text-[9px] text-white/30">{m.parameterSize}</span>}
                          {m.size && m.size !== "unknown" && <span className="text-[9px] text-white/25 flex items-center gap-1"><HardDrive className="size-2.5" />{m.size}</span>}
                          {m.family && m.family !== "unknown" && <span className="text-[8px] font-mono px-1.5 py-px rounded border" style={{ background: FC + "10", color: FC + "a0", borderColor: FC + "20" }}>{m.family}</span>}
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-semibold border transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30"
            style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" }}>
            {testing ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5" style={{ color: FC }} />}
            {testing ? "Detecting…" : "Test & detect models"}
          </button>
          <button onClick={doSave} disabled={saving || !url.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-[11px] font-black text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30"
            style={{ background: `linear-gradient(135deg, ${FC}, #7c3aedcc)`, boxShadow: `0 2px 16px ${FC}45` }}>
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

/* ─── Main page ───────────────────────────────────────────── */
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
      setAiKeys(d.aiKeys || {});
      setOllamaUrl(d.ollamaBaseUrl || null);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

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
    await fetchSettings();
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
          <div className="sh-aurora absolute -top-40 -left-20 size-[500px] rounded-full blur-[130px]" style={{ background: "#6366f1", opacity: .12, "--dur": "22s" } as any} />
          <div className="sh-aurora absolute -bottom-24 right-10 size-96 rounded-full blur-[110px]" style={{ background: "#8b5cf6", opacity: .1, "--dur": "28s" } as any} />
          <div className="sh-aurora absolute top-1/3 left-1/2 size-72 rounded-full blur-[90px]" style={{ background: "#06b6d4", opacity: .07, "--dur": "35s" } as any} />
          {selected && selected !== "ollama" && selectedProvider && (
            <div className="absolute inset-0 pointer-events-none transition-all duration-700"
              style={{ background: `radial-gradient(ellipse at 70% 50%, ${selectedProvider.color}10, transparent 55%)` }} />
          )}
          {selected === "ollama" && (
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 70% 50%, #e879f90a, transparent 55%)" }} />
          )}
        </div>

        {/* Header */}
        <header className="relative z-10 shrink-0 flex items-center gap-4 px-6 h-14 border-b border-white/[0.06]"
          style={{ backdropFilter: "blur(20px)", background: "rgba(7,7,15,0.75)" }}>
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl flex items-center justify-center border border-indigo-500/25 bg-gradient-to-br from-indigo-500/20 to-violet-500/10">
              <Sparkles className="size-4 text-indigo-400" />
            </div>
            <div>
              <h1 className="font-black text-[15px] sh-glow-text leading-none">AI Models</h1>
              <p className="text-[9px] text-white/20 font-medium">{connectedCount} of 10 providers connected</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-white/20 pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                className="pl-7 pr-3 py-1.5 rounded-lg text-[11px] text-white/70 placeholder:text-white/20 outline-none w-32"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
            </div>
            <button onClick={() => fetchSettings()} className="p-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.07] text-white/30 hover:text-white/60 transition-colors">
              <RefreshCw className="size-3.5" />
            </button>
          </div>
        </header>

        {/* Content: grid left + detail right */}
        <div className="relative z-10 flex flex-1 min-h-0">

          {/* Left: grid */}
          <div className="w-[320px] shrink-0 overflow-y-auto p-4 space-y-4 border-r border-white/[0.05]"
            style={{ background: "rgba(0,0,0,0.2)", backdropFilter: "blur(8px)" }}>
            {loading ? (
              <div className="grid grid-cols-2 gap-2">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-36 rounded-2xl sh-shimmer-bg" style={{ animationDelay: `${i * 80}ms` }} />
                ))}
              </div>
            ) : (
              <>
                {showOllama && (
                  <div>
                    <p className="text-[8.5px] font-black text-white/15 uppercase tracking-[.18em] px-1 mb-2">⚡ Local GPU</p>
                    <OllamaCard status={aiKeys["ollamaBaseUrl"]} ollamaUrl={ollamaUrl}
                      selected={selected === "ollama"} onClick={() => setSelected("ollama")} />
                  </div>
                )}
                {filteredProviders.length > 0 && (
                  <div>
                    <p className="text-[8.5px] font-black text-white/15 uppercase tracking-[.18em] px-1 mb-2">☁ Cloud Providers</p>
                    <div className="grid grid-cols-2 gap-2">
                      {filteredProviders.map(p => (
                        <ProviderCard key={p.id} p={p} status={aiKeys[p.field]}
                          selected={selected === p.id} onClick={() => setSelected(p.id)} />
                      ))}
                    </div>
                  </div>
                )}
                {filteredProviders.length === 0 && !showOllama && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <WifiOff className="size-8 text-white/10" />
                    <span className="text-[11px] text-white/25">No matches</span>
                    <button onClick={() => setSearch("")} className="text-[10px] text-indigo-400 hover:text-indigo-300">Clear search</button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right: detail */}
          <main className="flex-1 min-w-0 overflow-hidden">
            {!selected && (
              <div className="h-full flex flex-col items-center justify-center gap-5 p-8">
                <div className="relative">
                  <div className="size-20 rounded-3xl border border-white/[0.07] bg-gradient-to-br from-white/[0.04] to-transparent flex items-center justify-center">
                    <Sparkles className="size-9 text-white/10" />
                  </div>
                  <div className="absolute inset-0 rounded-3xl blur-xl bg-indigo-500/10 -z-10" />
                </div>
                <div className="text-center">
                  <p className="text-[16px] font-black text-white/30">Select a provider</p>
                  <p className="text-[12px] text-white/15 mt-1.5">Pick from the grid to connect API keys</p>
                </div>
                <div className="flex flex-col items-center gap-1.5 text-[10px] text-white/10">
                  <span>10 providers · 1 local GPU + 9 cloud</span>
                  <div className="flex items-center gap-1">
                    <ArrowRight className="size-3" />
                    <span>Click any card to get started</span>
                  </div>
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
