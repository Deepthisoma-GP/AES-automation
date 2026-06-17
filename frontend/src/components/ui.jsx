// Lightweight shadcn/ui-style primitives, hand-rolled with Tailwind so the
// prototype stays self-contained (no component CLI / generated files).
import React from "react";
import { cn } from "../lib/utils.js";

export function Button({ variant = "primary", size = "md", className, ...props }) {
  const variants = {
    primary: "bg-primary text-white hover:brightness-105 shadow-sm",
    secondary: "bg-secondary text-ink hover:brightness-105 shadow-sm",
    outline: "border border-border bg-white text-ink hover:bg-muted",
    ghost: "text-subtle hover:bg-muted hover:text-ink",
    subtle: "bg-muted text-ink hover:brightness-95",
    danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50",
  };
  const sizes = { sm: "h-8 px-3 text-sm", md: "h-10 px-4 text-sm", lg: "h-11 px-6" };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant], sizes[size], className
      )}
      {...props}
    />
  );
}

export function Card({ className, children, ...props }) {
  return (
    <div className={cn("rounded-2xl bg-card border border-border shadow-card", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="rounded-xl bg-muted p-2 text-primary">
            <Icon size={18} />
          </div>
        )}
        <div>
          <h3 className="font-semibold text-ink leading-tight">{title}</h3>
          {subtitle && <p className="text-sm text-subtle mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export const CardBody = ({ className, ...p }) => <div className={cn("px-5 pb-5", className)} {...p} />;

export function Badge({ className, children }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", className)}>
      {children}
    </span>
  );
}

export function Stat({ label, value, sub, icon: Icon, tone = "default" }) {
  const tones = {
    default: "text-ink", primary: "text-primary", secondary: "text-secondary",
  };
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-subtle">{label}</span>
        {Icon && <Icon size={18} className="text-accent" />}
      </div>
      <div className={cn("mt-2 text-3xl font-bold tracking-tight", tones[tone])}>{value}</div>
      {sub && <div className="mt-1 text-xs text-accent">{sub}</div>}
    </Card>
  );
}

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-ink",
        "placeholder:text-accent/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink min-h-[80px]",
        "placeholder:text-accent/60 focus:outline-none focus:ring-2 focus:ring-primary/30",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-ink",
        "focus:outline-none focus:ring-2 focus:ring-primary/30",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ children, className }) {
  return <label className={cn("block text-sm font-medium text-subtle mb-1.5", className)}>{children}</label>;
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-ink tracking-tight">{title}</h1>
        {subtitle && <p className="text-subtle mt-1 max-w-2xl">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

export function Spinner({ label = "Loading…" }) {
  return (
    <div className="flex items-center gap-3 text-subtle py-10 justify-center">
      <div className="h-5 w-5 rounded-full border-2 border-border border-t-primary animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, subtitle, children }) {
  return (
    <Card className="p-10 text-center">
      {Icon && (
        <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-muted grid place-items-center text-primary">
          <Icon size={24} />
        </div>
      )}
      <h3 className="font-semibold text-ink">{title}</h3>
      {subtitle && <p className="text-sm text-subtle mt-1 max-w-md mx-auto">{subtitle}</p>}
      {children && <div className="mt-4 flex justify-center gap-2">{children}</div>}
    </Card>
  );
}

export function Steps({ steps, current, onJump }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {steps.map((s, i) => {
        const state = i === current ? "current" : i < current ? "done" : "todo";
        return (
          <button
            key={s}
            onClick={() => onJump?.(i)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
              state === "current" && "bg-primary text-white",
              state === "done" && "bg-muted text-ink",
              state === "todo" && "text-accent hover:bg-muted"
            )}
          >
            <span
              className={cn(
                "grid place-items-center h-5 w-5 rounded-full text-[10px] font-bold",
                state === "current" ? "bg-white/25 text-white" : "bg-white text-subtle border border-border"
              )}
            >
              {i + 1}
            </span>
            <span className="hidden lg:inline">{s}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100);
  const color = value >= 0.85 ? "#16a34a" : value >= 0.7 ? "#FFAB28" : "#FD4E59";
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="h-2 flex-1 rounded-full bg-white border border-border overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-medium text-subtle w-9 text-right">{pct}%</span>
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40" onClick={onClose}>
      <Card className="w-full max-w-lg bg-canvas fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border font-semibold text-ink">{title}</div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-border flex justify-end gap-2">{footer}</div>}
      </Card>
    </div>
  );
}

export function Toast({ message, tone = "ok" }) {
  if (!message) return null;
  const tones = {
    ok: "bg-emerald-50 text-emerald-800 border-emerald-200",
    err: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm mb-4 fade-in", tones[tone])}>{message}</div>
  );
}
