import json
import uuid
import io
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.database import get_db
from app.models.schemas import DatasetResponse, DatasetDetailResponse, UploadResponse
import pandas as pd

router = APIRouter(prefix="/api/data", tags=["data"])


@router.post("/upload", response_model=UploadResponse)
async def upload_csv(file: UploadFile = File(...)) -> UploadResponse:
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    content = await file.read()
    df = pd.read_csv(io.BytesIO(content))

    dataset_id = str(uuid.uuid4())
    columns = df.columns.tolist()
    name = file.filename.rsplit(".", 1)[0]

    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO datasets (id, name, filename, row_count, columns_json) VALUES (?, ?, ?, ?, ?)",
            (dataset_id, name, file.filename, len(df), json.dumps(columns)),
        )

        for _, row in df.iterrows():
            row_id = str(uuid.uuid4())
            await db.execute(
                "INSERT INTO dataset_rows (id, dataset_id, row_data) VALUES (?, ?, ?)",
                (row_id, dataset_id, json.dumps(row.where(pd.notna(row), None).to_dict())),
            )

        await db.commit()
    finally:
        await db.close()

    preview = df.head(20).where(pd.notna(df.head(20)), None).to_dict(orient="records")

    return UploadResponse(
        dataset=DatasetResponse(
            id=dataset_id,
            name=name,
            filename=file.filename or "",
            row_count=len(df),
            columns=columns,
        ),
        preview=preview,
        columns=columns,
        row_count=len(df),
    )


@router.post("/demo", response_model=UploadResponse)
async def load_demo_data() -> UploadResponse:
    import os
    demo_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "demo_dataset.csv")

    if not os.path.exists(demo_path):
        raise HTTPException(status_code=404, detail="Demo dataset not found")

    df = pd.read_csv(demo_path)

    dataset_id = str(uuid.uuid4())
    columns = df.columns.tolist()
    name = "Developer Tools SaaS (Demo)"

    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO datasets (id, name, filename, row_count, columns_json) VALUES (?, ?, ?, ?, ?)",
            (dataset_id, name, "demo_dataset.csv", len(df), json.dumps(columns)),
        )

        for _, row in df.iterrows():
            row_id = str(uuid.uuid4())
            await db.execute(
                "INSERT INTO dataset_rows (id, dataset_id, row_data) VALUES (?, ?, ?)",
                (row_id, dataset_id, json.dumps(row.where(pd.notna(row), None).to_dict())),
            )

        await db.commit()
    finally:
        await db.close()

    preview = df.head(20).where(pd.notna(df.head(20)), None).to_dict(orient="records")

    return UploadResponse(
        dataset=DatasetResponse(
            id=dataset_id,
            name=name,
            filename="demo_dataset.csv",
            row_count=len(df),
            columns=columns,
        ),
        preview=preview,
        columns=columns,
        row_count=len(df),
    )


@router.post("/demo-v2", response_model=UploadResponse)
async def load_demo_data_v2() -> UploadResponse:
    import os
    demo_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "demo_dataset_v2.csv")

    if not os.path.exists(demo_path):
        raise HTTPException(status_code=404, detail="Demo dataset v2 not found")

    df = pd.read_csv(demo_path)

    dataset_id = str(uuid.uuid4())
    columns = df.columns.tolist()
    name = "Developer Tools SaaS — Q1 2026 (Demo)"

    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO datasets (id, name, filename, row_count, columns_json) VALUES (?, ?, ?, ?, ?)",
            (dataset_id, name, "demo_dataset_v2.csv", len(df), json.dumps(columns)),
        )

        for _, row in df.iterrows():
            row_id = str(uuid.uuid4())
            await db.execute(
                "INSERT INTO dataset_rows (id, dataset_id, row_data) VALUES (?, ?, ?)",
                (row_id, dataset_id, json.dumps(row.where(pd.notna(row), None).to_dict())),
            )

        await db.commit()
    finally:
        await db.close()

    preview = df.head(20).where(pd.notna(df.head(20)), None).to_dict(orient="records")

    return UploadResponse(
        dataset=DatasetResponse(
            id=dataset_id,
            name=name,
            filename="demo_dataset_v2.csv",
            row_count=len(df),
            columns=columns,
        ),
        preview=preview,
        columns=columns,
        row_count=len(df),
    )


@router.get("/datasets", response_model=list[DatasetResponse])
async def list_datasets() -> list[DatasetResponse]:
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id, name, filename, row_count, columns_json, created_at FROM datasets ORDER BY created_at DESC")
        rows = await cursor.fetchall()
        return [
            DatasetResponse(
                id=row[0],
                name=row[1],
                filename=row[2],
                row_count=row[3],
                columns=json.loads(row[4]) if row[4] else None,
                created_at=row[5],
            )
            for row in rows
        ]
    finally:
        await db.close()


@router.get("/datasets/{dataset_id}", response_model=DatasetDetailResponse)
async def get_dataset(dataset_id: str) -> DatasetDetailResponse:
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id, name, filename, row_count, columns_json, schema_json, created_at FROM datasets WHERE id = ?", (dataset_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Dataset not found")

        sample_cursor = await db.execute("SELECT row_data FROM dataset_rows WHERE dataset_id = ? LIMIT 50", (dataset_id,))
        sample_rows_raw = await sample_cursor.fetchall()
        sample_rows = [json.loads(r[0]) for r in sample_rows_raw]

        return DatasetDetailResponse(
            id=row[0],
            name=row[1],
            filename=row[2],
            row_count=row[3],
            columns=json.loads(row[4]) if row[4] else None,
            created_at=row[6],
            sample_rows=sample_rows,
            schema_info=json.loads(row[5]) if row[5] else None,
        )
    finally:
        await db.close()


@router.delete("/datasets/{dataset_id}")
async def delete_dataset(dataset_id: str) -> dict[str, str]:
    db = await get_db()
    try:
        await db.execute("DELETE FROM dataset_rows WHERE dataset_id = ?", (dataset_id,))
        await db.execute("DELETE FROM insights WHERE dataset_id = ?", (dataset_id,))
        await db.execute("DELETE FROM simulations WHERE dataset_id = ?", (dataset_id,))
        await db.execute("DELETE FROM datasets WHERE id = ?", (dataset_id,))
        await db.commit()
    finally:
        await db.close()
    return {"status": "deleted"}
