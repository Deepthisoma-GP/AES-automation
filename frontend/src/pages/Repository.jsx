import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderKanban, Plus, Copy, GitBranch, Archive, Trash2, Upload, PlayCircle,
  Eye, Search, MoreVertical, CheckCircle2,
} from "lucide-react";
import { api } from "../lib/api.js";
import { cn } from "../lib/utils.js";
import {
  PageHeader, Card, Button, Badge, Input, Select, Spinner, EmptyState, Toast,
} from "../components/ui.jsx";
import { useStore } from "../store.jsx";

const STATUS_TINT = {
  published: "bg-primary/10 text-primary",
  draft: "bg-secondary/20 text-[#9a6a00]",
  archived: "bg-muted text-accent",
};

export default function Repository() {
  const navigate = useNavigate();
  const { setActiveFrameworkId } = useStore();
  const [frameworks, setFrameworks] = useState(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [menuId, setMenuId] = useState(null);
  const [toast, setToast] = useState(null);

  const load = () => api.frameworks().then(setFrameworks).catch(() => setFrameworks([]));
  useEffect(() => { load(); }, []);

  const flash = (message, tone = "ok") => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 2600);
  };

  const act = async (id, action) => {
    setMenuId(null);
    if (action === "delete" && !window.confirm("Delete this framework permanently?")) return;
    const res = await api.frameworkAction(id, action);
    if (action === "clone" || action === "child") {
      flash(`Created "${res.name}".`);
      navigate(`/repository/${res.id}`);
      return;
    }
    flash(action === "archive" ? "Framework archived." : action === "publish" ? "Framework published." : "Framework deleted.");
    load();
  };

  const goUpload = (id) => { setActiveFrameworkId(id); navigate("/upload"); };
  const goRun = (id) => { setActiveFrameworkId(id); navigate("/execution"); };

  if (!frameworks) return <Spinner />;

  const filtered = frameworks.filter(
    (f) =>
      (status === "all" || f.status === status) &&
      (f.name.toLowerCase().includes(query.toLowerCase()) ||
        f.business.toLowerCase().includes(query.toLowerCase()) ||
        f.lob.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div>
      <PageHeader title="Framework Repository" subtitle="All performance frameworks — draft, published, and archived.">
        <Button onClick={() => navigate("/builder")}><Plus size={16} /> New Framework</Button>
      </PageHeader>

      <Toast message={toast?.message} tone={toast?.tone} />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
          <Input className="pl-9" placeholder="Search by name, business, or LOB…"
            value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select className="w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No frameworks found"
          subtitle="Adjust filters, build one manually, or discover one with AI.">
          <Button onClick={() => navigate("/builder")}><Plus size={16} /> New Framework</Button>
          <Button variant="outline" onClick={() => navigate("/discovery")}>AI Discovery</Button>
        </EmptyState>
      ) : (
        <Card className="overflow-visible">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-accent border-b border-border">
                <th className="px-5 py-3 font-semibold">Framework</th>
                <th className="px-3 py-3 font-semibold">Business / LOB</th>
                <th className="px-3 py-3 font-semibold">Owner</th>
                <th className="px-3 py-3 font-semibold">Ver</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Usage</th>
                <th className="px-3 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((f) => (
                <tr key={f.id} className="hover:bg-muted/50">
                  <td className="px-5 py-3">
                    <button className="font-medium text-ink hover:text-primary text-left"
                      onClick={() => navigate(`/repository/${f.id}`)}>
                      {f.name}
                    </button>
                    {f.parent_id && <div className="text-[11px] text-accent flex items-center gap-1">
                      <GitBranch size={11} /> child framework</div>}
                  </td>
                  <td className="px-3 py-3 text-subtle">{f.business}<div className="text-xs text-accent">{f.lob}</div></td>
                  <td className="px-3 py-3 text-subtle">{f.owner}</td>
                  <td className="px-3 py-3 text-subtle">{f.version}</td>
                  <td className="px-3 py-3">
                    <Badge className={cn("capitalize", STATUS_TINT[f.status])}>{f.status}</Badge>
                  </td>
                  <td className="px-3 py-3 text-subtle">{f.usage_count}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" title="Open" onClick={() => navigate(`/repository/${f.id}`)}>
                        <Eye size={15} /></Button>
                      <Button variant="ghost" size="sm" title="Upload data" onClick={() => goUpload(f.id)}>
                        <Upload size={15} /></Button>
                      <Button variant="ghost" size="sm" title="Run scorecard" onClick={() => goRun(f.id)}>
                        <PlayCircle size={15} /></Button>
                      <div className="relative">
                        <Button variant="ghost" size="sm" onClick={() => setMenuId(menuId === f.id ? null : f.id)}>
                          <MoreVertical size={15} /></Button>
                        {menuId === f.id && (
                          <div className="absolute right-0 top-9 z-20 w-44 rounded-xl border border-border bg-white shadow-card py-1 text-sm">
                            <MenuItem icon={Copy} label="Clone" onClick={() => act(f.id, "clone")} />
                            <MenuItem icon={GitBranch} label="Create Child" onClick={() => act(f.id, "child")} />
                            {f.status === "draft"
                              ? <MenuItem icon={CheckCircle2} label="Publish" onClick={() => act(f.id, "publish")} />
                              : <MenuItem icon={Archive} label="Archive" onClick={() => act(f.id, "archive")} />}
                            <MenuItem icon={Trash2} label="Delete" danger onClick={() => act(f.id, "delete")} />
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }) {
  return (
    <button onClick={onClick}
      className={cn("flex w-full items-center gap-2 px-3 py-2 hover:bg-muted text-left",
        danger ? "text-red-600" : "text-ink")}>
      <Icon size={14} /> {label}
    </button>
  );
}
