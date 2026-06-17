import clsx from "clsx";

export const cn = (...args) => clsx(...args);

// Chart palette derived from the design system.
export const CHART_COLORS = ["#FD4E59", "#FFAB28", "#6D7069", "#161916", "#f59e8a", "#d4a017"];

const RATING_STYLES = {
  Exceptional: "bg-[#FD4E59] text-white",
  Exceeds: "bg-[#FFAB28] text-ink",
  Meets: "bg-[#FFF0DC] text-ink border border-secondary/40",
  "Partially Meets": "bg-muted text-subtle border border-border",
  Below: "bg-[#494949] text-white",
  "Not Eligible": "bg-[#161916] text-white",
  "No Data": "bg-border text-subtle",
};
export const ratingClass = (r) => RATING_STYLES[r] || "bg-muted text-subtle";

const GOV_STYLES = {
  Pass: "text-emerald-700 bg-emerald-50 border-emerald-200",
  Warning: "text-amber-700 bg-amber-50 border-amber-200",
  Capped: "text-orange-700 bg-orange-50 border-orange-200",
  Penalized: "text-orange-700 bg-orange-50 border-orange-200",
  Blocked: "text-red-700 bg-red-50 border-red-200",
};
export const govClass = (s) => GOV_STYLES[s] || "text-subtle bg-muted border-border";

export const confidenceColor = (c) =>
  c >= 0.85 ? "#16a34a" : c >= 0.7 ? "#FFAB28" : "#FD4E59";

export const fmt = (n, digits = 1) =>
  n === null || n === undefined || Number.isNaN(n) ? "—" : Number(n).toFixed(digits);
