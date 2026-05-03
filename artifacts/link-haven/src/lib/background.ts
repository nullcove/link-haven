import { useState, useEffect } from "react";

export interface BgItem { id: number; name: string; emoji: string; path: string; }

export const BACKGROUNDS: BgItem[] = [
  { id: 1,  name: "Space Nebula",    emoji: "🌌", path: "/backgrounds/bg01.png" },
  { id: 2,  name: "Cyberpunk City",  emoji: "🌆", path: "/backgrounds/bg02.png" },
  { id: 3,  name: "Dark Geometry",   emoji: "🔷", path: "/backgrounds/bg03.png" },
  { id: 4,  name: "Aurora",          emoji: "🌠", path: "/backgrounds/bg04.png" },
  { id: 5,  name: "Deep Ocean",      emoji: "🌊", path: "/backgrounds/bg05.png" },
  { id: 6,  name: "Volcanic Lava",   emoji: "🌋", path: "/backgrounds/bg06.png" },
  { id: 7,  name: "Mystic Forest",   emoji: "🌲", path: "/backgrounds/bg07.png" },
  { id: 8,  name: "Ink Flow",        emoji: "🖋️", path: "/backgrounds/bg08.png" },
  { id: 9,  name: "Circuit Tech",    emoji: "⚡", path: "/backgrounds/bg09.png" },
  { id: 10, name: "Milky Way",       emoji: "✨", path: "/backgrounds/bg10.png" },
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

  return { bgId, bgPath: bgItem?.path ?? null, setBg };
}
