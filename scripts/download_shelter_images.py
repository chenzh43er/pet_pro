"""Download shelter office images to img/shelter/office/ and update JSON paths."""
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
IMG_DIR = ROOT / "img" / "shelter" / "office"
OFFICES_DIR = DATA_DIR / "offices"
ITEMS_DIR = DATA_DIR / "items"
SHELTERS_PATH = DATA_DIR / "shelters.json"
FAILURES_PATH = DATA_DIR / "image_download_failures.json"

OFFICE_ID_RE = re.compile(r"-(\d+)$")
IMAGE_ID_RE = re.compile(r"/office/(\d+)\.")
DELAY_SEC = 0.15
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def safe_print(*args, **kwargs) -> None:
    text = " ".join(str(a) for a in args)
    end = kwargs.get("end", "\n")
    flush = kwargs.get("flush", False)
    try:
        print(text, end=end, flush=flush)
    except UnicodeEncodeError:
        enc = sys.stdout.encoding or "utf-8"
        print(text.encode(enc, errors="replace").decode(enc), end=end, flush=flush)


def parse_office_id(slug: str, image: str = "") -> Optional[int]:
    m = OFFICE_ID_RE.search(slug or "")
    if m:
        return int(m.group(1))
    if image:
        im = IMAGE_ID_RE.search(image)
        if im:
            return int(im.group(1))
    return None


def remote_image_url(url: str) -> str:
    if not url or url.startswith("./"):
        return ""
    if "f=webp" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}f=webp&w=730"
    return url


def url_variants(office_id: int, primary: str) -> list[str]:
    urls = []
    if primary:
        urls.append(primary)
    base = f"https://cdn.findpawpal.com/office/{office_id}.jpg"
    for variant in (
        f"{base}?f=webp&w=730",
        f"{base}?w=730",
        base,
    ):
        if variant not in urls:
            urls.append(variant)
    return urls


def download_file(url: str, dest: Path, retries: int = 3) -> tuple[bool, str]:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        return True, ""

    last_err = ""
    for attempt in range(retries):
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": UA,
                "Referer": "https://www.findpawpal.com/",
                "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = resp.read()
            if not data:
                last_err = "empty response"
                continue
            dest.write_bytes(data)
            return True, ""
        except urllib.error.HTTPError as exc:
            last_err = f"HTTP {exc.code}"
            if exc.code in (403, 404):
                return False, last_err
            if exc.code in (429, 503) and attempt < retries - 1:
                time.sleep(2.0 * (attempt + 1))
                continue
            return False, last_err
        except Exception as exc:
            last_err = str(exc)
            if attempt < retries - 1:
                time.sleep(1.0 * (attempt + 1))
                continue
            return False, last_err
    return False, last_err


def download_office_image(office_id: int, remote: str, dest: Path) -> tuple[bool, str]:
    for url in url_variants(office_id, remote):
        ok, err = download_file(url, dest)
        if ok:
            return True, ""
        if err in ("HTTP 403", "HTTP 404"):
            continue
        return False, err
    return False, "HTTP 403"


def write_json_atomic(path: Path, payload: dict) -> None:
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    tmp.replace(path)


def load_shelters() -> list[dict]:
    if not SHELTERS_PATH.exists():
        raise SystemExit(f"Missing {SHELTERS_PATH}")
    return json.loads(SHELTERS_PATH.read_text(encoding="utf-8")).get("shelters") or []


def apply_image_updates(updates: dict[int, dict], state_slug: Optional[str] = None) -> None:
    if not updates:
        return

    if state_slug:
        office_paths = sorted((OFFICES_DIR / state_slug).glob("*.json"))
        label = f"{state_slug} office JSON files"
    else:
        office_paths = sorted(OFFICES_DIR.rglob("*.json"))
        label = "office JSON files"

    office_files = 0
    for path in office_paths:
        if not path.exists():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        changed = False
        for office in data.get("offices") or []:
            oid = office.get("officeId") or parse_office_id(
                office.get("slug", ""),
                office.get("image", "") or office.get("imageUrl", ""),
            )
            if oid and oid in updates:
                office["image"] = updates[oid]["image"]
                office["imageUrl"] = updates[oid]["imageUrl"]
                changed = True
        if changed:
            write_json_atomic(path, data)
            office_files += 1

    safe_print(f"  patched {office_files} {label}")

    item_count = 0
    for oid, fields in updates.items():
        slug = fields.get("slug")
        if not slug:
            continue
        item_path = ITEMS_DIR / f"{slug}.json"
        if not item_path.exists():
            continue
        item = json.loads(item_path.read_text(encoding="utf-8"))
        item["image"] = fields["image"]
        item["imageUrl"] = fields["imageUrl"]
        write_json_atomic(item_path, item)
        item_count += 1

    index = json.loads(SHELTERS_PATH.read_text(encoding="utf-8"))
    for shelter in index.get("shelters") or []:
        oid = shelter.get("officeId")
        if oid and oid in updates:
            shelter["image"] = updates[oid]["image"]
            shelter["imageUrl"] = updates[oid]["imageUrl"]
    index["imagesLocalizedAt"] = datetime.now(timezone.utc).isoformat()
    write_json_atomic(SHELTERS_PATH, index)


def apply_all_image_updates(updates: dict[int, dict]) -> None:
    safe_print("Updating JSON paths...")
    apply_image_updates(updates)
    safe_print("  patched shelters.json")


