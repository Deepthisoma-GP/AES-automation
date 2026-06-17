import React from "react";
import {
  Database,
  Sparkles,
  Calculator,
  LayoutTemplate,
  ShieldCheck,
  Target,
  Award,
  Layers,
  ListOrdered,
  Lightbulb,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Server,
  HardDrive,
} from "lucide-react";
import { PageHeader, Card, CardHeader, CardBody, Badge, Button } from "../components/ui.jsx";
import { cn } from "../lib/utils.js";

// ---------------------------------------------------------------------------
// Engine catalogue — the platform's processing pipeline, in business terms.
// ---------------------------------------------------------------------------
const ENGINES = [
  {
    id: "data-sources",
    name: "Data Sources",
    icon: Database,
    desc: "The connective layer that brings performance data into the platform, no matter where it lives today.",
    capabilities: [
      "Connect Excel, CSV, PDF, SOPs & KPI trackers",
      "Live links to Power BI, Tableau & SQL",
      "Cloud warehouses: BigQuery, Snowflake, Databricks",
    ],
  },
  {
    id: "ai-discovery",
    name: "AI Discovery Engine",
    icon: Sparkles,
    desc: "Reads your existing scorecards and automatically reverse-engineers how your performance framework is built.",
    capabilities: [
      "Discovers org structure, metrics, targets & formulas",
      "Detects governance rules, rating & benchmark logic",
      "Maps upload structure, ranking methods & dependencies",
    ],
  },
  {
    id: "formula-intelligence",
    name: "Formula Intelligence Engine",
    icon: Calculator,
    desc: "Understands the math behind every metric and untangles how calculations depend on one another.",
    capabilities: [
      "Parses Excel formulas, DAX measures & SQL/BigQuery logic",
      "Reads Snowflake views, derived & composite metrics",
      "Builds a full calculation dependency graph",
    ],
  },
  {
    id: "template-builder",
    name: "Template Builder",
    icon: LayoutTemplate,
    desc: "A guided workspace to configure or refine frameworks by hand when you want full manual control.",
    capabilities: [
      "Design org structure, metrics, targets & scoring",
      "Configure governance, rating & benchmark rules",
      "Define upload templates and data mapping",
    ],
  },
  {
    id: "governance",
    name: "Governance Engine",
    icon: ShieldCheck,
    desc: "Enforces the policies and guardrails that keep performance scoring fair, compliant and defensible.",
    capabilities: [
      "Hard eligibility, rating gates, penalties & informational rules",
      "Actions: block scorecard, cap rating, deduct points or warn",
      "Transparent, auditable rule outcomes",
    ],
  },
  {
    id: "scoring",
    name: "Scoring Engine",
    icon: Target,
    desc: "Turns raw metric values into comparable points and metric-level ratings using your chosen scoring logic.",
    capabilities: [
      "Achievement, threshold, range & formula-based scoring",
      "Converts performance into normalized points",
      "Produces metric-level ratings",
    ],
  },
  {
    id: "rating",
    name: "Rating Engine",
    icon: Award,
    desc: "Rolls scores up into a final performance rating using the method that fits each population.",
    capabilities: [
      "Points-based, threshold & weighted-average methods",
      "Forced ranking, gated & hybrid rating models",
      "Consistent, repeatable rating outcomes",
    ],
  },
  {
    id: "benchmark",
    name: "Benchmark Engine",
    icon: Layers,
    desc: "Groups people and teams into fair comparison sets so performance is always judged against the right peers.",
    capabilities: [
      "Define groups by Business, Market, Country, LOB, Department or Team",
      "Validates groups before ranking",
      "Ensures like-for-like comparisons",
    ],
  },
  {
    id: "ranking",
    name: "Ranking Engine",
    icon: ListOrdered,
    desc: "Orders performers within each benchmark group to surface relative standing and distribution.",
    capabilities: [
      "Relative, absolute & normalized ranking",
      "Operates within validated benchmark groups",
      "Drives distribution and calibration views",
    ],
  },
  {
    id: "insights",
    name: "Insights Engine",
    icon: Lightbulb,
    desc: "Closes the loop with AI recommendations that continuously improve how performance is measured.",
    capabilities: [
      "Suggests new & derived KPIs",
      "Recommends target, rating & benchmark improvements",
      "Proposes formula simplification & governance upgrades",
    ],
  },
];

