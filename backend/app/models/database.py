import aiosqlite
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "autopilot.db")


async def get_db() -> aiosqlite.Connection:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA foreign_keys=ON")
    return db


async def init_db() -> None:
    db = await get_db()
    try:
        await db.executescript("""
            CREATE TABLE IF NOT EXISTS datasets (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                filename TEXT NOT NULL,
                row_count INTEGER,
                columns_json TEXT,
                schema_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS dataset_rows (
                id TEXT PRIMARY KEY,
                dataset_id TEXT REFERENCES datasets(id) ON DELETE CASCADE,
                row_data TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS insights (
                id TEXT PRIMARY KEY,
                dataset_id TEXT REFERENCES datasets(id) ON DELETE CASCADE,
                type TEXT NOT NULL,
                priority TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                impact_revenue REAL,
                impact_customers INTEGER,
                confidence REAL,
                chart_data TEXT,
                ai_reasoning TEXT,
                dismissed INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS simulations (
                id TEXT PRIMARY KEY,
                dataset_id TEXT REFERENCES datasets(id) ON DELETE CASCADE,
                feature_name TEXT NOT NULL,
                parameters TEXT NOT NULL,
                results TEXT NOT NULL,
                recommendation TEXT,
                confidence REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                title TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                thinking TEXT,
                pinned_context TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        await db.commit()

        # Create action_items table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS action_items (
                id TEXT PRIMARY KEY,
                insight_id TEXT REFERENCES insights(id) ON DELETE CASCADE,
                dataset_id TEXT REFERENCES datasets(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                priority TEXT NOT NULL,
                effort TEXT NOT NULL,
                category TEXT NOT NULL,
                added_to_plan INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.commit()

        # Add new columns (safe for existing data — ignores if already present)
        for alter_sql in [
            "ALTER TABLE insights ADD COLUMN impact_score REAL",
            "ALTER TABLE insights ADD COLUMN suggested_questions TEXT",
            "ALTER TABLE simulations ADD COLUMN template_id TEXT",
            "ALTER TABLE insights ADD COLUMN prediction TEXT",
            "ALTER TABLE insights ADD COLUMN prediction_detail TEXT",
        ]:
            try:
                await db.execute(alter_sql)
            except Exception:
                pass  # Column already exists
        await db.commit()
    finally:
        await db.close()
