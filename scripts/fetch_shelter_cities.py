"""Fetch US states and cities from findpawpal.com/animal-shelter/."""
import json
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "shelters"
CITIES_DIR = DATA_DIR / "cities"
BASE = "https://www.findpawpal.com"
DELAY_SEC = 0.4


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


def extract_category_items(html: str) -> list[dict]:
    list_m = re.search(r'<ul class="category-wrap">(.*?)</ul>', html, re.S)
    if not list_m:
        return []

    block = list_m.group(1)
    pattern = re.compile(
        r'<li class="category-item only-text category">(.*?)</li>',
        re.S,
    )
    items = []
    for chunk in pattern.findall(block):
        href_m = re.search(r'<a href="([^"]+)" class="link-cover"></a>', chunk)
        name_m = re.search(r'<a href="[^"]+">([^<]+)</a>', chunk)
        num_m = re.search(r'<span class="category-num category">(\d+)</span>', chunk)
        unit_m = re.search(r'<span class="category-unit category">([^<]+)</span>', chunk)
        if not (href_m and name_m and num_m):
            continue
        href = href_m.group(1)
        items.append(
            {
                "slug": slug_from_href(href),
                "name": name_m.group(1).strip(),
                "offices": int(num_m.group(1)),
                "unit": unit_m.group(1).strip() if unit_m else "Offices",
                "url": href if href.startswith("http") else BASE + href,
            }
        )
    return items


def fetch_states() -> list[dict]:
    html = fetch_url(f"{BASE}/animal-shelter/")
    states = extract_category_items(html)
    if not states:
        raise RuntimeError("No states found on /animal-shelter/")
    return states


def fetch_cities(state_slug: str) -> list[dict]:
    html = fetch_url(f"{BASE}/animal-shelter/{state_slug}/")
    return extract_category_items(html)


def main() -> None:
    only_state = None
    skip_existing = "--skip-existing" in sys.argv
    for arg in sys.argv[1:]:
        if arg.startswith("--state="):
            only_state = arg.split("=", 1)[1]

    CITIES_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Fetching states from {BASE}/animal-shelter/")
    states = fetch_states()
    print(f"Found {len(states)} states")

    index = {
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "source": f"{BASE}/animal-shelter/",
        "states": [
            {
                "slug": s["slug"],
                "name": s["name"],
                "offices": s["offices"],
                "unit": s["unit"],
                "url": s["url"],
                "citiesFile": f"cities/{s['slug']}.json",
            }
            for s in states
        ],
    }
    states_path = DATA_DIR / "states.json"
    states_path.write_text(json.dumps(index, indent=2), encoding="utf-8")
    print(f"Wrote {states_path}")

    targets = [s for s in index["states"] if s["slug"] == only_state] if only_state else index["states"]
    if only_state and not targets:
        raise SystemExit(f"State not found: {only_state}")

    for state in targets:
        out_path = CITIES_DIR / f"{state['slug']}.json"
        if skip_existing and out_path.exists():
            print(f"Skip {state['slug']} (exists)")
            continue

        print(f"Fetching cities: {state['name']} ({state['slug']})...", end=" ", flush=True)
        time.sleep(DELAY_SEC)
        try:
            cities = fetch_cities(state["slug"])
            payload = {
                "fetchedAt": datetime.now(timezone.utc).isoformat(),
                "state": {
                    "slug": state["slug"],
                    "name": state["name"],
                    "offices": state["offices"],
                },
                "source": f"{BASE}/animal-shelter/{state['slug']}/",
                "cities": cities,
            }
            out_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
            print(f"{len(cities)} cities")
        except Exception as exc:
            print(f"FAILED: {exc}")

    print("Done.")


if __name__ == "__main__":
    main()
