import React, { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  Lightbulb,
  TrendingUp,
  Gauge,
  Check,
  X,
  PlusCircle,
  Calculator,
  Target,
  Award,
  Users,
  Wand2,
  ShieldCheck,
  Filter,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  Select,
  Label,
  Spinner,
  EmptyState,
  ConfidenceBar,
  Stat,
} from "../components/ui.jsx";
import { api } from "../lib/api.js";
import { useStore } from "../store.jsx";
import { cn, CHART_COLORS } from "../lib/utils.js";

// The spec categories for recommendation types, with display order, icon and
// a warm tint for the type Badge.
const CATEGORY_META = {
  "New KPIs": { icon: PlusCircle, tint: "bg-[#FFF0DC] text-ink border border-secondary/40" },
  "Derived KPIs": { icon: Calculator, tint: "bg-muted text-ink border border-secondary/40" },
  "Target Improvements": { icon: Target, tint: "bg-[#FFF0DC] text-ink border border-border" },
  "Rating Improvements": { icon: Award, tint: "bg-muted text-ink border border-border" },
  "Benchmark Improvements": { icon: Users, tint: "bg-white text-subtle border border-secondary/40" },
  "Formula Simplification": { icon: Wand2, tint: "bg-white text-ink border border-border" },
  "Governance Improvements": { icon: ShieldCheck, tint: "bg-muted text-subtle border border-border" },
};

const CATEGORY_ORDER = Object.keys(CATEGORY_META);

// Map an arbitrary recommendation `type` string onto one of the known
// categories so the API can return loose labels and we still render sensibly.
function resolveCategory(type) {
  const t = (type || "").toLowerCase();
  if (CATEGORY_META[type]) return type;
  if (t.includes("derived")) return "Derived KPIs";
  if (t.includes("kpi") || t.includes("metric") || t.includes("new")) return "New KPIs";
  if (t.includes("target")) return "Target Improvements";
  if (t.includes("rating")) return "Rating Improvements";
  if (t.includes("benchmark")) return "Benchmark Improvements";
  if (t.includes("formula") || t.includes("simplif")) return "Formula Simplification";
  if (t.includes("govern") || t.includes("cap") || t.includes("gate") || t.includes("complian"))
    return "Governance Improvements";
  return "New KPIs";
}

function categoryMeta(category) {
  return CATEGORY_META[category] || { icon: Lightbulb, tint: "bg-muted text-subtle border border-border" };
}

const impactClass = (impact) => {
  switch (impact) {
    case "High":
      return "bg-[#FD4E59] text-white";
    case "Medium":
      return "bg-[#FFAB28] text-ink";
    case "Low":
    default:
      return "bg-muted text-subtle border border-border";
  }
};

