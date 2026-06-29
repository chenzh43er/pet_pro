"""Print current animal-shelter scrape progress."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "shelters"


def safe_print(*args, **kwargs) -> None:
    text = " ".join(str(a) for a in args)
    end = kwargs.get("end", "\n")
    flush = kwargs.get("flush", False)
    try:
        print(text, end=end, flush=flush)
    except UnicodeEncodeError:
        enc = sys.stdout.encoding or "utf-8"
        print(text.encode(enc, errors="replace").decode(enc), end=end, flush=flush)


def main() -> None:
    cities_total = 0
    states_cities: dict[str, int] = {}
    for p in sorted((DATA / "cities").glob("*.json")):
        n = len(json.loads(p.read_text(encoding="utf-8")).get("cities") or [])
        states_cities[p.stem] = n
        cities_total += n

    office_files = list((DATA / "offices").rglob("*.json"))
    offices_by_state: dict[str, int] = {}
    total_offices = 0
    empty_cities = 0
    for p in office_files:
        try:
            d = json.loads(p.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            safe_print(f"  [损坏] {p}")
            continue
        state = d.get("state", {}).get("slug", p.parent.name)
        offices = d.get("offices") or []
        offices_by_state[state] = offices_by_state.get(state, 0) + 1
        total_offices += len(offices)
        if not offices:
            empty_cities += 1

    cities_fetched = len(office_files)
    pct = round(cities_fetched / cities_total * 100, 1) if cities_total else 0

    unique = 0
    local_images = 0
    shelters_path = DATA / "shelters.json"
    if shelters_path.exists():
        shelters_list = json.loads(shelters_path.read_text(encoding="utf-8")).get("shelters") or []
        unique = len(shelters_list)
        local_images = sum(1 for s in shelters_list if str(s.get("image", "")).startswith("./"))

    img_dir = ROOT / "img" / "shelter" / "office"
    img_files = len(list(img_dir.glob("*.webp"))) if img_dir.exists() else 0

    states_complete = sum(
        1 for s, t in states_cities.items() if offices_by_state.get(s, 0) >= t
    )

    safe_print("=== Animal Shelter 抓取进度 ===")
    safe_print(f"城市总数:       {cities_total}")
    safe_print(f"已抓取城市:     {cities_fetched} ({pct}%)")
    safe_print(f"剩余城市:       {cities_total - cities_fetched}")
    safe_print(f"办公室条数:     {total_offices}")
    safe_print(f"唯一 shelter:   {unique}  (shelters.json，需 build 后更新)")
    safe_print(f"本地图片:       {img_files} 文件 / {local_images} JSON 已本地化")
    safe_print(f"空城市页:       {empty_cities}")
    safe_print(f"已完成州:       {states_complete} / {len(states_cities)}")
    safe_print()
    safe_print("各州进度 (已抓取/总数):")
    for state_slug in sorted(states_cities.keys()):
        done = offices_by_state.get(state_slug, 0)
        total = states_cities[state_slug]
        pct_s = done / total * 100 if total else 0
        bar = "#" * int(pct_s / 5)
        mark = " DONE" if done >= total else ""
        safe_print(f"  {state_slug:25} {done:4}/{total:4} ({pct_s:5.1f}%) {bar}{mark}")


if __name__ == "__main__":
    main()
