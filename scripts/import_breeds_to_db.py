"""Create breed table and import data/breeds/breeds-all.json into Supabase Postgres."""
import json
import os
import sys
from pathlib import Path

import psycopg2
from psycopg2.extras import Json, execute_values

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "data" / "breeds" / "breeds-all.json"
SQL_FILE = Path(__file__).resolve().parent / "sql" / "create_breed_table.sql"

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "aws-1-us-east-1.pooler.supabase.com"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "database": os.getenv("DB_NAME", "postgres"),
    "user": os.getenv("DB_USER", "postgres.nlpcfypmotplbqounddk"),
    "password": os.getenv("DB_PASSWORD", ""),
    "sslmode": os.getenv("DB_SSLMODE", "require"),
    "connect_timeout": 10,
}

UPSERT_SQL = """
INSERT INTO breed (
    slug, type, name, url, path, alt, meta_description,
    list_features, list_image, list_image_url, detail_image, detail_image_url,
    summary, profile, upkeep, introduction, helpful_info, updated_at
) VALUES %s
ON CONFLICT (type, slug) DO UPDATE SET
    name = EXCLUDED.name,
    url = EXCLUDED.url,
    path = EXCLUDED.path,
    alt = EXCLUDED.alt,
    meta_description = EXCLUDED.meta_description,
    list_features = EXCLUDED.list_features,
    list_image = EXCLUDED.list_image,
    list_image_url = EXCLUDED.list_image_url,
    detail_image = EXCLUDED.detail_image,
    detail_image_url = EXCLUDED.detail_image_url,
    summary = EXCLUDED.summary,
    profile = EXCLUDED.profile,
    upkeep = EXCLUDED.upkeep,
    introduction = EXCLUDED.introduction,
    helpful_info = EXCLUDED.helpful_info,
    updated_at = NOW()
"""


def load_breeds():
    if not DATA_FILE.exists():
        raise FileNotFoundError(f"Missing data file: {DATA_FILE}")
    payload = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    breeds = payload.get("breeds", [])
    if not breeds:
        raise ValueError("No breeds found in breeds-all.json")
    return breeds


def to_row(item):
    return (
        item["slug"],
        item["type"],
        item["name"],
        item["url"],
        item["path"],
        item.get("alt") or item["name"],
        item.get("metaDescription") or "",
        Json(item.get("listFeatures") or []),
        item.get("listImage") or "",
        item.get("listImageUrl") or "",
        item.get("detailImage") or "",
        item.get("detailImageUrl") or "",
        Json(item.get("summary") or {}),
        Json(item.get("profile") or {}),
        Json(item.get("upkeep") or {}),
        item.get("introduction") or "",
        Json(item.get("helpfulInfo") or []),
    )


def create_table(cur):
    cur.execute(SQL_FILE.read_text(encoding="utf-8"))


def import_breeds(cur, breeds):
    rows = [to_row(item) for item in breeds]
    template = """(
        %s, %s, %s, %s, %s, %s, %s,
        %s, %s, %s, %s, %s,
        %s, %s, %s, %s, %s, NOW()
    )"""
    execute_values(cur, UPSERT_SQL, rows, template=template, page_size=100)


def main():
    if not DB_CONFIG["password"]:
        print("ERROR: Set DB_PASSWORD environment variable before running.")
        print("Example: set DB_PASSWORD=your_password && py scripts/import_breeds_to_db.py")
        sys.exit(1)

    breeds = load_breeds()
    print(f"Loaded {len(breeds)} breeds from {DATA_FILE.relative_to(ROOT)}")

    conn = psycopg2.connect(**DB_CONFIG)
    try:
        with conn:
            with conn.cursor() as cur:
                print("Creating breed table if not exists...")
                create_table(cur)

                print("Importing breeds...")
                import_breeds(cur, breeds)

                cur.execute("SELECT COUNT(*) FROM breed")
                total = cur.fetchone()[0]
                cur.execute("SELECT type, COUNT(*) FROM breed GROUP BY type ORDER BY type")
                by_type = cur.fetchall()

        print("Done.")
        print(f"breed table total rows: {total}")
        for pet_type, count in by_type:
            print(f"  {pet_type}: {count}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
