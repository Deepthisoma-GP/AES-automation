"""APFB calculation engine.

Implements the execution flow from the spec:

    Upload Data -> Derived Metric Calculation -> Formula Execution ->
    Governance Validation -> Metric Scoring -> Final Rating ->
    Benchmark Validation -> Ranking Generation -> Results

The engine is deliberately data-driven: a framework declares its metrics,
formulas, scoring bands, governance rules, rating method and benchmark/ranking
config, and the engine executes it against uploaded employee rows.
"""
from __future__ import annotations

import re
import statistics
from typing import Any

# ----------------------------------------------------------------------------
# Formula evaluation
# ----------------------------------------------------------------------------

_SAFE = {"__builtins__": {}}


def _safe_var(metric_id: str) -> str:
    return "m_" + re.sub(r"[^a-zA-Z0-9_]", "_", metric_id)


def translate_formula(formula: str, name_to_id: dict[str, str]) -> str:
    """Turn a business-friendly formula into a Python expression.

    Handles:
      * `÷` / `×` operators
      * percentage weights, e.g. ``40% Calls`` -> ``(40/100)* Calls``
      * metric names (case-insensitive, longest first) -> safe variables
    """
    expr = formula.replace("÷", "/").replace("×", "*")
    # "40% Calls" -> "(40/100)* Calls"
    expr = re.sub(r"(\d+(?:\.\d+)?)\s*%", r"(\1/100)*", expr)
    # Replace metric names with safe variables, longest names first.
    for name in sorted(name_to_id, key=len, reverse=True):
        pattern = re.compile(re.escape(name), re.IGNORECASE)
        expr = pattern.sub(_safe_var(name_to_id[name]), expr)
    # A trailing "*" from a bare percentage with nothing after it is invalid.
    expr = re.sub(r"\*\s*$", "", expr).strip()
    return expr


def evaluate_formula(formula: str, metrics: list[dict], values: dict[str, float]) -> float | None:
    name_to_id = {m["name"]: m["id"] for m in metrics}
    expr = translate_formula(formula, name_to_id)
    scope = {_safe_var(mid): values.get(mid, 0.0) for mid in {m["id"] for m in metrics}}
    try:
        result = eval(expr, _SAFE, scope)  # noqa: S307 - controlled, no builtins
        return float(result)
    except Exception:
        return None


# ----------------------------------------------------------------------------
# Scoring
# ----------------------------------------------------------------------------

def _to_float(v: Any) -> float | None:
    if v is None or v == "":
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip().replace(",", "").replace("%", "")
    try:
        return float(s)
    except ValueError:
        return None


def compute_achievement(metric: dict, actual: float, target: float | None) -> float | None:
    """Achievement % relative to target, respecting metric direction."""
    if target in (None, 0):
        return None
    direction = metric.get("direction", "higher_better")
    if direction == "lower_better":
        return round((target / actual) * 100, 1) if actual else None
    return round((actual / target) * 100, 1)


def score_from_bands(achievement: float | None, bands: list[dict]) -> dict:
    """Map an achievement % to points + rating using descending threshold bands."""
    if achievement is None:
        return {"points": 0, "rating": "No Data"}
    for band in bands:  # bands sorted high -> low
        if achievement >= band["min_achievement"]:
            return {"points": band["points"], "rating": band["rating"]}
    last = bands[-1] if bands else {"points": 0, "rating": "Below"}
    return {"points": last["points"], "rating": last["rating"]}


# ----------------------------------------------------------------------------
# Execution
# ----------------------------------------------------------------------------

WORKFORCE_COLUMNS = [
    "Agent ID", "Agent Name", "Department", "Business", "LOB",
    "Supervisor ID", "Supervisor Name", "Manager ID", "Manager Name",
    "Reporting Month", "Reporting Year",
]


def _target_for(framework: dict, metric_id: str, row: dict) -> float | None:
    """Find the most specific target for a metric given a row's org context."""
    targets = [t for t in framework.get("targets", []) if t["metric_id"] == metric_id]
    if not targets:
        return None
    # Prefer a target whose level/value matches the row, else fall back to a
    # default (level == "Business" or no entity).
    best = None
    for t in targets:
        level = t.get("level", "Business")
        entity = t.get("entity")
        if entity and str(row.get(level, "")).strip() == str(entity).strip():
            return _to_float(t["value"])
        if not entity or level == "Business":
            best = t
    return _to_float(best["value"]) if best else _to_float(targets[0]["value"])


