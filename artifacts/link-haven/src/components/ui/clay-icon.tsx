/**
 * Clay 3D Icon System
 * Soft / Pastel / Toy-like 3D icons — bubbly, inflated, cute.
 *
 * Usage:
 *   import { ClayIcon, ClayBarIcon, CLAY_CSS } from "@/components/ui/clay-icon";
 *   // inject CLAY_CSS once per page (or use ClayStyleOnce)
 */
import React from "react";

/* ─────────────────────────────────────────────────────────────────
   Animation + shared CSS  (inject once per page via <ClayStyleOnce>
   or via a <style> tag)
───────────────────────────────────────────────────────────────── */
export const CLAY_CSS = `
@keyframes clay-float   { 0%,100%{transform:translateY(0)rotate(-1deg)} 50%{transform:translateY(-5px)rotate(1deg)} }
@keyframes clay-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes clay-breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.13)} }
@keyframes clay-wiggle  { 0%,100%{transform:rotate(0)} 20%{transform:rotate(-16deg)} 45%{transform:rotate(14deg)} 65%{transform:rotate(-9deg)} 85%{transform:rotate(6deg)} }
@keyframes clay-pop     { 0%{transform:scale(.35)rotate(-14deg);opacity:0} 72%{transform:scale(1.08)rotate(2deg)} 100%{transform:scale(1)rotate(0);opacity:1} }
@keyframes clay-ring    { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(2.5);opacity:0} }
@keyframes clay-shd     { 0%{transform:translateX(-130%)} 100%{transform:translateX(130%)} }
@keyframes clay-bar-a   { 0%,100%{height:30%} 50%{height:88%} }
@keyframes clay-bar-b   { 0%,100%{height:64%} 50%{height:100%} }
@keyframes clay-bar-c   { 0%,100%{height:45%} 50%{height:72%} }

.clay-anim-float   { animation: clay-float   3s ease-in-out infinite; }
.clay-anim-spin    { animation: clay-spin    9s linear     infinite; }
.clay-anim-breathe { animation: clay-breathe 2.6s ease-in-out infinite; }
.clay-anim-wiggle  { animation: clay-wiggle  .65s ease-in-out; }
.clay-anim-pop     { animation: clay-pop .4s cubic-bezier(.22,1,.36,1) both; }

.clay-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
  cursor: default;
  transition:
    transform .2s cubic-bezier(.22,1,.36,1),
    box-shadow .2s ease,
    filter .2s ease;
}
.clay-icon:hover {
  transform: scale(1.15) translateY(-3px) rotate(-4deg) !important;
  filter: brightness(1.1) saturate(1.12);
}
.clay-icon .clay-gloss {
  position: absolute;
  pointer-events: none;
  z-index: 2;
  top: 10%;
  left: 13%;
  width: 38%;
  height: 26%;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(255,255,255,.78) 0%, transparent 100%);
  filter: blur(2.5px);
}
.clay-icon .clay-ic {
  position: relative;
  z-index: 3;
  flex-shrink: 0;
  color: #fff;
}
`;

let _injected = false;

/** Injects CLAY_CSS once into the document head — call anywhere before first render */
export function ClayStyleOnce() {
  if (typeof document !== "undefined" && !_injected) {
    const s = document.createElement("style");
    s.id = "clay-css";
    s.textContent = CLAY_CSS;
    document.head.appendChild(s);
    _injected = true;
  }
  return null;
}

/* ─────────────────────────────────────────────────────────────────
   Main ClayIcon
───────────────────────────────────────────────────────────────── */
export interface ClayIconProps {
  icon: React.ElementType;
  color: string;          // base hex  e.g. "#6366f1"
  light?: string;         // lighter tint, auto-derived if omitted
  size?: number;          // container px (default 36)
  iconScale?: number;     // icon/container ratio (default .52)
  anim?: "float" | "spin" | "breathe" | "wiggle" | "none";
  animDelay?: number;     // ms
  active?: boolean;       // stronger glow + ring for selected state
  pop?: boolean;          // play entry pop animation
  tilt?: number;          // static rotation degrees (playfulness)
  strokeWidth?: number;
}

