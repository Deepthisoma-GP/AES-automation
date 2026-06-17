import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Database,
  Layers,
  Calculator,
  Target,
  ShieldCheck,
  Award,
  Users,
  Network,
  ArrowRight,
  Check,
  Trash2,
  Pencil,
  Play,
  RotateCcw,
  CheckCircle2,
  FileSearch,
} from "lucide-react";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  Input,
  Label,
  Spinner,
  EmptyState,
  ConfidenceBar,
  Toast,
} from "../components/ui.jsx";
import { api } from "../lib/api.js";
import { cn, confidenceColor } from "../lib/utils.js";

// Staged "thinking" messages used while the AI discovery runs.
const STAGES = [
  "Reading sources…",
  "Discovering metrics…",
  "Analyzing formulas…",
  "Mapping governance & ratings…",
  "Building dependency graph…",
];

const classificationClass = (c) => {
  const k = (c || "").toLowerCase();
  if (k.includes("lead")) return "bg-muted text-ink border border-secondary/40";
  if (k.includes("lag")) return "bg-[#FFF0DC] text-ink border border-secondary/40";
  if (k.includes("guard") || k.includes("compli"))
    return "bg-white text-subtle border border-border";
  return "bg-muted text-subtle border border-border";
};

const govTypeClass = (t) => {
  const k = (t || "").toLowerCase();
  if (k.includes("cap")) return "text-orange-700 bg-orange-50 border border-orange-200";
  if (k.includes("gate") || k.includes("block"))
    return "text-red-700 bg-red-50 border border-red-200";
  if (k.includes("penal")) return "text-amber-700 bg-amber-50 border border-amber-200";
  return "text-emerald-700 bg-emerald-50 border border-emerald-200";
};

// A single reviewable finding row with UI-only Accept / Modify / Delete actions.
function FindingRow({ label, meta, confidence, status, onAction }) {
  const accepted = status === "accepted";
  const deleted = status === "deleted";
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2.5 transition",
        deleted
          ? "border-border bg-white/40 opacity-60"
          : accepted
          ? "border-emerald-200 bg-emerald-50/40"
          : "border-border bg-white"
      )}
    >
      <div className="min-w-[180px] flex-1">
        <div
          className={cn(
            "flex items-center gap-2 font-medium text-ink",
            deleted && "line-through text-subtle"
          )}
        >
          {accepted && <Check size={14} className="text-emerald-600 shrink-0" />}
          <span className="truncate">{label}</span>
        </div>
        {meta && <div className="mt-1 text-xs text-subtle">{meta}</div>}
      </div>

      {typeof confidence === "number" && <ConfidenceBar value={confidence} />}

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className={cn("px-2", accepted && "text-emerald-700 bg-emerald-50")}
          onClick={() => onAction(accepted ? "reset" : "accepted")}
          title="Accept finding"
        >
          <Check size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="px-2"
          onClick={() => onAction("modify")}
          title="Modify finding"
        >
          <Pencil size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn("px-2", deleted && "text-red-600 bg-red-50")}
          onClick={() => onAction(deleted ? "reset" : "deleted")}
          title="Delete finding"
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
}

function Section({ icon, title, subtitle, confidence, children }) {
  return (
    <Card>
      <CardHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
        action={
          typeof confidence === "number" ? (
            <div className="w-40">
              <ConfidenceBar value={confidence} />
            </div>
          ) : null
        }
      />
      <CardBody className="space-y-2">{children}</CardBody>
    </Card>
  );
}