def _rating_from_method(framework: dict, total_points: float, avg_points: float,
                        scored_count: int) -> str:
    rf = framework.get("rating_framework", {})
    method = rf.get("method", "weighted_average")
    bands = rf.get("bands", [])
    # Bands operate on a 0-5 scale by default (avg points). For points-based
    # aggregation, bands may declare `min_score` on the raw total instead.
    basis = avg_points
    key = "min_score"
    if method in ("points_based", "forced_ranking"):
        basis = total_points
    for band in bands:
        threshold = band.get(key, band.get("min_achievement", band.get("min_points", 0)))
        if basis >= threshold:
            return band["label"]
    return bands[-1]["label"] if bands else "Unrated"


def execute_scorecard(framework: dict, rows: list[dict]) -> dict:
    """Run the full execution flow and return per-employee + summary results."""
    metrics = framework.get("metrics", [])
    bands = framework.get("scoring_bands", DEFAULT_BANDS)
    governance = framework.get("governance", [])
    results: list[dict] = []

    for row in rows:
        # 1+2. Raw + derived/formula metric values (multi-pass for dependencies).
        values: dict[str, float] = {}
        for m in metrics:
            if m.get("scoring_method") != "formula_based" and not m.get("formula"):
                v = _to_float(row.get(m["name"]))
                if v is not None:
                    values[m["id"]] = v
        for _ in range(len(metrics)):
            progressed = False
            for m in metrics:
                if m["id"] in values:
                    continue
                if m.get("formula"):
                    val = evaluate_formula(m["formula"], metrics, values)
                    if val is not None:
                        values[m["id"]] = round(val, 4)
                        progressed = True
            if not progressed:
                break

        # 4. Governance validation.
        gov = _apply_governance(governance, row, values, metrics)

        # 5. Metric scoring.
        metric_results = []
        total_points = 0.0
        weighted_sum = 0.0
        weight_total = 0.0
        scored = 0
        for m in metrics:
            if not m.get("include_in_score", True):
                continue
            actual = values.get(m["id"])
            target = _target_for(framework, m["id"], row)
            ach = compute_achievement(m, actual, target) if actual is not None else None
            band = score_from_bands(ach, bands)
            pts = band["points"] - gov["point_deductions"].get(m["id"], 0)
            pts = max(0, pts)
            weight = m.get("weight", 1) or 1
            total_points += pts
            weighted_sum += pts * weight
            weight_total += weight
            scored += 1
            metric_results.append({
                "metric_id": m["id"],
                "metric": m["name"],
                "classification": m.get("classification"),
                "actual": actual,
                "target": target,
                "achievement": ach,
                "points": pts,
                "rating": band["rating"],
            })

        avg_points = round(weighted_sum / weight_total, 2) if weight_total else 0.0

        # 6. Final rating (+ governance gates/caps).
        if gov["blocked"]:
            final_rating = "Not Eligible"
        else:
            final_rating = _rating_from_method(framework, total_points, avg_points, scored)
            final_rating = _apply_rating_cap(final_rating, gov["rating_cap"], framework)

        results.append({
            "agent_id": row.get("Agent ID"),
            "agent_name": row.get("Agent Name"),
            "department": row.get("Department"),
            "business": row.get("Business"),
            "lob": row.get("LOB"),
            "supervisor": row.get("Supervisor Name"),
            "manager": row.get("Manager Name"),
            "period": f"{row.get('Reporting Month', '')} {row.get('Reporting Year', '')}".strip(),
            "governance_status": gov["status"],
            "governance_notes": gov["notes"],
            "blocked": gov["blocked"],
            "metric_results": metric_results,
            "total_points": round(total_points, 2),
            "score": avg_points,
            "final_rating": final_rating,
        })

    # 7+8. Benchmark validation + ranking.
    results = generate_rankings(framework, results)

    summary = _summarize(results)
    return {"results": results, "summary": summary}


def _apply_governance(rules: list[dict], row: dict, values: dict[str, float],
                      metrics: list[dict]) -> dict:
    out = {"blocked": False, "rating_cap": None, "point_deductions": {}, "notes": [], "status": "Pass"}
    name_to_id = {m["name"]: m["id"] for m in metrics}
    for rule in rules:
        triggered = _rule_triggered(rule, row, values, name_to_id)
        if not triggered:
            continue
        action = rule.get("action")
        label = rule.get("name", "Rule")
        if rule.get("type") == "hard_eligibility" or action == "block":
            out["blocked"] = True
            out["status"] = "Blocked"
            out["notes"].append(f"Blocked: {label}")
        elif action == "cap_rating":
            out["rating_cap"] = rule.get("cap_value", "Meets")
            out["notes"].append(f"Rating capped at {out['rating_cap']}: {label}")
            if out["status"] == "Pass":
                out["status"] = "Capped"
        elif action == "deduct_points":
            mid = name_to_id.get(rule.get("metric"))
            if mid:
                out["point_deductions"][mid] = out["point_deductions"].get(mid, 0) + rule.get("penalty", 1)
            out["notes"].append(f"Penalty applied: {label}")
            if out["status"] == "Pass":
                out["status"] = "Penalized"
        else:  # informational / warning
            out["notes"].append(f"Warning: {label}")
            if out["status"] == "Pass":
                out["status"] = "Warning"
    return out


