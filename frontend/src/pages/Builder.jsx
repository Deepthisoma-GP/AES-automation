import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, ArrowLeft, ArrowRight, Save, CheckCircle2, Lock, Wand2 } from "lucide-react";
import { api } from "../lib/api.js";
import { cn } from "../lib/utils.js";
import {
  PageHeader, Card, CardBody, Button, Input, Select, Label, Badge, Steps, Spinner, Toast,
} from "../components/ui.jsx";
import { useStore } from "../store.jsx";

const STEP_NAMES = [
  "Details", "Organization", "Metrics", "Targets", "Scoring", "Governance",
  "Rating", "Benchmarks", "Upload Template", "Data Mapping", "Review & Publish",
];

const WORKFORCE_COLUMNS = [
  "Agent ID", "Agent Name", "Department", "Business", "LOB", "Supervisor ID",
  "Supervisor Name", "Manager ID", "Manager Name", "Reporting Month", "Reporting Year",
];

const blankFramework = () => ({
  name: "", business: "", lob: "", owner: "", version: "1.0", status: "draft",
  organization: ["Business", "Region", "Country", "LOB", "Department", "Team"],
  metrics: [],
  targets: [],
  scoring_bands: [
    { min_achievement: 120, points: 5, rating: "Exceptional" },
    { min_achievement: 100, points: 4, rating: "Exceeds" },
    { min_achievement: 90, points: 3, rating: "Meets" },
    { min_achievement: 75, points: 2, rating: "Partially Meets" },
    { min_achievement: 0, points: 1, rating: "Below" },
  ],
  governance: [],
  rating_framework: {
    method: "weighted_average",
    bands: [
      { label: "Exceptional", min_score: 4.5 },
      { label: "Exceeds", min_score: 3.5 },
      { label: "Meets", min_score: 2.5 },
      { label: "Partially Meets", min_score: 1.5 },
      { label: "Below", min_score: 0 },
    ],
  },
  rating_order: ["Not Eligible", "Below", "Partially Meets", "Meets", "Exceeds", "Exceptional"],
  benchmark_groups: [{ name: "By LOB", level: "LOB", ranking_method: "relative" }],
  ranking_method: "relative",
  upload_template: { sections: [], aliases: {}, instructions: "", locked: [] },
});

const newMetric = () => ({
  id: "m_" + Math.random().toString(36).slice(2, 8),
  name: "", classification: "input", datatype: "number", direction: "higher_better",
  scoring_method: "achievement_higher_better", weight: 1, include_in_score: true, formula: "",
});

export default function Builder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setActiveFrameworkId } = useStore();
  const [step, setStep] = useState(0);
  const [fw, setFw] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) api.framework(id).then((f) => setFw({ ...blankFramework(), ...f })).catch(() => setFw(blankFramework()));
    else setFw(blankFramework());
  }, [id]);

  const flash = (message, tone = "ok") => { setToast({ message, tone }); setTimeout(() => setToast(null), 2800); };
  const patch = (p) => setFw((f) => ({ ...f, ...p }));

  const save = async (publish) => {
    setSaving(true);
    try {
      const payload = { ...fw, status: publish ? "published" : "draft" };
      const saved = id ? await api.updateFramework(id, payload) : await api.createFramework(payload);
      setActiveFrameworkId(saved.id);
      flash(publish ? "Framework published." : "Draft saved.");
      setTimeout(() => navigate(`/repository/${saved.id}`), 700);
    } catch (e) {
      flash(e.message, "err");
    } finally {
      setSaving(false);
    }
  };

  if (!fw) return <Spinner />;

  return (
    <div>
      <PageHeader title={id ? "Edit Framework" : "Template Builder"}
        subtitle="Configure a performance framework step by step — or accept an AI-discovered one.">
        <Button variant="outline" onClick={() => save(false)} disabled={saving}>
          <Save size={16} /> Save Draft
        </Button>
      </PageHeader>

      <Toast message={toast?.message} tone={toast?.tone} />

      <Card className="p-4 mb-5">
        <Steps steps={STEP_NAMES} current={step} onJump={setStep} />
      </Card>

      <Card>
        <CardBody className="pt-5">
          <h2 className="text-lg font-semibold text-ink mb-1">
            Step {step + 1}. {STEP_FULL[step]}
          </h2>
          <p className="text-sm text-subtle mb-5">{STEP_HELP[step]}</p>

          {step === 0 && <DetailsStep fw={fw} patch={patch} />}
          {step === 1 && <OrgStep fw={fw} patch={patch} />}
          {step === 2 && <MetricsStep fw={fw} patch={patch} />}
          {step === 3 && <TargetsStep fw={fw} patch={patch} />}
          {step === 4 && <ScoringStep fw={fw} patch={patch} />}
          {step === 5 && <GovernanceStep fw={fw} patch={patch} />}
          {step === 6 && <RatingStep fw={fw} patch={patch} />}
          {step === 7 && <BenchmarkStep fw={fw} patch={patch} />}
          {step === 8 && <UploadTemplateStep fw={fw} />}
          {step === 9 && <MappingStep fw={fw} />}
          {step === 10 && <ReviewStep fw={fw} />}
        </CardBody>
      </Card>

      <div className="flex justify-between mt-5">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          <ArrowLeft size={16} /> Back
        </Button>
        {step < STEP_NAMES.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)}>Next <ArrowRight size={16} /></Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => save(false)} disabled={saving}>Save as Draft</Button>
            <Button onClick={() => save(true)} disabled={saving}>
              <CheckCircle2 size={16} /> Publish Framework
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

