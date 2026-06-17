// Framework detail / overview — read-only view with lifecycle actions.
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Upload,
  Play,
  Copy,
  GitBranch,
  Send,
  Archive,
  Trash2,
  MoreHorizontal,
  Info,
  Network,
  Gauge,
  Target,
  Layers,
  ShieldCheck,
  Award,
  Trophy,
  FileSpreadsheet,
  Lock,
  ChevronRight,
} from "lucide-react";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  Spinner,
  EmptyState,
  Toast,
} from "../components/ui.jsx";
import { cn, ratingClass, fmt } from "../lib/utils.js";
import { api } from "../lib/api.js";
import { useStore } from "../store.jsx";

const STATUS_TINT = {
  published: "bg-primary/10 text-primary border border-primary/30",
  draft: "bg-secondary/15 text-ink border border-secondary/40",
  archived: "bg-muted text-subtle border border-border",
};

const CLASS_TINT = {
  input: "bg-secondary/15 text-ink border border-secondary/40",
  process: "bg-muted text-subtle border border-border",
  output: "bg-primary/10 text-primary border border-primary/30",
};

const DIRECTION_LABEL = {
  higher_better: "Higher is better",
  lower_better: "Lower is better",
};

function MetaItem({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-white/50 px-3 py-2.5">
      <div className="text-xs text-subtle">{label}</div>
      <div className="mt-0.5 font-medium text-ink break-words">{value ?? "—"}</div>
    </div>
  );
}

function Chip({ children, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg bg-white border border-border px-2.5 py-1 text-xs font-medium text-ink",
        className
      )}
    >
      {children}
    </span>
  );
}

