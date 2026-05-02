import { X, Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type FilterState = {
  type: string;
  dateRange: "all" | "today" | "week" | "month" | "year";
  hasTags: boolean | null;
  hasNote: boolean | null;
  isPinned: boolean | null;
  domain: string;
};

export const DEFAULT_FILTERS: FilterState = {
  type: "all",
  dateRange: "all",
  hasTags: null,
  hasNote: null,
  isPinned: null,
  domain: "",
};

export function countActiveFilters(f: FilterState) {
  let c = 0;
  if (f.type !== "all") c++;
  if (f.dateRange !== "all") c++;
  if (f.hasTags !== null) c++;
  if (f.hasNote !== null) c++;
  if (f.isPinned !== null) c++;
  if (f.domain) c++;
  return c;
}

export function applyFilters(bookmarks: any[], f: FilterState) {
  return bookmarks.filter(b => {
    if (f.type !== "all" && b.type !== f.type) return false;
    if (f.domain && !b.domain?.toLowerCase().includes(f.domain.toLowerCase())) return false;
    if (f.hasTags === true && (!b.tags || b.tags.length === 0)) return false;
    if (f.hasTags === false && b.tags && b.tags.length > 0) return false;
    if (f.hasNote === true && !b.note) return false;
    if (f.hasNote === false && b.note) return false;
    if (f.isPinned === true && !b.isPinned) return false;
    if (f.isPinned === false && b.isPinned) return false;
    if (f.dateRange !== "all") {
      const created = new Date(b.createdAt);
      const now = new Date();
      const diff = now.getTime() - created.getTime();
      const day = 86400000;
      if (f.dateRange === "today" && diff > day) return false;
      if (f.dateRange === "week" && diff > 7 * day) return false;
      if (f.dateRange === "month" && diff > 30 * day) return false;
      if (f.dateRange === "year" && diff > 365 * day) return false;
    }
    return true;
  });
}

interface AdvancedFiltersProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onClose: () => void;
}

const TYPES = [
  { value: "all", label: "All" },
  { value: "link", label: "Link" },
  { value: "article", label: "Article" },
  { value: "video", label: "Video" },
  { value: "image", label: "Image" },
  { value: "document", label: "Document" },
  { value: "audio", label: "Audio" },
];

const DATE_RANGES = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
];

type TBool = { value: boolean | null; label: string };
const BOOL_OPTS: TBool[] = [
  { value: null, label: "Any" },
  { value: true, label: "Yes" },
  { value: false, label: "No" },
];

function ChipGroup<T>({
  label, options, value, getValue, getLabel, onChange,
}: {
  label: string;
  options: T[];
  value: T;
  getValue: (o: T) => any;
  getLabel: (o: T) => string;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o, i) => (
          <button
            key={i}
            onClick={() => onChange(o)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[12px] border transition-all",
              JSON.stringify(getValue(o)) === JSON.stringify(value)
                ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300"
                : "bg-white/[0.04] border-white/[0.07] text-white/45 hover:text-white/70 hover:bg-white/[0.07]"
            )}
          >
            {getLabel(o)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AdvancedFilters({ filters, onChange, onClose }: AdvancedFiltersProps) {
  const activeCount = countActiveFilters(filters);

  return (
    <div className="absolute top-full left-0 right-0 z-30 bg-[#0f0f1c] border-b border-white/[0.08] shadow-xl">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="size-3.5 text-indigo-400" />
            <span className="text-[13px] font-semibold text-white/80">Advanced Filters</span>
            {activeCount > 0 && (
              <Badge variant="secondary" className="bg-indigo-500/15 text-indigo-300 text-[10px] h-4 px-1.5">
                {activeCount} active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button
                onClick={() => onChange(DEFAULT_FILTERS)}
                className="flex items-center gap-1 text-[11px] text-white/35 hover:text-white/60 transition-colors"
              >
                <RotateCcw className="size-3" />
                Reset
              </button>
            )}
            <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          <ChipGroup
            label="Type"
            options={TYPES}
            value={TYPES.find(t => t.value === filters.type)!}
            getValue={o => o.value}
            getLabel={o => o.label}
            onChange={o => onChange({ ...filters, type: (o as typeof TYPES[0]).value })}
          />
          <ChipGroup
            label="Date Added"
            options={DATE_RANGES}
            value={DATE_RANGES.find(d => d.value === filters.dateRange)!}
            getValue={o => o.value}
            getLabel={o => o.label}
            onChange={o => onChange({ ...filters, dateRange: (o as typeof DATE_RANGES[0]).value as any })}
          />
          <ChipGroup
            label="Has Tags"
            options={BOOL_OPTS}
            value={BOOL_OPTS.find(b => b.value === filters.hasTags)!}
            getValue={o => o.value}
            getLabel={o => o.label}
            onChange={o => onChange({ ...filters, hasTags: (o as TBool).value })}
          />
          <ChipGroup
            label="Has Note"
            options={BOOL_OPTS}
            value={BOOL_OPTS.find(b => b.value === filters.hasNote)!}
            getValue={o => o.value}
            getLabel={o => o.label}
            onChange={o => onChange({ ...filters, hasNote: (o as TBool).value })}
          />
          <ChipGroup
            label="Pinned"
            options={BOOL_OPTS}
            value={BOOL_OPTS.find(b => b.value === filters.isPinned)!}
            getValue={o => o.value}
            getLabel={o => o.label}
            onChange={o => onChange({ ...filters, isPinned: (o as TBool).value })}
          />
        </div>

        {/* Domain filter */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider shrink-0">Domain</span>
          <input
            type="text"
            value={filters.domain}
            onChange={e => onChange({ ...filters, domain: e.target.value })}
            placeholder="Filter by domain (e.g. github.com)"
            className="flex-1 max-w-xs text-[12px] bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-white/70 placeholder:text-white/20 outline-none focus:border-indigo-500/40 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
