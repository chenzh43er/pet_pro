"""Fetch articles and images from findpawpal.com for local use."""
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "img"
DATA = ROOT / "data" / "articles"
BASE = "https://www.findpawpal.com"

ARTICLE_PATHS = [
    "/pet-breed/16-most-popular-long-haired-dog-breeds-of-2024/",
    "/pet-training/10-tips-ensure-a-wonderful-travel-with-your-dog/",
    "/pet-breed/10-top-popular-poodle-mixes-breeds-of-2024/",
    "/pet-breed/top-hypoallergenic-dog-breeds-for-people-with-allergies/",
    "/pet-breed/10-most-popular-dog-breeds-in-2024/",
    "/pet-training/are-you-teaching-your-puppy-bad-habits/",
    "/pet-health/is-puppys-visual-world-different-from-yours/",
    "/pet-health/unlocking-the-10-secrets-to-your-dogs-longevity/",
    "/pet-adoption/the-top-11-small-dog-breeds-perfect-for-limited-space/",
    "/pet-health/the-thorough-instruction-on-dog-deworming/",
    "/pet-health/do-dogs-have-blood-types-like-humans/",
    "/pet-behavior/why-does-my-dog-sleep-by-the-door/",
    "/pet-health/12-amazing-facts-about-dogs/",
    "/pet-training/10-common-human-behaviors-that-dogs-cant-stand/",
    "/pet-breed/top-15-smartest-dog-breeds-for-everyone/",
    "/pet-feeding/nourishing-our-cute-companions-a-mindful-guide-to-feed-dogs/",
]

STATIC_ASSETS = [
    ("https://www.findpawpal.com/public/static/Images/adoption.webp", "img/adoption.webp"),
    ("https://www.findpawpal.com/public/static/Images/arrow.png", "img/arrow.png"),
]


def slug_from_path(path: str) -> str:
    return path.strip("/").split("/", 1)[1].rstrip("/")


def category_from_path(path: str) -> str:
    return path.strip("/").split("/")[0]


def category_label(cat: str) -> str:
    return cat.replace("-", " ").title().replace("Pet ", "Pet ")


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


def cdn_to_local_path(url: str) -> tuple[str, Path]:
    """Return (local_web_path, filesystem_path) for a CDN URL."""
    parsed = urllib.parse.urlparse(url)
    path = parsed.path.lstrip("/")
    ext = ".webp" if "f=webp" in (parsed.query or "") else Path(path).suffix or ".jpg"
    name = Path(path).stem + ext
    if path.startswith("blog/content/"):
        rel = f"img/blog/content/{name}"
    elif path.startswith("blog/list/"):
        rel = f"img/blog/list/{name}"
    elif path.startswith("pets/"):
        rel = f"img/pets/{name}"
    else:
        rel = f"img/{name}"
    return f"./{rel}", ROOT / rel


def localize_url(url: str, cache: dict) -> str:
    if url in cache:
        return cache[url]
    if not url.startswith("http"):
        return url
    if "cdn.findpawpal.com" not in url and "findpawpal.com/public" not in url:
        return url
    web_path, fs_path = cdn_to_local_path(url)
    try:
        download_file(url, fs_path)
        cache[url] = web_path
        print(f"  img: {web_path}")
    except Exception as e:
        print(f"  WARN download failed {url}: {e}")
        cache[url] = url
    return cache[url]


def strip_ads(html: str) -> str:
    html = re.sub(r"(?s)<div class=\"ads-normal\">.*?</div></div>\s*", "", html)
    html = re.sub(r"(?s)<div class=\"ads-aside[^\"]*\">.*?</script></div>\s*", "", html)
    return html


def extract_meta(html: str) -> dict:
    title_m = re.search(r"<title>([^<]+)</title>", html)
    desc_m = re.search(r'<meta name="description" content="([^"]*)"', html)
    h1_m = re.search(r"<h1>([^<]+)</h1>", html)
    title = (h1_m.group(1) if h1_m else title_m.group(1).split(" - ")[0] if title_m else "").strip()
    return {
        "title": title,
        "description": desc_m.group(1) if desc_m else "",
    }