// ---------------------------------------------------------------------------
// End-to-end workflow journey.
// ---------------------------------------------------------------------------
const WORKFLOW = [
  "Create Framework",
  "AI Discovery",
  "Connect Data Sources",
  "AI Analysis",
  "Review",
  "Publish",
  "Generate Upload Template",
  "Upload Data",
  "Run Scorecard",
  "Ratings",
  "Rankings",
  "Results",
];

// ---------------------------------------------------------------------------
// Technology stack.
// ---------------------------------------------------------------------------
const TECH = [
  {
    label: "Frontend",
    icon: Cpu,
    items: ["React", "Vite", "Tailwind CSS", "shadcn-style UI", "React Router", "Recharts"],
  },
  {
    label: "Backend",
    icon: Server,
    items: ["FastAPI", "Python"],
  },
  {
    label: "Storage",
    icon: HardDrive,
    items: ["JSON / SQLite (prototype)"],
  },
];

// Small node used in the horizontal data-flow diagram.
function FlowNode({ engine }) {
  const Icon = engine.icon;
  return (
    <div className="flex flex-col items-center text-center w-28 shrink-0">
      <div className="grid place-items-center h-14 w-14 rounded-2xl bg-muted text-primary border border-border shadow-card">
        <Icon size={22} />
      </div>
      <span className="mt-2 text-xs font-medium text-ink leading-tight">{engine.name}</span>
    </div>
  );
}

export default function Architecture() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Platform Architecture"
        subtitle="How APFB turns scattered performance data into governed scores, ratings and rankings — one connected pipeline of intelligent engines."
      >
        <Badge className="bg-muted text-ink border border-border">10 Engines</Badge>
        <Button variant="outline">Download Overview</Button>
      </PageHeader>

      {/* 1. End-to-end data flow diagram */}
      <Card>
        <CardHeader
          title="End-to-End Data Flow"
          subtitle="Data moves left to right through every engine, from raw sources to executive insights."
          icon={ArrowRight}
        />
        <CardBody>
          <div className="overflow-x-auto pb-2">
            <div className="flex items-start gap-1 min-w-max px-1">
              {ENGINES.map((engine, i) => (
                <React.Fragment key={engine.id}>
                  <FlowNode engine={engine} />
                  {i < ENGINES.length - 1 && (
                    <div className="flex items-center h-14 text-accent shrink-0">
                      <ChevronRight size={22} />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 2. Engine grid */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-ink tracking-tight">The Engines</h2>
          <p className="text-sm text-subtle mt-1 max-w-2xl">
            Each engine owns one job in the performance lifecycle and hands its output to the next.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ENGINES.map((engine, i) => {
            const Icon = engine.icon;
            return (
              <Card key={engine.id} className="flex flex-col">
                <CardHeader
                  title={engine.name}
                  subtitle={`Step ${i + 1} of ${ENGINES.length}`}
                  icon={Icon}
                />
                <CardBody className="flex flex-col flex-1 gap-3">
                  <p className="text-sm text-subtle leading-relaxed">{engine.desc}</p>
                  <ul className="space-y-1.5 mt-auto">
                    {engine.capabilities.map((cap) => (
                      <li key={cap} className="flex items-start gap-2 text-sm text-ink">
                        <CheckCircle2 size={15} className="mt-0.5 text-primary shrink-0" />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 3. Workflow journey */}
      <Card>
        <CardHeader
          title="The Workflow"
          subtitle="The journey a framework takes from creation to final results."
          icon={ListOrdered}
        />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {WORKFLOW.map((step, i) => (
              <div
                key={step}
                className={cn(
                  "relative flex items-center gap-3 rounded-2xl border border-border bg-canvas p-3",
                  "hover:bg-muted transition"
                )}
              >
                <span className="grid place-items-center h-8 w-8 rounded-xl bg-primary text-white text-sm font-bold shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-ink leading-tight">{step}</span>
                {i < WORKFLOW.length - 1 && (
                  <ChevronRight
                    size={16}
                    className="hidden xl:block absolute -right-3 top-1/2 -translate-y-1/2 text-accent"
                  />
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* 4. Technology note */}
      <Card>
        <CardHeader
          title="Technology"
          subtitle="The prototype stack powering APFB."
          icon={Cpu}
        />
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-3">
            {TECH.map((layer) => {
              const Icon = layer.icon;
              return (
                <div key={layer.label} className="rounded-2xl border border-border bg-canvas p-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-muted p-1.5 text-primary">
                      <Icon size={16} />
                    </div>
                    <span className="font-semibold text-ink">{layer.label}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {layer.items.map((item) => (
                      <Badge key={item} className="bg-muted text-ink border border-border">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
