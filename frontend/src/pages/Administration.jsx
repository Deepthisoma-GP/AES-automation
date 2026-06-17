// Administration module — platform configuration, users, roles, and data management.
import React, { useEffect, useState } from "react";
import {
  Shield,
  Users,
  KeyRound,
  UserCog,
  Database,
  Server,
  Layers,
  PlugZap,
  Play,
  UserCheck,
  Check,
  Minus,
  UserPlus,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  Input,
  Select,
  Label,
  Modal,
  Spinner,
  Toast,
  Stat,
} from "../components/ui.jsx";
import { cn } from "../lib/utils.js";
import { useStore } from "../store.jsx";
import { api } from "../lib/api.js";

const ROLES = [
  "Platform Administrator",
  "Business Owner",
  "Operations Manager",
  "Leadership",
];

const ROLE_BADGE = {
  "Platform Administrator": "bg-[#161916] text-white",
  "Business Owner": "bg-[#FD4E59] text-white",
  "Operations Manager": "bg-[#FFAB28] text-ink",
  Leadership: "bg-[#FFF0DC] text-ink border border-secondary/40",
};

const SEED_USERS = [
  { name: "Priya Nair", role: "Business Owner" },
  { name: "Rajesh Kumar", role: "Operations Manager" },
  { name: "Meera Iyer", role: "Leadership" },
  { name: "Admin", role: "Platform Administrator" },
];

const CAPABILITIES = [
  { key: "create", label: "Create Framework" },
  { key: "run", label: "Run Scorecard" },
  { key: "publish", label: "Publish" },
  { key: "manage", label: "Manage Users" },
  { key: "view", label: "View Results" },
];

const PERMISSIONS = {
  "Platform Administrator": { create: true, run: true, publish: true, manage: true, view: true },
  "Business Owner": { create: true, run: true, publish: true, manage: false, view: true },
  "Operations Manager": { create: false, run: true, publish: false, manage: false, view: true },
  Leadership: { create: false, run: false, publish: false, manage: false, view: true },
};

function RoleBadge({ role }) {
  return <Badge className={ROLE_BADGE[role] || "bg-muted text-subtle"}>{role}</Badge>;
}

