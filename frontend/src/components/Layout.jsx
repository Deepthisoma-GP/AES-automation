import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FolderKanban, Sparkles, Wrench, Database, Upload,
  PlayCircle, Star, Trophy, Lightbulb, Network, Settings, ChevronRight,
} from "lucide-react";
import { useStore } from "../store.jsx";
import { cn } from "../lib/utils.js";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/repository", label: "Framework Repository", icon: FolderKanban },
  { to: "/discovery", label: "AI Framework Discovery", icon: Sparkles },
  { to: "/builder", label: "Template Builder", icon: Wrench },
  { to: "/data-sources", label: "Data Sources", icon: Database },
  { to: "/upload", label: "Upload Center", icon: Upload },
  { to: "/execution", label: "Scorecard Execution", icon: PlayCircle },
  { to: "/ratings", label: "Ratings", icon: Star },
  { to: "/rankings", label: "Rankings", icon: Trophy },
  { to: "/insights", label: "Insights", icon: Lightbulb },
  { to: "/architecture", label: "Architecture", icon: Network },
  { to: "/administration", label: "Administration", icon: Settings },
];

const ROLES = ["Platform Administrator", "Business Owner", "Operations Manager", "Leadership"];

export default function Layout({ children }) {
  const { role, setRole } = useStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-canvas">
      <aside className="w-64 shrink-0 border-r border-border bg-card flex flex-col fixed h-screen">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 px-5 h-16 border-b border-border text-left"
        >
          <div className="h-9 w-9 rounded-xl bg-primary grid place-items-center text-white font-extrabold">
            A
          </div>
          <div className="leading-tight">
            <div className="font-bold text-ink">APFB</div>
            <div className="text-[11px] text-accent">Performance Framework Builder</div>
          </div>
        </button>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-subtle hover:bg-muted hover:text-ink"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className={isActive ? "text-white" : "text-accent"} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={14} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <label className="text-[11px] uppercase tracking-wide text-accent px-1">Viewing as</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 w-full h-9 rounded-xl border border-border bg-white px-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
      </aside>

      <main className="flex-1 ml-64 min-w-0">
        <div className="max-w-[1180px] mx-auto px-8 py-8 fade-in">{children}</div>
      </main>
    </div>
  );
}
