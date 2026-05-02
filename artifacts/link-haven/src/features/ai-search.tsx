import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, Bookmark, ExternalLink } from "lucide-react";

interface AiSearchProps {
  bookmarks: any[];
  onSelect: (bookmark: any) => void;
  onClose: () => void;
}

function scoreBookmark(bookmark: any, query: string): number {
  const q = query.toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);
  let score = 0;

  for (const token of tokens) {
    if (bookmark.title?.toLowerCase().includes(token)) score += 10;
    if (bookmark.domain?.toLowerCase().includes(token)) score += 8;
    if (bookmark.url?.toLowerCase().includes(token)) score += 5;
    if (bookmark.description?.toLowerCase().includes(token)) score += 4;
    if (bookmark.note?.toLowerCase().includes(token)) score += 3;
    if (bookmark.tags?.some((t: string) => t.toLowerCase().includes(token))) score += 6;
    if (bookmark.collectionName?.toLowerCase().includes(token)) score += 4;
  }

  // Bonus for exact phrase match
  const text = [bookmark.title, bookmark.description, bookmark.note, bookmark.url].filter(Boolean).join(" ").toLowerCase();
  if (text.includes(q)) score += 15;

  // Boost favorites
  if (bookmark.isFavorite) score += 2;

  return score;
}

type Message = { role: "user" | "assistant"; text: string; results?: any[] };

function interpretQuery(query: string, bookmarks: any[]): { answer: string; results: any[] } {
  const q = query.toLowerCase();

  // Special intents
  if (q.match(/how many|count/)) {
    return {
      answer: `You have **${bookmarks.length}** bookmarks in your library.`,
      results: [],
    };
  }
  if (q.match(/favorite|starred/)) {
    const favs = bookmarks.filter(b => b.isFavorite);
    return {
      answer: `You have **${favs.length}** favourited bookmarks.`,
      results: favs.slice(0, 8),
    };
  }
  if (q.match(/recent|latest|newest/)) {
    const sorted = [...bookmarks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return {
      answer: `Here are your most recently saved bookmarks:`,
      results: sorted.slice(0, 6),
    };
  }
  if (q.match(/video/)) {
    const videos = bookmarks.filter(b => b.type === "video" || b.tags?.includes("video") || b.domain?.includes("youtube") || b.domain?.includes("vimeo"));
    return { answer: `Found **${videos.length}** video bookmarks:`, results: videos.slice(0, 8) };
  }
  if (q.match(/article|read/)) {
    const articles = bookmarks.filter(b => b.type === "article" || b.tags?.includes("article") || b.tags?.includes("read"));
    return { answer: `Found **${articles.length}** articles:`, results: articles.slice(0, 8) };
  }
  if (q.match(/tool|app/)) {
    const tools = bookmarks.filter(b => b.tags?.includes("tools") || b.tags?.includes("tool") || b.tags?.includes("app") || b.tags?.includes("productivity"));
    return { answer: `Found **${tools.length}** tools and apps:`, results: tools.slice(0, 8) };
  }

  // Relevance search
  const scored = bookmarks
    .map(b => ({ bookmark: b, score: scoreBookmark(b, query) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(x => x.bookmark);

  if (scored.length === 0) {
    return {
      answer: `No bookmarks matched your search for **"${query}"**. Try different keywords.`,
      results: [],
    };
  }

  return {
    answer: `Found **${scored.length}** bookmark${scored.length !== 1 ? "s" : ""} matching **"${query}"**:`,
    results: scored,
  };
}

function renderText(text: string) {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

export function AiSearch({ bookmarks, onSelect, onClose }: AiSearchProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: `Hi! I'm your AI search assistant. I can help you find bookmarks, answer questions about your library, and more. Try asking me something like:\n• "Show me my latest bookmarks"\n• "Find design tools"\n• "How many bookmarks do I have?"`,
    },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const send = () => {
    const q = input.trim();
    if (!q) return;
    setInput("");
    const userMsg: Message = { role: "user", text: q };
    const { answer, results } = interpretQuery(q, bookmarks);
    const assistantMsg: Message = { role: "assistant", text: answer, results };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-[#0b0b14] border-l border-white/[0.08] flex flex-col z-50 shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-white/[0.07] shrink-0">
        <div className="size-7 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
          <Sparkles className="size-3.5 text-violet-400" />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-white/80">AI Assistant</p>
          <p className="text-[10px] text-white/30">{bookmarks.length} bookmarks indexed</p>
        </div>
        <button
          onClick={onClose}
          className="size-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.07] transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] ${msg.role === "user" ? "" : "w-full"}`}>
              {msg.role === "user" ? (
                <div className="px-3.5 py-2.5 rounded-2xl rounded-tr-md bg-indigo-600 text-white text-[13px]">
                  {msg.text}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="size-5 rounded-md bg-violet-600/20 border border-violet-500/25 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="size-2.5 text-violet-400" />
                    </div>
                    <p
                      className="text-[13px] text-white/65 leading-relaxed whitespace-pre-line"
                      dangerouslySetInnerHTML={{ __html: renderText(msg.text) }}
                    />
                  </div>
                  {msg.results && msg.results.length > 0 && (
                    <div className="space-y-1.5 pl-7">
                      {msg.results.map(b => (
                        <button
                          key={b.id}
                          onClick={() => onSelect(b)}
                          className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all text-left group"
                        >
                          {b.favicon
                            ? <img src={b.favicon} className="size-4 rounded-sm shrink-0" alt="" onError={e => (e.target as HTMLImageElement).style.display = "none"} />
                            : <Bookmark className="size-4 text-white/20 shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-medium text-white/70 truncate">{b.title}</p>
                            <p className="text-[10px] text-white/30 truncate">{b.domain}</p>
                          </div>
                          <ExternalLink className="size-3 text-white/15 group-hover:text-white/40 transition-colors shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/[0.07] shrink-0">
        <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.09] rounded-xl px-3 py-2.5">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask anything about your bookmarks…"
            className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/25 outline-none"
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="size-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 flex items-center justify-center transition-colors"
          >
            <Send className="size-3.5 text-white" />
          </button>
        </div>
        <p className="text-center text-[10px] text-white/15 mt-2">Searches your library locally — no data leaves your device</p>
      </div>
    </div>
  );
}
