import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, PlayCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { api } from "../lib/api.js";
import { cn, ratingClass, govClass, fmt, CHART_COLORS } from "../lib/utils.js";
import {
  PageHeader, Card, CardHeader, CardBody, Badge, Button, Select, Label, Spinner, EmptyState, Stat,
} from "../components/ui.jsx";
import { useStore } from "../store.jsx";

const METHODS = [
  ["Points-Based", "Sum metric points into a total."],
  ["Threshold", "Map a score to a band via thresholds."],
  ["Weighted Average", "Weighted mean of metric points."],
  ["Forced Ranking", "Fixed distribution across bands."],
  ["Gated", "Eligibility gates before rating."],
  ["Hybrid", "Combines scoring with governance caps."],
];

export default function Ratings() {
  const navigate = useNavigate();
  const { activeFrameworkId, setActiveFrameworkId, lastRunId } = useStore();
  const [frameworks, setFrameworks] = useState([]);
  const [run, setRun] = useState(undefined); // undefined = loading, null = none
  const [framework, setFramework] = useState(null);

  useEffect(() => { api.frameworks().then(setFrameworks); }, []);
  useEffect(() => {
    if (activeFrameworkId) api.framework(activeFrameworkId).then(setFramework).catch(() => {});
  }, [activeFrameworkId]);
  useEffect(() => {
    setRun(undefined);
    const loader = lastRunId
      ? api.runResult(lastRunId).catch(() => api.latestRun(activeFrameworkId))
      : api.latestRun(activeFrameworkId);
    loader.then(setRun).catch(() => setRun(null));
  }, [activeFrameworkId, lastRunId]);

  const dist = run?.summary?.rating_distribution
    ? Object.entries(run.summary.rating_distribution).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div>
      <PageHeader title="Ratings" subtitle="Final and metric-level ratings produced by the rating engine.">
        <Select className="w-56" value={activeFrameworkId || ""} onChange={(e) => setActiveFrameworkId(e.target.value)}>
          {frameworks.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </Select>
      </PageHeader>

      <Card className="mb-5">
        <CardHeader title="Rating Engine" subtitle={`Method: ${framework?.rating_framework?.method?.replace(/_/g, " ") || "—"}`} icon={Star} />
        <CardBody>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {METHODS.map(([name, desc]) => {
              const active = framework?.rating_framework?.method?.replace(/_/g, " ").toLowerCase() === name.toLowerCase();
              return (
                <div key={name} className={cn("rounded-xl border px-3 py-2",
                  active ? "border-primary bg-primary/5" : "border-border bg-white")}>
                  <div className="text-sm font-medium text-ink flex items-center gap-2">
                    {name}{active && <Badge className="bg-primary/10 text-primary">active</Badge>}
                  </div>
                  <div className="text-xs text-accent">{desc}</div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {run === undefined ? <Spinner /> : !run ? (
        <EmptyState icon={PlayCircle} title="No ratings yet"
          subtitle="Run a scorecard to generate ratings for this framework.">
          <Button onClick={() => navigate("/execution")}>Go to Execution</Button>
        </EmptyState>
      ) : (
        <>
          <div className="grid lg:grid-cols-3 gap-5 mb-5">
            <Card className="lg:col-span-1">
              <CardHeader title="Distribution" />
              <CardBody>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={dist} dataKey="value" nameKey="name" outerRadius={80}>
                      {dist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader title="Rating Bands" subtitle="Counts per final rating" />
              <CardBody className="space-y-2">
                {dist.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-3">
                    <Badge className={ratingClass(d.name)}>{d.name}</Badge>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${(d.value / run.summary.count) * 100}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    </div>
                    <span className="text-sm text-subtle w-10 text-right">{d.value}</span>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader title="Employee Ratings" subtitle="Final rating with governance status and per-metric ratings" />
            <CardBody className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase text-accent border-b border-border">
                  <th className="px-2 py-2">Employee</th><th className="px-2">Governance</th>
                  <th className="px-2">Score</th><th className="px-2">Final Rating</th>
                  <th className="px-2">Metric Ratings</th>
                </tr></thead>
                <tbody>
                  {run.results.map((r, i) => (
                    <tr key={i} className="border-b border-border/60">
                      <td className="px-2 py-2.5">
                        <div className="font-medium text-ink">{r.agent_name}</div>
                        <div className="text-xs text-accent">{r.lob}</div>
                      </td>
                      <td className="px-2"><Badge className={cn("border", govClass(r.governance_status))}>{r.governance_status}</Badge></td>
                      <td className="px-2 font-medium text-ink">{fmt(r.score)}</td>
                      <td className="px-2"><Badge className={ratingClass(r.final_rating)}>{r.final_rating}</Badge></td>
                      <td className="px-2">
                        <div className="flex flex-wrap gap-1">
                          {r.metric_results.map((m, j) => (
                            <span key={j} title={`${m.metric}: ${m.rating}`}
                              className={cn("text-[10px] px-1.5 py-0.5 rounded", ratingClass(m.rating))}>
                              {m.metric.split(" ").map((w) => w[0]).join("")} {m.points}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
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