def extract_sections(html: str) -> list:
    section_m = re.search(r'(?s)<div class="article-section">(.*?)</div>\s*<ul class="pageNext">', html)
    if not section_m:
        section_m = re.search(r'(?s)<div class="article-section">(.*?)</div>\s*<div class="islike-wrap">', html)
    if not section_m:
        return []
    block = section_m.group(1)
    sections = []
    parts = re.split(r'(?=<h3[^>]*class="long-title")', block)
    for part in parts:
        part = part.strip()
        if not part:
            continue
        h3_m = re.search(r'<h3[^>]*id="([^"]*)"[^>]*class="long-title"[^>]*>([^<]+)</h3>', part)
        if not h3_m:
            h3_m = re.search(r'<h3[^>]*class="long-title"[^>]*>([^<]+)</h3>', part)
            if not h3_m:
                continue
            sec_id = re.sub(r"[^a-z0-9-]", "-", h3_m.group(1).lower())
            sec_title = h3_m.group(1).strip()
        else:
            sec_id = h3_m.group(1)
            sec_title = h3_m.group(2).strip()
        rest = part[h3_m.end():]
        img_m = re.search(r'<img[^>]*class="long-img"[^>]*src="([^"]+)"', rest)
        if not img_m:
            img_m = re.search(r'<img[^>]*src="([^"]+)"[^>]*class="long-img"', rest)
        img_url = img_m.group(1) if img_m else ""
        paragraphs = []
        for p_m in re.finditer(r"<p>(.*?)</p>", rest, re.DOTALL):
            text = re.sub(r"<[^>]+>", "", p_m.group(1)).strip()
            if text:
                paragraphs.append(text)
        sections.append({
            "id": sec_id,
            "title": sec_title,
            "paragraphs": paragraphs,
            "image": img_url,
        })
    return sections


def extract_nav(html: str) -> list:
    items = []
    for m in re.finditer(r'<a href="#([^"]+)" class="long-nav-item">([^<]+)</a>', html):
        items.append({"id": m.group(1), "label": m.group(2).strip()})
    return items


def extract_next(html: str) -> str:
    m = re.search(r'<a href="(/pet-[^"]+)" class="page-next">', html)
    return m.group(1) if m else ""


def extract_list_image(html: str, slug: str) -> str:
    m = re.search(
        rf'blog/list/{re.escape(slug)}\.jpg[^"]*',
        html,
    )
    if m:
        full = re.search(rf'src="(https://cdn\.findpawpal\.com/blog/list/{re.escape(slug)}\.jpg[^"]*)"', html)
        if full:
            return full.group(1)
    return f"https://cdn.findpawpal.com/blog/list/{slug}.jpg?f=webp&w=300"


def fetch_article(path: str, cache: dict) -> dict:
    url = BASE + path
    slug = slug_from_path(path)
    cat = category_from_path(path)
    print(f"\n[{slug}] fetching...")
    html = strip_ads(fetch_url(url))
    meta = extract_meta(html)
    sections = extract_sections(html)
    for sec in sections:
        if sec["image"]:
            sec["image"] = localize_url(sec["image"], cache)
    list_img = localize_url(extract_list_image(html, slug), cache)
    nav = extract_nav(html)
    next_path = extract_next(html)
    tag_map = {
        "pet-breed": "Pet Breed",
        "pet-training": "Pet Training",
        "pet-health": "Pet Health",
        "pet-adoption": "Pet Adoption",
        "pet-behavior": "Pet Behavior",
        "pet-feeding": "Pet Feeding",
    }
    return {
        "slug": slug,
        "path": path,
        "category": cat,
        "categoryLabel": tag_map.get(cat, category_label(cat)),
        "title": meta["title"],
        "description": meta["description"],
        "listImage": list_img,
        "sections": sections,
        "nav": nav,
        "nextPath": next_path,
    }


def localize_post_html(cache: dict):
    post = ROOT / "post.html"
    text = post.read_text(encoding="utf-8")
    urls = set(re.findall(r'https://cdn\.findpawpal\.com[^"\s]+', text))
    urls |= set(re.findall(r'https://www\.findpawpal\.com/public/static/Images/[^"\s]+', text))
    for url in urls:
        localize_url(url, cache)
    for url, urls_found in list(cache.items()):
        if url.startswith("http"):
            text = text.replace(url, urls_found)
    post.write_text(text, encoding="utf-8")
    print("\npost.html image URLs localized.")


def main():
    DATA.mkdir(parents=True, exist_ok=True)
    cache: dict[str, str] = {}

    print("Downloading static assets...")
    for remote, local in STATIC_ASSETS:
        dest = ROOT / local
        try:
            download_file(remote, dest)
            cache[remote] = f"./{local}"
            print(f"  {local}")
        except Exception as e:
            print(f"  WARN {local}: {e}")

    index = []
    for path in ARTICLE_PATHS:
        try:
            article = fetch_article(path, cache)
            out = DATA / f"{article['slug']}.json"
            out.write_text(json.dumps(article, ensure_ascii=False, indent=2), encoding="utf-8")
            index.append({
                "slug": article["slug"],
                "path": article["path"],
                "title": article["title"],
                "categoryLabel": article["categoryLabel"],
                "listImage": article["listImage"],
            })
            time.sleep(0.5)
        except Exception as e:
            print(f"  ERROR {path}: {e}")

    (DATA / "index.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"\nSaved {len(index)} articles to data/articles/")
    print("Done.")


if __name__ == "__main__":
    main()
