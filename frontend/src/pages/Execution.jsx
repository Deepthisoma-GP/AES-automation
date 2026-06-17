import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlayCircle, ChevronDown, ChevronRight, Star, Trophy, Lightbulb, ArrowRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { api } from "../lib/api.js";
import { cn, ratingClass, govClass, fmt, CHART_COLORS } from "../lib/utils.js";
import {
  PageHeader, Card, CardHeader, CardBody, Button, Select, Label, Badge, Stat, Spinner, EmptyState, Toast,
} from "../components/ui.jsx";
import { useStore } from "../store.jsx";

const FLOW = [
  "Upload Data", "Derived Metrics", "Formula Execution", "Governance",
  "Metric Scoring", "Final Rating", "Benchmark", "Ranking", "Results",
];

export default function Execution() {
  const navigate = useNavigate();
  const { activeFrameworkId, setActiveFrameworkId, lastRunId, setLastRunId } = useStore();
  const [frameworks, setFrameworks] = useState([]);
  const [run, setRun] = useState(null);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { api.frameworks().then(setFrameworks); }, []);
  useEffect(() => {
    if (lastRunId) api.runResult(lastRunId).then(setRun).catch(() => setRun(null));
  }, [lastRunId]);

  const execute = async () => {
    setBusy(true);
    try {
      const result = await api.run(activeFrameworkId);
      setRun(result);
      setLastRunId(result.id);
      setToast({ message: `Executed on ${result.row_count} employees.`, tone: "ok" });
      setTimeout(() => setToast(null), 2600);
    } catch (e) {
      setToast({ message: e.message, tone: "err" });
    } finally { setBusy(false); }
  };

  const dist = run?.summary?.rating_distribution
    ? Object.entries(run.summary.rating_distribution).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div>
      <PageHeader title="Scorecard Execution" subtitle="Run the engine end-to-end and review employee-level results.">
        <Button onClick={execute} disabled={busy || !activeFrameworkId}>
          <PlayCircle size={16} /> {busy ? "Running…" : "Run Scorecard"}
        </Button>
      </PageHeader>
      <Toast message={toast?.message} tone={toast?.tone} />

      <Card className="mb-5">
        <CardBody className="pt-5 flex flex-wrap items-end gap-4">
          <div className="min-w-[260px]">
            <Label>Framework</Label>
            <Select value={activeFrameworkId || ""} onChange={(e) => setActiveFrameworkId(e.target.value)}>
              {frameworks.map((f) => <option key={f.id} value={f.id}>{f.name} (v{f.version})</option>)}
            </Select>
          </div>
          <p className="text-sm text-accent flex-1">
            Runs against uploaded data, or the seeded sample dataset if none was uploaded.
          </p>
        </CardBody>
      </Card>

      <Card className="mb-5">
        <CardBody className="pt-5">
          <div className="flex flex-wrap items-center gap-1">
            {FLOW.map((s, i) => (
              <React.Fragment key={s}>
                <span className={cn("rounded-lg px-2.5 py-1.5 text-xs font-medium",
                  run ? "bg-primary/10 text-primary" : "bg-muted text-accent")}>{s}</span>
                {i < FLOW.length - 1 && <ChevronRight size={14} className="text-accent" />}
              </React.Fragment>
            ))}
          </div>
        </CardBody>
      </Card>

      {!run ? (
        <EmptyState icon={PlayCircle} title="No results yet"
          subtitle="Run the scorecard to generate employee-level ratings, rankings, and governance outcomes." >
          <Button onClick={execute} disabled={busy || !activeFrameworkId}><PlayCircle size={16} /> Run Scorecard</Button>
        </EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <Stat label="Employees" value={run.summary.count} tone="primary" />
            <Stat label="Eligible" value={run.summary.eligible} sub={`${run.summary.blocked} blocked`} />
            <Stat label="Avg Score" value={fmt(run.summary.avg_score)} sub="of 5.0" tone="secondary" />
            <Stat label="Top Score" value={fmt(run.summary.top_score)} />
          </div>

          <div className="grid lg:grid-cols-3 gap-5 mb-5">
            <Card className="lg:col-span-2">
              <CardHeader title="Rating Distribution" subtitle="Final ratings across the population" />
              <CardBody>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={dist}>
                    <CartesianGrid vertical={false} stroke="#F0E6DC" />
                    <XAxis dataKey="name" stroke="#6D7069" fontSize={11} />
                    <YAxis stroke="#6D7069" fontSize={12} allowDecimals={false} />
                    <Tooltip cursor={{ fill: "#FFF0DC" }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={48}>
                      {dist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
            <Card className="lg:col-span-1">
              <CardHeader title="Next Steps" subtitle="Explore the results" />
              <CardBody className="space-y-2">
                <Button variant="outline" className="w-full justify-between" onClick={() => navigate("/ratings")}>
                  <span className="flex items-center gap-2"><Star size={16} /> View Ratings</span><ArrowRight size={14} />
                </Button>
                <Button variant="outline" className="w-full justify-between" onClick={() => navigate("/rankings")}>
                  <span className="flex items-center gap-2"><Trophy size={16} /> View Rankings</span><ArrowRight size={14} />
                </Button>
                <Button variant="outline" className="w-full justify-between" onClick={() => navigate("/insights")}>
                  <span className="flex items-center gap-2"><Lightbulb size={16} /> AI Insights</span><ArrowRight size={14} />
                </Button>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader title="Employee Results" subtitle="Click a row for metric-level detail" />
            <CardBody className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase text-accent border-b border-border">
                  <th className="px-2 py-2">Employee</th><th className="px-2">LOB</th>
                  <th className="px-2">Governance</th><th className="px-2">Score</th>
                  <th className="px-2">Final Rating</th><th className="px-2">Rank</th><th></th>
                </tr></thead>
                <tbody>
                  {run.results.map((r, i) => (
                    <React.Fragment key={i}>
                      <tr className="border-b border-border/60 hover:bg-muted/40 cursor-pointer"
                        onClick={() => setExpanded(expanded === i ? null : i)}>
                        <td className="px-2 py-2.5">
                          <div className="font-medium text-ink">{r.agent_name}</div>
                          <div className="text-xs text-accent">{r.agent_id} · {r.manager}</div>
                        </td>
                        <td className="px-2 text-subtle">{r.lob}</td>
                        <td className="px-2"><Badge className={cn("border", govClass(r.governance_status))}>{r.governance_status}</Badge></td>
                        <td className="px-2 font-medium text-ink">{fmt(r.score)}</td>
                        <td className="px-2"><Badge className={ratingClass(r.final_rating)}>{r.final_rating}</Badge></td>
                        <td className="px-2 text-subtle">{r.rank ? `#${r.rank}/${r.group_size}` : "—"}</td>
                        <td className="px-2">{expanded === i ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</td>
                      </tr>
                      {expanded === i && (
                        <tr className="bg-muted/30">
                          <td colSpan={7} className="px-4 py-4">
                            <EmployeeDetail r={r} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}

function EmployeeDetail({ r }) {
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-4 gap-3 text-sm">
        <Info label="Business" value={r.business} />
        <Info label="LOB" value={r.lob} />
        <Info label="Supervisor" value={r.supervisor} />
        <Info label="Period" value={r.period} />
      </div>

      {r.governance_notes?.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {r.governance_notes.join(" · ")}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm bg-white rounded-xl">
          <thead><tr className="text-left text-xs uppercase text-accent border-b border-border">
            <th className="px-3 py-2">Metric</th><th className="px-3">Class</th><th className="px-3">Target</th>
            <th className="px-3">Actual</th><th className="px-3">Achievement</th><th className="px-3">Points</th><th className="px-3">Rating</th>
          </tr></thead>
          <tbody>
            {r.metric_results.map((m, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="px-3 py-2 font-medium text-ink">{m.metric}</td>
                <td className="px-3 text-subtle capitalize">{m.classification}</td>
                <td className="px-3 text-subtle">{fmt(m.target, 0)}</td>
                <td className="px-3 text-subtle">{fmt(m.actual, 1)}</td>
                <td className="px-3 text-subtle">{m.achievement != null ? `${fmt(m.achievement)}%` : "—"}</td>
                <td className="px-3 font-medium text-ink">{m.points}</td>
                <td className="px-3"><Badge className={ratingClass(m.rating)}>{m.rating}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid sm:grid-cols-4 gap-3">
        <Info label="Total Points" value={fmt(r.total_points, 1)} />
        <Info label="Weighted Score" value={fmt(r.score)} />
        <Info label="Final Rating" value={r.final_rating} />
        <Info label="Benchmark / Rank" value={`${r.benchmark_group}${r.rank ? ` · #${r.rank}` : ""}`} />
      </div>
    </div>
  );
}

const Info = ({ label, value }) => (
  <div className="rounded-xl bg-white border border-border px-3 py-2">
    <div className="text-[11px] uppercase tracking-wide text-accent">{label}</div>
    <div className="text-ink font-medium">{value || "—"}</div>
  </div>
);
