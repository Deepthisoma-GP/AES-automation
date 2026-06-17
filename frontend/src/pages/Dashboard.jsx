import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderKanban, Database, PlayCircle, Users, Sparkles, Wrench, Upload, ArrowRight,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { api } from "../lib/api.js";
import { CHART_COLORS, ratingClass, fmt } from "../lib/utils.js";
import { Card, CardHeader, CardBody, Stat, Button, PageHeader, Spinner, Badge } from "../components/ui.jsx";

const QUICK = [
  { label: "Discover with AI", to: "/discovery", icon: Sparkles, variant: "primary" },
  { label: "Build Framework", to: "/builder", icon: Wrench, variant: "secondary" },
  { label: "Upload Data", to: "/upload", icon: Upload, variant: "outline" },
  { label: "Run Scorecard", to: "/execution", icon: PlayCircle, variant: "outline" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.dashboard().then(setData).catch(() => setData({ error: true }));
  }, []);

  if (!data) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Executive Dashboard"
        subtitle="Performance frameworks, data sources, and scorecard activity across the organization."
      >
        <Button onClick={() => navigate("/discovery")}>
          <Sparkles size={16} /> AI Discovery
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Frameworks" value={data.frameworks.total} icon={FolderKanban}
          sub={`${data.frameworks.published} published · ${data.frameworks.draft} draft`} tone="primary" />
        <Stat label="Data Sources" value={data.data_sources} icon={Database} sub="connected" />
        <Stat label="Scorecard Runs" value={data.runs} icon={PlayCircle} sub="executed" tone="secondary" />
        <Stat label="Employees Scored" value={data.employees_scored} icon={Users} sub="cumulative" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-1">
          <CardHeader title="Frameworks by Status" subtitle="Lifecycle distribution" />
          <CardBody>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.frameworks_by_status} dataKey="value" nameKey="name"
                  innerRadius={48} outerRadius={80} paddingAngle={3}>
                  {data.frameworks_by_status.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-sm">
              {data.frameworks_by_status.map((s, i) => (
                <span key={s.name} className="flex items-center gap-1.5 text-subtle">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i] }} />
                  {s.name} ({s.value})
                </span>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Most-Used Frameworks" subtitle="By scorecard executions" />
          <CardBody>
            {data.top_frameworks?.some((f) => f.usage > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.top_frameworks} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid horizontal={false} stroke="#F0E6DC" />
                  <XAxis type="number" stroke="#6D7069" fontSize={12} />
                  <YAxis type="category" dataKey="name" width={150} stroke="#6D7069" fontSize={11} />
                  <Tooltip cursor={{ fill: "#FFF0DC" }} />
                  <Bar dataKey="usage" fill="#FD4E59" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-subtle py-10 text-center">No executions yet — run a scorecard to populate.</p>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Recent Scorecard Runs" subtitle="Latest executions and outcomes"
            action={<Button variant="ghost" size="sm" onClick={() => navigate("/execution")}>
              View all <ArrowRight size={14} /></Button>} />
          <CardBody>
            {data.recent_runs?.length ? (
              <div className="divide-y divide-border">
                {data.recent_runs.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium text-ink">{r.framework_name}</div>
                      <div className="text-xs text-accent">{r.executed_at} · {r.summary?.count ?? 0} employees</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-subtle">avg {fmt(r.summary?.avg_score)}</span>
                      <Badge className={ratingClass("Exceeds")}>{r.summary?.eligible ?? 0} eligible</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-subtle py-8 text-center">
                No runs yet. Head to Upload Center or Scorecard Execution to run your first scorecard.
              </p>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader title="Quick Actions" subtitle="Jump into the workflow" />
          <CardBody className="space-y-2">
            {QUICK.map((q) => (
              <Button key={q.to} variant={q.variant} className="w-full justify-start"
                onClick={() => navigate(q.to)}>
                <q.icon size={16} /> {q.label}
              </Button>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