const STEP_FULL = [
  "Framework Details", "Organization Structure", "Metric Configuration", "Target Configuration",
  "Scoring Framework", "Governance Rules", "Final Rating Framework", "Benchmark Groups",
  "Upload Template Preview", "Data Mapping", "Review & Publish",
];
const STEP_HELP = [
  "Name the framework and assign ownership.",
  "Define the organizational hierarchy this framework operates over.",
  "Add the metrics, classify them, and define formulas in plain language.",
  "Set performance targets at the level that fits each metric.",
  "Define how metric achievement converts to points and metric-level ratings.",
  "Add governance rules that block, gate, penalize, or warn.",
  "Choose how the final rating is derived from metric scores.",
  "Create benchmark groups and pick the ranking method.",
  "Preview the upload template generated from this framework.",
  "Map source columns to platform metrics.",
  "Review the configuration and publish.",
];

// ---- helpers ----
const Field = ({ label, children }) => (
  <div><Label>{label}</Label>{children}</div>
);
const Section = ({ children, className }) => (
  <div className={cn("space-y-4", className)}>{children}</div>
);

// ---- Step 1: Details ----
function DetailsStep({ fw, patch }) {
  return (
    <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
      <Field label="Framework Name"><Input value={fw.name} placeholder="e.g. Sales Performance Scorecard"
        onChange={(e) => patch({ name: e.target.value })} /></Field>
      <Field label="Owner"><Input value={fw.owner} placeholder="e.g. Priya Nair"
        onChange={(e) => patch({ owner: e.target.value })} /></Field>
      <Field label="Business"><Input value={fw.business} placeholder="e.g. Global Sales"
        onChange={(e) => patch({ business: e.target.value })} /></Field>
      <Field label="Line of Business (LOB)"><Input value={fw.lob} placeholder="e.g. Inside Sales"
        onChange={(e) => patch({ lob: e.target.value })} /></Field>
      <Field label="Version"><Input value={fw.version}
        onChange={(e) => patch({ version: e.target.value })} /></Field>
    </div>
  );
}

