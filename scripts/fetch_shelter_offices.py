"""Fetch shelter offices per city from findpawpal.com/animal-shelter/{state}/{city}/."""
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
CITIES_DIR = DATA_DIR / "cities"
OFFICES_DIR = DATA_DIR / "offices"
BASE = "https://www.findpawpal.com"
DELAY_SEC = 0.35
OFFICE_ID_RE = re.compile(r"-(\d+)$")
IMAGE_ID_RE = re.compile(r"/office/(\d+)\.")


def safe_print(*args, **kwargs) -> None:
    """Print safely on Windows consoles that use GBK."""
    text = " ".join(str(a) for a in args)
    end = kwargs.get("end", "\n")
    flush = kwargs.get("flush", False)
    try:
        print(text, end=end, flush=flush)
    except UnicodeEncodeError:
        enc = sys.stdout.encoding or "utf-8"
        print(text.encode(enc, errors="replace").decode(enc), end=end, flush=flush)


def write_json_atomic(path: Path, payload: dict) -> None:
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    tmp.replace(path)


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


def parse_office_id(slug: str, image: str = "") -> Optional[int]:
    m = OFFICE_ID_RE.search(slug or "")
    if m:
        return int(m.group(1))
    if image:
        im = IMAGE_ID_RE.search(image)
        if im:
            return int(im.group(1))
    return None


def extract_city_label(html: str) -> str:
    m = re.search(r"<h1[^>]*>\s*Animal Shelters in\s+([^<]+?)\s*</h1>", html, re.I)
    return m.group(1).strip() if m else ""


def extract_offices(html: str) -> list[dict]:
    block_m = re.search(r'<ul class="store-list-wrap">(.*?)</ul>', html, re.S)
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
        img_m = re.search(
            r'(?:data-src|src)="(https://cdn\.findpawpal\.com/office/[^"]+)"',
            chunk,
        )
        addr_m = re.search(
            r'class="store-location"[\s\S]*?<span>([^<]+)</span>',
            chunk,
        )
        tel_m = re.search(
            r'class="store-tel"[\s\S]*?<span>([^<]+)</span>',
            chunk,
        )

        image = img_m.group(1) if img_m else ""
        if image and "f=webp" not in image:
            image = image + ("&" if "?" in image else "?") + "f=webp&w=730"

        slug = slug_from_href(href)
        offices.append(
            {
                "officeId": parse_office_id(slug, image),
                "slug": slug,
                "name": name_m.group(1).strip(),
                "address": addr_m.group(1).strip() if addr_m else "",
                "phone": tel_m.group(1).strip() if tel_m else "",
                "image": image,
                "url": href if href.startswith("http") else BASE + href,
            }
        )
    return offices


def fetch_city_offices(state_slug: str, city_slug: str, state_name: str = "", city_name: str = "") -> dict:
    url = f"{BASE}/animal-shelter/{state_slug}/{city_slug}/"
    html = fetch_url(url)
    label = extract_city_label(html) or city_name or city_slug.replace("-", " ").title()
    return {
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "state": {"slug": state_slug, "name": state_name},
        "city": {"slug": city_slug, "name": city_name or label.split(",")[0].strip(), "label": label},
        "source": url,
        "offices": extract_offices(html),
    }


def iter_city_targets(state_filter: Optional[str], city_filter: Optional[str]):
    states_path = DATA_DIR / "states.json"
    if not states_path.exists():
        raise SystemExit("Missing data/shelters/states.json — run fetch_shelter_cities.py first")

    index = json.loads(states_path.read_text(encoding="utf-8"))
    for state in index["states"]:
        if state_filter and state["slug"] != state_filter:
            continue
        cities_path = DATA_DIR / state["citiesFile"]
        if not cities_path.exists():
            continue
        cities_data = json.loads(cities_path.read_text(encoding="utf-8"))
        for city in cities_data.get("cities", []):
            if city_filter and city["slug"] != city_filter:
                continue
            yield state, city


def main() -> None:
    state_filter = None
    city_filter = None
    skip_existing = "--skip-existing" in sys.argv
    for arg in sys.argv[1:]:
        if arg.startswith("--state="):
            state_filter = arg.split("=", 1)[1]
        elif arg.startswith("--city="):
            city_filter = arg.split("=", 1)[1]

    targets = list(iter_city_targets(state_filter, city_filter))
    if not targets:
        raise SystemExit("No city targets found")

    safe_print(f"Fetching offices for {len(targets)} cities...")
    for state, city in targets:
        out_dir = OFFICES_DIR / state["slug"]
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / f"{city['slug']}.json"
        if skip_existing and out_path.exists():
            safe_print(f"Skip {state['slug']}/{city['slug']} (exists)")
            continue

        safe_print(f"Fetching {state['name']}/{city['name']}...", end=" ", flush=True)
        time.sleep(DELAY_SEC)
        try:
            payload = fetch_city_offices(
                state["slug"],
                city["slug"],
                state["name"],
                city["name"],
            )
            write_json_atomic(out_path, payload)
            safe_print(f"{len(payload['offices'])} offices")
        except Exception as exc:
            safe_print(f"FAILED: {exc}")

    safe_print("Done.")
    try:
        import subprocess
        build_script = Path(__file__).resolve().parent / "build_shelters_index.py"
        safe_print("Rebuilding shelters.json index...")
        subprocess.run([sys.executable, str(build_script)], check=True)
    except Exception as exc:
        safe_print(f"Index rebuild skipped/failed: {exc}")


if __name__ == "__main__":
    main()