function SectionTable({ head, children }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-subtle">
          <tr>
            {head.map((h) => (
              <th key={h} className="text-left font-medium px-4 py-2.5 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export default function FrameworkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setActiveFrameworkId } = useStore();

  const [fw, setFw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [toast, setToast] = useState(null); // { message, tone }
  const [moreOpen, setMoreOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setNotFound(false);
    try {
      const data = await api.framework(id);
      if (!data || !data.id) {
        setNotFound(true);
        setFw(null);
      } else {
        setFw(data);
      }
    } catch {
      setNotFound(true);
      setFw(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const flash = (message, tone = "ok") => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3500);
  };

  async function doAction(action) {
    setMoreOpen(false);
    setBusy(true);
    try {
      const res = await api.frameworkAction(id, action);
      if (action === "clone" || action === "child") {
        const newId = res?.id;
        flash(action === "clone" ? "Framework cloned." : "Child framework created.");
        if (newId) navigate(`/repository/${newId}`);
        else load();
      } else if (action === "delete") {
        navigate("/repository");
      } else {
        // archive / publish — reload current view
        flash(action === "publish" ? "Framework published." : "Framework archived.");
        if (res && res.id) setFw(res);
        else await load();
      }
    } catch (e) {
      flash(e.message || "Action failed.", "err");
    } finally {
      setBusy(false);
    }
  }

  function handleDelete() {
    setConfirmDelete(false);
    doAction("delete");
  }

  if (loading) return <Spinner label="Loading framework…" />;

  if (notFound || !fw) {
    return (
      <>
        <Link
          to="/repository"
          className="inline-flex items-center gap-1.5 text-sm text-subtle hover:text-ink mb-4"
        >
          <ArrowLeft size={15} /> Framework Repository
        </Link>
        <EmptyState
          icon={Info}
          title="Framework not found"
          subtitle="This framework may have been deleted or the link is invalid."
        >
          <Button variant="primary" onClick={() => navigate("/repository")}>
            Back to Repository
          </Button>
        </EmptyState>
      </>
    );
  }

  const metrics = fw.metrics || [];
  const metricName = (mid) => {
    const m = metrics.find((x) => x.id === mid);
    return m ? m.name : mid;
  };

  const org = fw.organization || [];
  const targets = fw.targets || [];
  const bands = fw.scoring_bands || [];
  const governance = fw.governance || [];
  const ratingFw = fw.rating_framework || {};
  const ratingBands = ratingFw.bands || [];
  const benchGroups = fw.benchmark_groups || [];
  const template = fw.upload_template || {};
  const sections = template.sections || [];
  const locked = template.locked || [];
  const isLocked = (col) => locked.includes(col);

  return (
    <>
      <Link
        to="/repository"
        className="inline-flex items-center gap-1.5 text-sm text-subtle hover:text-ink mb-4"
      >
        <ArrowLeft size={15} /> Framework Repository
      </Link>

      {toast && <Toast message={toast.message} tone={toast.tone} />}

      <PageHeader
        title={fw.name}
        subtitle={`${fw.business || "—"} • ${fw.lob || "—"} • v${fw.version}`}
      >
        <Badge className={cn("mr-1", STATUS_TINT[fw.status] || STATUS_TINT.draft)}>
          {fw.status}
        </Badge>

        <Button size="sm" variant="outline" onClick={() => navigate(`/builder/${id}`)}>
          <Pencil size={15} /> Edit
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setActiveFrameworkId(id);
            navigate("/upload");
          }}
        >
          <Upload size={15} /> Upload Data
        </Button>
        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            setActiveFrameworkId(id);
            navigate("/execution");
          }}
        >
          <Play size={15} /> Run Scorecard
        </Button>

        <div className="relative">
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => setMoreOpen((v) => !v)}
          >
            <MoreHorizontal size={16} /> More
          </Button>
          {moreOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMoreOpen(false)}
                aria-hidden
              />
              <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-border bg-white shadow-card py-1.5 fade-in">
                <MenuItem icon={Copy} label="Clone" onClick={() => doAction("clone")} />
                <MenuItem
                  icon={GitBranch}
                  label="Create Child"
                  onClick={() => doAction("child")}
                />
                {fw.status === "draft" && (
                  <MenuItem icon={Send} label="Publish" onClick={() => doAction("publish")} />
                )}
                {fw.status === "published" && (
                  <MenuItem
                    icon={Archive}
                    label="Archive"
                    onClick={() => doAction("archive")}
                  />
                )}
                <div className="my-1 border-t border-border" />
                <MenuItem
                  icon={Trash2}
                  label="Delete"
                  danger
                  onClick={() => {
                    setMoreOpen(false);
                    setConfirmDelete(true);
                  }}
                />
              </div>
            </>
          )}
        </div>
      </PageHeader>

      {confirmDelete && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardBody className="pt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-red-700">
              <span className="font-semibold">Delete this framework?</span> This action cannot
              be undone.
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="danger" onClick={handleDelete}>
                <Trash2 size={15} /> Delete framework
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metadata */}
        <Card className="lg:col-span-2">
          <CardHeader title="Overview" subtitle="Framework metadata" icon={Info} />
          <CardBody>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <MetaItem label="Owner" value={fw.owner} />
              <MetaItem label="Version" value={`v${fw.version}`} />
              <MetaItem
                label="Status"
                value={
                  <Badge className={cn(STATUS_TINT[fw.status] || STATUS_TINT.draft)}>
                    {fw.status}
                  </Badge>
                }
              />
              <MetaItem label="Usage Count" value={fmt(fw.usage_count, 0)} />
              <MetaItem label="Created Date" value={fw.created_date} />
              <MetaItem label="Last Updated" value={fw.last_updated} />
              {fw.parent_id && (
                <MetaItem
                  label="Parent"
                  value={
                    <Link
                      to={`/repository/${fw.parent_id}`}
                      className="text-primary hover:underline"
                    >
                      {fw.parent_id}
                    </Link>
                  }
                />
              )}
            </div>
          </CardBody>
        </Card>

        {/* Organization Structure */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Organization Structure"
            subtitle="Hierarchy levels evaluated by this framework"
            icon={Network}
          />
          <CardBody>
            {org.length ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {org.map((level, i) => (
                  <React.Fragment key={`${level}-${i}`}>
                    <Chip
                      className={i === 0 ? "border-primary/40 bg-primary/5 text-primary" : ""}
                    >
                      {level}
                    </Chip>
                    {i < org.length - 1 && (
                      <ChevronRight size={15} className="text-accent shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <p className="text-sm text-subtle">No organization levels defined.</p>
            )}
          </CardBody>
        </Card>

        {/* Metrics */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Metrics"
            subtitle={`${metrics.length} metric${metrics.length === 1 ? "" : "s"} defined`}
            icon={Gauge}
          />
          <CardBody>
            {metrics.length ? (
              <SectionTable
                head={[
                  "Name",
                  "Classification",
                  "Datatype",
                  "Direction",
                  "Scoring Method",
                  "Weight",
                  "Formula",
                ]}
              >
                {metrics.map((m) => (
                  <tr key={m.id} className="border-t border-border bg-white/40">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-ink">{m.name}</div>
                      {!m.include_in_score && (
                        <div className="text-xs text-subtle">Excluded from score</div>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge className={cn(CLASS_TINT[m.classification] || "bg-muted text-subtle")}>
                        {m.classification}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-subtle">{m.datatype || "—"}</td>
                    <td className="px-4 py-2.5 text-subtle whitespace-nowrap">
                      {DIRECTION_LABEL[m.direction] || m.direction || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-subtle">{m.scoring_method || "—"}</td>
                    <td className="px-4 py-2.5 font-medium text-ink whitespace-nowrap">
                      {m.weight === null || m.weight === undefined
                        ? "—"
                        : `${fmt(m.weight, 0)}%`}
                    </td>
                    <td className="px-4 py-2.5">
                      {m.formula ? (
                        <code className="rounded-lg bg-muted px-2 py-1 font-mono text-xs text-ink">
                          {m.formula}
                        </code>
                      ) : (
                        <span className="text-subtle">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </SectionTable>
            ) : (
              <p className="text-sm text-subtle">No metrics defined.</p>
            )}
          </CardBody>
        </Card>

        {/* Targets */}
        <Card>
          <CardHeader
            title="Targets"
            subtitle="Metric targets by entity"
            icon={Target}
          />
          <CardBody>
            {targets.length ? (
              <SectionTable head={["Level", "Entity", "Metric", "Value"]}>
                {targets.map((t, i) => (
                  <tr key={i} className="border-t border-border bg-white/40">
                    <td className="px-4 py-2.5 text-subtle whitespace-nowrap">{t.level}</td>
                    <td className="px-4 py-2.5 font-medium text-ink">{t.entity}</td>
                    <td className="px-4 py-2.5 text-ink">{metricName(t.metric_id)}</td>
                    <td className="px-4 py-2.5 font-medium text-ink whitespace-nowrap">
                      {t.value}
                    </td>
                  </tr>
                ))}
              </SectionTable>
            ) : (
              <p className="text-sm text-subtle">No targets defined.</p>
            )}
          </CardBody>
        </Card>

        {/* Scoring Bands */}
        <Card>
          <CardHeader
            title="Scoring Bands"
            subtitle="Achievement to points mapping"
            icon={Layers}
          />
          <CardBody>
            {bands.length ? (
              <SectionTable head={["Min Achievement", "Points", "Rating"]}>
                {bands.map((b, i) => (
                  <tr key={i} className="border-t border-border bg-white/40">
                    <td className="px-4 py-2.5 font-medium text-ink whitespace-nowrap">
                      {fmt(b.min_achievement, 0)}%
                    </td>
                    <td className="px-4 py-2.5 text-ink">{b.points}</td>
                    <td className="px-4 py-2.5">
                      <Badge className={ratingClass(b.rating)}>{b.rating}</Badge>
                    </td>
                  </tr>
                ))}
              </SectionTable>
            ) : (
              <p className="text-sm text-subtle">No scoring bands defined.</p>
            )}
          </CardBody>
        </Card>

        {/* Governance */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Governance Rules"
            subtitle={`${governance.length} rule${governance.length === 1 ? "" : "s"}`}
            icon={ShieldCheck}
          />
          <CardBody>
            {governance.length ? (
              <div className="space-y-2.5">
                {governance.map((g, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-white/50 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-ink">{g.name}</span>
                      {g.type && (
                        <Badge className="bg-muted text-subtle border border-border">
                          {g.type}
                        </Badge>
                      )}
                      {g.action && (
                        <Badge className="bg-secondary/15 text-ink border border-secondary/40">
                          {g.action}
                        </Badge>
                      )}
                    </div>
                    {(g.field || g.operator || g.threshold !== undefined) && (
                      <code className="mt-2 inline-block rounded-lg bg-muted px-2 py-1 font-mono text-xs text-ink">
                        {[g.field, g.operator, g.threshold]
                          .filter((x) => x !== undefined && x !== null && x !== "")
                          .join(" ")}
                        {g.cap_value !== undefined && g.cap_value !== null
                          ? ` → cap ${g.cap_value}`
                          : ""}
                        {g.penalty !== undefined && g.penalty !== null
                          ? ` → penalty ${g.penalty}`
                          : ""}
                      </code>
                    )}
                    {g.metric && (
                      <span className="mt-2 ml-2 text-xs text-subtle">on {g.metric}</span>
                    )}
                    {g.description && (
                      <p className="mt-1.5 text-sm text-subtle">{g.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-subtle">No governance rules defined.</p>
            )}
          </CardBody>
        </Card>

        {/* Rating Framework */}
        <Card>
          <CardHeader
            title="Rating Framework"
            subtitle={ratingFw.method ? `Method: ${ratingFw.method}` : "Score to rating bands"}
            icon={Award}
          />
          <CardBody>
            {ratingBands.length ? (
              <div className="space-y-2">
                {ratingBands.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-border bg-white/50 px-4 py-2.5"
                  >
                    <Badge className={ratingClass(b.label)}>{b.label}</Badge>
                    <span className="text-sm text-subtle">
                      min score{" "}
                      <span className="font-medium text-ink">{b.min_score}</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-subtle">No rating bands defined.</p>
            )}
          </CardBody>
        </Card>

        {/* Benchmark & Ranking */}
        <Card>
          <CardHeader
            title="Benchmark & Ranking"
            subtitle="Peer comparison groups"
            icon={Trophy}
          />
          <CardBody>
            <div className="space-y-2">
              {benchGroups.length ? (
                benchGroups.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-border bg-white/50 px-4 py-2.5"
                  >
                    <div>
                      <div className="font-medium text-ink">{b.name}</div>
                      <div className="text-xs text-subtle">Level: {b.level}</div>
                    </div>
                    {b.ranking_method && (
                      <Chip>{b.ranking_method}</Chip>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-subtle">No benchmark groups defined.</p>
              )}
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-2.5">
                <span className="text-sm text-subtle">Ranking method</span>
                <span className="font-medium text-ink">{fw.ranking_method || "—"}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Upload Template */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Upload Template"
            subtitle="Expected sections, columns and instructions"
            icon={FileSpreadsheet}
          />
          <CardBody>
            {sections.length ? (
              <div className="space-y-4">
                {sections.map((s, i) => (
                  <div key={`${s.name}-${i}`}>
                    <div className="text-sm font-semibold text-ink mb-1.5">{s.name}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(s.columns || []).map((col, j) => (
                        <Chip
                          key={`${col}-${j}`}
                          className={isLocked(col) ? "bg-muted border-border" : ""}
                        >
                          {isLocked(col) && <Lock size={12} className="text-accent" />}
                          {col}
                        </Chip>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-subtle">No template sections defined.</p>
            )}
            {template.instructions && (
              <div className="mt-4 rounded-xl border border-border bg-muted/40 px-4 py-3">
                <div className="text-xs font-medium text-subtle mb-1">Instructions</div>
                <p className="text-sm text-ink whitespace-pre-line">{template.instructions}</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-left transition",
        danger ? "text-red-600 hover:bg-red-50" : "text-ink hover:bg-muted"
      )}
    >
      <Icon size={15} className={danger ? "" : "text-accent"} />
      {label}
    </button>
  );
}