export default function Administration() {
  const { role, setRole } = useStore();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [toast, setToast] = useState({ message: "", tone: "ok" });

  const [users, setUsers] = useState(SEED_USERS);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState(ROLES[1]);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function loadStats() {
    setLoading(true);
    try {
      const d = await api.dashboard();
      setStats(d);
    } catch (e) {
      setToast({ message: `Could not load platform stats: ${e.message}`, tone: "err" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  function flash(message, tone = "ok") {
    setToast({ message, tone });
    window.clearTimeout(flash._t);
    flash._t = window.setTimeout(() => setToast({ message: "", tone }), 3500);
  }

  function submitInvite(e) {
    e?.preventDefault?.();
    const name = inviteName.trim();
    if (!name) {
      flash("Please enter a name for the user.", "err");
      return;
    }
    setUsers((prev) => [...prev, { name, role: inviteRole }]);
    setInviteOpen(false);
    setInviteName("");
    setInviteRole(ROLES[1]);
    flash(`Invited ${name} as ${inviteRole}.`);
  }

  async function confirmReset() {
    setResetting(true);
    try {
      await api.reset();
      setResetOpen(false);
      await loadStats();
      flash("Prototype data has been reset and reseeded.");
    } catch (e) {
      flash(`Reset failed: ${e.message}`, "err");
    } finally {
      setResetting(false);
    }
  }

  const fw = stats?.frameworks || {};

  return (
    <div>
      <PageHeader
        title="Administration"
        subtitle="Configure the APFB platform — manage users and roles, review permissions, and control prototype data."
      >
        <Badge className="bg-muted text-subtle gap-1.5 inline-flex items-center">
          <Shield size={13} /> Admin Console
        </Badge>
      </PageHeader>

      <Toast message={toast.message} tone={toast.tone} />

      {/* Platform overview */}
      {loading ? (
        <Spinner label="Loading platform overview…" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Stat label="Frameworks" value={fw.total ?? 0} sub={`${fw.published ?? 0} published · ${fw.draft ?? 0} draft`} icon={Layers} tone="primary" />
          <Stat label="Data Sources" value={stats?.data_sources ?? 0} icon={PlugZap} />
          <Stat label="Scorecard Runs" value={stats?.runs ?? 0} icon={Play} tone="secondary" />
          <Stat label="Employees Scored" value={stats?.employees_scored ?? 0} icon={UserCheck} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users & Roles */}
        <Card>
          <CardHeader
            title="Users & Roles"
            subtitle="People with access to this APFB workspace."
            icon={Users}
            action={
              <Button size="sm" variant="secondary" onClick={() => setInviteOpen(true)}>
                <UserPlus size={15} /> Invite User
              </Button>
            }
          />
          <CardBody>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-subtle">
                  <tr>
                    <th className="text-left font-medium px-4 py-2.5">User</th>
                    <th className="text-left font-medium px-4 py-2.5">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={`${u.name}-${i}`} className="border-t border-border bg-white/40">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="grid place-items-center h-7 w-7 rounded-full bg-muted text-xs font-semibold text-ink">
                            {u.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                          </span>
                          <span className="font-medium text-ink">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <RoleBadge role={u.role} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* Your Active Role */}
        <Card>
          <CardHeader
            title="Your Active Role"
            subtitle="Switch perspective to preview the demo as a different persona."
            icon={UserCog}
          />
          <CardBody>
            <div className="rounded-xl bg-muted/60 border border-border p-4 mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs text-subtle">Currently acting as</div>
                <div className="mt-1">
                  <RoleBadge role={role} />
                </div>
              </div>
              <Shield className="text-accent" size={28} />
            </div>
            <Label>Active role</Label>
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
            <p className="text-xs text-subtle mt-3">
              Role switching is for the prototype only — it changes which capabilities and views the
              demo presents from each stakeholder's perspective. It does not alter stored data.
            </p>
          </CardBody>
        </Card>

        {/* Role Permissions */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Role Permissions"
            subtitle="What each role can do across the platform. Your active role is highlighted."
            icon={KeyRound}
          />
          <CardBody>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-subtle">
                  <tr>
                    <th className="text-left font-medium px-4 py-2.5">Role</th>
                    {CAPABILITIES.map((c) => (
                      <th key={c.key} className="text-center font-medium px-3 py-2.5 whitespace-nowrap">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROLES.map((r) => {
                    const active = r === role;
                    return (
                      <tr
                        key={r}
                        className={cn(
                          "border-t border-border",
                          active ? "bg-muted" : "bg-white/40"
                        )}
                      >
                        <td className="px-4 py-2.5 font-medium text-ink">
                          <div className="flex items-center gap-2">
                            {r}
                            {active && (
                              <Badge className="bg-primary text-white text-[10px]">You</Badge>
                            )}
                          </div>
                        </td>
                        {CAPABILITIES.map((c) => {
                          const allowed = PERMISSIONS[r]?.[c.key];
                          return (
                            <td key={c.key} className="px-3 py-2.5 text-center">
                              {allowed ? (
                                <Check size={16} className="inline text-emerald-600" />
                              ) : (
                                <Minus size={16} className="inline text-accent/50" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader
            title="Data Management"
            subtitle="Where APFB keeps its prototype data."
            icon={Database}
          />
          <CardBody>
            <div className="rounded-xl bg-muted/60 border border-border p-4 text-sm text-subtle">
              All frameworks, data sources, and scorecard runs are persisted in a lightweight JSON
              store on the FastAPI backend. This keeps the prototype self-contained and easy to
              reset.
            </div>

            <div className="mt-4 rounded-xl border border-red-200 bg-red-50/60 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle size={18} className="text-red-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-red-700">Danger zone</div>
                  <p className="text-sm text-red-700/80 mt-1">
                    Resetting reseeds all frameworks and data sources to their defaults and clears
                    every scorecard run. This cannot be undone.
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <Button variant="danger" size="sm" onClick={() => setResetOpen(true)}>
                  <RotateCcw size={15} /> Reset Prototype Data
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* System */}
        <Card>
          <CardHeader
            title="System"
            subtitle="Read-only environment details."
            icon={Server}
          />
          <CardBody>
            <dl className="divide-y divide-border rounded-xl border border-border overflow-hidden">
              {[
                ["Backend", "FastAPI (Python)"],
                ["Frontend", "React + Vite + Tailwind"],
                ["Storage", "JSON / SQLite (prototype)"],
                ["Version", "0.1.0"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-4 py-3 bg-white/40">
                  <dt className="text-sm text-subtle">{k}</dt>
                  <dd className="text-sm font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>
      </div>

      {/* Invite modal */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite User"
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submitInvite}>
              <UserPlus size={15} /> Send Invite
            </Button>
          </>
        }
      >
        <form onSubmit={submitInvite} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              autoFocus
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="e.g. Anita Desai"
            />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
          <p className="text-xs text-subtle">
            This is a prototype — invited users are added to the local list only and no email is
            sent.
          </p>
        </form>
      </Modal>

      {/* Reset confirm modal */}
      <Modal
        open={resetOpen}
        onClose={() => (resetting ? null : setResetOpen(false))}
        title="Reset Prototype Data?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetOpen(false)} disabled={resetting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmReset} disabled={resetting}>
              {resetting ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-red-200 border-t-red-600 animate-spin" />
                  Resetting…
                </>
              ) : (
                <>
                  <RotateCcw size={15} /> Yes, reset everything
                </>
              )}
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-red-50 p-2 text-red-600 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <p className="text-sm text-subtle">
            This will reseed all frameworks and data sources to their defaults and permanently clear
            every scorecard run. The action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
}