export function ClayIcon({
  icon: Ic,
  color,
  light,
  size = 36,
  iconScale = 0.52,
  anim = "none",
  animDelay = 0,
  active = false,
  pop = false,
  tilt = 0,
  strokeWidth = 2,
}: ClayIconProps) {
  const r = Math.round(size * 0.30);
  const iconSz = Math.round(size * iconScale);
  const lt = light ?? _lighten(color);

  const animClass = anim !== "none" ? `clay-anim-${anim}` : "";
  const popClass  = pop ? "clay-anim-pop" : "";

  return (
    <span
      className={`clay-icon ${popClass}`}
      style={{
        width: size,
        height: size,
        borderRadius: r,
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
        animationDelay: pop ? `${animDelay}ms` : undefined,
        background: _bg(color, lt),
        boxShadow: active ? _shadowActive(color) : _shadow(color),
      }}
    >
      <span className="clay-gloss" />

      {/* Active pulse ring */}
      {active && (
        <span
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: r,
            border: `1.5px solid ${color}65`,
            animation: "clay-ring 2.2s ease-out infinite",
          }}
        />
      )}

      {/* Shimmer sweep on active */}
      {active && (
        <span
          className="absolute pointer-events-none overflow-hidden"
          style={{
            borderRadius: r,
            inset: 0,
            background: "linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent)",
            animation: "clay-shd 2.6s ease-in-out infinite",
            width: "40%",
            transform: "translateX(-130%)",
          }}
        />
      )}

      <Ic
        className={`clay-ic ${animClass}`}
        style={{
          width: iconSz,
          height: iconSz,
          strokeWidth,
          animationDelay: `${animDelay}ms`,
          filter: `drop-shadow(0 2px 4px rgba(0,0,0,.32)) drop-shadow(0 0 8px ${color}55)`,
        }}
      />
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Live-animated bar chart clay icon
───────────────────────────────────────────────────────────────── */
export function ClayBarIcon({ color, light, size = 36 }: { color: string; light?: string; size?: number }) {
  const r = Math.round(size * 0.30);
  const lt = light ?? _lighten(color);
  const barH = Math.round(size * 0.44);

  return (
    <span
      className="clay-icon"
      style={{
        width: size, height: size, borderRadius: r,
        background: _bg(color, lt),
        boxShadow: _shadow(color),
      }}
    >
      <span className="clay-gloss" />
      <span className="relative z-10 flex items-end gap-[2.5px]"
        style={{ height: barH, width: barH }}>
        {(["clay-bar-a","clay-bar-b","clay-bar-c"] as const).map((k, i) => (
          <span key={i} className="flex-1 rounded-sm"
            style={{
              height: "40%",
              background: "linear-gradient(to top, rgba(255,255,255,.5), rgba(255,255,255,.95))",
              animation: `${k} 1.9s ease-in-out infinite`,
              animationDelay: `${i * 130}ms`,
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,.2))",
            }} />
        ))}
      </span>
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Tiny inline clay icon (for dropdown items, stat tiles, etc.)
───────────────────────────────────────────────────────────────── */
export function ClayDot({ color, light, size = 22, icon: Ic }: { color: string; light?: string; size?: number; icon: React.ElementType }) {
  const lt = light ?? _lighten(color);
  const r = Math.round(size * 0.30);
  const iconSz = Math.round(size * 0.54);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      position: "relative", flexShrink: 0,
      width: size, height: size, borderRadius: r,
      background: _bg(color, lt),
      boxShadow: `0 4px 12px ${color}40, 0 2px 4px rgba(0,0,0,.22), inset 0 -2px 6px rgba(0,0,0,.14), inset 0 2px 8px rgba(255,255,255,.5)`,
    }}>
      <span style={{
        position: "absolute", top: "10%", left: "12%",
        width: "36%", height: "26%", borderRadius: "50%",
        background: "radial-gradient(ellipse,rgba(255,255,255,.72) 0%,transparent 100%)",
        filter: "blur(1.5px)",
        zIndex: 2, pointerEvents: "none",
      }} />
      <Ic style={{
        width: iconSz, height: iconSz,
        color: "#fff", strokeWidth: 2,
        filter: `drop-shadow(0 1px 3px rgba(0,0,0,.28))`,
        position: "relative", zIndex: 3, flexShrink: 0,
      }} />
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────── */
function _lighten(hex: string): string {
  // Shift each channel 35% toward white
  const m = hex.replace("#","").match(/.{2}/g);
  if (!m || m.length < 3) return hex + "99";
  const [r,g,b] = m.map(c => parseInt(c,16));
  const mix = (v: number) => Math.round(v + (255 - v) * 0.42).toString(16).padStart(2,"0");
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

function _bg(base: string, light: string): string {
  return `radial-gradient(circle at 30% 28%, rgba(255,255,255,.92) 0%, ${light} 28%, ${base} 58%, ${base}cc 100%)`;
}

function _shadow(color: string): string {
  return [
    `0 8px 22px ${color}4a`,
    `0 3px 7px rgba(0,0,0,.28)`,
    `inset 0 -3px 9px rgba(0,0,0,.18)`,
    `inset 0 3px 12px rgba(255,255,255,.58)`,
  ].join(",");
}

function _shadowActive(color: string): string {
  return [
    `0 0 0 2px ${color}50`,
    `0 12px 28px ${color}55`,
    `0 4px 9px rgba(0,0,0,.32)`,
    `inset 0 -3px 10px rgba(0,0,0,.2)`,
    `inset 0 3px 14px rgba(255,255,255,.65)`,
  ].join(",");
}
