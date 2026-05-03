import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Send, Square, Sparkles, ChevronDown, ChevronUp,
  Bookmark, Tag, Trash2, FolderPlus, Star, Archive,
  Pin, Edit3, Zap, CheckCircle2, AlertCircle,
  Activity, Clock, Cpu, Wifi, Brain, Copy,
  RotateCcw, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAuthToken } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";

/* ─── Types ───────────────────────────────────────────────── */
type ChatStats = { model: string; inputTokens: number; outputTokens: number; latency: number };
type ActionResult = { action: any; result: { success: boolean; message: string; data?: any } };
type Msg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  streaming?: boolean;
  actions?: ActionResult[];
  stats?: ChatStats;
  error?: boolean;
};

/* ─── CSS (injected once) ────────────────────────────────── */
const CHAT_CSS = `
@keyframes ai-dot-1 { 0%,60%,100%{transform:translateY(0);opacity:.5} 30%{transform:translateY(-7px);opacity:1} }
@keyframes ai-dot-2 { 0%,20%,80%,100%{transform:translateY(0);opacity:.5} 50%{transform:translateY(-7px);opacity:1} }
@keyframes ai-dot-3 { 0%,40%,100%{transform:translateY(0);opacity:.5} 70%{transform:translateY(-7px);opacity:1} }
@keyframes ai-cursor { 0%,100%{opacity:1} 50%{opacity:0} }
@keyframes ai-action-in { 0%{transform:scale(.82) translateY(12px) rotate(-1deg);opacity:0} 70%{transform:scale(1.03) translateY(-2px)} 100%{transform:scale(1) translateY(0);opacity:1} }
@keyframes ai-msg-r { 0%{transform:translateX(28px) scale(.9);opacity:0} 100%{transform:translateX(0) scale(1);opacity:1} }
@keyframes ai-msg-l { 0%{transform:translateX(-28px) scale(.9);opacity:0} 100%{transform:translateX(0) scale(1);opacity:1} }
@keyframes ai-orb-1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,-25px) scale(1.12)} 66%{transform:translate(-25px,30px) scale(.9)} }
@keyframes ai-orb-2 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-45px,30px) scale(1.15)} 75%{transform:translate(30px,-18px) scale(.88)} }
@keyframes ai-orb-3 { 0%,100%{transform:translate(0,0) scale(1)} 55%{transform:translate(20px,35px) scale(1.08)} }
@keyframes ai-stats-in { 0%{transform:translateY(-8px);opacity:0} 100%{transform:translateY(0);opacity:1} }
@keyframes ai-ping { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.5)} 50%{box-shadow:0 0 0 6px rgba(34,197,94,0)} }
@keyframes ai-send { 0%{transform:scale(1)} 35%{transform:scale(.78)} 70%{transform:scale(1.08)} 100%{transform:scale(1)} }
@keyframes ai-shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
@keyframes ai-bg-pulse { 0%,100%{opacity:.7} 50%{opacity:1} }
@keyframes ai-suggestion-in { 0%{transform:translateY(10px);opacity:0} 100%{transform:translateY(0);opacity:1} }
@keyframes ai-ring-spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
@keyframes ai-ring-spin-rev { 0%{transform:rotate(0deg)} 100%{transform:rotate(-360deg)} }
@keyframes ai-burst { 0%{transform:scale(0.6);opacity:1} 100%{transform:scale(2.2);opacity:0} }
@keyframes ai-backdrop-glow { 0%,100%{opacity:.45} 50%{opacity:.7} }
@keyframes ai-border-glow { 0%,100%{opacity:.5} 50%{opacity:1} }

._ai-d1 { animation: ai-dot-1 1.4s ease-in-out infinite; }
._ai-d2 { animation: ai-dot-2 1.4s ease-in-out infinite; }
._ai-d3 { animation: ai-dot-3 1.4s ease-in-out infinite; }
._ai-cur { display:inline-block; width:2px; height:.9em; background:rgba(139,92,246,.9); margin-left:2px; border-radius:1px; vertical-align:-.05em; animation: ai-cursor .85s ease-in-out infinite; }
._ai-act { animation: ai-action-in .45s cubic-bezier(.22,1,.36,1) both; }
._ai-mr  { animation: ai-msg-r  .38s cubic-bezier(.22,1,.36,1) both; }
._ai-ml  { animation: ai-msg-l  .38s cubic-bezier(.22,1,.36,1) both; }
._ai-o1  { animation: ai-orb-1  9s  ease-in-out infinite; }
._ai-o2  { animation: ai-orb-2  13s ease-in-out infinite; }
._ai-o3  { animation: ai-orb-3  17s ease-in-out infinite; }
._ai-stats { animation: ai-stats-in .28s ease both; }
._ai-ping  { animation: ai-ping  2.2s ease-in-out infinite; }
._ai-send  { animation: ai-send  .32s cubic-bezier(.22,1,.36,1) both; }
._ai-bgp   { animation: ai-bg-pulse 6s ease-in-out infinite; }
._ai-sugg  { animation: ai-suggestion-in .4s cubic-bezier(.22,1,.36,1) both; }
._ai-ring1 { animation: ai-ring-spin 4s linear infinite; }
._ai-ring2 { animation: ai-ring-spin-rev 6s linear infinite; }
._ai-burst { animation: ai-burst .65s cubic-bezier(.22,1,.36,1) both; }
._ai-bglow { animation: ai-backdrop-glow 5s ease-in-out infinite; }
._ai-bdglow { animation: ai-border-glow 3s ease-in-out infinite; }

._ai-msg-text {
  text-shadow: 0 0 20px rgba(0,0,0,1), 0 2px 8px rgba(0,0,0,1), 0 1px 2px rgba(0,0,0,1);
  color: #fff;
  font-weight: 450;
}
._ai-msg-text strong { color: #fff; font-weight: 700; }
._ai-msg-text em { color: #e0e0ff; }
._ai-glass-ui {
  text-shadow: 0 0 16px rgba(0,0,0,1), 0 1px 4px rgba(0,0,0,1);
}

._ai-title {
  background: linear-gradient(90deg,#818cf8 0%,#a78bfa 25%,#67e8f9 50%,#a78bfa 75%,#818cf8 100%);
  background-size: 200% auto;
  animation: ai-shimmer 3.5s linear infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
._ai-code {
  background: rgba(139,92,246,.15);
  border: 1px solid rgba(139,92,246,.2);
  padding: 1px 5px;
  border-radius: 5px;
  color: #a78bfa;
  font-size: .88em;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
`;

