import { useState, useEffect } from "react";

export type BgCategory = "Space" | "Urban" | "Nature" | "Abstract";

export interface BgItem {
  id: number;
  name: string;
  path: string;
  category: BgCategory;
}

export const BG_CATEGORY_META: Record<BgCategory, { accent: string; glyph: string }> = {
  Space:    { accent: "#818cf8", glyph: "✦" },
  Urban:    { accent: "#f472b6", glyph: "◈" },
  Nature:   { accent: "#34d399", glyph: "◎" },
  Abstract: { accent: "#fb923c", glyph: "◇" },
};

export const BG_CATEGORIES: BgCategory[] = ["Space", "Urban", "Nature", "Abstract"];

export const BACKGROUNDS: BgItem[] = [
  // ── Space ─────────────────────────────────────────
  { id: 1,  name: "Space Nebula",   path: "/backgrounds/bg01.png", category: "Space" },
  { id: 10, name: "Milky Way",      path: "/backgrounds/bg10.png", category: "Space" },
  { id: 11, name: "Black Hole",     path: "/backgrounds/bg11.png", category: "Space" },
  { id: 12, name: "Asteroid Belt",  path: "/backgrounds/bg12.png", category: "Space" },
  { id: 13, name: "Alien World",    path: "/backgrounds/bg13.png", category: "Space" },
  { id: 14, name: "Galaxy Merge",   path: "/backgrounds/bg14.png", category: "Space" },
  { id: 15, name: "Pulsar Star",    path: "/backgrounds/bg15.png", category: "Space" },

  // ── Urban ─────────────────────────────────────────
  { id: 2,  name: "Cyberpunk City", path: "/backgrounds/bg02.png", category: "Urban" },
  { id: 16, name: "Neon Alley",     path: "/backgrounds/bg16.png", category: "Urban" },
  { id: 17, name: "Glass Tower",    path: "/backgrounds/bg17.png", category: "Urban" },
  { id: 18, name: "Metro Station",  path: "/backgrounds/bg18.png", category: "Urban" },
  { id: 19, name: "Tokyo Rooftop",  path: "/backgrounds/bg19.png", category: "Urban" },
  { id: 20, name: "Night Harbor",   path: "/backgrounds/bg20.png", category: "Urban" },

  // ── Nature ────────────────────────────────────────
  { id: 4,  name: "Aurora Peaks",   path: "/backgrounds/bg04.png", category: "Nature" },
  { id: 5,  name: "Deep Ocean",     path: "/backgrounds/bg05.png", category: "Nature" },
  { id: 6,  name: "Volcanic Glow",  path: "/backgrounds/bg06.png", category: "Nature" },
  { id: 7,  name: "Mystic Forest",  path: "/backgrounds/bg07.png", category: "Nature" },

  // ── Abstract ──────────────────────────────────────
  { id: 3,  name: "Dark Geometry",  path: "/backgrounds/bg03.png", category: "Abstract" },
  { id: 8,  name: "Ink Flow",       path: "/backgrounds/bg08.png", category: "Abstract" },
  { id: 9,  name: "Circuit Grid",   path: "/backgrounds/bg09.png", category: "Abstract" },
];

const KEY = "lh_bg";
const EVT = "lh_bg_change";

export function getStoredBgId(): number | null {
  try { const v = localStorage.getItem(KEY); return v ? parseInt(v, 10) : null; }
  catch { return null; }
}

export function setStoredBgId(id: number | null): void {
  try {
    if (id === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, String(id));
    window.dispatchEvent(new Event(EVT));
  } catch {}
}

export function useBg() {
  const [bgId, setBgIdState] = useState<number | null>(() => getStoredBgId());

  useEffect(() => {
    const handler = () => setBgIdState(getStoredBgId());
    window.addEventListener(EVT, handler);
    return () => window.removeEventListener(EVT, handler);
  }, []);

  const setBg = (id: number | null) => setStoredBgId(id);
  const bgItem = BACKGROUNDS.find(b => b.id === bgId) ?? null;

  return { bgId, bgPath: bgItem?.path ?? null, bgItem, setBg };
}
