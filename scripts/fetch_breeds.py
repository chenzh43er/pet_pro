"""Fetch dog/cat breed listings from findpawpal.com with pagination."""
import html as html_lib
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "img" / "breed"
DATA_DIR = ROOT / "data" / "breeds"
BASE = "https://www.findpawpal.com"

BREED_LISTS = [
    {
        "type": "cat",
        "path": "/cat-breed/",
        "index_file": "cat-breeds.json",
    },
    {
        "type": "dog",
        "path": "/dog-breed/",
        "index_file": "dog-breeds.json",
    },
]


def fetch_url(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8", errors="replace")


def download_file(url: str, dest: Path) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        return dest
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        dest.write_bytes(resp.read())
    return dest


def full_url(path: str) -> str:
    if path.startswith("http"):
        return path
    return BASE + path


def slug_from_href(href: str) -> str:
    return href.strip("/").split("/")[-1]


def image_filename_from_url(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    name = Path(parsed.path).stem
    ext = ".webp" if "f=webp" in (parsed.query or "") else Path(parsed.path).suffix or ".jpg"
    return f"{name}{ext}"


def extract_total_count(html: str):
    m = re.search(r"(\d+)\s+(?:dog|cat)\s+breeds", html, re.I)
    return int(m.group(1)) if m else None


def extract_items(html: str) -> list[dict]:
    block_m = re.search(r'(?s)<div class="adoption-con">(.*?)</div>\s*<div class="page-wrap">', html)
    if not block_m:
        block_m = re.search(r'(?s)<div class="adoption-con">(.*?)</div>\s*</div>\s*<div class="page-wrap">', html)
    if not block_m:
        return []

    block = block_m.group(1)
    items = []
    pattern = re.compile(
        r'(?s)<div class="adoption-item">'
        r'.*?<a class="link-cover" href="([^"]+)"'
        r'.*?(?:data-src|src)="(https://cdn\.findpawpal\.com/breed/[^"]+)"'
        r'.*?alt="([^"]*)"'
        r'.*?<div class="info-name">([^<]+)</div>'
        r'.*?<div class="info-feature">(.*?)</div>'
    )
    for item_m in pattern.finditer(block):
        href = item_m.group(1)
        img_url = html_lib.unescape(item_m.group(2))
        alt = html_lib.unescape(item_m.group(3))
        name = html_lib.unescape(item_m.group(4).strip())
        feature_html = item_m.group(5)
        features = [
            html_lib.unescape(s.strip())
            for s in re.findall(r"<span>([^<]+)</span>", feature_html)
        ]

        items.append({
            "href": href,
            "name": name,
            "alt": alt or name,
            "imageUrl": img_url,
            "features": features,
        })
    return items


def localize_image(url: str, cache: dict[str, str]) -> str:
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
        print(f"  img: {local}")
    except Exception as exc:
        print(f"  WARN download failed {url}: {exc}")
        cache[url] = url
    return cache[url]


def fetch_breed_list(config: dict, cache: dict[str, str]) -> list[dict]:
    list_path = config["path"]
    pet_type = config["type"]
    print(f"\n=== {pet_type.upper()} breeds ===")

    first_url = full_url(list_path)
    first_html = fetch_url(first_url)
    expected_total = extract_total_count(first_html)
    if expected_total:
        print(f"Expected total: {expected_total}")

    seen_hrefs: set[str] = set()
    breeds: list[dict] = []
    page = 1

    while True:
        page_url = first_url if page == 1 else full_url(f"{list_path}?page={page}")
        print(f"Fetching page {page}: {page_url}")
        html = first_html if page == 1 else fetch_url(page_url)
        items = extract_items(html)
        print(f"  found {len(items)} items")

        if not items:
            break

        new_on_page = 0
        for item in items:
            href = item["href"]
            if href in seen_hrefs:
                continue
            seen_hrefs.add(href)
            new_on_page += 1

            slug = slug_from_href(href)
            local_image = localize_image(item["imageUrl"], cache)
            breeds.append({
                "slug": slug,
                "name": item["name"],
                "type": pet_type,
                "url": full_url(href),
                "path": href if href.startswith("/") else f"/{href}",
                "features": item["features"],
                "listImage": local_image,
                "listImageUrl": item["imageUrl"],
                "alt": item["alt"],
            })

        if expected_total and len(breeds) >= expected_total:
            break
        if new_on_page == 0:
            break

        page += 1
        time.sleep(0.4)

    breeds.sort(key=lambda b: b["name"].lower())
    return breeds


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    cache: dict[str, str] = {}

    all_index = {}
    for config in BREED_LISTS:
        breeds = fetch_breed_list(config, cache)
        out = DATA_DIR / config["index_file"]
        out.write_text(json.dumps(breeds, ensure_ascii=False, indent=2), encoding="utf-8")
        all_index[config["type"]] = {
            "count": len(breeds),
            "file": config["index_file"],
        }
        print(f"Saved {len(breeds)} {config['type']} breeds -> {out.relative_to(ROOT)}")

    (DATA_DIR / "index.json").write_text(
        json.dumps(all_index, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"\nDone. Images in {IMG_DIR.relative_to(ROOT)}/")


if __name__ == "__main__":
    main()
