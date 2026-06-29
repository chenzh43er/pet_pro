"""Fetch name detail pages and merge origin into name JSON files."""
import html as html_lib
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def log(message: str) -> None:
    text = f"{message}\n"
    try:
        sys.stdout.write(text)
        sys.stdout.flush()
    except UnicodeEncodeError:
        sys.stdout.buffer.write(text.encode("utf-8", errors="replace"))
        sys.stdout.buffer.flush()

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "names"
BASE = "https://www.findpawpal.com"

LIST_FILES = [
    ("dog", DATA_DIR / "dog-names.json"),
    ("cat", DATA_DIR / "cat-names.json"),
]
OUTPUT_FILE = DATA_DIR / "names-all.json"


def fetch_url(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    safe_path = urllib.parse.quote(parsed.path, safe="/:%")
    safe_url = urllib.parse.urlunparse(parsed._replace(path=safe_path))
    req = urllib.request.Request(safe_url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8", errors="replace")


def clean_text(raw: str) -> str:
    text = re.sub(r"<[^>]+>", "", raw)
    text = html_lib.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def parse_detail_page(html: str) -> dict:
    meaning_m = re.search(
        r'(?s)<div class="name-feature-key">MEANING</div>\s*'
        r'<div class="name-feature-value">\s*(.*?)\s*</div>',
        html,
    )
    origin_m = re.search(
        r'(?s)<div class="name-feature-key">ORIGIN</div>\s*'
        r'<div class="name-feature-value">\s*(.*?)\s*</div>',
        html,
    )
    next_m = re.search(
        r'(?s)<a class="name-next-href" href="([^"]+)"',
        html,
    )
    gender_m = re.search(
        r'(?s)<h1[^>]*>.*?<svg class="icon-(boy|girl|unisex)">',
        html,
    )

    next_slug = ""
    if next_m:
        next_slug = next_m.group(1).strip("/").split("/")[-1]

    return {
        "meaning": clean_text(meaning_m.group(1)) if meaning_m else "",
        "origin": clean_text(origin_m.group(1)) if origin_m else "",
        "gender": gender_m.group(1) if gender_m else "",
        "nextSlug": next_slug,
    }


def name_key(item: dict) -> str:
    return f"{item['type']}:{item['slug']}"


def load_list_items() -> list[dict]:
    items = []
    for pet_type, path in LIST_FILES:
        if not path.exists():
            log(f"WARN missing {path}")
            continue
        rows = json.loads(path.read_text(encoding="utf-8"))
        for row in rows:
            row["type"] = pet_type
            items.append(row)
    return items


def save_json(path: Path, data) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    list_items = load_list_items()
    if not list_items:
        log("No name list files found. Run scripts/fetch_names.py first.")
        return

    by_type = {"dog": [], "cat": []}
    for item in list_items:
        by_type[item["type"]].append(item)

    merged_all = []
    total = len(list_items)
    log(f"Total names to process: {total}")

    for idx, item in enumerate(list_items, 1):
        if item.get("origin"):
            merged_all.append(item)
            continue

        log(f"[{idx}/{total}] {item['type']} / {item['slug']}")
        try:
            html = fetch_url(item["url"])
            detail = parse_detail_page(html)
            if detail["meaning"]:
                item["meaning"] = detail["meaning"]
            if detail["origin"]:
                item["origin"] = detail["origin"]
            if detail["gender"]:
                item["gender"] = detail["gender"]
            if detail["nextSlug"]:
                item["nextSlug"] = detail["nextSlug"]
        except Exception as exc:
            log(f"  ERROR: {exc}")

        merged_all.append(item)

        if idx % 25 == 0:
            for pet_type, path in LIST_FILES:
                save_json(path, by_type[pet_type])

        time.sleep(0.35)

    for pet_type, path in LIST_FILES:
        save_json(path, by_type[pet_type])
        log(f"Updated {len(by_type[pet_type])} {pet_type} names -> {path.relative_to(ROOT)}")

    merged_all.sort(key=lambda item: (item["type"], item["name"].lower()))
    cat_count = sum(1 for item in merged_all if item["type"] == "cat")
    dog_count = sum(1 for item in merged_all if item["type"] == "dog")
    output = {
        "meta": {
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "source": BASE,
            "total": len(merged_all),
            "catCount": cat_count,
            "dogCount": dog_count,
        },
        "names": merged_all,
    }
    save_json(OUTPUT_FILE, output)
    log(f"Saved merged database -> {OUTPUT_FILE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
