import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Clock, Bookmark, Star, Archive, Pin, Hash, Link2, FileText, Video, Image, File, Music, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RecentActivityProps {
  bookmarks: any[];
  onSelect: (b: any) => void;
  limit?: number;
}

const TYPE_ICON: Record<string, { icon: React.ElementType; color: string }> = {
  link:     { icon: Link2,    color: "#6366f1" },
  article:  { icon: FileText, color: "#8b5cf6" },
  image:    { icon: Image,    color: "#10b981" },
  video:    { icon: Video,    color: "#ef4444" },
  document: { icon: File,     color: "#f59e0b" },
  audio:    { icon: Music,    color: "#06b6d4" },
};

const LIST_VARIANTS = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.055, delayChildren: 0.08 } } },
  item: { hidden: { opacity: 0, x: 18, scale: 0.97 }, visible: { opacity: 1, x: 0, scale: 1, transition: { type: "spring" as const, stiffness: 280, damping: 22 } } },
};

export function RecentActivity({ bookmarks, onSelect, limit = 10 }: RecentActivityProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });

  const recent = [...bookmarks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  if (!recent.length) return null;

  return (
    <div ref={ref} className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,.032)", border: "1px solid rgba(255,255,255,.07)" }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-white/[0.06]"
        style={{ background: "rgba(6,182,212,.04)" }}>
        <div className="size-7 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(6,182,212,.18)", border: "1px solid rgba(6,182,212,.3)", boxShadow: "0 0 12px rgba(6,182,212,.18)" }}>
          <Clock size={14} color="#22d3ee" />
        </div>
        <h3 className="text-[13px] font-bold text-white/80">Recent Activity</h3>
        <span className="ml-auto text-[9.5px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: "rgba(6,182,212,.12)", color: "#22d3ee", border: "1px solid rgba(6,182,212,.2)" }}>
          {recent.length} items
        </span>
      </div>

      <motion.div
        variants={LIST_VARIANTS.container}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className="divide-y divide-white/[0.04]"
      >
        {recent.map((b, i) => {
          const tm = TYPE_ICON[b.type || "link"] || TYPE_ICON.link;
          const Ic = tm.icon;
          return (
            <motion.button
              key={b.id}
              variants={LIST_VARIANTS.item}
              onClick={() => onSelect(b)}
              whileHover={{ backgroundColor: "rgba(255,255,255,.025)", x: 2, transition: { type: "spring", stiffness: 600, damping: 30 } }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left group transition-colors"
            >
              {/* Favicon */}
              <div className="relative size-8 rounded-xl flex items-center justify-center shrink-0 overflow-hidden transition-transform group-hover:scale-110"
                style={{ background: `linear-gradient(145deg,${tm.color}28,${tm.color}10)`, border: `1px solid ${tm.color}25`, boxShadow: `0 2px 8px ${tm.color}18` }}>
                {b.favicon ? (
                  <img src={b.favicon} alt="" className="size-4 object-contain"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : <Ic size={13} color={tm.color} />}
                {/* Type indicator dot */}
                <span className="absolute bottom-0 right-0 size-2 rounded-full border border-[#09090f]"
                  style={{ backgroundColor: tm.color }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-white/70 truncate group-hover:text-white/95 transition-colors leading-tight">{b.title}</p>
                <p className="text-[10px] text-white/28 truncate mt-0.5">{b.domain}</p>
              </div>

              {/* Right side */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className="flex items-center gap-1">
                  {b.isFavorite && (
                    <span className="size-4 rounded flex items-center justify-center" style={{ background: "rgba(245,158,11,.15)" }}>
                      <Star size={8} color="#fbbf24" fill="#fbbf24" />
                    </span>
                  )}
                  {b.isPinned && (
                    <span className="size-4 rounded flex items-center justify-center" style={{ background: "rgba(99,102,241,.15)" }}>
                      <Pin size={8} color="#818cf8" />
                    </span>
                  )}
                  {b.isArchived && (
                    <span className="size-4 rounded flex items-center justify-center" style={{ background: "rgba(100,116,139,.15)" }}>
                      <Archive size={8} color="rgba(255,255,255,.3)" />
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-white/20 whitespace-nowrap">
                  {formatDistanceToNow(new Date(b.createdAt), { addSuffix: true })}
                </span>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Footer */}
      {bookmarks.length > limit && (
        <div className="px-4 py-2.5 border-t border-white/[0.05] flex items-center justify-center">
          <span className="text-[10px] text-white/25">+{bookmarks.length - limit} more bookmarks</span>
        </div>
      )}
    </div>
  );
}