def _rule_triggered(rule: dict, row: dict, values: dict[str, float],
                    name_to_id: dict[str, str]) -> bool:
    field = rule.get("field")
    op = rule.get("operator", "<")
    threshold = rule.get("threshold")
    # Resolve the left-hand value from a metric, an achievement, or a raw column.
    if field in name_to_id:
        actual = values.get(name_to_id[field])
    else:
        actual = _to_float(row.get(field))
        if actual is None:
            actual = row.get(field)
    if actual is None:
        return False
    try:
        if op == "<":
            return float(actual) < float(threshold)
        if op == "<=":
            return float(actual) <= float(threshold)
        if op == ">":
            return float(actual) > float(threshold)
        if op == ">=":
            return float(actual) >= float(threshold)
        if op == "==":
            return str(actual).strip().lower() == str(threshold).strip().lower()
        if op == "!=":
            return str(actual).strip().lower() != str(threshold).strip().lower()
    except (ValueError, TypeError):
        return str(actual).strip().lower() == str(threshold).strip().lower()
    return False


_RATING_ORDER = ["Not Eligible", "Below", "Partially Meets", "Meets", "Exceeds", "Exceptional"]


def _apply_rating_cap(rating: str, cap: str | None, framework: dict) -> str:
    if not cap:
        return rating
    order = framework.get("rating_order", _RATING_ORDER)
    try:
        if order.index(rating) > order.index(cap):
            return cap
    except ValueError:
        pass
    return rating


# ----------------------------------------------------------------------------
# Ranking
# ----------------------------------------------------------------------------

def generate_rankings(framework: dict, results: list[dict]) -> list[dict]:
    bg = framework.get("benchmark_groups", [])
    method = (bg[0].get("ranking_method") if bg else None) or framework.get("ranking_method", "relative")
    group_level = (bg[0].get("level") if bg else None) or "LOB"

    # Eligible (non-blocked) employees are ranked; blocked ones are excluded.
    groups: dict[str, list[dict]] = {}
    for r in results:
        if r["blocked"]:
            r["rank"] = None
            r["benchmark_group"] = "Excluded"
            r["percentile"] = None
            continue
        key = str(r.get(_level_field(group_level), "All"))
        r["benchmark_group"] = key
        groups.setdefault(key, []).append(r)

    for key, members in groups.items():
        scores = [m["score"] for m in members]
        mean = statistics.fmean(scores) if scores else 0
        stdev = statistics.pstdev(scores) if len(scores) > 1 else 0
        ranked = sorted(members, key=lambda m: m["score"], reverse=True)
        n = len(ranked)
        for i, m in enumerate(ranked):
            m["rank"] = i + 1
            m["group_size"] = n
            m["percentile"] = round((n - i) / n * 100, 1) if n else None
            if method == "normalized":
                m["normalized_score"] = round((m["score"] - mean) / stdev, 2) if stdev else 0.0
            elif method == "absolute":
                m["normalized_score"] = m["score"]
    return results


def _level_field(level: str) -> str:
    return {
        "Business": "business", "LOB": "lob", "Department": "department",
        "Team": "department", "Market": "business", "Country": "business",
    }.get(level, "lob")


# ----------------------------------------------------------------------------
# Summary + defaults
# ----------------------------------------------------------------------------

def _summarize(results: list[dict]) -> dict:
    if not results:
        return {"count": 0}
    scores = [r["score"] for r in results if not r["blocked"]]
    dist: dict[str, int] = {}
    for r in results:
        dist[r["final_rating"]] = dist.get(r["final_rating"], 0) + 1
    return {
        "count": len(results),
        "eligible": len(scores),
        "blocked": sum(1 for r in results if r["blocked"]),
        "avg_score": round(statistics.fmean(scores), 2) if scores else 0,
        "top_score": round(max(scores), 2) if scores else 0,
        "rating_distribution": dist,
    }


DEFAULT_BANDS = [
    {"min_achievement": 120, "points": 5, "rating": "Exceptional"},
    {"min_achievement": 100, "points": 4, "rating": "Exceeds"},
    {"min_achievement": 90, "points": 3, "rating": "Meets"},
    {"min_achievement": 75, "points": 2, "rating": "Partially Meets"},
    {"min_achievement": 0, "points": 1, "rating": "Below"},
]