// ---- Step 2: Organization ----
const ORG_EXAMPLES = {
  Business: "Global Sales", Region: "EMEA", Country: "Germany", Market: "DACH",
  LOB: "Inside Sales", Department: "Sales", Team: "Team Alpha",
};
function OrgStep({ fw, patch }) {
  const [val, setVal] = useState("");
  const add = () => { if (val.trim()) { patch({ organization: [...fw.organization, val.trim()] }); setVal(""); } };
  return (
    <Section className="max-w-2xl">
      <div className="flex flex-wrap gap-2">
        {fw.organization.map((lvl, i) => (
          <span key={i} className="inline-flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm">
            <span className="font-medium text-ink">{lvl}</span>
            <span className="text-accent text-xs">e.g. {ORG_EXAMPLES[lvl] || "—"}</span>
            <button onClick={() => patch({ organization: fw.organization.filter((_, j) => j !== i) })}
              className="text-accent hover:text-primary"><Trash2 size={13} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2 max-w-md">
        <Input placeholder="Add level (e.g. Sub-Team)" value={val}
          onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <Button variant="outline" onClick={add}><Plus size={16} /> Add</Button>
      </div>
    </Section>
  );
}

// ---- Step 3: Metrics ----
function MetricsStep({ fw, patch }) {
  const update = (i, p) => patch({ metrics: fw.metrics.map((m, j) => (j === i ? { ...m, ...p } : m)) });
  const remove = (i) => patch({ metrics: fw.metrics.filter((_, j) => j !== i) });
  return (
    <Section>
      {fw.metrics.length === 0 && <p className="text-sm text-accent">No metrics yet — add your first.</p>}
      {fw.metrics.map((m, i) => (
        <Card key={m.id} className="p-4 bg-white">
          <div className="grid md:grid-cols-3 gap-3">
            <Field label="Metric Name"><Input value={m.name} placeholder="e.g. Calls"
              onChange={(e) => update(i, { name: e.target.value })} /></Field>
            <Field label="Classification (mandatory)">
              <Select value={m.classification} onChange={(e) => update(i, { classification: e.target.value })}>
                <option value="input">Input Metric</option>
                <option value="process">Process Metric</option>
                <option value="output">Output Metric</option>
              </Select></Field>
            <Field label="Datatype">
              <Select value={m.datatype} onChange={(e) => update(i, { datatype: e.target.value })}>
                {["number", "percentage", "decimal", "duration", "count", "currency", "text"].map((d) =>
                  <option key={d} value={d}>{d}</option>)}
              </Select></Field>
            <Field label="Direction">
              <Select value={m.direction} onChange={(e) => update(i, { direction: e.target.value })}>
                <option value="higher_better">Higher Better</option>
                <option value="lower_better">Lower Better</option>
              </Select></Field>
            <Field label="Scoring Method">
              <Select value={m.scoring_method} onChange={(e) => update(i, { scoring_method: e.target.value })}>
                <option value="achievement_higher_better">Achievement (Higher Better)</option>
                <option value="achievement_lower_better">Achievement (Lower Better)</option>
                <option value="threshold">Threshold</option>
                <option value="range">Range</option>
                <option value="formula_based">Formula Based</option>
              </Select></Field>
            <Field label="Weight"><Input type="number" value={m.weight}
              onChange={(e) => update(i, { weight: Number(e.target.value) })} /></Field>
          </div>
          <div className="mt-3">
            <Label>Formula (plain language — e.g. "40% Calls + 30% Engagement Score + 30% Pitch Rate" or "Meetings ÷ Calls")</Label>
            <Input value={m.formula || ""} placeholder="Leave blank for a directly-uploaded metric"
              onChange={(e) => update(i, { formula: e.target.value })} />
          </div>
          <div className="flex items-center justify-between mt-3">
            <label className="flex items-center gap-2 text-sm text-subtle">
              <input type="checkbox" checked={m.include_in_score}
                onChange={(e) => update(i, { include_in_score: e.target.checked })} />
              Include in final score
            </label>
            <Button variant="danger" size="sm" onClick={() => remove(i)}><Trash2 size={14} /> Remove</Button>
          </div>
        </Card>
      ))}
      <Button variant="outline" onClick={() => patch({ metrics: [...fw.metrics, newMetric()] })}>
        <Plus size={16} /> Add Metric
      </Button>
    </Section>
  );
}

// ---- Step 4: Targets ----
function TargetsStep({ fw, patch }) {
  const add = () => patch({ targets: [...fw.targets, { level: "Business", entity: "", metric_id: fw.metrics[0]?.id || "", value: 0 }] });
  const update = (i, p) => patch({ targets: fw.targets.map((t, j) => (j === i ? { ...t, ...p } : t)) });
  const remove = (i) => patch({ targets: fw.targets.filter((_, j) => j !== i) });
  if (!fw.metrics.length) return <p className="text-sm text-accent">Add metrics first (Step 3).</p>;
  return (
    <Section>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs uppercase text-accent">
          <th className="py-2">Metric</th><th>Level</th><th>Entity (optional)</th><th>Target</th><th></th></tr></thead>
        <tbody>
          {fw.targets.map((t, i) => (
            <tr key={i} className="border-t border-border">
              <td className="py-2 pr-2"><Select value={t.metric_id} onChange={(e) => update(i, { metric_id: e.target.value })}>
                {fw.metrics.map((m) => <option key={m.id} value={m.id}>{m.name || m.id}</option>)}</Select></td>
              <td className="pr-2"><Select value={t.level} onChange={(e) => update(i, { level: e.target.value })}>
                {fw.organization.map((l) => <option key={l}>{l}</option>)}</Select></td>
              <td className="pr-2"><Input value={t.entity || ""} placeholder="default"
                onChange={(e) => update(i, { entity: e.target.value })} /></td>
              <td className="pr-2"><Input type="number" value={t.value}
                onChange={(e) => update(i, { value: Number(e.target.value) })} /></td>
              <td><Button variant="ghost" size="sm" onClick={() => remove(i)}><Trash2 size={14} /></Button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button variant="outline" onClick={add}><Plus size={16} /> Add Target</Button>
    </Section>
  );
}

// ---- Step 5: Scoring ----
function ScoringStep({ fw, patch }) {
  const update = (i, p) => patch({ scoring_bands: fw.scoring_bands.map((b, j) => (j === i ? { ...b, ...p } : b)) });
  return (
    <Section className="max-w-2xl">
      <p className="text-sm text-subtle">Achievement % maps to points and a metric-level rating (highest matching band wins).</p>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs uppercase text-accent">
          <th className="py-2">Min Achievement %</th><th>Points</th><th>Rating</th></tr></thead>
        <tbody>
          {fw.scoring_bands.map((b, i) => (
            <tr key={i} className="border-t border-border">
              <td className="py-2 pr-2"><Input type="number" value={b.min_achievement}
                onChange={(e) => update(i, { min_achievement: Number(e.target.value) })} /></td>
              <td className="pr-2"><Input type="number" value={b.points}
                onChange={(e) => update(i, { points: Number(e.target.value) })} /></td>
              <td><Input value={b.rating} onChange={(e) => update(i, { rating: e.target.value })} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

// ---- Step 6: Governance ----
function GovernanceStep({ fw, patch }) {
  const add = () => patch({ governance: [...fw.governance, {
    name: "", type: "rating_gate", action: "cap_rating", field: "", operator: "<",
    threshold: 0, cap_value: "Meets", penalty: 1, metric: "", description: "" }] });
  const update = (i, p) => patch({ governance: fw.governance.map((g, j) => (j === i ? { ...g, ...p } : g)) });
  const remove = (i) => patch({ governance: fw.governance.filter((_, j) => j !== i) });
  return (
    <Section>
      {fw.governance.map((g, i) => (
        <Card key={i} className="p-4 bg-white">
          <div className="grid md:grid-cols-3 gap-3">
            <Field label="Rule Name"><Input value={g.name} onChange={(e) => update(i, { name: e.target.value })} /></Field>
            <Field label="Type"><Select value={g.type} onChange={(e) => update(i, { type: e.target.value })}>
              <option value="hard_eligibility">Hard Eligibility</option>
              <option value="rating_gate">Rating Gate</option>
              <option value="penalty">Penalty</option>
              <option value="informational">Informational</option>
            </Select></Field>
            <Field label="Action"><Select value={g.action} onChange={(e) => update(i, { action: e.target.value })}>
              <option value="block">Block Scorecard</option>
              <option value="cap_rating">Cap Rating</option>
              <option value="deduct_points">Deduct Points</option>
              <option value="warning">Warning</option>
            </Select></Field>
            <Field label="Field / Metric"><Input value={g.field} placeholder="e.g. Calls or Mandatory Training"
              onChange={(e) => update(i, { field: e.target.value })} /></Field>
            <Field label="Operator"><Select value={g.operator} onChange={(e) => update(i, { operator: e.target.value })}>
              {["<", "<=", ">", ">=", "==", "!="].map((o) => <option key={o}>{o}</option>)}</Select></Field>
            <Field label="Threshold"><Input value={g.threshold}
              onChange={(e) => update(i, { threshold: e.target.value })} /></Field>
            {g.action === "cap_rating" && <Field label="Cap Rating At"><Input value={g.cap_value}
              onChange={(e) => update(i, { cap_value: e.target.value })} /></Field>}
            {g.action === "deduct_points" && <>
              <Field label="Penalty Points"><Input type="number" value={g.penalty}
                onChange={(e) => update(i, { penalty: Number(e.target.value) })} /></Field>
              <Field label="Deduct From Metric"><Input value={g.metric}
                onChange={(e) => update(i, { metric: e.target.value })} /></Field>
            </>}
          </div>
          <div className="mt-3"><Label>Description</Label>
            <Input value={g.description} onChange={(e) => update(i, { description: e.target.value })} /></div>
          <div className="flex justify-end mt-3">
            <Button variant="danger" size="sm" onClick={() => remove(i)}><Trash2 size={14} /> Remove</Button>
          </div>
        </Card>
      ))}
      <Button variant="outline" onClick={add}><Plus size={16} /> Add Governance Rule</Button>
    </Section>
  );
}

// ---- Step 7: Rating ----
function RatingStep({ fw, patch }) {
  const rf = fw.rating_framework;
  const setRf = (p) => patch({ rating_framework: { ...rf, ...p } });
  const updateBand = (i, p) => setRf({ bands: rf.bands.map((b, j) => (j === i ? { ...b, ...p } : b)) });
  return (
    <Section className="max-w-2xl">
      <Field label="Rating Method">
        <Select value={rf.method} onChange={(e) => setRf({ method: e.target.value })}>
          <option value="points_based">Points-Based (sum of points)</option>
          <option value="threshold">Threshold</option>
          <option value="weighted_average">Weighted Average</option>
          <option value="forced_ranking">Forced Ranking</option>
          <option value="gated">Gated Rating</option>
          <option value="hybrid">Hybrid</option>
        </Select>
      </Field>
      <p className="text-sm text-subtle">
        Final rating bands — for weighted average these apply to the 0–5 weighted score; for points-based, to total points.
      </p>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs uppercase text-accent"><th className="py-2">Rating Band</th><th>Minimum</th></tr></thead>
        <tbody>
          {rf.bands.map((b, i) => (
            <tr key={i} className="border-t border-border">
              <td className="py-2 pr-2"><Input value={b.label} onChange={(e) => updateBand(i, { label: e.target.value })} /></td>
              <td><Input type="number" step="0.1" value={b.min_score}
                onChange={(e) => updateBand(i, { min_score: Number(e.target.value) })} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="rounded-xl bg-muted p-4 text-sm text-subtle">
        <strong className="text-ink">Supported scenarios:</strong> (A) metric points → sum → final rating ·
        (B) overall score → final rating · (C) hybrid: governance gates and rating caps applied on top.
      </div>
    </Section>
  );
}

// ---- Step 8: Benchmarks ----
function BenchmarkStep({ fw, patch }) {
  const add = () => patch({ benchmark_groups: [...fw.benchmark_groups, { name: "", level: "LOB", ranking_method: "relative" }] });
  const update = (i, p) => patch({ benchmark_groups: fw.benchmark_groups.map((g, j) => (j === i ? { ...g, ...p } : g)) });
  const remove = (i) => patch({ benchmark_groups: fw.benchmark_groups.filter((_, j) => j !== i) });
  return (
    <Section className="max-w-3xl">
      {fw.benchmark_groups.map((g, i) => (
        <div key={i} className="grid md:grid-cols-4 gap-3 items-end border-t border-border pt-3">
          <Field label="Group Name"><Input value={g.name} onChange={(e) => update(i, { name: e.target.value })} /></Field>
          <Field label="Level"><Select value={g.level} onChange={(e) => update(i, { level: e.target.value })}>
            {["Business", "Market", "Country", "LOB", "Department", "Team"].map((l) => <option key={l}>{l}</option>)}</Select></Field>
          <Field label="Ranking Method"><Select value={g.ranking_method}
            onChange={(e) => update(i, { ranking_method: e.target.value, })}>
            <option value="relative">Relative</option>
            <option value="absolute">Absolute</option>
            <option value="normalized">Normalized</option>
          </Select></Field>
          <Button variant="ghost" size="sm" onClick={() => remove(i)}><Trash2 size={14} /> Remove</Button>
        </div>
      ))}
      <Button variant="outline" onClick={add}><Plus size={16} /> Add Benchmark Group</Button>
    </Section>
  );
}

// ---- Step 9: Upload Template Preview ----
function UploadTemplateStep({ fw }) {
  const govCols = fw.governance.map((g) => g.field).filter((f) => f && !fw.metrics.some((m) => m.name === f));
  const metricCols = fw.metrics.filter((m) => !m.formula).map((m) => m.name);
  const groups = [
    { name: "Workforce (mandatory)", cols: WORKFORCE_COLUMNS, locked: true },
    { name: "Governance", cols: [...new Set(govCols)], locked: false },
    { name: "Metrics", cols: metricCols, locked: true },
  ];
  return (
    <Section>
      <p className="text-sm text-subtle">Generated automatically. Locked columns (metrics, datatypes, scoring) cannot be renamed or removed; you may reorder, add instructions, sample values, and aliases.</p>
      {groups.map((grp) => (
        <Card key={grp.name} className="p-4 bg-white">
          <div className="font-medium text-ink mb-2">{grp.name}</div>
          <div className="flex flex-wrap gap-2">
            {grp.cols.length === 0 && <span className="text-sm text-accent">None defined.</span>}
            {grp.cols.map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-sm">
                {grp.locked && <Lock size={11} className="text-accent" />}{c}
              </span>
            ))}
          </div>
        </Card>
      ))}
    </Section>
  );
}

// ---- Step 10: Data Mapping ----
function MappingStep({ fw }) {
  const metricCols = fw.metrics.filter((m) => !m.formula).map((m) => m.name);
  const [mapping, setMapping] = useState(() => Object.fromEntries(metricCols.map((c) => [c, c])));
  return (
    <Section className="max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-subtle">Map source columns to platform metrics. Auto-mapping matches by name.</p>
        <Button variant="subtle" size="sm" onClick={() => setMapping(Object.fromEntries(metricCols.map((c) => [c, c])))}>
          <Wand2 size={14} /> Auto-map
        </Button>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs uppercase text-accent"><th className="py-2">Platform Metric</th><th>Source Column</th><th>Status</th></tr></thead>
        <tbody>
          {metricCols.map((c) => (
            <tr key={c} className="border-t border-border">
              <td className="py-2 font-medium text-ink">{c}</td>
              <td className="pr-2"><Input value={mapping[c] || ""}
                onChange={(e) => setMapping({ ...mapping, [c]: e.target.value })} /></td>
              <td>{mapping[c]
                ? <Badge className="bg-emerald-50 text-emerald-700">mapped</Badge>
                : <Badge className="bg-amber-50 text-amber-700">unmapped</Badge>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

// ---- Step 11: Review ----
function ReviewStep({ fw }) {
  const rows = [
    ["Name", fw.name || "—"], ["Business / LOB", `${fw.business || "—"} / ${fw.lob || "—"}`],
    ["Owner", fw.owner || "—"], ["Version", fw.version],
    ["Org Levels", fw.organization.join(" → ")],
    ["Metrics", `${fw.metrics.length} (${fw.metrics.filter((m) => m.formula).length} derived)`],
    ["Targets", fw.targets.length], ["Scoring Bands", fw.scoring_bands.length],
    ["Governance Rules", fw.governance.length], ["Rating Method", fw.rating_framework.method],
    ["Benchmark Groups", fw.benchmark_groups.map((g) => `${g.name} (${g.ranking_method})`).join(", ") || "—"],
  ];
  return (
    <Section className="max-w-2xl">
      <div className="rounded-xl border border-border divide-y divide-border">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between px-4 py-2.5 text-sm">
            <span className="text-accent">{k}</span><span className="text-ink font-medium text-right">{v}</span>
          </div>
        ))}
      </div>
      <p className="text-sm text-subtle">Publishing creates a versioned, executable framework available in the repository.</p>
    </Section>
  );
}