export default function Discovery() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState([]);
  const [discoveries, setDiscoveries] = useState([]);
  const [active, setActive] = useState(null);

  // Run-discovery panel state
  const [selectedSources, setSelectedSources] = useState([]);
  const [name, setName] = useState("");
  const [discovering, setDiscovering] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);

  // Per-row review state: { [`${section}:${idx}`]: "accepted" | "deleted" }
  const [rowStatus, setRowStatus] = useState({});

  const [accepting, setAccepting] = useState(false);
  const [toast, setToast] = useState(null);

  const stageTimer = useRef(null);

  const showToast = (message, tone = "ok") => {
    setToast({ message, tone });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [ds, disc] = await Promise.all([api.dataSources(), api.discoveries()]);
        if (!mounted) return;
        setSources(Array.isArray(ds) ? ds : []);
        const list = Array.isArray(disc) ? disc : [];
        setDiscoveries(list);
        if (list.length) {
          setActive(list[0]);
          setName(list[0].framework_name || "");
        }
      } catch (e) {
        if (mounted) showToast(e.message || "Failed to load discovery data", "err");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      if (stageTimer.current) window.clearInterval(stageTimer.current);
    };
  }, []);

  const toggleSource = (id) =>
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );

  const selectActive = (d) => {
    setActive(d);
    setName(d.framework_name || "");
    setRowStatus({});
  };

  const runDiscovery = async () => {
    if (discovering) return;
    setDiscovering(true);
    setStageIdx(0);

    // Staged progress messages over ~2.5s.
    const interval = 2500 / STAGES.length;
    stageTimer.current = window.setInterval(() => {
      setStageIdx((i) => Math.min(i + 1, STAGES.length - 1));
    }, interval);

    const chosen = sources.filter((s) => selectedSources.includes(s.id)).map((s) => s.name);

    try {
      const result = await api.runDiscovery({
        name: name || "Discovered Framework",
        sources: chosen,
      });
      setDiscoveries((prev) => [result, ...prev]);
      selectActive(result);
      showToast("AI discovery complete — review the findings below.");
    } catch (e) {
      showToast(e.message || "Discovery failed", "err");
    } finally {
      if (stageTimer.current) window.clearInterval(stageTimer.current);
      setDiscovering(false);
    }
  };

  const setStatus = (key, status) =>
    setRowStatus((prev) => {
      const next = { ...prev };
      if (status === "reset" || status === "modify") delete next[key];
      else next[key] = status;
      return next;
    });

  const onRowAction = (section, idx) => (status) => {
    if (status === "modify") {
      showToast("Modify is available in the framework editor after accepting.");
      return;
    }
    setStatus(`${section}:${idx}`, status === "reset" ? "reset" : status);
  };

  const acceptAll = async () => {
    if (!active || accepting) return;
    setAccepting(true);
    try {
      await api.acceptDiscovery(active.id, { name: name || active.framework_name });
      showToast("Draft framework created. Redirecting to repository…");
      window.setTimeout(() => navigate("/repository"), 900);
    } catch (e) {
      showToast(e.message || "Could not create draft framework", "err");
      setAccepting(false);
    }
  };

  const discard = () => {
    setActive(null);
    setRowStatus({});
    showToast("Discovery discarded.");
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="AI Framework Discovery"
          subtitle="Let AI read your existing scorecards and discover the underlying metrics, formulas, governance, ratings and benchmarks."
        />
        <Card>
          <Spinner label="Loading data sources & prior discoveries…" />
        </Card>
      </>
    );
  }

  const org = active?.organization;
  const rating = active?.rating_framework;

  return (
    <>
      <PageHeader
        title="AI Framework Discovery"
        subtitle="Let AI read your existing scorecards and discover the underlying metrics, formulas, governance, ratings and benchmarks — each finding scored by confidence for your review."
      >
        {discoveries.length > 1 && (
          <div className="flex items-center gap-2">
            <Label className="mb-0 hidden sm:block">History</Label>
            <select
              className="h-9 rounded-xl border border-border bg-white px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={active?.id || ""}
              onChange={(e) =>
                selectActive(discoveries.find((d) => d.id === e.target.value) || discoveries[0])
              }
            >
              {discoveries.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.framework_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </PageHeader>

      <Toast message={toast?.message} tone={toast?.tone} />

      {/* ---------------------------------------------------------------- */}
      {/* Run Discovery panel                                              */}
      {/* ---------------------------------------------------------------- */}
      <Card className="mb-6">
        <CardHeader
          icon={Sparkles}
          title="Run AI Discovery"
          subtitle="Pick the data sources to analyze and name the framework the AI should reconstruct."
        />
        <CardBody className="space-y-5">
          <div>
            <Label>Data sources to analyze</Label>
            {sources.length === 0 ? (
              <p className="text-sm text-subtle">No data sources connected yet.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {sources.map((s) => {
                  const checked = selectedSources.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSource(s.id)}
                      disabled={discovering}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                        checked
                          ? "border-primary/50 bg-muted"
                          : "border-border bg-white hover:bg-muted/60"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border",
                          checked
                            ? "bg-primary border-primary text-white"
                            : "border-border bg-white text-transparent"
                        )}
                      >
                        <Check size={14} />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 font-medium text-ink">
                          <Database size={14} className="text-accent shrink-0" />
                          <span className="truncate">{s.name}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-subtle">
                          {s.type}
                          {s.purpose ? ` · ${s.purpose}` : ""}
                          {typeof s.records === "number"
                            ? ` · ${s.records.toLocaleString()} records`
                            : ""}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label>Discovered framework name</Label>
              <Input
                placeholder="e.g. Inside Sales Performance Framework"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={discovering}
              />
            </div>
            <Button
              variant="primary"
              onClick={runDiscovery}
              disabled={discovering || sources.length === 0}
            >
              {discovering ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Discovering…
                </>
              ) : (
                <>
                  <Play size={16} />
                  Run AI Discovery
                </>
              )}
            </Button>
          </div>

          {discovering && (
            <div className="rounded-xl border border-secondary/40 bg-[#FFF0DC] px-4 py-3">
              <div className="flex items-center gap-3 text-sm font-medium text-ink">
                <span className="h-4 w-4 rounded-full border-2 border-border border-t-primary animate-spin" />
                {STAGES[stageIdx]}
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${((stageIdx + 1) / STAGES.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ---------------------------------------------------------------- */}
      {/* Framework Review                                                 */}
      {/* ---------------------------------------------------------------- */}
      {!active ? (
        <EmptyState
          icon={FileSearch}
          title="No framework discovered yet"
          subtitle="Select one or more data sources above and run AI discovery to reconstruct a performance framework with confidence-scored findings."
        />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">Framework Review</h2>
              <p className="text-sm text-subtle">
                AI findings for{" "}
                <span className="font-medium text-ink">{active.framework_name}</span>
                {active.sources?.length ? (
                  <> · from {active.sources.length} source(s)</>
                ) : null}
              </p>
            </div>
            {active.sources?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {active.sources.map((s) => (
                  <Badge key={s} className="bg-muted text-subtle border border-border">
                    {s}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>

          {/* Organization Structure */}
          {org && (
            <Section
              icon={Layers}
              title="Organization Structure"
              subtitle="Hierarchy levels the AI inferred from the source data."
              confidence={org.confidence}
            >
              <div className="flex flex-wrap items-center gap-2">
                {(org.levels || []).map((lvl, i) => (
                  <React.Fragment key={lvl}>
                    <Badge className="bg-muted text-ink border border-secondary/40">{lvl}</Badge>
                    {i < org.levels.length - 1 && (
                      <ArrowRight size={14} className="text-accent" />
                    )}
                  </React.Fragment>
                ))}
                {(!org.levels || org.levels.length === 0) && (
                  <span className="text-sm text-subtle">No levels detected.</span>
                )}
              </div>
            </Section>
          )}

          {/* Metrics */}
          <Section
            icon={Target}
            title="Metrics"
            subtitle="Performance measures discovered across the sources."
          >
            {(active.metrics || []).length === 0 ? (
              <p className="text-sm text-subtle">No metrics discovered.</p>
            ) : (
              active.metrics.map((m, i) => (
                <FindingRow
                  key={`m-${i}`}
                  label={m.name}
                  confidence={m.confidence}
                  status={rowStatus[`metrics:${i}`]}
                  onAction={onRowAction("metrics", i)}
                  meta={
                    <Badge className={classificationClass(m.classification)}>
                      {m.classification}
                    </Badge>
                  }
                />
              ))
            )}
          </Section>

          {/* Formulas — Formula Intelligence Engine */}
          <Section
            icon={Calculator}
            title="Formulas"
            subtitle="Formula Intelligence Engine — derived calculations and their sources."
          >
            {(active.formulas || []).length === 0 ? (
              <p className="text-sm text-subtle">No formulas discovered.</p>
            ) : (
              active.formulas.map((f, i) => {
                const key = `formulas:${i}`;
                const status = rowStatus[key];
                const deleted = status === "deleted";
                const accepted = status === "accepted";
                return (
                  <div
                    key={`f-${i}`}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 transition",
                      deleted
                        ? "border-border bg-white/40 opacity-60"
                        : accepted
                        ? "border-emerald-200 bg-emerald-50/40"
                        : "border-border bg-white"
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="min-w-[180px] flex-1">
                        <div
                          className={cn(
                            "flex items-center gap-2 font-medium text-ink",
                            deleted && "line-through text-subtle"
                          )}
                        >
                          {accepted && (
                            <Check size={14} className="text-emerald-600 shrink-0" />
                          )}
                          {f.name}
                        </div>
                        <code className="mt-1 block rounded-lg bg-muted px-2 py-1 font-mono text-xs text-ink">
                          {f.expression}
                        </code>
                        {f.source && (
                          <div className="mt-1 text-xs text-subtle">Source: {f.source}</div>
                        )}
                      </div>
                      <ConfidenceBar value={f.confidence} />
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn("px-2", accepted && "text-emerald-700 bg-emerald-50")}
                          onClick={() =>
                            setStatus(key, accepted ? "reset" : "accepted")
                          }
                          title="Accept"
                        >
                          <Check size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-2"
                          onClick={() =>
                            showToast(
                              "Modify is available in the framework editor after accepting."
                            )
                          }
                          title="Modify"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn("px-2", deleted && "text-red-600 bg-red-50")}
                          onClick={() => setStatus(key, deleted ? "reset" : "deleted")}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </Section>

          {/* Targets */}
          <Section
            icon={Target}
            title="Targets"
            subtitle="Goal thresholds inferred from historical performance."
          >
            {(active.targets || []).length === 0 ? (
              <p className="text-sm text-subtle">No targets discovered.</p>
            ) : (
              active.targets.map((t, i) => (
                <FindingRow
                  key={`t-${i}`}
                  label={t.name}
                  confidence={t.confidence}
                  status={rowStatus[`targets:${i}`]}
                  onAction={onRowAction("targets", i)}
                  meta={<span className="text-ink font-medium">Target: {t.value}</span>}
                />
              ))
            )}
          </Section>

          {/* Governance */}
          <Section
            icon={ShieldCheck}
            title="Governance Rules"
            subtitle="Caps, gates and compliance rules the AI detected."
          >
            {(active.governance || []).length === 0 ? (
              <p className="text-sm text-subtle">No governance rules discovered.</p>
            ) : (
              active.governance.map((g, i) => (
                <FindingRow
                  key={`g-${i}`}
                  label={g.name}
                  confidence={g.confidence}
                  status={rowStatus[`governance:${i}`]}
                  onAction={onRowAction("governance", i)}
                  meta={<Badge className={govTypeClass(g.type)}>{g.type}</Badge>}
                />
              ))
            )}
          </Section>

          {/* Rating Framework + Benchmark Groups */}
          <div className="grid gap-5 lg:grid-cols-2">
            <Section
              icon={Award}
              title="Rating Framework"
              subtitle="How scores roll up into a rating."
              confidence={rating?.confidence}
            >
              {rating ? (
                <div className="rounded-xl border border-border bg-white px-3 py-3">
                  <div className="text-sm text-subtle">Method</div>
                  <div className="font-medium text-ink">{rating.method}</div>
                </div>
              ) : (
                <p className="text-sm text-subtle">No rating method discovered.</p>
              )}
            </Section>

            <Section
              icon={Users}
              title="Benchmark Groups"
              subtitle="Peer cohorts for relative comparison."
            >
              {(active.benchmark_groups || []).length === 0 ? (
                <p className="text-sm text-subtle">No benchmark groups discovered.</p>
              ) : (
                active.benchmark_groups.map((b, i) => (
                  <FindingRow
                    key={`b-${i}`}
                    label={b.name}
                    confidence={b.confidence}
                    status={rowStatus[`benchmarks:${i}`]}
                    onAction={onRowAction("benchmarks", i)}
                  />
                ))
              )}
            </Section>
          </div>

          {/* Dependency Graph */}
          <Section
            icon={Network}
            title="Dependency Graph"
            subtitle="How discovered metrics feed into one another."
          >
            {(active.dependency_graph || []).length === 0 ? (
              <p className="text-sm text-subtle">No dependencies discovered.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(
                  active.dependency_graph.reduce((acc, edge) => {
                    (acc[edge.to] = acc[edge.to] || []).push(edge.from);
                    return acc;
                  }, {})
                ).map(([to, froms]) => (
                  <div key={to} className="rounded-xl border border-border bg-white px-3 py-2.5">
                    <div className="mb-2 text-sm font-medium text-ink">{to}</div>
                    <div className="flex flex-wrap gap-2">
                      {froms.map((from, i) => (
                        <span
                          key={`${to}-${from}-${i}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-muted px-2.5 py-1 text-xs text-ink"
                        >
                          {from}
                          <ArrowRight size={12} className="text-primary" />
                          <span className="text-subtle">{to}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Footer action bar */}
          <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-card backdrop-blur">
            <div className="flex items-center gap-2 text-sm text-subtle">
              <CheckCircle2 size={16} className="text-emerald-600" />
              Review the findings, then create a draft framework you can refine.
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={discard} disabled={accepting}>
                <RotateCcw size={16} />
                Discard
              </Button>
              <Button variant="primary" onClick={acceptAll} disabled={accepting}>
                {accepting ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Accept &amp; Create Draft Framework
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
