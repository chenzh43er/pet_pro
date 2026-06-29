"""Fetch breed detail pages and merge into a database-ready JSON."""
import html as html_lib
import json
import re
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "breeds"
IMG_DIR = ROOT / "img" / "breed"
BASE = "https://www.findpawpal.com"

LIST_FILES = [
    ("cat", DATA_DIR / "cat-breeds.json"),
    ("dog", DATA_DIR / "dog-breeds.json"),
]
OUTPUT_FILE = DATA_DIR / "breeds-all.json"


def fetch_url(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8", errors="replace")


def download_file(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        return
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        dest.write_bytes(resp.read())


def image_filename_from_url(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    name = Path(parsed.path).stem
    ext = ".webp" if "f=webp" in (parsed.query or "") else Path(parsed.path).suffix or ".jpg"
    return f"{name}{ext}"


def localize_image(url: str, cache: dict) -> str:
    if not url:
        return ""
    if url in cache:
        return cache[url]
    filename = image_filename_from_url(url)
    dest = IMG_DIR / filename
    try:
        download_file(url, dest)
        local = f"./img/breed/{filename}"
        cache[url] = local
    except Exception as exc:
        print(f"    WARN image: {exc}")
        cache[url] = url
    return cache[url]


def clean_text(raw: str) -> str:
    text = re.sub(r"<br\s*/?>", "\n", raw, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    text = html_lib.unescape(text)
    text = text.replace("\xa0", " ")
    return re.sub(r"\s+", " ", text).strip()


def to_snake_key(label: str) -> str:
    key = re.sub(r"[^a-zA-Z0-9]+", "_", label.strip().lower())
    return key.strip("_")


def extract_table(html: str) -> dict:
    table_m = re.search(
        r'(?s)<table[^>]*class="animal-table"[^>]*>(.*?)</table>',
        html,
    )
    if not table_m:
        return {}
    rows = {}
    for label, value in re.findall(
        r"(?s)<tr>\s*<td>([^<]+)</td>\s*<td>(.*?)</td>\s*</tr>",
        table_m.group(1),
    ):
        rows[to_snake_key(label)] = clean_text(value)
    return rows


def extract_section_items(html: str, section_title: str) -> dict:
    section_m = re.search(
        rf'(?s)<h3[^>]*>\s*{re.escape(section_title)}\s*</h3>(.*?)(?:<h3[^>]*>|$)',
        html,
        re.I,
    )
    if not section_m:
        return {}
    block = section_m.group(1)
    items = {}
    for label, value in re.findall(
        r'(?s)<span class="about-text">([^<]+)</span>\s*</div>\s*<div class="about-des">(.*?)</div>',
        block,
    ):
        items[to_snake_key(label)] = clean_text(value)
    return items


def extract_about_blocks(html: str) -> list[dict]:
    profile = extract_section_items(html, "Profile")
    upkeep = extract_section_items(html, "Upkeep")
    blocks = []
    if profile:
        blocks.append(profile)
    if upkeep:
        blocks.append(upkeep)
    return blocks


def extract_introduction(html: str) -> str:
    for block_m in re.finditer(r'(?s)<div class="animal-sampson([^"]*)">(.*?)</div>', html):
        classes = block_m.group(1)
        if "helpful" in classes:
            continue
        paragraphs = [
            clean_text(p)
            for p in re.findall(r"<p>(.*?)</p>", block_m.group(2), re.DOTALL)
            if clean_text(p)
        ]
        if paragraphs:
            return "\n\n".join(paragraphs)
    return ""


def extract_helpful_info(html: str) -> list[dict]:
    helpful_m = re.search(
        r'(?s)<div class="animal-sampson helpful">(.*?)</div>',
        html,
    )
    if not helpful_m:
        return []
    items = []
    for label, value in re.findall(
        r"<li><span>([^<:]+):?\s*</span>(.*?)</li>",
        helpful_m.group(1),
        re.DOTALL,
    ):
        items.append({
            "label": clean_text(label),
            "value": clean_text(value),
        })
    return items


def extract_detail_image(html: str) -> str:
    img_m = re.search(
        r'(?:data-src|src)="(https://cdn\.findpawpal\.com/breed/[^"]+)"',
        html,
    )
    return html_lib.unescape(img_m.group(1)) if img_m else ""


def extract_meta_description(html: str) -> str:
    m = re.search(r'<meta name="description" content="([^"]*)"', html)
    return html_lib.unescape(m.group(1)) if m else ""


def parse_detail_page(html: str) -> dict:
    about_blocks = extract_about_blocks(html)
    profile = about_blocks[0] if len(about_blocks) > 0 else {}
    upkeep = about_blocks[1] if len(about_blocks) > 1 else {}

    return {
        "summary": extract_table(html),
        "profile": profile,
        "upkeep": upkeep,
        "introduction": extract_introduction(html),
        "helpfulInfo": extract_helpful_info(html),
        "metaDescription": extract_meta_description(html),
        "detailImageUrl": extract_detail_image(html),
    }


def breed_key(item: dict) -> str:
    return f"{item['type']}:{item['slug']}"


def load_existing() -> dict:
    if not OUTPUT_FILE.exists():
        return {"meta": {}, "breeds": []}
    data = json.loads(OUTPUT_FILE.read_text(encoding="utf-8"))
    if "breeds" not in data:
        data["breeds"] = []
    return data


def save_output(data: dict) -> None:
    OUTPUT_FILE.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def merge_breed(list_item: dict, detail: dict, img_cache: dict) -> dict:
    detail_image_url = detail.get("detailImageUrl") or list_item.get("imageUrl", "")
    detail_image = localize_image(detail_image_url, img_cache) if detail_image_url else list_item.get("image", "")

    return {
        "slug": list_item["slug"],
        "name": list_item["name"],
        "type": list_item["type"],
        "url": list_item["url"],
        "path": list_item["path"],
        "listFeatures": list_item.get("features", []),
        "listImage": list_item.get("image", ""),
        "listImageUrl": list_item.get("imageUrl", ""),
        "detailImage": detail_image,
        "detailImageUrl": detail_image_url,
        "alt": list_item.get("alt", list_item["name"]),
        "metaDescription": detail.get("metaDescription", ""),
        "summary": detail.get("summary", {}),
        "profile": detail.get("profile", {}),
        "upkeep": detail.get("upkeep", {}),
        "introduction": detail.get("introduction", ""),
        "helpfulInfo": detail.get("helpfulInfo", []),
    }


def load_list_items() -> list[dict]:
    items = []
    for pet_type, path in LIST_FILES:
        if not path.exists():
            print(f"WARN missing {path}")
            continue
        rows = json.loads(path.read_text(encoding="utf-8"))
        for row in rows:
            row["type"] = pet_type
            items.append(row)
    return items


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    IMG_DIR.mkdir(parents=True, exist_ok=True)

    list_items = load_list_items()
    data = load_existing()
    done = {breed_key(b) for b in data["breeds"]}
    img_cache: dict = {}

    print(f"Total breeds to process: {len(list_items)}")
    print(f"Already done: {len(done)}")

    for i, item in enumerate(list_items, 1):
        key = breed_key(item)
        if key in done:
            continue

        print(f"[{i}/{len(list_items)}] {item['type']} / {item['slug']}")
        try:
            html = fetch_url(item["url"])
            detail = parse_detail_page(html)
            merged = merge_breed(item, detail, img_cache)
            data["breeds"].append(merged)
            done.add(key)

            cat_count = sum(1 for b in data["breeds"] if b["type"] == "cat")
            dog_count = sum(1 for b in data["breeds"] if b["type"] == "dog")
            data["meta"] = {
                "generatedAt": datetime.now(timezone.utc).isoformat(),
                "source": BASE,
                "total": len(data["breeds"]),
                "catCount": cat_count,
                "dogCount": dog_count,
            }
            save_output(data)
        except Exception as exc:
            print(f"  ERROR: {exc}")

        time.sleep(0.35)

    data["breeds"].sort(key=lambda b: (b["type"], b["name"].lower()))
    cat_count = sum(1 for b in data["breeds"] if b["type"] == "cat")
    dog_count = sum(1 for b in data["breeds"] if b["type"] == "dog")
    data["meta"] = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": BASE,
        "total": len(data["breeds"]),
        "catCount": cat_count,
        "dogCount": dog_count,
    }
    save_output(data)
    print(f"\nSaved {len(data['breeds'])} breeds -> {OUTPUT_FILE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
