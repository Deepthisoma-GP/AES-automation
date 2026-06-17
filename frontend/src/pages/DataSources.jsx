import React, { useEffect, useState } from "react";
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
  EmptyState,
  Toast,
  Stat,
} from "../components/ui.jsx";
import { cn } from "../lib/utils.js";
import { api } from "../lib/api.js";
import {
  Database,
  FileSpreadsheet,
  BarChart3,
  FileText,
  FileCheck,
  Plus,
  Plug,
  Layers,
  CheckCircle2,
  Hash,
} from "lucide-react";

// All source types the platform can ingest.
const SOURCE_TYPES = [
  "Excel",
  "CSV",
  "Power BI",
  "Tableau",
  "PDF",
  "PPT",
  "SQL Query",
  "BigQuery",
  "Snowflake",
  "Databricks",
  "Target File",
  "Rating Framework File",
  "SOP Document",
];

const PURPOSES = [
  "Performance Metrics",
  "Targets",
  "Governance",
  "Rating Logic",
  "Benchmarking",
];

// Map a source type to a sensible lucide icon.
function iconForType(type) {
  switch (type) {
    case "Excel":
    case "CSV":
    case "Target File":
    case "Rating Framework File":
      return FileSpreadsheet;
    case "Power BI":
    case "Tableau":
      return BarChart3;
    case "SQL Query":
    case "BigQuery":
    case "Snowflake":
    case "Databricks":
      return Database;
    case "PDF":
    case "PPT":
      return FileText;
    case "SOP Document":
      return FileCheck;
    default:
      return Layers;
  }
}

const formatNumber = (n) =>
  n === null || n === undefined || Number.isNaN(Number(n))
    ? "0"
    : Number(n).toLocaleString("en-US");

function SourceCard({ source }) {
  const Icon = iconForType(source.type);
  const connected = source.status === "connected";
  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="rounded-xl bg-muted p-2.5 text-primary shrink-0">
            <Icon size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-ink leading-tight truncate">
              {source.name}
            </h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge className="bg-muted text-ink border border-border">
                {source.type}
              </Badge>
              {source.purpose && (
                <Badge className="bg-[#FFF0DC] text-ink border border-secondary/40">
                  {source.purpose}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shrink-0",
            connected
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          )}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              connected ? "bg-emerald-500" : "bg-amber-500"
            )}
          />
          {connected ? "Connected" : "Pending"}
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="flex items-center gap-1.5 text-subtle">
          <Hash size={14} className="text-accent" />
          Records
        </span>
        <span className="font-semibold text-ink">
          {formatNumber(source.records)}
        </span>
      </div>
    </Card>
  );
}

export default function DataSources() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    type: SOURCE_TYPES[0],
    purpose: PURPOSES[0],
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.dataSources();
        if (active) setSources(Array.isArray(data) ? data : []);
      } catch (e) {
        if (active) setToast({ message: e.message || "Failed to load data sources.", tone: "err" });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Auto-dismiss toast.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const openModal = () => {
    setError("");
    setForm({ name: "", type: SOURCE_TYPES[0], purpose: PURPOSES[0] });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const name = form.name.trim();
    if (!name) {
      setError("Source name is required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const created = await api.addDataSource({
        name,
        type: form.type,
        purpose: form.purpose,
      });
      setSources((prev) => [created, ...prev]);
      setModalOpen(false);
      setToast({ message: `"${created.name || name}" connected successfully.`, tone: "ok" });
    } catch (e) {
      setError(e.message || "Could not connect the source. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const total = sources.length;
  const connectedCount = sources.filter((s) => s.status === "connected").length;
  const totalRecords = sources.reduce(
    (sum, s) => sum + (Number(s.records) || 0),
    0
  );

  return (
    <div>
      <PageHeader
        title="Data Sources"
        subtitle="Connect the systems and files that hold your performance data so the AI can understand how performance is measured, targeted, and rated."
      >
        <Button variant="primary" onClick={openModal}>
          <Plus size={16} />
          Connect Source
        </Button>
      </PageHeader>

      {toast && <Toast message={toast.message} tone={toast.tone} />}

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Stat label="Total Sources" value={total} icon={Layers} />
        <Stat
          label="Connected"
          value={connectedCount}
          sub={total ? `${total - connectedCount} pending` : undefined}
          icon={CheckCircle2}
          tone="primary"
        />
        <Stat
          label="Total Records"
          value={formatNumber(totalRecords)}
          icon={Database}
          tone="secondary"
        />
      </div>

      {/* Source grid */}
      {loading ? (
        <Card className="p-2">
          <Spinner label="Loading data sources…" />
        </Card>
      ) : sources.length === 0 ? (
        <EmptyState
          icon={Plug}
          title="No data sources connected yet"
          subtitle="Connect your first source — an Excel export, BI dashboard, SQL query, or governance document — so the AI can start mapping your performance framework."
        >
          <Button variant="primary" onClick={openModal}>
            <Plus size={16} />
            Connect Source
          </Button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map((s) => (
            <SourceCard key={s.id} source={s} />
          ))}
        </div>
      )}

      {/* Supported source types info card */}
      <Card className="mt-6">
        <CardHeader
          title="Supported Source Types"
          subtitle="The APFB platform can ingest and reason over these formats and systems."
          icon={Plug}
        />
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {SOURCE_TYPES.map((type) => {
              const Icon = iconForType(type);
              return (
                <span
                  key={type}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border px-3 py-1.5 text-xs font-medium text-ink"
                >
                  <Icon size={13} className="text-primary" />
                  {type}
                </span>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Connect Source modal */}
      <Modal
        open={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        title="Connect a Data Source"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Connecting…" : "Connect Source"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <Label>Source Name</Label>
            <Input
              autoFocus
              placeholder="e.g. Q3 Sales Performance Export"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && !submitting) handleSubmit();
              }}
            />
          </div>

          <div>
            <Label>Source Type</Label>
            <Select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              {SOURCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Purpose</Label>
            <Select
              value={form.purpose}
              onChange={(e) =>
                setForm((f) => ({ ...f, purpose: e.target.value }))
              }
            >
              {PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>

          <p className="text-xs text-accent">
            The source will be registered for ingestion. Connection status is
            confirmed automatically once the platform validates access.
          </p>
        </div>
      </Modal>
    </div>
  );
}