/* ─── Helpers ─────────────────────────────────────────────── */
function genId() { return Math.random().toString(36).slice(2); }

function cleanText(raw: string): string {
  return raw
    .replace(/<execute>[\s\S]*?<\/execute>/g, "")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code class="_ai-code">$1</code>')
    .replace(/\n/g, "<br/>")
    .trim();
}

function fmtTokens(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
}

function fmtLatency(ms: number) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

/* ─── Action icon map ─────────────────────────────────────── */
const ACTION_ICON: Record<string, React.ReactNode> = {
  add_bookmark:      <Bookmark className="size-3.5" />,
  delete_bookmark:   <Trash2 className="size-3.5" />,
  delete_bookmarks:  <Trash2 className="size-3.5" />,
  update_bookmark:   <Edit3 className="size-3.5" />,
  bulk_tag:          <Tag className="size-3.5" />,
  remove_tags:       <Tag className="size-3.5" />,
  create_collection: <FolderPlus className="size-3.5" />,
  move_collection:   <FolderPlus className="size-3.5" />,
  toggle_favorite:   <Star className="size-3.5" />,
  toggle_archive:    <Archive className="size-3.5" />,
  toggle_pin:        <Pin className="size-3.5" />,
  set_note:          <Edit3 className="size-3.5" />,
};

