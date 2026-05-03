import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Hash, TrendingUp } from "lucide-react";

interface TagCloudProps {
  bookmarks: any[];
  onTagClick: (tag: string) => void;
  activeTag?: string;
}

const COLORS = [
  { text:"#818cf8", bg:"rgba(129,140,248,.12)", border:"rgba(129,140,248,.25)", glow:"#6366f1" },
  { text:"#a78bfa", bg:"rgba(167,139,250,.12)", border:"rgba(167,139,250,.25)", glow:"#8b5cf6" },
  { text:"#38bdf8", bg:"rgba(56,189,248,.12)",  border:"rgba(56,189,248,.25)",  glow:"#0ea5e9" },
  { text:"#22d3ee", bg:"rgba(34,211,238,.12)",  border:"rgba(34,211,238,.25)",  glow:"#06b6d4" },
  { text:"#c084fc", bg:"rgba(192,132,252,.12)", border:"rgba(192,132,252,.25)", glow:"#a855f7" },
  { text:"#f472b6", bg:"rgba(244,114,182,.12)", border:"rgba(244,114,182,.25)", glow:"#ec4899" },
  { text:"#34d399", bg:"rgba(52,211,153,.12)",  border:"rgba(52,211,153,.25)",  glow:"#10b981" },
  { text:"#60a5fa", bg:"rgba(96,165,250,.12)",  border:"rgba(96,165,250,.25)",  glow:"#3b82f6" },
];

const FLOAT_ANIMS = [
  "0%,100%{transform:translateY(0) rotate(0deg)}40%{transform:translateY(-7px) rotate(1deg)}",
  "0%,100%{transform:translateY(0)}60%{transform:translateY(-10px)}",
  "0%,100%{transform:translateY(0) rotate(0)}30%{transform:translateY(-5px) rotate(-1.5deg)}70%{transform:translateY(-8px) rotate(1deg)}",
];

export function TagCloud({ bookmarks, onTagClick, activeTag }: TagCloudProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });

  const tagMap: Record<string, number> = {};
  bookmarks.forEach(b => b.tags?.forEach((t: string) => { tagMap[t] = (tagMap[t] || 0) + 1; }));
  const entries = Object.entries(tagMap).sort((a, b) => b[1] - a[1]);

  if (!entries.length) return null;
  const max = entries[0][1];
  const min = entries[entries.length - 1][1];

  const getSize = (count: number) => {
    const pct = max === min ? 0.5 : (count - min) / (max - min);
    if (pct > 0.8) return { fs: 18, fw: 900 };
    if (pct > 0.6) return { fs: 15, fw: 800 };
    if (pct > 0.4) return { fs: 13, fw: 700 };
    if (pct > 0.2) return { fs: 11.5, fw: 600 };
    return { fs: 10, fw: 500 };
  };

  const CSS = `
    ${FLOAT_ANIMS.map((kf,i) => `@keyframes _tc-float-${i} { ${kf} }`).join("")}
    ._tc-f0 { animation:_tc-float-0 var(--d,4.5s) ease-in-out infinite; }
    ._tc-f1 { animation:_tc-float-1 var(--d,5.5s) ease-in-out infinite; }
    ._tc-f2 { animation:_tc-float-2 var(--d,3.8s) ease-in-out infinite; }
  `;

  return (
    <>
      <style>{CSS}</style>
      <div ref={ref} className="rounded-2xl overflow-hidden relative"
        style={{ background:"rgba(255,255,255,.032)", border:"1px solid rgba(255,255,255,.07)" }}>
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background:"radial-gradient(ellipse at 50% 50%,rgba(99,102,241,.07),transparent 70%)",
        }}/>

        <div className="relative p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="size-7 rounded-lg flex items-center justify-center"
              style={{ background:"rgba(99,102,241,.18)", border:"1px solid rgba(99,102,241,.3)", boxShadow:"0 0 12px rgba(99,102,241,.2)" }}>
              <Hash size={14} color="#818cf8" />
            </div>
            <h3 className="text-[13px] font-bold text-white/80">Tag Cloud</h3>
            <div className="flex items-center gap-1.5 ml-2">
              <TrendingUp size={10} color="rgba(255,255,255,.2)"/>
              <span className="text-[10px] text-white/25">{entries.length} unique tags</span>
            </div>
            <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background:"rgba(99,102,241,.15)", color:"#818cf8", border:"1px solid rgba(99,102,241,.25)" }}>
              {entries.reduce((s,[,c])=>s+c,0)} total uses
            </span>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-3 leading-loose">
            {entries.slice(0, 60).map(([tag, count], i) => {
              const { fs, fw } = getSize(count);
              const c = COLORS[i % COLORS.length];
              const floatClass = `_tc-f${i % 3}`;
              const isActive = activeTag === tag;
              return (
                <motion.button
                  key={tag}
                  initial={{ opacity: 0, scale: 0.4, rotate: (i % 2 === 0 ? -1 : 1) * (5 + Math.random() * 15) }}
                  animate={inView ? { opacity: 1, scale: 1, rotate: 0 } : {}}
                  transition={{ delay: i * 0.025, type: "spring", stiffness: 300, damping: 18 }}
                  whileHover={{ scale: 1.2, transition: { type: "spring", stiffness: 500, damping: 20 } }}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => onTagClick(tag)}
                  className={`${floatClass} inline-flex items-center gap-1 px-2.5 py-1 rounded-full transition-all cursor-pointer`}
                  style={{
                    fontSize: fs,
                    fontWeight: fw,
                    color: isActive ? "#ffffff" : c.text,
                    background: isActive ? `${c.glow}40` : c.bg,
                    border: `1px solid ${isActive ? c.text : c.border}`,
                    boxShadow: isActive ? `0 0 16px ${c.glow}55, inset 0 1px 0 rgba(255,255,255,.1)` : `0 0 8px ${c.glow}22`,
                    ["--d" as any]: `${3 + (i % 5) * 0.7}s`,
                    animationDelay: `${i * 0.08}s`,
                    textShadow: `0 0 ${fs}px ${c.glow}55`,
                  }}
                  title={`${count} bookmark${count !== 1 ? "s" : ""}`}
                >
                  <Hash size={fs * 0.6} style={{ opacity: 0.6 }} />
                  {tag}
                  <span style={{ fontSize: fs * 0.65, opacity: 0.45, marginLeft: 1 }}>({count})</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
