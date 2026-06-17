# APFB — AI Performance Framework Builder

An enterprise SaaS **prototype** that helps organizations discover, configure, manage,
execute, and optimize performance scorecards using AI. It supports both **AI-Assisted
Framework Discovery** and **Manual Framework Creation**, and includes a real
scorecard / rating / ranking calculation engine.

## Stack

- **Frontend:** React + Vite + Tailwind CSS (shadcn-style primitives) + React Router + Recharts
- **Backend:** FastAPI + Python
- **Storage:** JSON file store (prototype) — `backend/data/store.json`, auto-seeded

## Running

Two processes. From the repo root:

**1. Backend (port 8000)**
```bash
cd backend
python3 -m pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**2. Frontend (port 5173)**
```bash
cd frontend
npm install
npm run dev
```

Then open http://localhost:5173. Vite proxies `/api` → `http://localhost:8000`.

Or use the helper: `./start.sh` (starts both).

## Modules (left nav)

Dashboard · Framework Repository · AI Framework Discovery · Template Builder ·
Data Sources · Upload Center · Scorecard Execution · Ratings · Rankings ·
Insights · Architecture · Administration.

## Try the end-to-end flow

1. **AI Framework Discovery** → run discovery → review AI findings (confidence scores) → Accept & create draft.
2. Or **Template Builder** → 11-step wizard → Publish.
3. **Upload Center** → pick framework → *Load Sample Dataset* → Validate → Run Scorecard.
4. **Scorecard Execution** → expand an employee to see metric-level scoring, governance, final rating, rank.
5. **Ratings** / **Rankings** → distribution and benchmark-group leaderboards.
6. **Insights** → AI recommendations to improve the framework.

## Engine

The seeded "Sales Performance Scorecard" demonstrates:
- **Derived/formula metrics** — `Conversion Rate = Meetings ÷ Calls`,
  `Productivity Score = 40% Calls + 30% Engagement Score + 30% Pitch Rate`.
- **Governance** — hard eligibility (block), rating gate (cap), penalty (deduct points), informational (warn).
- **Scoring** — achievement vs. target → points + metric rating bands.
- **Rating** — weighted average → final rating bands, with governance caps/gates.
- **Ranking** — relative / absolute / normalized within benchmark groups.

> Prototype note: "AI" discovery and insights are realistic simulations, not live model calls.