def apply_only_from_disk() -> None:
    """Patch JSON paths for all existing local image files."""
    updates: dict[int, dict] = {}
    shelters = load_shelters()
    by_id = {s.get("officeId"): s for s in shelters if s.get("officeId")}

    for path in sorted(IMG_DIR.glob("*.webp")):
        if path.stat().st_size <= 0:
            continue
        oid = int(path.stem)
        shelter = by_id.get(oid, {})
        remote = remote_image_url(shelter.get("imageUrl") or shelter.get("image", ""))
        updates[oid] = {
            "image": f"./img/shelter/office/{oid}.webp",
            "imageUrl": remote or f"https://cdn.findpawpal.com/office/{oid}.jpg?f=webp&w=730",
            "slug": shelter.get("slug", ""),
        }

    apply_all_image_updates(updates)
    safe_print(f"Applied local paths for {len(updates)} images")


def process_shelter_batch(
    shelters: list[dict],
    skip_existing: bool,
    state_slug: Optional[str],
) -> tuple[dict[int, dict], list[dict], dict[str, int]]:
    updates: dict[int, dict] = {}
    failures: list[dict] = []
    stats = {"downloaded": 0, "skipped": 0, "failed": 0, "processed": 0}
    total = len(shelters)

    for shelter in shelters:
        slug = shelter.get("slug", "")
        oid = shelter.get("officeId") or parse_office_id(
            slug, shelter.get("image", "") or shelter.get("imageUrl", "")
        )
        stats["processed"] += 1

        if not oid:
            stats["failed"] += 1
            continue

        remote = remote_image_url(shelter.get("imageUrl") or shelter.get("image", ""))
        if not remote:
            stats["skipped"] += 1
            continue

        local_rel = f"./img/shelter/office/{oid}.webp"
        dest = IMG_DIR / f"{oid}.webp"

        if skip_existing and dest.exists() and dest.stat().st_size > 0:
            updates[oid] = {"image": local_rel, "imageUrl": remote, "slug": slug}
            stats["skipped"] += 1
            continue

        time.sleep(DELAY_SEC)
        ok, err = download_office_image(oid, remote, dest)

        if ok:
            stats["downloaded"] += 1
            updates[oid] = {"image": local_rel, "imageUrl": remote, "slug": slug}
        else:
            stats["failed"] += 1
            failures.append(
                {
                    "officeId": oid,
                    "slug": slug,
                    "stateSlug": state_slug or shelter.get("stateSlug", ""),
                    "citySlug": shelter.get("citySlug", ""),
                    "url": remote,
                    "error": err,
                    "at": datetime.now(timezone.utc).isoformat(),
                }
            )
            if stats["failed"] <= 5:
                safe_print(f"    WARN {err} office/{oid} ({slug})")

        if stats["processed"] % 100 == 0 or stats["processed"] == total:
            local_count = len(list(IMG_DIR.glob("*.webp")))
            safe_print(
                f"    {stats['processed']}/{total} "
                f"files={local_count} dl={stats['downloaded']} "
                f"skip={stats['skipped']} fail={stats['failed']}"
            )

    return updates, failures, stats


def main() -> None:
    if "--apply-only" in sys.argv:
        apply_only_from_disk()
        return

    skip_existing = "--skip-existing" in sys.argv or "--missing-only" in sys.argv
    limit = None
    state_filter = None
    for arg in sys.argv[1:]:
        if arg.startswith("--limit="):
            limit = int(arg.split("=", 1)[1])
        elif arg.startswith("--state="):
            state_filter = arg.split("=", 1)[1]

    by_state = state_filter is None

    IMG_DIR.mkdir(parents=True, exist_ok=True)
    shelters = load_shelters()
    if state_filter:
        shelters = [s for s in shelters if s.get("stateSlug") == state_filter]
        by_state = False
    if limit is not None:
        shelters = shelters[:limit]

    total_all = len(shelters)
    safe_print(f"Localizing images for {total_all} shelters -> {IMG_DIR}")
    if skip_existing:
        safe_print("Mode: skip existing local files (missing only)")

    all_failures: list[dict] = []
    totals = {"downloaded": 0, "skipped": 0, "failed": 0}

    if by_state:
        grouped: dict[str, list[dict]] = {}
        for shelter in shelters:
            grouped.setdefault(shelter.get("stateSlug", "unknown"), []).append(shelter)

        for state_slug in sorted(grouped.keys()):
            batch = grouped[state_slug]
            safe_print(f"\n== {state_slug} ({len(batch)} shelters) ==")
            updates, failures, stats = process_shelter_batch(batch, skip_existing, state_slug)
            if updates:
                apply_image_updates(updates, state_slug)
            all_failures.extend(failures)
            for key in totals:
                totals[key] += stats[key]
            safe_print(
                f"  {state_slug} done: dl={stats['downloaded']} "
                f"skip={stats['skipped']} fail={stats['failed']}"
            )
    else:
        updates, failures, stats = process_shelter_batch(shelters, skip_existing, state_filter)
        apply_all_image_updates(updates)
        all_failures = failures
        totals = stats

    if all_failures:
        FAILURES_PATH.write_text(json.dumps(all_failures, indent=2), encoding="utf-8")
        safe_print(f"\nFailures logged: {FAILURES_PATH} ({len(all_failures)} items)")
    elif FAILURES_PATH.exists():
        FAILURES_PATH.unlink()

    safe_print()
    safe_print("=== Image download complete ===")
    safe_print(f"Downloaded:  {totals['downloaded']}")
    safe_print(f"Skipped:     {totals['skipped']}")
    safe_print(f"Failed:      {totals['failed']}")
    safe_print(f"Local files: {len(list(IMG_DIR.glob('*.webp')))}")


if __name__ == "__main__":
    main()