/* ─── Sub-components ─────────────────────────────────────── */
function BotOrb() {
  return (
    <div className="size-9 rounded-full shrink-0 flex items-center justify-center"
      style={{
        background: "radial-gradient(circle at 30% 28%, rgba(255,255,255,.88) 0%, #c4b5fd 26%, #7c3aed 56%, #4c1d95cc 100%)",
        boxShadow: "0 5px 20px rgba(124,58,237,.55), 0 2px 8px rgba(0,0,0,.4), inset 0 1px 4px rgba(255,255,255,.5)",
      }}>
      <Brain className="size-4 text-white drop-shadow-sm" />
    </div>
  );
}

function UserOrb({ letter = "U" }: { letter?: string }) {
  return (
    <div className="size-8 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black text-white/90 uppercase"
      style={{
        background: "radial-gradient(circle at 30% 28%, rgba(255,255,255,.85) 0%, #a5b4fc 25%, #4f46e5 55%, #3730a3cc 100%)",
        boxShadow: "0 4px 14px rgba(99,102,241,.45), inset 0 1px 3px rgba(255,255,255,.4)",
      }}>
      {letter}
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex gap-2.5 mb-4 _ai-ml">
      <BotOrb />
      <div className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-3">
        <span className="text-[11px] text-violet-300 font-semibold tracking-wide _ai-glass-ui">Thinking</span>
        <div className="flex items-center gap-1.5">
          <span className="size-[7px] rounded-full bg-violet-400 _ai-d1" />
          <span className="size-[7px] rounded-full bg-indigo-400 _ai-d2" />
          <span className="size-[7px] rounded-full bg-cyan-400 _ai-d3" />
        </div>
      </div>
    </div>
  );
}

function ActionCard({ ar, delay = 0 }: { ar: ActionResult; delay?: number }) {
  const icon = ACTION_ICON[ar.action?.action] ?? <Zap className="size-3.5" />;
  const ok = ar.result.success;
  return (
    <div
      className={cn(
        "_ai-act flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[11.5px] border mt-1.5",
        ok
          ? "bg-emerald-500/[0.07] border-emerald-500/20 text-emerald-300"
          : "bg-red-500/[0.07] border-red-500/18 text-red-300"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={cn(
        "size-6 rounded-lg flex items-center justify-center shrink-0",
        ok ? "bg-emerald-500/15" : "bg-red-500/15"
      )}>
        {ok ? icon : <AlertCircle className="size-3.5" />}
      </div>
      <span className="font-medium flex-1">{ar.result.message}</span>
      {ok
        ? <CheckCircle2 className="size-3.5 shrink-0 opacity-50" />
        : <AlertCircle className="size-3.5 shrink-0 opacity-50" />
      }
    </div>
  );
}

function StatsPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border text-[10.5px]", color)}>
      {icon}
      <span className="opacity-60">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  );
}

