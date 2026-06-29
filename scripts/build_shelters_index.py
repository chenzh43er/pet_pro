"""Merge per-city office JSON into a flat shelters index for database import."""
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "shelters"
OFFICES_DIR = DATA_DIR / "offices"
ITEMS_DIR = DATA_DIR / "items"

OFFICE_ID_RE = re.compile(r"-(\d+)$")
IMAGE_ID_RE = re.compile(r"/office/(\d+)\.")


def parse_office_id(slug: str, image: str = "") -> Optional[int]:
    m = OFFICE_ID_RE.search(slug or "")
    if m:
        return int(m.group(1))
    if image:
        im = IMAGE_ID_RE.search(image)
        if im:
            return int(im.group(1))
    return None


def parse_address_parts(address: str) -> dict:
    """Best-effort: 'street, City, ST 12345' -> components."""
    if not address:
        return {"street": "", "city": "", "state_code": "", "zip": ""}
    parts = [p.strip() for p in address.split(",")]
    street = parts[0] if parts else ""
    city = parts[1] if len(parts) > 1 else ""
    state_zip = parts[2] if len(parts) > 2 else ""
    state_code = ""
    zip_code = ""
    if state_zip:
        tokens = state_zip.split()
        if tokens:
            state_code = tokens[0]
        if len(tokens) > 1:
            zip_code = tokens[1]
    return {
        "street": street,
        "city": city,
        "state_code": state_code,
        "zip": zip_code,
    }


def normalize_shelter_record(office: dict, state: dict, city: dict, source_city_url: str, fetched_at: str) -> dict:
    slug = office.get("slug", "")
    image = office.get("image", "")
    office_id = parse_office_id(slug, image)
    addr_parts = parse_address_parts(office.get("address", ""))
    image = office.get("image", "")
    image_url = office.get("imageUrl", "")
    if not image_url and image.startswith("http"):
        image_url = image

    return {
        "officeId": office_id,
        "slug": slug,
        "name": office.get("name", ""),
        "address": office.get("address", ""),
        "street": addr_parts["street"],
        "addressCity": addr_parts["city"] or city.get("name", ""),
        "stateCode": addr_parts["state_code"],
        "zip": addr_parts["zip"],
        "phone": office.get("phone", ""),
        "image": image,
        "imageUrl": image_url,
        "url": office.get("url", ""),
        "stateSlug": state.get("slug", ""),
        "stateName": state.get("name", ""),
        "citySlug": city.get("slug", ""),
        "cityName": city.get("name", ""),
        "cityLabel": city.get("label", ""),
        "sourceCityUrl": source_city_url,
        "fetchedAt": fetched_at,
    }


def main() -> None:
    if not OFFICES_DIR.exists():
        raise SystemExit(f"Missing {OFFICES_DIR} — run fetch_shelter_offices.py first")

    ITEMS_DIR.mkdir(parents=True, exist_ok=True)

    by_slug: dict[str, dict] = {}
    city_files = sorted(OFFICES_DIR.rglob("*.json"))
    empty_cities = 0

    for path in city_files:
        payload = json.loads(path.read_text(encoding="utf-8"))
        state = payload.get("state") or {}
        city = payload.get("city") or {}
        source = payload.get("source", "")
        fetched_at = payload.get("fetchedAt", "")
        offices = payload.get("offices") or []

        if not offices:
            empty_cities += 1

        for office in offices:
            record = normalize_shelter_record(office, state, city, source, fetched_at)
            if not record["slug"]:
                continue
            # Keep first seen; city context is from listing page
            if record["slug"] not in by_slug:
                by_slug[record["slug"]] = record

    shelters = sorted(by_slug.values(), key=lambda r: (r["stateSlug"], r["citySlug"], r["name"]))

    index = {
        "schemaVersion": 1,
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "source": "https://www.findpawpal.com/animal-shelter/",
        "description": "Flat index of animal shelters scraped from state/city listing pages.",
        "stats": {
            "cityFiles": len(city_files),
            "emptyCityFiles": empty_cities,
            "uniqueShelters": len(shelters),
        },
        "shelters": shelters,
    }

    out_path = DATA_DIR / "shelters.json"
    out_path.write_text(json.dumps(index, indent=2), encoding="utf-8")
    print(f"Wrote {out_path} ({len(shelters)} shelters from {len(city_files)} city files)")

    for record in shelters:
        item_path = ITEMS_DIR / f"{record['slug']}.json"
        item_path.write_text(json.dumps(record, indent=2), encoding="utf-8")
    print(f"Wrote {len(shelters)} files under {ITEMS_DIR}")


if __name__ == "__main__":
    main()
