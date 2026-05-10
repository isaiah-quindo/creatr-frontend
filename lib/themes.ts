/**
 * Theme system for the public /@username link-in-bio page.
 *
 * Each theme is a flat record of CSS variable values that the page renders
 * as a `style` attribute on the wrapper. Pages then reference the variables
 * via Tailwind arbitrary properties (e.g. `bg-[var(--theme-bg)]`).
 */

export type ThemeName =
  | "clean"
  | "bold"
  | "warm"
  | "midnight"
  | "cover"
  | "indigo"
  | "honey"
  | "azure";

export type ThemeTokens = {
  bg: string;
  surface: string;
  text: string;
  textSecondary: string;
  accent: string;
  accentText: string;
  border: string;
  pillBg: string;
  pillText: string;
};

export const THEMES: Record<ThemeName, ThemeTokens> = {
  clean: {
    bg: "#FFFFFF",
    surface: "#F5F5F0",
    text: "#1a1a1a",
    textSecondary: "#888",
    accent: "#1a1a1a",
    accentText: "#fff",
    border: "#e5e5e5",
    pillBg: "#F5F5F0",
    pillText: "#555",
  },
  bold: {
    bg: "#0D0D1A",
    surface: "rgba(255,255,255,0.05)",
    text: "#ffffff",
    textSecondary: "#9995B7",
    accent: "linear-gradient(135deg, #7F77DD, #D4537E)",
    accentText: "#fff",
    border: "rgba(255,255,255,0.1)",
    pillBg: "rgba(127,119,221,0.2)",
    pillText: "#AFA9EC",
  },
  warm: {
    bg: "#FAF8FF",
    surface: "rgba(127,119,221,0.08)",
    text: "#15131F",
    textSecondary: "#6E6A88",
    accent: "linear-gradient(135deg, #7F77DD, #D4537E)",
    accentText: "#fff",
    border: "rgba(20,18,30,0.08)",
    pillBg: "rgba(127,119,221,0.14)",
    pillText: "#5048B0",
  },
  midnight: {
    bg: "#0B0B0F",
    surface: "rgba(255,255,255,0.05)",
    text: "#F2F2F4",
    textSecondary: "#74747A",
    accent: "#1D9E75",
    accentText: "#fff",
    border: "rgba(255,255,255,0.09)",
    pillBg: "rgba(29,158,117,0.15)",
    pillText: "#5DCAA5",
  },
  // "cover" promotes the avatar to a full-bleed cover photo that fades into
  // `bg`. Sage-earth palette: muted sage-green canvas with deep forest text
  // and an ochre accent — calm, organic, reads well behind any portrait.
  cover: {
    bg: "#E9EBDD",
    surface: "#DEE2CF",
    text: "#1F2A1B",
    textSecondary: "#6B7565",
    accent: "#8B6A2C",
    accentText: "#FBFAF7",
    border: "rgba(31,42,27,0.12)",
    pillBg: "#DEE2CF",
    pillText: "#3F4A33",
  },
  // "indigo" pairs the cover-photo hero with bold typography on a deep indigo
  // canvas, with a violet→indigo gradient on the display name.
  indigo: {
    bg: "#1A1640",
    surface: "rgba(255,255,255,0.06)",
    text: "#F5F3FF",
    textSecondary: "#A09CCE",
    accent: "linear-gradient(135deg, #6366F1, #C084FC)",
    accentText: "#FFFFFF",
    border: "rgba(255,255,255,0.10)",
    pillBg: "rgba(99,102,241,0.22)",
    pillText: "#CFCDF8",
  },
  // "honey" is the pastel-yellow twin of indigo: cover-photo hero plus bold
  // typography, on a soft butter-cream canvas with a gold→amber gradient.
  honey: {
    bg: "#FFF8E1",
    surface: "rgba(244,200,80,0.10)",
    text: "#2F2308",
    textSecondary: "#967F39",
    accent: "linear-gradient(135deg, #F4C84F, #FF9C5B)",
    accentText: "#FFFFFF",
    border: "rgba(47,35,8,0.10)",
    pillBg: "rgba(244,200,80,0.20)",
    pillText: "#7A5C12",
  },
  // "azure" pairs the cover-photo hero with midnight's mono metadata layout
  // on a deep navy canvas. Bright sky-blue accent stands out for socials and
  // the section count chips.
  azure: {
    bg: "#0A1428",
    surface: "rgba(255,255,255,0.05)",
    text: "#E6F0FF",
    textSecondary: "#6B7B96",
    accent: "#5BA9F5",
    accentText: "#0A1428",
    border: "rgba(255,255,255,0.09)",
    pillBg: "rgba(91,169,245,0.16)",
    pillText: "#9DC8F5",
  },
};

export function themeStyle(theme: ThemeName): React.CSSProperties {
  const t = THEMES[theme] ?? THEMES.clean;
  return {
    "--theme-bg": t.bg,
    "--theme-surface": t.surface,
    "--theme-text": t.text,
    "--theme-text-secondary": t.textSecondary,
    "--theme-accent": t.accent,
    "--theme-accent-text": t.accentText,
    "--theme-border": t.border,
    "--theme-pill-bg": t.pillBg,
    "--theme-pill-text": t.pillText,
  } as React.CSSProperties;
}
