"""APFB FastAPI backend — frameworks, discovery, templates, execution, insights."""
from __future__ import annotations

import copy
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import engine
import storage

app = FastAPI(title="AI Performance Framework Builder", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _next_id(prefix: str, items: list[dict]) -> str:
    return f"{prefix}_{len(items) + 1}_{abs(hash(str(len(items)))) % 9000 + 1000}"


# ---------------------------------------------------------------------------
# Frameworks
# ---------------------------------------------------------------------------

@app.get("/api/frameworks")
def list_frameworks():
    state = storage.load()
    return [
        {k: f[k] for k in (
            "id", "name", "business", "lob", "owner", "version", "status",
            "parent_id", "created_date", "last_updated", "usage_count")}
        for f in state["frameworks"]
    ]


@app.get("/api/frameworks/{fid}")
def get_framework(fid: str):
    state = storage.load()
    fw = next((f for f in state["frameworks"] if f["id"] == fid), None)
    if not fw:
        raise HTTPException(404, "Framework not found")
    return fw


class FrameworkBody(BaseModel):
    framework: dict[str, Any]


@app.post("/api/frameworks")
def create_framework(body: FrameworkBody):
    state = storage.load()
    fw = body.framework
    fw.setdefault("id", _next_id("fw", state["frameworks"]))
    fw.setdefault("status", "draft")
    fw.setdefault("version", "1.0")
    fw.setdefault("usage_count", 0)
    fw.setdefault("created_date", "2026-06-17")
    fw["last_updated"] = "2026-06-17"
    state["frameworks"].append(fw)
    storage.save(state)
    return fw


@app.put("/api/frameworks/{fid}")
def update_framework(fid: str, body: FrameworkBody):
    state = storage.load()
    idx = next((i for i, f in enumerate(state["frameworks"]) if f["id"] == fid), None)
    if idx is None:
        raise HTTPException(404, "Framework not found")
    merged = {**state["frameworks"][idx], **body.framework, "id": fid,
              "last_updated": "2026-06-17"}
    state["frameworks"][idx] = merged
    storage.save(state)
    return merged


@app.post("/api/frameworks/{fid}/action")
def framework_action(fid: str, payload: dict[str, Any]):
    """clone | child | archive | publish | delete"""
    state = storage.load()
    fw = next((f for f in state["frameworks"] if f["id"] == fid), None)
    if not fw:
        raise HTTPException(404, "Framework not found")
    action = payload.get("action")

    if action == "delete":
        state["frameworks"] = [f for f in state["frameworks"] if f["id"] != fid]
        storage.save(state)
        return {"ok": True}
    if action in ("archive", "publish"):
        fw["status"] = "archived" if action == "archive" else "published"
        fw["last_updated"] = "2026-06-17"
        storage.save(state)
        return fw
    if action in ("clone", "child"):
        new = copy.deepcopy(fw)
        new["id"] = _next_id("fw", state["frameworks"])
        new["usage_count"] = 0
        new["status"] = "draft"
        new["created_date"] = "2026-06-17"
        new["last_updated"] = "2026-06-17"
        if action == "clone":
            new["name"] = f"{fw['name']} (Copy)"
            new["parent_id"] = None
        else:
            new["name"] = f"{fw['name']} (Child)"
            new["parent_id"] = fid
            new["version"] = f"{fw.get('version', '1.0')}-child"
        state["frameworks"].append(new)
        storage.save(state)
        return new
    raise HTTPException(400, f"Unknown action: {action}")


@app.get("/api/frameworks/{fid}/template")
def get_upload_template(fid: str):
    fw = get_framework(fid)
    tmpl = fw.get("upload_template", {})
    columns: list[str] = []
    for section in tmpl.get("sections", []):
        columns.extend(section["columns"])
    return {"sections": tmpl.get("sections", []), "columns": columns,
            "aliases": tmpl.get("aliases", {}), "instructions": tmpl.get("instructions", ""),
            "locked": tmpl.get("locked", [])}


@app.get("/api/frameworks/{fid}/sample-data")
def get_sample_data(fid: str):
    state = storage.load()
    rows = state.get("sample_rows", {}).get(fid)
    if rows is None:  # fall back to the canonical sample
        rows = state.get("sample_rows", {}).get("fw_sales_v2", [])
    return {"rows": rows}


# ---------------------------------------------------------------------------
# Data sources & discovery
# ---------------------------------------------------------------------------

@app.get("/api/data-sources")
def list_data_sources():
    return storage.load()["data_sources"]


@app.post("/api/data-sources")
def add_data_source(payload: dict[str, Any]):
    state = storage.load()
    ds = {"id": _next_id("ds", state["data_sources"]),
          "name": payload.get("name", "New Source"),
          "type": payload.get("type", "Excel"),
          "purpose": payload.get("purpose", "Performance Metrics"),
          "status": "connected", "records": payload.get("records", 0)}
    state["data_sources"].append(ds)
    storage.save(state)
    return ds


@app.get("/api/discoveries")
def list_discoveries():
    return storage.load()["discoveries"]


@app.post("/api/discoveries/run")
def run_discovery(payload: dict[str, Any]):
    """Simulate an AI discovery pass over the declared/uploaded sources."""
    state = storage.load()
    base = copy.deepcopy(state["discoveries"][0])
    base["id"] = _next_id("disc", state["discoveries"])
    sources = payload.get("sources")
    if sources:
        base["sources"] = sources
    base["framework_name"] = payload.get("name", base["framework_name"])
    state["discoveries"].append(base)
    storage.save(state)
    return base


@app.post("/api/discoveries/{did}/accept")
def accept_discovery(did: str, payload: dict[str, Any]):
    """Turn an accepted discovery into a draft framework seeded from the template."""
    state = storage.load()
    disc = next((d for d in state["discoveries"] if d["id"] == did), None)
    if not disc:
        raise HTTPException(404, "Discovery not found")
    from seed import _sales_framework
    fw = _sales_framework()
    fw["id"] = _next_id("fw", state["frameworks"])
    fw["name"] = payload.get("name", disc.get("framework_name", "Discovered Framework"))
    fw["status"] = "draft"
    fw["version"] = "1.0"
    fw["usage_count"] = 0
    fw["parent_id"] = None
    state["frameworks"].append(fw)
    storage.save(state)
    return fw


# ---------------------------------------------------------------------------
# Upload validation & scorecard execution
# ---------------------------------------------------------------------------

@app.post("/api/frameworks/{fid}/validate")
def validate_upload(fid: str, payload: dict[str, Any]):
    fw = get_framework(fid)
    rows = payload.get("rows", [])
    metric_names = [m["name"] for m in fw.get("metrics", []) if not m.get("formula")]
    issues = []
    seen = set()
    for i, row in enumerate(rows):
        line = i + 2  # account for header row
        if not row.get("Agent ID"):
            issues.append({"row": line, "severity": "error", "message": "Missing Agent ID"})
        key = (row.get("Agent ID"), row.get("Reporting Month"), row.get("Reporting Year"))
        if key in seen:
            issues.append({"row": line, "severity": "error", "message": "Duplicate record"})
        seen.add(key)
        for m in metric_names:
            v = row.get(m)
            fv = engine._to_float(v)
            if v in (None, ""):
                issues.append({"row": line, "severity": "warning", "message": f"Missing metric '{m}'"})
            elif fv is not None and fv < 0:
                issues.append({"row": line, "severity": "error", "message": f"Negative value for '{m}'"})
            if m == "Engagement Score" and fv is not None and fv > 100:
                issues.append({"row": line, "severity": "error", "message": "Invalid percentage for 'Engagement Score'"})
    return {
        "rows": len(rows),
        "errors": sum(1 for x in issues if x["severity"] == "error"),
        "warnings": sum(1 for x in issues if x["severity"] == "warning"),
        "issues": issues[:200],
        "valid": all(x["severity"] != "error" for x in issues),
    }


@app.post("/api/frameworks/{fid}/run")
def run_scorecard(fid: str, payload: dict[str, Any]):
    state = storage.load()
    fw = next((f for f in state["frameworks"] if f["id"] == fid), None)
    if not fw:
        raise HTTPException(404, "Framework not found")
    rows = payload.get("rows")
    if not rows:
        rows = state.get("sample_rows", {}).get(fid) or state["sample_rows"].get("fw_sales_v2", [])
    output = engine.execute_scorecard(fw, rows)

    run = {
        "id": _next_id("run", state["runs"]),
        "framework_id": fid,
        "framework_name": fw["name"],
        "executed_at": "2026-06-17",
        "row_count": len(rows),
        **output,
    }
    state["runs"].append(run)
    fw["usage_count"] = fw.get("usage_count", 0) + 1
    storage.save(state)
    return run


@app.get("/api/runs")
def list_runs():
    return [{k: r[k] for k in ("id", "framework_id", "framework_name", "executed_at",
                               "row_count", "summary")} for r in storage.load()["runs"]]


@app.get("/api/runs/{rid}")
def get_run(rid: str):
    run = next((r for r in storage.load()["runs"] if r["id"] == rid), None)
    if not run:
        raise HTTPException(404, "Run not found")
    return run


@app.get("/api/runs/latest/{fid}")
def latest_run(fid: str):
    runs = [r for r in storage.load()["runs"] if r["framework_id"] == fid]
    if not runs:
        raise HTTPException(404, "No runs for framework")
    return runs[-1]


# ---------------------------------------------------------------------------
# Insights
# ---------------------------------------------------------------------------

@app.get("/api/frameworks/{fid}/insights")
def insights(fid: str):
    fw = get_framework(fid)
    runs = [r for r in storage.load()["runs"] if r["framework_id"] == fid]
    recs = _generate_insights(fw, runs[-1] if runs else None)
    return {"framework": fw["name"], "recommendations": recs}


def _generate_insights(fw: dict, run: dict | None) -> list[dict]:
    recs = [
        {"type": "New KPI", "title": "Add 'First Response Time'",
         "detail": "Process-stage SLA metric strongly correlates with conversion in similar frameworks.",
         "confidence": 0.86, "impact": "High"},
        {"type": "Derived KPI", "title": "Introduce 'Meetings per 100 Calls'",
         "detail": "Normalizes Conversion Rate across agents with different call volumes.",
         "confidence": 0.8, "impact": "Medium"},
        {"type": "Formula Simplification", "title": "Simplify Productivity Score",
         "detail": "Calls dominate the weighted sum due to scale; normalize inputs to 0–100 before weighting.",
         "confidence": 0.74, "impact": "Medium"},
        {"type": "Governance", "title": "Tighten Quality Penalty band",
         "detail": "Threshold of 5 errors penalizes <8% of agents; consider a graduated penalty.",
         "confidence": 0.71, "impact": "Low"},
        {"type": "Benchmark", "title": "Add normalized ranking for cross-LOB comparison",
         "detail": "LOBs have different target baselines; normalized ranking enables fair org-wide comparison.",
         "confidence": 0.78, "impact": "High"},
    ]
    if run and run.get("summary"):
        dist = run["summary"].get("rating_distribution", {})
        below = dist.get("Below", 0) + dist.get("Partially Meets", 0)
        if below:
            recs.insert(0, {
                "type": "Target Improvement",
                "title": f"Review targets — {below} agents below expectations",
                "detail": "A cluster below 'Meets' may indicate targets are set above achievable levels for this period.",
                "confidence": 0.82, "impact": "High"})
    return recs


# ---------------------------------------------------------------------------
# Dashboard & admin
# ---------------------------------------------------------------------------

@app.get("/api/dashboard")
def dashboard():
    state = storage.load()
    fws = state["frameworks"]
    runs = state["runs"]
    return {
        "frameworks": {
            "total": len(fws),
            "published": sum(1 for f in fws if f["status"] == "published"),
            "draft": sum(1 for f in fws if f["status"] == "draft"),
            "archived": sum(1 for f in fws if f["status"] == "archived"),
        },
        "data_sources": len(state["data_sources"]),
        "runs": len(runs),
        "employees_scored": sum(r.get("row_count", 0) for r in runs),
        "recent_runs": [{"id": r["id"], "framework_name": r["framework_name"],
                         "executed_at": r["executed_at"], "summary": r.get("summary", {})}
                        for r in runs[-5:][::-1]],
        "frameworks_by_status": [
            {"name": "Published", "value": sum(1 for f in fws if f["status"] == "published")},
            {"name": "Draft", "value": sum(1 for f in fws if f["status"] == "draft")},
            {"name": "Archived", "value": sum(1 for f in fws if f["status"] == "archived")},
        ],
        "top_frameworks": sorted(
            [{"name": f["name"], "usage": f.get("usage_count", 0)} for f in fws],
            key=lambda x: x["usage"], reverse=True)[:5],
    }


@app.post("/api/admin/reset")
def admin_reset():
    storage.reset()
    return {"ok": True}


@app.get("/api/health")
def health():
    return {"status": "ok"}
