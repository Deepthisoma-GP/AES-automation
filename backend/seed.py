"""Seed data for the APFB prototype: a full published framework, data sources,
a sample AI discovery result, upload templates, and sample workforce data.
"""
from __future__ import annotations


def _sales_framework() -> dict:
    metrics = [
        {"id": "m_calls", "name": "Calls", "classification": "input", "datatype": "count",
         "direction": "higher_better", "scoring_method": "achievement_higher_better",
         "weight": 1, "include_in_score": True, "formula": None},
        {"id": "m_meetings", "name": "Meetings", "classification": "output", "datatype": "count",
         "direction": "higher_better", "scoring_method": "achievement_higher_better",
         "weight": 1, "include_in_score": True, "formula": None},
        {"id": "m_engagement", "name": "Engagement Score", "classification": "process",
         "datatype": "percentage", "direction": "higher_better",
         "scoring_method": "achievement_higher_better", "weight": 1,
         "include_in_score": True, "formula": None},
        {"id": "m_pitch", "name": "Pitch Rate", "classification": "process",
         "datatype": "percentage", "direction": "higher_better",
         "scoring_method": "achievement_higher_better", "weight": 1,
         "include_in_score": True, "formula": None},
        {"id": "m_conversion", "name": "Conversion Rate", "classification": "output",
         "datatype": "percentage", "direction": "higher_better",
         "scoring_method": "formula_based", "weight": 2, "include_in_score": True,
         "formula": "(Meetings ÷ Calls) × 100"},
        {"id": "m_productivity", "name": "Productivity Score", "classification": "output",
         "datatype": "decimal", "direction": "higher_better",
         "scoring_method": "formula_based", "weight": 2, "include_in_score": True,
         "formula": "40% Calls + 30% Engagement Score + 30% Pitch Rate"},
    ]

    targets = [
        {"level": "Business", "entity": None, "metric_id": "m_calls", "value": 150},
        {"level": "Business", "entity": None, "metric_id": "m_meetings", "value": 30},
        {"level": "Business", "entity": None, "metric_id": "m_engagement", "value": 75},
        {"level": "Business", "entity": None, "metric_id": "m_pitch", "value": 70},
        {"level": "Business", "entity": None, "metric_id": "m_conversion", "value": 20},
        {"level": "Business", "entity": None, "metric_id": "m_productivity", "value": 100},
        # LOB-specific override example.
        {"level": "LOB", "entity": "Enterprise Sales", "metric_id": "m_calls", "value": 120},
    ]

    governance = [
        {"name": "Mandatory Compliance Training", "type": "hard_eligibility",
         "action": "block", "field": "Mandatory Training", "operator": "==", "threshold": "No",
         "description": "Agents who have not completed compliance training are not eligible for a rating."},
        {"name": "Minimum Activity Gate", "type": "rating_gate", "action": "cap_rating",
         "field": "Calls", "operator": "<", "threshold": 100, "cap_value": "Meets",
         "description": "Agents below 100 calls cannot be rated higher than 'Meets'."},
        {"name": "Quality Penalty", "type": "penalty", "action": "deduct_points",
         "field": "Quality Errors", "operator": ">", "threshold": 5, "metric": "Productivity Score",
         "penalty": 1, "description": "More than 5 quality errors deducts 1 point from Productivity Score."},
        {"name": "Low Engagement Watch", "type": "informational", "action": "warning",
         "field": "Engagement Score", "operator": "<", "threshold": 50,
         "description": "Flags agents with engagement below 50% for coaching."},
    ]

    rating_framework = {
        "method": "weighted_average",
        "bands": [
            {"label": "Exceptional", "min_score": 4.5},
            {"label": "Exceeds", "min_score": 3.5},
            {"label": "Meets", "min_score": 2.5},
            {"label": "Partially Meets", "min_score": 1.5},
            {"label": "Below", "min_score": 0},
        ],
    }

    upload_template = {
        "sections": [
            {"name": "Workforce", "columns": [
                "Agent ID", "Agent Name", "Department", "Business", "LOB",
                "Supervisor ID", "Supervisor Name", "Manager ID", "Manager Name",
                "Reporting Month", "Reporting Year"]},
            {"name": "Governance", "columns": ["Mandatory Training", "Quality Errors"]},
            {"name": "Metrics", "columns": ["Calls", "Meetings", "Engagement Score", "Pitch Rate"]},
        ],
        "aliases": {"Engagement Score": ["Engagement", "Eng %"], "Calls": ["Total Calls", "Dials"]},
        "instructions": "Provide one row per agent per reporting month. Derived metrics "
                        "(Conversion Rate, Productivity Score) are calculated automatically.",
        "locked": ["Calls", "Meetings", "Engagement Score", "Pitch Rate"],
    }

    return {
        "id": "fw_sales_v2",
        "name": "Sales Performance Scorecard",
        "business": "Global Sales",
        "lob": "Inside Sales",
        "owner": "Priya Nair",
        "version": "2.0",
        "status": "published",
        "parent_id": None,
        "created_date": "2025-09-01",
        "last_updated": "2026-02-14",
        "usage_count": 18,
        "organization": ["Business", "Region", "Country", "LOB", "Department", "Team"],
        "metrics": metrics,
        "targets": targets,
        "scoring_bands": [
            {"min_achievement": 120, "points": 5, "rating": "Exceptional"},
            {"min_achievement": 100, "points": 4, "rating": "Exceeds"},
            {"min_achievement": 90, "points": 3, "rating": "Meets"},
            {"min_achievement": 75, "points": 2, "rating": "Partially Meets"},
            {"min_achievement": 0, "points": 1, "rating": "Below"},
        ],
        "governance": governance,
        "rating_framework": rating_framework,
        "rating_order": ["Not Eligible", "Below", "Partially Meets", "Meets", "Exceeds", "Exceptional"],
        "benchmark_groups": [{"name": "By LOB", "level": "LOB", "ranking_method": "relative"}],
        "ranking_method": "relative",
        "upload_template": upload_template,
    }


