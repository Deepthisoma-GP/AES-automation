import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  FileSpreadsheet,
  FileText,
  Database,
  BarChart3,
  Table,
  Cloud,
  Boxes,
  ClipboardList,
  Gauge,
  Plug,
  Brain,
  Search,
  LayoutTemplate,
  Lightbulb,
  ShieldCheck,
  Scale,
  Trophy,
  GitBranch,
  Workflow,
  Layers,
  Calculator,
  Award,
  TrendingUp,
  ListOrdered,
  Eye,
  CheckCircle2,
  Rocket,
  Headphones,
  Wallet,
} from "lucide-react";
import { Button, Card, Badge } from "../components/ui.jsx";

/* ------------------------------------------------------------------ */
/* Static content (no API calls — pure marketing page)                 */
/* ------------------------------------------------------------------ */

const DATA_SOURCES = [
  { label: "Excel", icon: FileSpreadsheet },
  { label: "CSV", icon: Table },
  { label: "Power BI", icon: BarChart3 },
  { label: "Tableau", icon: BarChart3 },
  { label: "SQL", icon: Database },
  { label: "BigQuery", icon: Cloud },
  { label: "Snowflake", icon: Cloud },
  { label: "Databricks", icon: Boxes },
  { label: "PDF", icon: FileText },
  { label: "SOPs", icon: ClipboardList },
  { label: "KPI Trackers", icon: Gauge },
];

const AI_STEPS = [
  {
    icon: Plug,
    title: "Connect Data Sources",
    desc: "Securely link spreadsheets, warehouses, BI tools and documents that already hold your performance data.",
  },
  {
    icon: Brain,
    title: "Understand Measurement",
    desc: "AI reads your data to learn how performance is actually defined and measured across teams.",
  },
  {
    icon: Search,
    title: "Discover the Framework",
    desc: "It surfaces metrics, formulas, governance rules, rating methods and benchmarks — with explanations.",
  },
  {
    icon: LayoutTemplate,
    title: "Build Reusable Templates",
    desc: "Discovered logic becomes standardized, reusable scorecard templates ready to publish.",
  },
  {
    icon: Lightbulb,
    title: "Recommend & Automate",
    desc: "AI suggests improvements and automates future scoring, rating and ranking execution.",
  },
];

const ENGINES = [
  { label: "Data Sources", icon: Database },
  { label: "AI Discovery Engine", icon: Brain },
  { label: "Formula Intelligence", icon: Calculator },
  { label: "Template Builder", icon: LayoutTemplate },
  { label: "Governance", icon: ShieldCheck },
  { label: "Scoring", icon: Gauge },
  { label: "Rating", icon: Award },
  { label: "Benchmark", icon: Scale },
  { label: "Ranking", icon: Trophy },
  { label: "Insights", icon: Lightbulb },
];

const BENEFITS = [
  {
    icon: Rocket,
    title: "Faster Onboarding",
    desc: "Stand up new performance frameworks in days, not quarters, by reusing AI-discovered logic.",
  },
  {
    icon: ShieldCheck,
    title: "Consistent Governance",
    desc: "Apply the same caps, thresholds and eligibility rules everywhere for trustworthy results.",
  },
  {
    icon: Eye,
    title: "Explainable Ratings",
    desc: "Every score traces back to a formula and a source, so outcomes are defensible and transparent.",
  },
  {
    icon: Scale,
    title: "Fair Rankings",
    desc: "Normalized, benchmark-aware comparisons keep rankings objective across cohorts and regions.",
  },
  {
    icon: Lightbulb,
    title: "AI Recommendations",
    desc: "Continuous suggestions help refine metrics, weights and benchmarks as performance evolves.",
  },
  {
    icon: Layers,
    title: "Single Source of Truth",
    desc: "Unify scattered trackers into one governed platform for performance measurement.",
  },
];

const WORKFLOW = [
  { label: "Create Framework", icon: GitBranch },
  { label: "AI Discovery", icon: Sparkles },
  { label: "Connect Data Sources", icon: Plug },
  { label: "AI Analysis", icon: Brain },
  { label: "Review", icon: Eye },
  { label: "Publish", icon: Rocket },
  { label: "Generate Upload Template", icon: LayoutTemplate },
  { label: "Upload Data", icon: Database },
  { label: "Run Scorecard", icon: Gauge },
  { label: "Generate Ratings", icon: Award },
  { label: "Generate Rankings", icon: Trophy },
  { label: "View Results", icon: BarChart3 },
];

