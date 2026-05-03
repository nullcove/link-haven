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
      <div className="bg-white/[0.06] border border-violet-500/15 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-3 shadow-lg">
        <span className="text-[11px] text-violet-300/60 font-semibold tracking-wide">Thinking</span>
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
          "rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed",
          isUser
            ? "bg-gradient-to-br from-indigo-600/30 to-violet-600/22 border border-indigo-500/25 text-white rounded-tr-sm shadow-lg shadow-indigo-900/20"
            : msg.error
              ? "bg-red-500/[0.08] border border-red-500/18 text-red-200/85 rounded-tl-sm"
              : "bg-white/[0.055] border border-white/[0.08] text-white/88 rounded-tl-sm shadow-lg shadow-black/20"
        )}>
          {html ? <span dangerouslySetInnerHTML={{ __html: html }} /> : null}
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
      {/* ── Backdrop ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28 }}
        className="fixed inset-0 z-[998] flex items-center justify-center"
        style={{ background: "rgba(2,2,14,.82)", backdropFilter: "blur(14px) saturate(1.4)" }}
        onClick={onClose}
      >
        {/* animated backdrop glows */}
        <div className="_ai-bglow absolute pointer-events-none"
          style={{ width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,.18) 0%, transparent 65%)", filter: "blur(80px)", top: "20%", left: "25%" }} />
        <div className="_ai-bglow absolute pointer-events-none"
          style={{ width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,.14) 0%, transparent 65%)", filter: "blur(70px)", bottom: "15%", right: "20%", animationDelay: "2.5s" }} />
      </motion.div>

      {/* ── Burst ring (fires once on open) ───────────────────── */}
      <motion.div
        initial={{ opacity: 1, scale: 0.55 }}
        animate={{ opacity: 0, scale: 2.1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="fixed z-[999] pointer-events-none"
        style={{
          top: "50%", left: "50%",
          width: 520, height: 520,
          marginTop: -260, marginLeft: -260,
          borderRadius: "50%",
          border: "1.5px solid rgba(139,92,246,.55)",
          boxShadow: "0 0 40px rgba(99,102,241,.3), inset 0 0 40px rgba(139,92,246,.15)",
        }}
      />
      <motion.div
        initial={{ opacity: 0.7, scale: 0.55 }}
        animate={{ opacity: 0, scale: 1.75 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.07 }}
        className="fixed z-[999] pointer-events-none"
        style={{
          top: "50%", left: "50%",
          width: 520, height: 520,
          marginTop: -260, marginLeft: -260,
          borderRadius: "50%",
          border: "1px solid rgba(99,102,241,.35)",
        }}
      />

      {/* ── Modal wrapper — flex-center so Framer transform doesn't fight CSS translate ── */}
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none"
        style={{ padding: "16px" }}
      >
      <motion.div
        initial={{ opacity: 0, scale: 0.82, y: 36, filter: "blur(14px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, scale: 0.88, y: 18, filter: "blur(10px)" }}
        transition={{ type: "spring" as const, stiffness: 400, damping: 32, mass: 0.88 }}
        className="flex flex-col overflow-hidden pointer-events-auto"
        style={{
          width: "min(560px, calc(100vw - 32px))",
          height: "min(720px, calc(100vh - 56px))",
          borderRadius: 24,
          background: "transparent",
          boxShadow: [
            "0 0 0 1px rgba(139,92,246,.25)",
            "0 0 0 2px rgba(99,102,241,.09)",
            "0 32px 80px rgba(0,0,0,.78)",
            "0 12px 40px rgba(99,102,241,.2)",
            "0 4px 12px rgba(0,0,0,.65)",
            "inset 0 1px 0 rgba(255,255,255,.07)",
          ].join(", "),
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* spinning glow ring outer */}
        <div className="absolute pointer-events-none"
          style={{
            inset: -2, borderRadius: 26, zIndex: 0,
            background: "transparent",
            overflow: "hidden",
          }}>
          <div className="_ai-ring1 absolute"
            style={{
              inset: -80,
              background: "conic-gradient(from 0deg, transparent 0%, rgba(99,102,241,.0) 30%, rgba(139,92,246,.5) 48%, rgba(6,182,212,.4) 52%, rgba(99,102,241,.0) 70%, transparent 100%)",
              borderRadius: "50%",
            }} />
        </div>
        {/* spinning glow ring inner (reverse, slower) */}
        <div className="absolute pointer-events-none"
          style={{
            inset: -1, borderRadius: 25, zIndex: 0,
            overflow: "hidden",
          }}>
          <div className="_ai-ring2 absolute"
            style={{
              inset: -80,
              background: "conic-gradient(from 180deg, transparent 0%, rgba(236,72,153,.0) 35%, rgba(99,102,241,.28) 48%, rgba(139,92,246,.22) 52%, rgba(236,72,153,.0) 65%, transparent 100%)",
              borderRadius: "50%",
            }} />
        </div>

        {/* ── Aurora background ─────────────────────────────── */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1, borderRadius: 24 }}>
          <div style={{
            position: "absolute", inset: 0, borderRadius: 24,
            background: "radial-gradient(ellipse at 20% 90%, rgba(99,102,241,.22) 0%, transparent 50%), radial-gradient(ellipse at 85% 8%, rgba(139,92,246,.18) 0%, transparent 45%), radial-gradient(ellipse at 50% 50%, rgba(6,182,212,.05) 0%, transparent 65%), radial-gradient(ellipse at 2% 2%, rgba(236,72,153,.07) 0%, transparent 38%), #040412",
          }} />
          <div className="_ai-o1 _ai-bgp absolute rounded-full pointer-events-none"
            style={{ width: 320, height: 320, top: "5%", left: "-12%", background: "radial-gradient(circle, rgba(99,102,241,.2) 0%, transparent 70%)", filter: "blur(50px)" }} />
          <div className="_ai-o2 _ai-bgp absolute rounded-full pointer-events-none"
            style={{ width: 280, height: 280, bottom: "10%", right: "-8%", background: "radial-gradient(circle, rgba(139,92,246,.18) 0%, transparent 70%)", filter: "blur(45px)", animationDelay: "2s" }} />
          <div className="_ai-o3 _ai-bgp absolute rounded-full pointer-events-none"
            style={{ width: 200, height: 200, top: "45%", right: "20%", background: "radial-gradient(circle, rgba(6,182,212,.1) 0%, transparent 70%)", filter: "blur(40px)", animationDelay: "5s" }} />
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,.025) 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: .5, borderRadius: 24 }} />
        </div>

        {/* ── Content ────────────────────────────────────────── */}
        <div className="relative flex flex-col h-full" style={{ zIndex: 2 }}>

          {/* Header */}
          <div className="shrink-0 px-4 pt-4 pb-3 border-b border-white/[0.07]"
            style={{ background: "linear-gradient(180deg, rgba(10,8,28,.9) 0%, rgba(6,5,18,.75) 100%)", backdropFilter: "blur(20px)", borderRadius: "24px 24px 0 0" }}>
            <div className="flex items-center gap-3">
              {/* Bot orb */}
              <div className="relative">
                <BotOrb />
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 border-[2px] border-[#040412] _ai-ping" />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="_ai-title text-[17px] font-black tracking-tight">Haven AI</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-white/30 font-mono">gemini-2.0-flash</span>
                  <span className="size-0.5 rounded-full bg-white/15" />
                  <span className="text-[10px] text-white/30">Full library access</span>
                  {ping !== null && (
                    <>
                      <span className="size-0.5 rounded-full bg-white/15" />
                      <span className="text-[10px] text-emerald-400/70 font-mono">{ping}ms</span>
                    </>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1">
                <button onClick={copyLast} title="Copy last reply"
                  className="size-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.07] transition-all">
                  <Copy className="size-3.5" />
                </button>
                <button onClick={reset} title="Clear conversation"
                  className="size-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.07] transition-all">
                  <RotateCcw className="size-3.5" />
                </button>
                <button
                  onClick={() => setShowStats(v => !v)}
                  title="Toggle stats"
                  className={cn(
                    "size-7 rounded-lg flex items-center justify-center transition-all",
                    showStats ? "text-violet-400 bg-violet-500/10" : "text-white/30 hover:text-white/70 hover:bg-white/[0.07]"
                  )}>
                  <Activity className="size-3.5" />
                </button>
                <button onClick={onClose}
                  className="size-7 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400/80 hover:bg-red-500/[0.08] transition-all ml-1">
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Stats bar (collapsible) */}
            <AnimatePresence>
              {showStats && lastStats && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-1.5 mt-3 _ai-stats">
                    <StatsPill
                      icon={<Cpu className="size-3" />}
                      label="Model"
                      value={lastStats.model}
                      color="bg-violet-500/[0.08] border-violet-500/20 text-violet-300"
                    />
                    <StatsPill
                      icon={<MessageSquare className="size-3" />}
                      label="In"
                      value={fmtTokens(lastStats.inputTokens)}
                      color="bg-indigo-500/[0.08] border-indigo-500/20 text-indigo-300"
                    />
                    <StatsPill
                      icon={<Sparkles className="size-3" />}
                      label="Out"
                      value={fmtTokens(lastStats.outputTokens)}
                      color="bg-cyan-500/[0.08] border-cyan-500/20 text-cyan-300"
                    />
                    <StatsPill
                      icon={<Clock className="size-3" />}
                      label="Latency"
                      value={fmtLatency(lastStats.latency)}
                      color="bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-300"
                    />
                    {ping !== null && (
                      <StatsPill
                        icon={<Wifi className="size-3" />}
                        label="Ping"
                        value={`${ping}ms`}
                        color="bg-amber-500/[0.08] border-amber-500/20 text-amber-300"
                      />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-thin scrollbar-thumb-white/[0.06] scrollbar-track-transparent">
            <AnimatePresence initial={false}>
              {messages.map(m => (
                <MsgBubble key={m.id} msg={m} userLetter={userLetter} />
              ))}
            </AnimatePresence>

            {thinking && <ThinkingBubble />}
            <div ref={bottomRef} />
          </div>

          {/* Suggestion chips */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.25 }}
                className="px-4 pb-3"
              >
                <p className="text-[9.5px] font-black uppercase tracking-[0.15em] text-white/15 mb-2">Try asking</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={s.text}
                      onClick={() => send(s.text)}
                      className="_ai-sugg flex items-center gap-1.5 text-[11px] bg-white/[0.04] hover:bg-indigo-500/10 border border-white/[0.07] hover:border-indigo-500/25 text-white/45 hover:text-indigo-300 rounded-xl px-2.5 py-1.5 transition-all text-left"
                      style={{ animationDelay: `${i * 45}ms` }}
                    >
                      <span className="text-white/20">{s.icon}</span>
                      {s.text}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input */}
          <div className="shrink-0 p-4 border-t border-white/[0.07]"
            style={{ background: "linear-gradient(0deg, rgba(4,4,18,.98) 0%, rgba(6,5,18,.8) 100%)", backdropFilter: "blur(20px)", borderRadius: "0 0 24px 24px" }}>
            <div className="flex gap-2.5 items-end">
              <div className="relative flex-1">
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
                  className="w-full resize-none min-h-[44px] max-h-[140px] px-4 py-3 rounded-2xl text-[13px] text-white/88 placeholder:text-white/18 outline-none transition-all border disabled:opacity-50"
                  style={{
                    background: "rgba(255,255,255,.04)",
                    borderColor: input ? "rgba(139,92,246,.35)" : "rgba(255,255,255,.08)",
                    boxShadow: input ? "0 0 0 2px rgba(139,92,246,.08), inset 0 1px 0 rgba(255,255,255,.04)" : "none",
                    lineHeight: "1.5",
                  }}
                  onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = "rgba(139,92,246,.4)"; }}
                  onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = input ? "rgba(139,92,246,.35)" : "rgba(255,255,255,.08)"; }}
                />
              </div>

              {streaming ? (
                <button
                  onClick={stop}
                  className="size-11 rounded-2xl flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, rgba(239,68,68,.25) 0%, rgba(220,38,38,.15) 100%)",
                    border: "1px solid rgba(239,68,68,.25)",
                    boxShadow: "0 4px 12px rgba(239,68,68,.15)",
                  }}
                >
                  <Square className="size-4 text-red-400" />
                </button>
              ) : (
                <button
                  ref={sendBtnRef}
                  onClick={() => send()}
                  disabled={!input.trim()}
                  className="size-11 rounded-2xl flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100"
                  style={{
                    background: "linear-gradient(135deg, #6366f1 0%, #7c3aed 60%, #8b5cf6 100%)",
                    boxShadow: input.trim() ? "0 6px 20px rgba(99,102,241,.45), 0 2px 6px rgba(0,0,0,.3)" : "none",
                  }}
                >
                  <Send className="size-4 text-white" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between mt-2.5 px-0.5">
              <p className="text-[10px] text-white/15 font-mono">⌘J to toggle · Esc to close · Enter to send</p>
              {copied && <span className="text-[10px] text-emerald-400 font-medium">Copied!</span>}
            </div>
          </div>
        </div>
      </motion.div>
      </div>
    </>
  );
}