// A single recommendation card with UI-only Apply / Dismiss actions.
function RecommendationCard({ rec, state, onApply, onDismiss }) {
  const meta = categoryMeta(rec.category);
  const Icon = meta.icon;
  const applied = state === "applied";
  const dismissed = state === "dismissed";

  return (
    <Card
      className={cn(
        "p-5 transition",
        applied && "border-emerald-200 ring-1 ring-emerald-200/60",
        dismissed && "opacity-60"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge className={meta.tint}>
            <Icon size={12} className="mr-1.5" />
            {rec.category}
          </Badge>
          <Badge className={impactClass(rec.impact)}>{rec.impact} impact</Badge>
        </div>
        {applied && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <Check size={14} /> Applied
          </span>
        )}
        {dismissed && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-subtle">
            <X size={14} /> Dismissed
          </span>
        )}
      </div>

      <h3
        className={cn(
          "mt-3 font-semibold text-ink leading-snug",
          dismissed && "line-through text-subtle"
        )}
      >
        {rec.title}
      </h3>
      {rec.detail && <p className="mt-1 text-sm text-subtle">{rec.detail}</p>}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-[160px]">
          <div className="mb-1 text-xs font-medium text-subtle">Confidence</div>
          <ConfidenceBar value={rec.confidence} />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={onApply}
            disabled={dismissed}
            className={cn(applied && "bg-emerald-600 hover:bg-emerald-600")}
          >
            <Check size={14} />
            {applied ? "Applied" : "Apply"}
          </Button>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            <X size={14} />
            {dismissed ? "Restore" : "Dismiss"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function Insights() {
  const { activeFrameworkId, setActiveFrameworkId } = useStore();

  const [frameworks, setFrameworks] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI-only per-recommendation state keyed by index: "applied" | "dismissed".
  const [cardState, setCardState] = useState({});
  // Category filter: null = all.
  const [activeCategory, setActiveCategory] = useState(null);

  // Load framework list once for the selector.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const fws = await api.frameworks();
        if (mounted) setFrameworks(Array.isArray(fws) ? fws : []);
      } catch {
        if (mounted) setFrameworks([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load insights on mount and whenever the active framework changes.
  useEffect(() => {
    if (!activeFrameworkId) return;
    let mounted = true;
    setLoading(true);
    setError(null);
    setCardState({});
    setActiveCategory(null);
    (async () => {
      try {
        const res = await api.insights(activeFrameworkId);
        if (mounted) setData(res || null);
      } catch (e) {
        if (mounted) {
          setError(e.message || "Failed to load insights");
          setData(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [activeFrameworkId]);

  // Normalise recommendations and attach a resolved category.
  const recommendations = useMemo(() => {
    const list = Array.isArray(data?.recommendations) ? data.recommendations : [];
    return list.map((r, i) => ({
      ...r,
      _id: i,
      confidence: typeof r.confidence === "number" ? r.confidence : 0,
      category: resolveCategory(r.type),
    }));
  }, [data]);

  // Summary metrics across ALL recommendations (not just the filtered view).
  const summary = useMemo(() => {
    const total = recommendations.length;
    const high = recommendations.filter((r) => r.impact === "High").length;
    const avgConfidence = total
      ? Math.round(
          (recommendations.reduce((s, r) => s + r.confidence, 0) / total) * 100
        )
      : 0;
    return { total, high, avgConfidence };
  }, [recommendations]);

  // Chart: count by category, in spec order, only non-empty categories.
  const chartData = useMemo(() => {
    const counts = {};
    recommendations.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return CATEGORY_ORDER.filter((c) => counts[c]).map((c) => ({
      category: c,
      count: counts[c],
    }));
  }, [recommendations]);

  // Categories present (for the filter chips).
  const presentCategories = useMemo(
    () => CATEGORY_ORDER.filter((c) => recommendations.some((r) => r.category === c)),
    [recommendations]
  );

  const visible = useMemo(
    () =>
      activeCategory
        ? recommendations.filter((r) => r.category === activeCategory)
        : recommendations,
    [recommendations, activeCategory]
  );

  const setState = (id, value) =>
    setCardState((prev) => {
      const next = { ...prev };
      if (prev[id] === value) delete next[id];
      else next[id] = value;
      return next;
    });

  const selector = (
    <div className="flex items-center gap-2">
      <Label className="mb-0 hidden sm:block">Framework</Label>
      <Select
        className="w-56"
        value={activeFrameworkId || ""}
        onChange={(e) => setActiveFrameworkId(e.target.value)}
      >
        {frameworks.length === 0 && <option value="">No frameworks</option>}
        {frameworks.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
            {f.status ? ` · ${f.status}` : ""}
          </option>
        ))}
      </Select>
    </div>
  );

  return (
    <>
      <PageHeader
        title="AI Insights"
        subtitle="AI-generated recommendations to sharpen your performance framework — new KPIs, smarter targets, simpler formulas and stronger governance, each scored by confidence and impact."
      >
        {selector}
      </PageHeader>

      {loading ? (
        <Card>
          <Spinner label="Generating recommendations…" />
        </Card>
      ) : error ? (
        <EmptyState
          icon={Sparkles}
          title="Couldn’t load insights"
          subtitle={error}
        >
          <Button variant="primary" onClick={() => setActiveFrameworkId(activeFrameworkId)}>
            Retry
          </Button>
        </EmptyState>
      ) : recommendations.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No recommendations yet"
          subtitle="The Insights Engine hasn’t surfaced any improvements for this framework. Try selecting another framework or run a fresh scorecard to give the AI more signal."
        />
      ) : (
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat
              label="Recommendations"
              value={summary.total}
              sub={`for ${data?.framework || "this framework"}`}
              icon={Lightbulb}
              tone="primary"
            />
            <Stat
              label="High impact"
              value={summary.high}
              sub={summary.total ? `${Math.round((summary.high / summary.total) * 100)}% of total` : "—"}
              icon={TrendingUp}
              tone="secondary"
            />
            <Stat
              label="Avg. confidence"
              value={`${summary.avgConfidence}%`}
              sub="across all recommendations"
              icon={Gauge}
            />
          </div>

          {/* Breakdown chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader
                icon={BarChart3}
                title="Recommendations by category"
                subtitle="Where the AI sees the most room to improve."
              />
              <CardBody>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
                  >
                    <CartesianGrid horizontal={false} stroke="#FFE3C2" />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fill: "#6D7069", fontSize: 12 }}
                      axisLine={{ stroke: "#FFE3C2" }}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="category"
                      width={150}
                      tick={{ fill: "#161916", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(253,78,89,0.06)" }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #FFE3C2",
                        background: "#FDF8F4",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                      {chartData.map((entry, i) => (
                        <Cell key={entry.category} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          )}

          {/* Category filter chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-subtle">
              <Filter size={14} />
              Filter
            </span>
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition border",
                activeCategory === null
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-subtle border-border hover:bg-muted"
              )}
            >
              All ({recommendations.length})
            </button>
            {presentCategories.map((c) => {
              const count = recommendations.filter((r) => r.category === c).length;
              const active = activeCategory === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveCategory(active ? null : c)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition border",
                    active
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-subtle border-border hover:bg-muted"
                  )}
                >
                  {c} ({count})
                </button>
              );
            })}
          </div>

          {/* Recommendation list */}
          <div className="grid gap-4 lg:grid-cols-2">
            {visible.map((rec) => (
              <RecommendationCard
                key={rec._id}
                rec={rec}
                state={cardState[rec._id]}
                onApply={() => setState(rec._id, "applied")}
                onDismiss={() => setState(rec._id, "dismissed")}
              />
            ))}
          </div>

          {visible.length === 0 && (
            <EmptyState
              icon={Filter}
              title="No recommendations in this category"
              subtitle="Clear the filter to see all recommendations."
            >
              <Button variant="outline" onClick={() => setActiveCategory(null)}>
                Show all
              </Button>
            </EmptyState>
          )}
        </div>
      )}
    </>
  );
}