function MsgBubble({ msg, userLetter }: { msg: Msg; userLetter: string }) {
  const isUser = msg.role === "user";
  const html = isUser
    ? msg.text.replace(/\n/g, "<br/>")
    : cleanText(msg.text);

  return (
    <div className={cn("flex gap-2.5 mb-3", isUser ? "flex-row-reverse _ai-mr" : "flex-row _ai-ml")}>
      {isUser ? <UserOrb letter={userLetter} /> : <BotOrb />}
      <div className={cn("max-w-[80%] flex flex-col gap-1.5", isUser ? "items-end" : "items-start")}>
        <div className={cn(
          "px-1 py-1 text-[13.5px] leading-relaxed",
          isUser
            ? "bg-white/[0.15] border border-white/[0.2] rounded-2xl rounded-tr-sm px-4 py-2.5 text-white"
            : msg.error
              ? "text-red-300 rounded-tl-sm"
              : "text-white rounded-tl-sm"
        )}>
          {html ? <span className="_ai-msg-text" dangerouslySetInnerHTML={{ __html: html }} /> : null}
          {msg.streaming && <span className="_ai-cur" />}
        </div>
        {msg.actions && msg.actions.length > 0 && (
          <div className="flex flex-col gap-0.5 w-full">
            {msg.actions.map((ar, i) => <ActionCard key={i} ar={ar} delay={i * 80} />)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Suggestions ─────────────────────────────────────────── */
const SUGGESTIONS = [
  { text: "Add https://github.com to my library", icon: <Bookmark className="size-3" /> },
  { text: "Show all untagged bookmarks", icon: <Tag className="size-3" /> },
  { text: "Tag all AI bookmarks with 'machine-learning'", icon: <Tag className="size-3" /> },
  { text: "Create a collection called 'Reading List'", icon: <FolderPlus className="size-3" /> },
  { text: "Star my top 5 most recent bookmarks", icon: <Star className="size-3" /> },
  { text: "Archive all bookmarks older than 2023", icon: <Archive className="size-3" /> },
  { text: "What's my most bookmarked domain?", icon: <Activity className="size-3" /> },
  { text: "Find and delete duplicate bookmarks", icon: <Trash2 className="size-3" /> },
];

/* ─── Main Component ─────────────────────────────────────── */
interface UltraAiChatProps {
  onClose: () => void;
  userLetter?: string;
  onRefresh?: () => void;
}

export function UltraAiChat({ onClose, userLetter = "U", onRefresh }: UltraAiChatProps) {
  const [messages, setMessages] = useState<Msg[]>([{
    id: genId(),
    role: "assistant",
    text: "Hello! I'm **Haven AI** — your full-power bookmark assistant.\n\nI can **add**, **delete**, **tag**, **organize**, and **analyze** every bookmark in your library. Just tell me what to do in plain English, and I'll execute it instantly.\n\nWhat would you like to do?",
  }]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [lastStats, setLastStats] = useState<ChatStats | null>(null);
  const [ping, setPing] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [styleInjected, setStyleInjected] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sendBtnRef = useRef<HTMLButtonElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const historyRef = useRef<Array<{ role: string; parts: Array<{ text: string }> }>>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!styleInjected) {
      const style = document.createElement("style");
      style.textContent = CHAT_CSS;
      document.head.appendChild(style);
      setStyleInjected(true);
    }
  }, [styleInjected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;

    setInput("");
    if (sendBtnRef.current) {
      sendBtnRef.current.classList.add("_ai-send");
      setTimeout(() => sendBtnRef.current?.classList.remove("_ai-send"), 400);
    }

    const userMsgId = genId();
    const asstMsgId = genId();

    setMessages(prev => [...prev, { id: userMsgId, role: "user", text: msg }]);
    setThinking(true);
    setStreaming(true);

    const history = historyRef.current;
    const controller = new AbortController();
    abortRef.current = controller;
    const pingStart = Date.now();

    try {
      const token = getAuthToken();
      const BASE = (import.meta.env.BASE_URL || "").replace(/\/$/, "");
      const resp = await fetch(`${BASE}/api/gemini/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: msg, history }),
        signal: controller.signal,
      });

      setPing(Date.now() - pingStart);
      setThinking(false);
      setMessages(prev => [...prev, { id: asstMsgId, role: "assistant", text: "", streaming: true }]);

      if (!resp.ok) {
        const err = await resp.json() as any;
        setMessages(prev => prev.map(m => m.id === asstMsgId
          ? { ...m, streaming: false, text: err.error || "API error", error: true }
          : m));
        setStreaming(false);
        return;
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let fullText = "";
      const actions: ActionResult[] = [];
      let eventType = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const json = line.slice(6).trim();
            if (!json) continue;
            try {
              const data = JSON.parse(json);
              if (eventType === "chunk") {
                fullText += data.text;
                setMessages(prev => prev.map(m => m.id === asstMsgId ? { ...m, text: fullText } : m));
              } else if (eventType === "action_result") {
                actions.push(data);
                setMessages(prev => prev.map(m => m.id === asstMsgId ? { ...m, actions: [...actions] } : m));
                queryClient.invalidateQueries();
                if (onRefresh) onRefresh();
              } else if (eventType === "done") {
                setLastStats(data.stats);
                setMessages(prev => prev.map(m => m.id === asstMsgId
                  ? { ...m, streaming: false, stats: data.stats, actions: [...actions] }
                  : m));
                setStreaming(false);
                historyRef.current = [
                  ...history,
                  { role: "user", parts: [{ text: msg }] },
                  { role: "model", parts: [{ text: fullText }] },
                ];
              } else if (eventType === "error") {
                setMessages(prev => prev.map(m => m.id === asstMsgId
                  ? { ...m, streaming: false, text: data.error || "An error occurred", error: true }
                  : m));
                setStreaming(false);
              }
              eventType = "";
            } catch { /* ignore */ }
          }
        }
      }
    } catch (e: any) {
      if (e.name === "AbortError") {
        setMessages(prev => prev.map(m => m.id === asstMsgId
          ? { ...m, streaming: false, text: m.text || "Stopped." }
          : m));
      } else {
        setThinking(false);
        setMessages(prev => {
          const existing = prev.find(m => m.id === asstMsgId);
          if (existing) {
            return prev.map(m => m.id === asstMsgId
              ? { ...m, streaming: false, text: "Connection error. Please try again.", error: true }
              : m);
          }
          return [...prev, { id: asstMsgId, role: "assistant", text: "Connection error. Please try again.", error: true }];
        });
      }
      setStreaming(false);
    }
  }, [input, streaming, onRefresh, queryClient]);

  const stop = () => {
    abortRef.current?.abort();
  };

  const copyLast = () => {
    const last = [...messages].reverse().find(m => m.role === "assistant");
    if (last) {
      navigator.clipboard.writeText(last.text.replace(/<execute>[\s\S]*?<\/execute>/g, "").trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const reset = () => {
    historyRef.current = [];
    setMessages([{
      id: genId(),
      role: "assistant",
      text: "Conversation cleared. Ready for a fresh start! What would you like to do?",
    }]);
    setLastStats(null);
    setPing(null);
  };

  const showSuggestions = messages.length <= 1 && !streaming;

  return (
    <>
      {/* Dim backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="fixed inset-0 z-[998]"
        style={{ background: "rgba(0,0,0,0.2)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[999] flex items-center justify-center pointer-events-none" style={{ padding: 20 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: "spring" as const, stiffness: 380, damping: 30 }}
          className="flex flex-col pointer-events-auto"
          style={{
            width: "min(560px, calc(100vw - 40px))",
            height: "min(700px, calc(100vh - 60px))",
            borderRadius: 20,
            overflow: "hidden",
            background: "transparent",
            backdropFilter: "blur(20px) saturate(1.6)",
            WebkitBackdropFilter: "blur(20px) saturate(1.6)",
            border: "1px solid rgba(255,255,255,0.18)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Header ─────────────────────────────────────────── */}
          <div className="shrink-0 flex items-center gap-3 px-5 py-4 border-b border-white/[0.12]" style={{ background: "rgba(0,0,0,0.1)" }}>
            <div className="relative shrink-0">
              <BotOrb />
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 border-2 border-[#0a081c] _ai-ping" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="_ai-title text-[15px] font-bold tracking-tight">Haven AI</h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-semibold">online</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-white/70 font-mono _ai-glass-ui">gemini-2.0-flash</span>
                {ping !== null && <><span className="text-white/40 _ai-glass-ui">·</span><span className="text-[10px] text-white/70 font-mono _ai-glass-ui">{ping}ms</span></>}
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              <button onClick={copyLast} title="Copy" className="size-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.1] transition-all" style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.8))" }}>
                <Copy className="size-3.5" />
              </button>
              <button onClick={reset} title="Clear" className="size-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.1] transition-all" style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.8))" }}>
                <RotateCcw className="size-3.5" />
              </button>
              <button onClick={() => setShowStats(v => !v)} title="Stats"
                className={cn("size-8 rounded-lg flex items-center justify-center transition-all",
                  showStats ? "text-violet-300 bg-violet-500/15" : "text-white/60 hover:text-white hover:bg-white/[0.1]")}
                style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.8))" }}>
                <Activity className="size-3.5" />
              </button>
              <button onClick={onClose} className="size-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.1] transition-all ml-0.5" style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.8))" }}>
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <AnimatePresence>
            {showStats && lastStats && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden border-b border-white/[0.06]">
                <div className="flex flex-wrap gap-1.5 px-5 py-2.5 _ai-stats">
                  <StatsPill icon={<Cpu className="size-3" />} label="Model" value={lastStats.model} color="bg-violet-500/[0.08] border-violet-500/20 text-violet-300" />
                  <StatsPill icon={<MessageSquare className="size-3" />} label="In" value={fmtTokens(lastStats.inputTokens)} color="bg-indigo-500/[0.08] border-indigo-500/20 text-indigo-300" />
                  <StatsPill icon={<Sparkles className="size-3" />} label="Out" value={fmtTokens(lastStats.outputTokens)} color="bg-cyan-500/[0.08] border-cyan-500/20 text-cyan-300" />
                  <StatsPill icon={<Clock className="size-3" />} label="Latency" value={fmtLatency(lastStats.latency)} color="bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-300" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Messages ────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-0.5 scrollbar-thin scrollbar-thumb-white/[0.08] scrollbar-track-transparent">
            <AnimatePresence initial={false}>
              {messages.map(m => <MsgBubble key={m.id} msg={m} userLetter={userLetter} />)}
            </AnimatePresence>
            {thinking && <ThinkingBubble />}
            <div ref={bottomRef} />
          </div>

          {/* ── Suggestion chips ──────────────────────────────── */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }} className="px-5 pb-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/30 mb-2">Try asking</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((s, i) => (
                    <button key={s.text} onClick={() => send(s.text)}
                      className="_ai-sugg flex items-center gap-1.5 text-[11px] font-medium bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] hover:border-white/[0.2] text-white/60 hover:text-white/90 rounded-lg px-2.5 py-1.5 transition-all"
                      style={{ animationDelay: `${i * 35}ms` }}>
                      <span className="opacity-50">{s.icon}</span>{s.text}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Input ──────────────────────────────────────────── */}
          <div className="shrink-0 px-4 pb-4 pt-3 border-t border-white/[0.12]" style={{ background: "rgba(0,0,0,0.1)" }}>
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                  if (e.key === "Escape") onClose();
                }}
                placeholder="Add a link, delete bookmarks, tag, organize… anything"
                rows={1}
                disabled={streaming}
                className="flex-1 resize-none min-h-[44px] max-h-[120px] px-4 py-3 rounded-xl text-[13px] text-white placeholder:text-white/50 outline-none transition-all border disabled:opacity-40"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  borderColor: "rgba(255,255,255,0.2)",
                  lineHeight: "1.5",
                  textShadow: "0 1px 8px rgba(0,0,0,0.9)",
                }}
                onFocus={e => { e.target.style.borderColor = "rgba(167,139,250,0.7)"; e.target.style.background = "rgba(255,255,255,0.14)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.2)"; e.target.style.background = "rgba(255,255,255,0.1)"; }}
              />

              {streaming ? (
                <button onClick={stop} className="size-11 rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20">
                  <Square className="size-4 text-red-400" />
                </button>
              ) : (
                <button ref={sendBtnRef} onClick={() => send()} disabled={!input.trim()}
                  className="size-11 rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-25 disabled:scale-100"
                  style={{ background: "linear-gradient(135deg,#6366f1,#7c3aed)", boxShadow: input.trim() ? "0 4px 16px rgba(99,102,241,.4)" : "none" }}>
                  <Send className="size-4 text-white" />
                </button>
              )}
            </div>

            <div className="flex justify-between items-center mt-2 px-1">
              <p className="text-[10px] text-white/25 font-mono">⌘J toggle · Esc close · Enter send</p>
              {copied && <span className="text-[10px] text-emerald-400 font-medium">Copied!</span>}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
