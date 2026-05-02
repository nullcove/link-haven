import { useState, useRef, useEffect } from "react";
import {
  Sparkles, Send, X, Bot, User2, Loader2, Zap, Brain,
  Tags, Archive, Star, Trash2, FolderOpen, RefreshCw, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiCall } from "@/lib/api";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; text: string; actions?: ParsedAction[] };
type ParsedAction = { type: string; ids?: number[]; tags?: string[]; collectionId?: number };

function parseActions(text: string): { clean: string; actions: ParsedAction[] } {
  const match = text.match(/<actions>([\s\S]*?)<\/actions>/);
  if (!match) return { clean: text, actions: [] };
  try {
    const actions = JSON.parse(match[1].trim());
    return { clean: text.replace(/<actions>[\s\S]*?<\/actions>/, "").trim(), actions };
  } catch {
    return { clean: text, actions: [] };
  }
}

function ActionChip({ action }: { action: ParsedAction }) {
  const icons: Record<string, React.ReactNode> = {
    add_tags: <Tags className="size-3" />,
    archive: <Archive className="size-3" />,
    favorite: <Star className="size-3" />,
    delete: <Trash2 className="size-3" />,
    move_collection: <FolderOpen className="size-3" />,
  };
  const labels: Record<string, string> = {
    add_tags: `Tag ${action.ids?.length} items`,
    archive: `Archive ${action.ids?.length} items`,
    favorite: `Favorite ${action.ids?.length} items`,
    delete: `Delete ${action.ids?.length} items`,
    move_collection: `Move ${action.ids?.length} items`,
  };
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1.5 text-[11px] text-indigo-300">
      {icons[action.type] || <Zap className="size-3" />}
      {labels[action.type] || action.type}
    </div>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  const { clean, actions } = msg.role === "assistant" ? parseActions(msg.text) : { clean: msg.text, actions: [] };

  const formatted = clean
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-white/10 px-1 rounded text-indigo-300 text-[11px]">$1</code>')
    .replace(/\n/g, '<br/>');

  return (
    <div className={cn("flex gap-2.5 mb-4", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn(
        "size-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
        isUser
          ? "bg-indigo-600/30 border border-indigo-500/30"
          : "bg-violet-600/20 border border-violet-500/25"
      )}>
        {isUser ? <User2 className="size-3.5 text-indigo-300" /> : <Bot className="size-3.5 text-violet-300" />}
      </div>
      <div className={cn("max-w-[82%]", isUser ? "items-end" : "items-start", "flex flex-col gap-1.5")}>
        <div className={cn(
          "rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
          isUser
            ? "bg-indigo-600/25 border border-indigo-500/20 text-white rounded-tr-sm"
            : "bg-white/[0.05] border border-white/[0.07] text-white/85 rounded-tl-sm"
        )}>
          <span dangerouslySetInnerHTML={{ __html: formatted }} />
        </div>
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {actions.map((a, i) => <ActionChip key={i} action={a} />)}
            <div className="w-full text-[10px] text-white/25 mt-0.5">
              Action suggestions — confirm in bookmark manager
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  "What bookmarks do I have about machine learning?",
  "Find all untagged bookmarks",
  "Which domains have the most bookmarks?",
  "Suggest how to organize my library",
  "What are my most recent saves?",
  "Find duplicates or similar bookmarks",
];

interface GeminiChatProps {
  onClose: () => void;
  bookmarks?: any[];
}

export function GeminiChat({ onClose, bookmarks = [] }: GeminiChatProps) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: `Hello! I'm your **AI bookmark assistant** powered by Gemini. I have full access to your library of **${bookmarks.length} bookmarks**.\n\nI can help you **find**, **organize**, **tag**, and **analyze** your bookmarks. What would you like to do?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const history = messages.slice(1).map(m => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.text }],
  }));

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setError(null);
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setLoading(true);

    try {
      const data = await apiCall("/gemini/chat", {
        method: "POST",
        body: JSON.stringify({ message: msg, history }),
      }) as any;
      setMessages(prev => [...prev, { role: "assistant", text: data.text }]);
    } catch (e: any) {
      setError(e.message);
      setMessages(prev => [...prev, { role: "assistant", text: `Sorry, I encountered an error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[480px] bg-[#0b0b14] border-l border-white/[0.08] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.07] bg-gradient-to-r from-indigo-950/50 to-violet-950/30">
          <div className="size-8 rounded-lg bg-gradient-to-br from-indigo-500/30 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Brain className="size-4 text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-[14px] text-white">Gemini AI Assistant</h2>
            <p className="text-[11px] text-white/35">{bookmarks.length} bookmarks in context • Full management access</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="size-7 text-white/40 hover:text-white rounded-lg">
            <X className="size-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {messages.map((m, i) => <MessageBubble key={i} msg={m} />)}
          {loading && (
            <div className="flex gap-2.5 mb-4">
              <div className="size-7 rounded-full bg-violet-600/20 border border-violet-500/25 flex items-center justify-center">
                <Bot className="size-3.5 text-violet-300" />
              </div>
              <div className="bg-white/[0.05] border border-white/[0.07] rounded-2xl rounded-tl-sm px-3.5 py-2.5 flex items-center gap-2">
                <Loader2 className="size-3.5 text-indigo-400 animate-spin" />
                <span className="text-[12px] text-white/40">Thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2">
            <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">Try asking</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[11px] bg-white/[0.04] hover:bg-indigo-500/10 border border-white/[0.07] hover:border-indigo-500/25 text-white/50 hover:text-indigo-300 rounded-lg px-2.5 py-1.5 transition-all text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-white/[0.07] bg-[#0a0a12]">
          {error && (
            <div className="mb-2 text-[11px] text-red-400/80 bg-red-500/[0.08] border border-red-500/15 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              placeholder="Ask anything about your bookmarks…"
              rows={1}
              className="flex-1 resize-none min-h-[40px] max-h-[120px] bg-white/[0.05] border-white/[0.08] focus:border-indigo-500/40 text-[13px] text-white/80 placeholder:text-white/20 rounded-xl py-2.5"
            />
            <Button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              size="icon"
              className="size-10 bg-indigo-600 hover:bg-indigo-500 rounded-xl shrink-0 disabled:opacity-30"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-white/15 mt-2 text-center">Powered by Google Gemini • Your data stays private</p>
        </div>
      </div>
    </div>
  );
}