def _other_frameworks() -> list[dict]:
    base = _sales_framework()
    return [
        {**base, "id": "fw_cs_v1", "name": "Customer Support Scorecard",
         "business": "Customer Experience", "lob": "Support", "owner": "Meera Iyer",
         "version": "1.0", "status": "published", "usage_count": 9,
         "created_date": "2025-10-12", "last_updated": "2026-01-20"},
        {**base, "id": "fw_sales_v3_draft", "name": "Sales Performance Scorecard (FY26 Draft)",
         "business": "Global Sales", "lob": "Inside Sales", "owner": "Priya Nair",
         "version": "3.0", "status": "draft", "parent_id": "fw_sales_v2", "usage_count": 0,
         "created_date": "2026-03-01", "last_updated": "2026-03-08"},
        {**base, "id": "fw_collections_v1", "name": "Collections Performance (Archived)",
         "business": "Finance Ops", "lob": "Collections", "owner": "Tom Garcia",
         "version": "1.2", "status": "archived", "usage_count": 24,
         "created_date": "2024-06-01", "last_updated": "2025-07-30"},
    ]


def _data_sources() -> list[dict]:
    return [
        {"id": "ds_1", "name": "Sales_Metrics_FY26.xlsx", "type": "Excel", "purpose": "Performance Metrics",
         "status": "connected", "records": 1840},
        {"id": "ds_2", "name": "Targets_by_LOB.csv", "type": "CSV", "purpose": "Targets",
         "status": "connected", "records": 42},
        {"id": "ds_3", "name": "Sales KPIs (Power BI)", "type": "Power BI", "purpose": "Performance Metrics",
         "status": "connected", "records": 0},
        {"id": "ds_4", "name": "snowflake.sales.fct_activity", "type": "Snowflake", "purpose": "Performance Metrics",
         "status": "connected", "records": 92000},
        {"id": "ds_5", "name": "Rating_Methodology.pdf", "type": "PDF", "purpose": "Rating Logic",
         "status": "connected", "records": 0},
        {"id": "ds_6", "name": "Governance_SOP.docx", "type": "SOP", "purpose": "Governance",
         "status": "pending", "records": 0},
    ]