const USE_CASES = [
  {
    icon: TrendingUp,
    title: "Sales Performance Scorecard",
    desc: "Measure quota attainment, pipeline health and conversion to rank reps fairly across territories.",
  },
  {
    icon: Headphones,
    title: "Customer Support Scorecard",
    desc: "Track CSAT, resolution time and SLA adherence to rate agents with consistent governance.",
  },
  {
    icon: Wallet,
    title: "Collections Performance",
    desc: "Monitor recovery rate, aging and promise-to-pay outcomes to benchmark collector effectiveness.",
  },
];

/* ------------------------------------------------------------------ */
/* Small section helpers                                               */
/* ------------------------------------------------------------------ */

function SectionHeader({ eyebrow, title, subtitle, icon: Icon }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <div className="mb-3 flex justify-center">
          <Badge className="bg-muted text-primary gap-1.5">
            {Icon && <Icon size={13} />}
            {eyebrow}
          </Badge>
        </div>
      )}
      <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-subtle">{subtitle}</p>}
    </div>
  );
}

const Section = ({ className = "", children, ...props }) => (
  <section className={`mx-auto w-full max-w-7xl px-6 py-16 sm:py-20 ${className}`} {...props}>
    {children}
  </section>
);

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* 1. Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-lg font-bold text-white shadow-sm">
              A
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-ink">APFB</div>
              <div className="text-xs text-accent">AI Performance Framework Builder</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/architecture")}>
              <GitBranch size={16} />
              <span className="hidden sm:inline">View Architecture</span>
            </Button>
            <Button variant="primary" onClick={() => navigate("/dashboard")}>
              Enter Platform
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* 2. Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-muted via-canvas to-secondary/10">
          <div className="mx-auto max-w-7xl px-6 py-24 text-center sm:py-28">
            <div className="mb-5 flex justify-center">
              <Badge className="bg-white/70 text-primary gap-1.5 shadow-sm">
                <Sparkles size={13} />
                AI-Powered Performance Intelligence
              </Badge>
            </div>
            <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl md:text-6xl">
              The AI-powered performance framework{" "}
              <span className="text-primary">discovery &amp; execution</span> platform
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-subtle">
              APFB helps organizations discover, configure, manage, execute and optimize
              performance scorecards using AI — turning scattered metrics into governed,
              explainable and automated frameworks.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button variant="primary" size="lg" onClick={() => navigate("/builder")}>
                <LayoutTemplate size={18} />
                Create Framework
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate("/discovery")}>
                <Sparkles size={18} />
                AI Discovery
              </Button>
            </div>
          </div>
        </section>

        {/* 3. Problem Statement */}
        <Section>
          <SectionHeader
            eyebrow="The Problem"
            icon={Layers}
            title="Performance lives in scattered, disconnected systems"
            subtitle="Today, organizations manage performance across dozens of tools — spreadsheets, BI dashboards, warehouses and documents — with no shared logic, governance or source of truth."
          />
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {DATA_SOURCES.map(({ label, icon: Icon }) => (
              <Card
                key={label}
                className="flex items-center gap-3 bg-card p-4 transition hover:shadow-md"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-primary">
                  <Icon size={18} />
                </div>
                <span className="text-sm font-medium text-ink">{label}</span>
              </Card>
            ))}
          </div>
        </Section>

        {/* 4. How AI Works */}
        <section className="bg-muted/40">
          <Section>
            <SectionHeader
              eyebrow="How AI Works"
              icon={Brain}
              title="From raw data to a working framework"
              subtitle="APFB learns how your organization measures performance and turns that understanding into reusable, automated scorecards."
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {AI_STEPS.map(({ icon: Icon, title, desc }, i) => (
                <Card key={title} className="relative h-full bg-canvas p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon size={20} />
                    </div>
                    <span className="text-sm font-bold text-secondary">0{i + 1}</span>
                  </div>
                  <h3 className="font-semibold text-ink">{title}</h3>
                  <p className="mt-1.5 text-sm text-subtle">{desc}</p>
                </Card>
              ))}
            </div>
          </Section>
        </section>

        {/* 5. Architecture (brief) */}
        <Section>
          <SectionHeader
            eyebrow="Architecture"
            icon={Workflow}
            title="One intelligent pipeline, end to end"
            subtitle="Every engine builds on the last — from connecting data sources to surfacing actionable insights."
          />
          <div className="mt-10 flex flex-wrap items-stretch justify-center gap-2">
            {ENGINES.map(({ label, icon: Icon }, i) => (
              <React.Fragment key={label}>
                <div className="flex min-w-[140px] flex-1 items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-primary">
                    <Icon size={16} />
                  </div>
                  <span className="text-sm font-medium text-ink">{label}</span>
                </div>
                {i < ENGINES.length - 1 && (
                  <div className="hidden items-center text-accent lg:flex" aria-hidden="true">
                    <ArrowRight size={16} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </Section>

        {/* 6. Benefits */}
        <section className="bg-muted/40">
          <Section>
            <SectionHeader
              eyebrow="Benefits"
              icon={CheckCircle2}
              title="Why teams choose APFB"
              subtitle="Replace fragmented, manual processes with a governed, explainable and automated performance platform."
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {BENEFITS.map(({ icon: Icon, title, desc }) => (
                <Card key={title} className="h-full bg-canvas p-6 transition hover:shadow-md">
                  <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon size={22} />
                  </div>
                  <h3 className="font-semibold text-ink">{title}</h3>
                  <p className="mt-1.5 text-sm text-subtle">{desc}</p>
                </Card>
              ))}
            </div>
          </Section>
        </section>

        {/* 7. Workflow */}
        <Section>
          <SectionHeader
            eyebrow="End-to-End Workflow"
            icon={ListOrdered}
            title="The complete performance journey"
            subtitle="A guided path from creating a framework to viewing governed results — with AI assisting at every step."
          />
          <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {WORKFLOW.map(({ label, icon: Icon }, i) => (
              <li key={label}>
                <Card className="flex h-full items-center gap-3 bg-card p-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <Icon size={18} className="shrink-0 text-accent" />
                  <span className="text-sm font-medium text-ink">{label}</span>
                </Card>
              </li>
            ))}
          </ol>
        </Section>

        {/* 8. Sample Use Cases */}
        <section className="bg-muted/40">
          <Section>
            <SectionHeader
              eyebrow="Use Cases"
              icon={Boxes}
              title="Built for any performance domain"
              subtitle="Configure once, then reuse the same intelligent framework across the business."
            />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {USE_CASES.map(({ icon: Icon, title, desc }) => (
                <Card key={title} className="h-full bg-canvas p-6 transition hover:shadow-md">
                  <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-secondary/20 text-secondary">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-ink">{title}</h3>
                  <p className="mt-2 text-sm text-subtle">{desc}</p>
                </Card>
              ))}
            </div>
          </Section>
        </section>

        {/* 9. Call to action footer */}
        <Section>
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary to-secondary p-10 text-center shadow-card sm:p-14">
            <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-white/20 text-white">
              <Sparkles size={28} />
            </div>
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to unify and automate performance?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/90">
              Step into APFB and let AI discover, govern and execute your performance frameworks —
              from a single source of truth.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-primary hover:brightness-100"
                onClick={() => navigate("/dashboard")}
              >
                Enter Platform
                <ArrowRight size={18} />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/40 bg-transparent text-white hover:bg-white/10"
                onClick={() => navigate("/discovery")}
              >
                <Sparkles size={18} />
                Try AI Discovery
              </Button>
            </div>
          </Card>
        </Section>
      </main>

      {/* Footer strip */}
      <footer className="border-t border-border bg-canvas">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-accent sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-sm font-bold text-white">
              A
            </div>
            <span className="font-medium text-subtle">APFB — AI Performance Framework Builder</span>
          </div>
          <span>© {new Date().getFullYear()} APFB. Enterprise performance, reimagined.</span>
        </div>
      </footer>
    </div>
  );
}
