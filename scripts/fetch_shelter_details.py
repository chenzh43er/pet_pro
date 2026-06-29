"""Fetch individual shelter detail pages (map embed, description, nearby shelters)."""
import json
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "shelters"
DETAILS_DIR = DATA_DIR / "details"
BASE = "https://www.findpawpal.com"
DELAY_SEC = 0.35


def fetch_url(url: str, retries: int = 3) -> str:
    last_err = None
    for attempt in range(retries):
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                return resp.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError as exc:
            last_err = exc
            if exc.code in (403, 429, 503) and attempt < retries - 1:
                time.sleep(1.5 * (attempt + 1))
                continue
            raise
    raise last_err


def slug_from_href(href: str) -> str:
    return href.rstrip("/").split("/")[-1]


def extract_nearby_offices(html: str) -> list[dict]:
    block_m = re.search(r'<ul class="store-list-wrap common">(.*?)</ul>', html, re.S)
    if not block_m:
        return []

    offices = []
    item_re = re.compile(r'<li class="store-list-item">(.*?)</li>', re.S)
    for chunk in item_re.findall(block_m.group(1)):
        href_m = re.search(r'<a href="([^"]+)" class="link-cover">', chunk)
        name_m = re.search(r'<div class="store-slug"><a[^>]*>([^<]+)</a>', chunk)
        if not (href_m and name_m):
            continue
        href = href_m.group(1)
        addr_m = re.search(r'class="store-location"[\s\S]*?<span>([^<]+)</span>', chunk)
        tel_m = re.search(r'class="store-tel"[\s\S]*?<span>([^<]+)</span>', chunk)
        offices.append(
            {
                "slug": slug_from_href(href),
                "name": name_m.group(1).strip(),
                "address": addr_m.group(1).strip() if addr_m else "",
                "phone": tel_m.group(1).strip() if tel_m else "",
                "url": href if href.startswith("http") else BASE + href,
            }
        )
    return offices


def extract_detail(html: str, url: str) -> dict:
    desc_m = re.search(r'<p class="category-des">([^<]*)</p>', html)
    map_m = re.search(r'<iframe[^>]+src="([^"]+)"', html)
    info_m = re.search(r'<ul class="store-info">(.*?)</ul>', html, re.S)

    name = ""
    address = ""
    phone = ""
    if info_m:
        items = re.findall(r'<li[^>]*>([^<]+)</li>', info_m.group(1))
        if items:
            name = items[0].strip()
        if len(items) > 1:
            address = items[1].strip()
        if len(items) > 2:
            phone = items[2].strip()

    return {
        "name": name,
        "address": address,
        "phone": phone,
        "description": desc_m.group(1).strip() if desc_m else "",
        "mapEmbedUrl": map_m.group(1) if map_m else "",
        "nearbyShelters": extract_nearby_offices(html),
        "source": url,
    }


def iter_shelter_targets(shelters_path: Path, slug_filter: Optional[str]) -> list[dict]:
    data = json.loads(shelters_path.read_text(encoding="utf-8"))
    shelters = data.get("shelters") or []
    if slug_filter:
        shelters = [s for s in shelters if s.get("slug") == slug_filter]
    return shelters


def main() -> None:
    skip_existing = "--skip-existing" in sys.argv
    slug_filter = None
    for arg in sys.argv[1:]:
        if arg.startswith("--slug="):
            slug_filter = arg.split("=", 1)[1]

    shelters_path = DATA_DIR / "shelters.json"
    if not shelters_path.exists():
        raise SystemExit("Missing data/shelters/shelters.json — run build_shelters_index.py first")

    targets = iter_shelter_targets(shelters_path, slug_filter)
    if not targets:
        raise SystemExit("No shelter targets found")

    DETAILS_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Fetching details for {len(targets)} shelters...")

    for shelter in targets:
        slug = shelter.get("slug", "")
        url = shelter.get("url", "")
        if not slug or not url:
            continue
        out_path = DETAILS_DIR / f"{slug}.json"
        if skip_existing and out_path.exists():
            print(f"Skip {slug} (exists)")
            continue

        print(f"Fetching {slug}...", end=" ", flush=True)
        time.sleep(DELAY_SEC)
        try:
            html = fetch_url(url)
            detail = extract_detail(html, url)
            payload = {
                "fetchedAt": datetime.now(timezone.utc).isoformat(),
                "slug": slug,
                "officeId": shelter.get("officeId"),
                **detail,
            }
            out_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
            print(f"ok ({len(detail['nearbyShelters'])} nearby)")
        except Exception as exc:
            print(f"FAILED: {exc}")

    print("Done.")


if __name__ == "__main__":
    main()
