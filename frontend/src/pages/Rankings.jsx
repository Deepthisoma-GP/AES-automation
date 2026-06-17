import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, PlayCircle, Medal, ShieldCheck } from "lucide-react";
import { api } from "../lib/api.js";
import { cn, ratingClass, fmt } from "../lib/utils.js";
import {
  PageHeader, Card, CardHeader, CardBody, Badge, Button, Select, Spinner, EmptyState,
} from "../components/ui.jsx";
import { useStore } from "../store.jsx";

const RANK_METHODS = {
  relative: "Relative — ranked within each benchmark group by score.",
  absolute: "Absolute — ranked on raw score across the group.",
  normalized: "Normalized — z-scored within group for fair cross-group comparison.",
};

export default function Rankings() {
  const navigate = useNavigate();
  const { activeFrameworkId, setActiveFrameworkId, lastRunId } = useStore();
  const [frameworks, setFrameworks] = useState([]);
  const [framework, setFramework] = useState(null);
  const [run, setRun] = useState(undefined);

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

  const method = framework?.benchmark_groups?.[0]?.ranking_method || framework?.ranking_method || "relative";

  // Group eligible results by benchmark group, ordered by rank.
  const groups = {};
  (run?.results || []).forEach((r) => {
    if (r.blocked) return;
    (groups[r.benchmark_group] ??= []).push(r);
  });
  Object.values(groups).forEach((g) => g.sort((a, b) => (a.rank || 99) - (b.rank || 99)));
  const blocked = (run?.results || []).filter((r) => r.blocked);

  return (
    <div>
      <PageHeader title="Rankings" subtitle="Benchmark-group rankings produced by the ranking engine.">
        <Select className="w-56" value={activeFrameworkId || ""} onChange={(e) => setActiveFrameworkId(e.target.value)}>
          {frameworks.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </Select>
      </PageHeader>

      <Card className="mb-5">
        <CardHeader title="Ranking Engine" subtitle={RANK_METHODS[method]} icon={Trophy} />
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {Object.keys(RANK_METHODS).map((m) => (
              <Badge key={m} className={cn("capitalize", m === method ? "bg-primary/10 text-primary" : "bg-muted text-accent")}>{m}</Badge>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700">
            <ShieldCheck size={15} /> Benchmark validation passed — only eligible employees are ranked.
          </div>
        </CardBody>
      </Card>

      {run === undefined ? <Spinner /> : !run ? (
        <EmptyState icon={PlayCircle} title="No rankings yet"
          subtitle="Run a scorecard to generate rankings for this framework.">
          <Button onClick={() => navigate("/execution")}>Go to Execution</Button>
        </EmptyState>
      ) : (
        <div className="space-y-5">
          {Object.entries(groups).map(([name, members]) => (
            <Card key={name}>
              <CardHeader title={`Benchmark Group: ${name}`} subtitle={`${members.length} ranked · method: ${method}`} />
              <CardBody className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs uppercase text-accent border-b border-border">
                    <th className="px-2 py-2 w-16">Rank</th><th className="px-2">Employee</th>
                    <th className="px-2">Score</th>
                    {method === "normalized" && <th className="px-2">Normalized</th>}
                    <th className="px-2">Percentile</th><th className="px-2">Final Rating</th>
                  </tr></thead>
                  <tbody>
                    {members.map((r, i) => (
                      <tr key={i} className="border-b border-border/60 hover:bg-muted/40">
                        <td className="px-2 py-2.5">
                          <span className={cn("inline-flex items-center gap-1 font-bold",
                            r.rank === 1 ? "text-[#D4A017]" : r.rank <= 3 ? "text-accent" : "text-subtle")}>
                            {r.rank <= 3 && <Medal size={14} />} #{r.rank}
                          </span>
                        </td>
                        <td className="px-2"><div className="font-medium text-ink">{r.agent_name}</div>
                          <div className="text-xs text-accent">{r.agent_id}</div></td>
                        <td className="px-2 font-medium text-ink">{fmt(r.score)}</td>
                        {method === "normalized" && <td className="px-2 text-subtle">{fmt(r.normalized_score, 2)}</td>}
                        <td className="px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${r.percentile || 0}%` }} />
                            </div>
                            <span className="text-xs text-subtle">{fmt(r.percentile, 0)}%</span>
                          </div>
                        </td>
                        <td className="px-2"><Badge className={ratingClass(r.final_rating)}>{r.final_rating}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          ))}

          {blocked.length > 0 && (
            <Card>
              <CardHeader title="Excluded from Ranking" subtitle="Blocked by governance — not eligible" />
              <CardBody>
                <div className="flex flex-wrap gap-2">
                  {blocked.map((r, i) => (
                    <span key={i} className="rounded-lg bg-muted px-3 py-1.5 text-sm text-subtle">
                      {r.agent_name} <span className="text-xs text-accent">({r.lob})</span>
                    </span>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
