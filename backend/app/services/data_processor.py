import json
import pandas as pd
import numpy as np
from app.models.database import get_db


async def get_dataset_summary(dataset_id: str) -> dict:
    """Load dataset rows and return a statistical summary for Claude prompts."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT row_data FROM dataset_rows WHERE dataset_id = ?",
            (dataset_id,),
        )
        raw_rows = await cursor.fetchall()
    finally:
        await db.close()

    if not raw_rows:
        return {"row_count": 0, "columns": [], "stats": {}, "categorical": {}, "sample_rows": []}

    rows = [json.loads(r[0]) for r in raw_rows]
    df = pd.DataFrame(rows)

    # Column info
    columns_info = []
    for col in df.columns:
        dtype = str(df[col].dtype)
        columns_info.append({"name": col, "dtype": dtype, "null_count": int(df[col].isna().sum())})

    # Numeric stats
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    stats: dict[str, dict] = {}
    for col in numeric_cols:
        s = df[col].dropna()
        if len(s) == 0:
            continue
        stats[col] = {
            "mean": round(float(s.mean()), 2),
            "median": round(float(s.median()), 2),
            "min": round(float(s.min()), 2),
            "max": round(float(s.max()), 2),
            "std": round(float(s.std()), 2),
        }

    # Categorical value counts (top 10)
    categorical_cols = df.select_dtypes(include=["object", "bool"]).columns.tolist()
    categorical: dict[str, list[dict]] = {}
    for col in categorical_cols:
        vc = df[col].value_counts().head(10)
        categorical[col] = [
            {"value": str(k), "count": int(v)} for k, v in vc.items()
        ]

    # Sample rows
    sample_size = min(10, len(df))
    sample_df = df.sample(n=sample_size, random_state=42)
    sample_rows = sample_df.where(pd.notna(sample_df), None).to_dict(orient="records")

    return {
        "row_count": len(df),
        "columns": columns_info,
        "numeric_stats": stats,
        "categorical_counts": categorical,
        "sample_rows": sample_rows,
    }


async def compute_kpis(dataset_id: str) -> dict:
    """Compute dashboard KPIs directly from data (no AI needed)."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT row_data FROM dataset_rows WHERE dataset_id = ?",
            (dataset_id,),
        )
        raw_rows = await cursor.fetchall()
    finally:
        await db.close()

    if not raw_rows:
        return {}

    rows = [json.loads(r[0]) for r in raw_rows]
    df = pd.DataFrame(rows)

    kpis: dict[str, object] = {}

    # Total MRR (sum of mrr for non-churned)
    if "mrr" in df.columns:
        if "churned" in df.columns:
            active = df[df["churned"] != True]  # noqa: E712
            kpis["total_mrr"] = round(float(active["mrr"].sum()), 2)
        else:
            kpis["total_mrr"] = round(float(df["mrr"].sum()), 2)

    # Churn rate
    if "churned" in df.columns:
        churned_count = int(df["churned"].sum())
        total = len(df)
        kpis["churn_rate"] = round(churned_count / total * 100, 1) if total > 0 else 0.0
        kpis["churned_count"] = churned_count
        kpis["active_accounts"] = total - churned_count
    else:
        kpis["active_accounts"] = len(df)

    # Avg NPS
    if "nps_score" in df.columns:
        kpis["avg_nps"] = round(float(df["nps_score"].mean()), 1)

    # Total support tickets
    if "support_tickets" in df.columns:
        kpis["total_support_tickets"] = int(df["support_tickets"].sum())

    # Total accounts
    kpis["total_accounts"] = len(df)

    return kpis