def _discovery_result() -> dict:
    return {
        "id": "disc_1",
        "framework_name": "Sales Performance (discovered)",
        "sources": ["Sales_Metrics_FY26.xlsx", "Targets_by_LOB.csv", "Rating_Methodology.pdf"],
        "organization": {"confidence": 0.92,
                         "levels": ["Business", "Region", "LOB", "Department", "Team"]},
        "metrics": [
            {"name": "Calls", "classification": "input", "confidence": 0.97},
            {"name": "Meetings", "classification": "output", "confidence": 0.95},
            {"name": "Engagement Score", "classification": "process", "confidence": 0.88},
            {"name": "Pitch Rate", "classification": "process", "confidence": 0.84},
        ],
        "formulas": [
            {"name": "Conversion Rate", "expression": "Meetings ÷ Calls", "confidence": 0.93,
             "source": "Excel column N"},
            {"name": "Productivity Score", "expression": "40% Calls + 30% Engagement + 30% Pitch Rate",
             "confidence": 0.79, "source": "DAX measure 'Productivity'"},
        ],
        "targets": [{"name": "Calls target", "value": 150, "confidence": 0.9},
                    {"name": "Meetings target", "value": 30, "confidence": 0.86}],
        "governance": [
            {"name": "Compliance training gate", "confidence": 0.81, "type": "hard_eligibility"},
            {"name": "Minimum activity gate", "confidence": 0.74, "type": "rating_gate"},
        ],
        "rating_framework": {"method": "weighted_average", "confidence": 0.83},
        "benchmark_groups": [{"name": "By LOB", "confidence": 0.88}],
        "dependency_graph": [
            {"from": "Calls", "to": "Conversion Rate"},
            {"from": "Meetings", "to": "Conversion Rate"},
            {"from": "Calls", "to": "Productivity Score"},
            {"from": "Engagement Score", "to": "Productivity Score"},
            {"from": "Pitch Rate", "to": "Productivity Score"},
        ],
    }


def _sample_rows() -> list[dict]:
    # name, lob, calls, meetings, engagement, pitch, training, errors
    raw = [
        ("A101", "Aarav Sharma", "Enterprise Sales", 190, 41, 88, 82, "Yes", 1),
        ("A102", "Bianca Rossi", "Enterprise Sales", 155, 33, 79, 71, "Yes", 2),
        ("A103", "Chen Wei", "Enterprise Sales", 95, 18, 64, 58, "Yes", 0),
        ("A104", "Diego Morales", "Enterprise Sales", 175, 36, 81, 77, "No", 1),
        ("A105", "Emma Johnson", "SMB Sales", 210, 48, 91, 86, "Yes", 0),
        ("A106", "Farah Ali", "SMB Sales", 140, 27, 72, 68, "Yes", 7),
        ("A107", "Goro Tanaka", "SMB Sales", 160, 31, 76, 70, "Yes", 3),
        ("A108", "Hana Kim", "SMB Sales", 85, 12, 45, 49, "Yes", 2),
        ("A109", "Ibrahim Khan", "Mid-Market", 168, 34, 80, 74, "Yes", 1),
        ("A110", "Julia Costa", "Mid-Market", 198, 44, 89, 83, "Yes", 0),
        ("A111", "Kofi Mensah", "Mid-Market", 132, 24, 70, 66, "Yes", 4),
        ("A112", "Lena Müller", "Mid-Market", 151, 30, 77, 72, "Yes", 9),
    ]
    rows = []
    for aid, name, lob, calls, meet, eng, pitch, train, errs in raw:
        rows.append({
            "Agent ID": aid, "Agent Name": name, "Department": "Sales",
            "Business": "Global Sales", "LOB": lob,
            "Supervisor ID": "S01", "Supervisor Name": "Priya Nair",
            "Manager ID": "M01", "Manager Name": "Rajesh Kumar",
            "Reporting Month": "May", "Reporting Year": 2026,
            "Mandatory Training": train, "Quality Errors": errs,
            "Calls": calls, "Meetings": meet, "Engagement Score": eng, "Pitch Rate": pitch,
        })
    return rows


def build_seed() -> dict:
    return {
        "frameworks": [_sales_framework(), *_other_frameworks()],
        "data_sources": _data_sources(),
        "discoveries": [_discovery_result()],
        "sample_rows": {"fw_sales_v2": _sample_rows()},
        "runs": [],
        "users": [
            {"name": "Priya Nair", "role": "Business Owner"},
            {"name": "Rajesh Kumar", "role": "Operations Manager"},
            {"name": "Meera Iyer", "role": "Leadership"},
            {"name": "Admin", "role": "Platform Administrator"},
        ],
    }
