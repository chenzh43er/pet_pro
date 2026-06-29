"""Fetch dog/cat name listings from findpawpal.com with pagination."""
import html as html_lib
import json
import re
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "names"
BASE = "https://www.findpawpal.com"

NAME_LISTS = [
    {
        "type": "dog",
        "path": "/dog-name/",
        "index_file": "dog-names.json",
    },
    {
        "type": "cat",
        "path": "/cat-name/",
        "index_file": "cat-names.json",
    },
]

ROW_PATTERN = re.compile(
    r'(?s)<tr>\s*'
    r'<td class="link-cover"><a class="link-cover" href="([^"]+)"></a></td>\s*'
    r'<td class="name-gender">\s*<svg class="icon-(boy|girl|unisex)">\s*'
    r'.*?<td class="name-value"><a href="[^"]+">([^<]+)</a></td>\s*'
    r'<td class="name-des"><a href="[^"]+">([^<]*)</a></td>'
)


def fetch_url(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8", errors="replace")


def full_url(path: str) -> str:
    if path.startswith("http"):
        return path
    return BASE + path


def slug_from_href(href: str) -> str:
    return href.strip("/").split("/")[-1]


def clean_text(raw: str) -> str:
    text = re.sub(r"<[^>]+>", "", raw)
    text = html_lib.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def extract_max_page(html: str) -> int:
    pages = [int(n) for n in re.findall(r"\?page=(\d+)", html)]
    return max(pages) if pages else 1


def extract_rows(html: str) -> list[dict]:
    table_m = re.search(r"(?s)<table[^>]*>(.*?)</table>", html)
    if not table_m:
        return []

    items = []
    for href, gender, name, meaning in ROW_PATTERN.findall(table_m.group(1)):
        path = href if href.startswith("/") else f"/{href}"
        items.append({
            "href": path,
            "gender": gender,
            "name": clean_text(name),
            "meaning": clean_text(meaning),
        })
    return items


def fetch_name_list(config: dict) -> list[dict]:
    list_path = config["path"]
    pet_type = config["type"]
    print(f"\n=== {pet_type.upper()} names ===")

    first_url = full_url(list_path)
    first_html = fetch_url(first_url)
    max_page = extract_max_page(first_html)
    print(f"Pages: {max_page}")

    seen_hrefs: set[str] = set()
    names: list[dict] = []

    for page in range(1, max_page + 1):
        page_url = first_url if page == 1 else full_url(f"{list_path}?page={page}")
        print(f"Fetching page {page}/{max_page}: {page_url}")
        html = first_html if page == 1 else fetch_url(page_url)
        rows = extract_rows(html)
        print(f"  found {len(rows)} rows")

        if not rows:
            break

        new_on_page = 0
        for row in rows:
            href = row["href"]
            if href in seen_hrefs:
                continue
            seen_hrefs.add(href)
            new_on_page += 1

            slug = slug_from_href(href)
            names.append({
                "slug": slug,
                "name": row["name"],
                "type": pet_type,
                "gender": row["gender"],
                "meaning": row["meaning"],
                "origin": "",
                "url": full_url(href),
                "path": href,
            })

        if new_on_page == 0:
            break

        if page < max_page:
            time.sleep(0.35)

    names.sort(key=lambda item: item["name"].lower())
    return names


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    all_index = {}
    for config in NAME_LISTS:
        names = fetch_name_list(config)
        out = DATA_DIR / config["index_file"]
        out.write_text(json.dumps(names, ensure_ascii=False, indent=2), encoding="utf-8")
        all_index[config["type"]] = {
            "count": len(names),
            "file": config["index_file"],
        }
        print(f"Saved {len(names)} {config['type']} names -> {out.relative_to(ROOT)}")

    (DATA_DIR / "index.json").write_text(
        json.dumps(all_index, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print("\nDone. Run scripts/fetch_name_details.py to fill origin fields.")


if __name__ == "__main__":
    main()
