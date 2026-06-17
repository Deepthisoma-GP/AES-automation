import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload, Download, FileText, CheckCircle2, AlertTriangle, XCircle, PlayCircle, Table2,
} from "lucide-react";
import { api } from "../lib/api.js";
import { cn } from "../lib/utils.js";
import {
  PageHeader, Card, CardHeader, CardBody, Button, Select, Label, Badge, Spinner, Toast,
} from "../components/ui.jsx";
import { useStore } from "../store.jsx";

// Minimal CSV parse/serialize (handles simple quoted fields).
function toCSV(columns, rows) {
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [columns.join(","), ...rows.map((r) => columns.map((c) => esc(r[c])).join(","))].join("\n");
}
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return [];
  const split = (line) => {
    const out = []; let cur = ""; let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') q = false;
        else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === ",") { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  };
  const headers = split(lines[0]);
  return lines.slice(1).map((l) => {
    const cells = split(l);
    return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ""]));
  });
}

export default function UploadCenter() {
  const navigate = useNavigate();
  const { activeFrameworkId, setActiveFrameworkId, setLastRunId } = useStore();
  const fileRef = useRef(null);
  const [frameworks, setFrameworks] = useState([]);
  const [template, setTemplate] = useState(null);
  const [rows, setRows] = useState(null);
  const [validation, setValidation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const flash = (message, tone = "ok") => { setToast({ message, tone }); setTimeout(() => setToast(null), 2800); };

  useEffect(() => { api.frameworks().then(setFrameworks); }, []);
  useEffect(() => {
    if (!activeFrameworkId) return;
    setTemplate(null); setRows(null); setValidation(null);
    api.template(activeFrameworkId).then(setTemplate).catch(() => setTemplate(null));
  }, [activeFrameworkId]);

  const downloadTemplate = () => {
    if (!template) return;
    const blob = new Blob([template.columns.join(",") + "\n"], { type: "text/csv" });
    triggerDownload(blob, "upload_template.csv");
  };

  const downloadSample = async () => {
    const { rows: sample } = await api.sampleData(activeFrameworkId);
    const cols = template?.columns || Object.keys(sample[0] || {});
    triggerDownload(new Blob([toCSV(cols, sample)], { type: "text/csv" }), "sample_data.csv");
  };

  const loadSample = async () => {
    const { rows: sample } = await api.sampleData(activeFrameworkId);
    setRows(sample); setValidation(null);
    flash(`Loaded ${sample.length} sample records.`);
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseCSV(text);
    setRows(parsed); setValidation(null);
    flash(`Parsed ${parsed.length} records from ${file.name}.`);
  };

  const validate = async () => {
    setBusy(true);
    try { setValidation(await api.validate(activeFrameworkId, rows)); }
    finally { setBusy(false); }
  };

  const run = async () => {
    setBusy(true);
    try {
      const result = await api.run(activeFrameworkId, rows);
      setLastRunId(result.id);
      flash("Scorecard executed — opening results.");
      setTimeout(() => navigate("/execution"), 700);
    } catch (e) { flash(e.message, "err"); }
    finally { setBusy(false); }
  };

  const columns = template?.columns || [];

  return (
    <div>
      <PageHeader title="Upload Center" subtitle="Generate a template, upload performance data, validate, and run the scorecard." />
      <Toast message={toast?.message} tone={toast?.tone} />

      <Card className="mb-5">
        <CardBody className="pt-5 flex flex-wrap items-end gap-4">
          <div className="min-w-[260px]">
            <Label>Framework</Label>
            <Select value={activeFrameworkId || ""} onChange={(e) => setActiveFrameworkId(e.target.value)}>
              {frameworks.map((f) => <option key={f.id} value={f.id}>{f.name} (v{f.version})</option>)}
            </Select>
          </div>
          <Button variant="outline" onClick={downloadTemplate} disabled={!template}>
            <Download size={16} /> Download Template
          </Button>
          <Button variant="outline" onClick={downloadSample} disabled={!template}>
            <FileText size={16} /> Download Sample
          </Button>
        </CardBody>
      </Card>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-1">
          <CardHeader title="Upload Data" subtitle="CSV matching the template" icon={Upload} />
          <CardBody className="space-y-3">
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={onFile} />
            <Button className="w-full" onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> Choose CSV File
            </Button>
            <div className="text-center text-xs text-accent">or</div>
            <Button variant="subtle" className="w-full" onClick={loadSample} disabled={!activeFrameworkId}>
              <Table2 size={16} /> Load Sample Dataset
            </Button>
            {rows && (
              <div className="rounded-xl bg-muted p-3 text-sm text-subtle">
                <strong className="text-ink">{rows.length}</strong> records ready.
              </div>
            )}
            <div className="border-t border-border pt-3 space-y-2">
              <Button variant="outline" className="w-full" onClick={validate} disabled={!rows || busy}>
                Validate Data
              </Button>
              <Button className="w-full" onClick={run} disabled={!rows || busy}>
                <PlayCircle size={16} /> Run Scorecard
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="lg:col-span-2 space-y-5">
          {template && (
            <Card>
              <CardHeader title="Upload Template" subtitle={`${columns.length} columns`} />
              <CardBody>
                <p className="text-sm text-subtle mb-3">{template.instructions}</p>
                {template.sections?.map((s) => (
                  <div key={s.name} className="mb-3">
                    <div className="text-xs uppercase tracking-wide text-accent mb-1.5">{s.name}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {s.columns.map((c) => (
                        <span key={c} className={cn("rounded-lg px-2 py-1 text-xs",
                          template.locked?.includes(c) ? "bg-primary/10 text-primary" : "bg-muted text-subtle")}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}

          {validation && (
            <Card>
              <CardHeader title="Validation Results"
                subtitle={validation.valid ? "Ready to run" : "Resolve errors before running"} />
              <CardBody>
                <div className="flex gap-3 mb-4">
                  <Stat2 icon={CheckCircle2} tone="text-emerald-600" label="Rows" value={validation.rows} />
                  <Stat2 icon={XCircle} tone="text-red-600" label="Errors" value={validation.errors} />
                  <Stat2 icon={AlertTriangle} tone="text-amber-600" label="Warnings" value={validation.warnings} />
                </div>
                {validation.issues.length === 0 ? (
                  <p className="text-sm text-emerald-700">No issues found.</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                    {validation.issues.map((iss, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 text-sm">
                        {iss.severity === "error"
                          ? <XCircle size={14} className="text-red-500 shrink-0" />
                          : <AlertTriangle size={14} className="text-amber-500 shrink-0" />}
                        <span className="text-accent">Row {iss.row}:</span>
                        <span className="text-ink">{iss.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {rows && (
            <Card>
              <CardHeader title="Data Preview" subtitle={`First ${Math.min(rows.length, 8)} of ${rows.length} records`} />
              <CardBody className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-accent border-b border-border">
                    {columns.slice(0, 8).map((c) => <th key={c} className="px-2 py-1.5 whitespace-nowrap">{c}</th>)}
                  </tr></thead>
                  <tbody>
                    {rows.slice(0, 8).map((r, i) => (
                      <tr key={i} className="border-b border-border/60">
                        {columns.slice(0, 8).map((c) => <td key={c} className="px-2 py-1.5 whitespace-nowrap text-ink">{r[c]}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {columns.length > 8 && <p className="text-xs text-accent mt-2">+ {columns.length - 8} more columns</p>}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat2({ icon: Icon, tone, label, value }) {
  return (
    <div className="flex-1 rounded-xl bg-white border border-border p-3 text-center">
      <Icon size={18} className={cn("mx-auto mb-1", tone)} />
      <div className="text-xl font-bold text-ink">{value}</div>
      <div className="text-xs text-accent">{label}</div>
    </div>
  );
}

function triggerDownload(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
