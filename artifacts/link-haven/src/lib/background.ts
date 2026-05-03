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
  { id: 1,  name: "Space Nebula",       path: "/backgrounds/bg01.png", category: "Space" },
  { id: 10, name: "Milky Way",          path: "/backgrounds/bg10.png", category: "Space" },
  { id: 11, name: "Black Hole",         path: "/backgrounds/bg11.png", category: "Space" },
  { id: 12, name: "Asteroid Belt",      path: "/backgrounds/bg12.png", category: "Space" },
  { id: 13, name: "Alien World",        path: "/backgrounds/bg13.png", category: "Space" },
  { id: 14, name: "Galaxy Merge",       path: "/backgrounds/bg14.png", category: "Space" },
  { id: 15, name: "Pulsar Star",        path: "/backgrounds/bg15.png", category: "Space" },

  // ── Urban ─────────────────────────────────────────
  { id: 2,  name: "Cyberpunk City",     path: "/backgrounds/bg02.png", category: "Urban" },
  { id: 16, name: "Neon Alley",         path: "/backgrounds/bg16.png", category: "Urban" },
  { id: 17, name: "Glass Tower",        path: "/backgrounds/bg17.png", category: "Urban" },
  { id: 18, name: "Metro Station",      path: "/backgrounds/bg18.png", category: "Urban" },
  { id: 19, name: "Tokyo Rooftop",      path: "/backgrounds/bg19.png", category: "Urban" },
  { id: 20, name: "Night Harbor",       path: "/backgrounds/bg20.png", category: "Urban" },

  // ── Nature ────────────────────────────────────────
  { id: 4,  name: "Aurora Peaks",       path: "/backgrounds/bg04.png", category: "Nature" },
  { id: 5,  name: "Deep Ocean",         path: "/backgrounds/bg05.png", category: "Nature" },
  { id: 6,  name: "Volcanic Glow",      path: "/backgrounds/bg06.png", category: "Nature" },
  { id: 7,  name: "Mystic Forest",      path: "/backgrounds/bg07.png", category: "Nature" },
  { id: 21, name: "Ancient Forest",     path: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=85&fit=crop", category: "Nature" },
  { id: 22, name: "Mountain Sunrise",   path: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85&fit=crop", category: "Nature" },
  { id: 23, name: "Waterfall Mist",     path: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=85&fit=crop", category: "Nature" },
  { id: 24, name: "Golden Meadow",      path: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1920&q=85&fit=crop", category: "Nature" },
  { id: 25, name: "Ocean Horizon",      path: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1920&q=85&fit=crop", category: "Nature" },
  { id: 26, name: "Misty Mountains",    path: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=85&fit=crop", category: "Nature" },
  { id: 27, name: "Desert Dunes",       path: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1920&q=85&fit=crop", category: "Nature" },
  { id: 28, name: "Tropical Beach",     path: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1920&q=85&fit=crop&sat=-20", category: "Nature" },
  { id: 29, name: "Snow Peaks",         path: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=85&fit=crop", category: "Nature" },
  { id: 30, name: "Cherry Blossom",     path: "https://images.unsplash.com/photo-1490750967868-88df5691cc16?w=1920&q=85&fit=crop", category: "Nature" },
  { id: 31, name: "Autumn Valley",      path: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&q=85&fit=crop", category: "Nature" },
  { id: 32, name: "Bamboo Grove",       path: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1920&q=85&fit=crop", category: "Nature" },
  { id: 33, name: "Lavender Fields",    path: "https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=1920&q=85&fit=crop", category: "Nature" },
  { id: 34, name: "Fjord Sunrise",      path: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&q=85&fit=crop", category: "Nature" },
  { id: 35, name: "Lightning Storm",    path: "https://images.unsplash.com/photo-1472145246862-b24cf25c4a36?w=1920&q=85&fit=crop", category: "Nature" },
  { id: 36, name: "Coral Reef",         path: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1920&q=85&fit=crop", category: "Nature" },
  { id: 37, name: "Night Forest",       path: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=1920&q=85&fit=crop", category: "Nature" },
  { id: 38, name: "Iceland Aurora",     path: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&q=85&fit=crop&hue=180", category: "Nature" },
  { id: 39, name: "Rainforest Canopy",  path: "https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?w=1920&q=85&fit=crop", category: "Nature" },
  { id: 40, name: "Starlit Lake",       path: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&q=85&fit=crop", category: "Nature" },

  // ── Abstract ──────────────────────────────────────
  { id: 3,  name: "Dark Geometry",      path: "/backgrounds/bg03.png", category: "Abstract" },
  { id: 8,  name: "Ink Flow",           path: "/backgrounds/bg08.png", category: "Abstract" },
  { id: 9,  name: "Circuit Grid",       path: "/backgrounds/bg09.png", category: "Abstract" },
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
