"""Extract breed-detail icon symbols from the live site once."""
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "partials" / "breed-detail-icons.svg"
URL = "https://www.findpawpal.com/dog-breed/affenpinscher/"

req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"})
html = urllib.request.urlopen(req, timeout=60).read().decode("utf-8", errors="replace")

icons = [
    "icon-color",
    "icon-exercise",
    "icon-needs",
    "icon-height",
    "icon-lifespan",
    "icon-litter",
    "icon-nickname",
    "icon-personality",
    "icon-shedding",
    "icon-trainability",
    "icon-vocality",
    "icon-weight",
]

parts = []
for icon_id in icons:
    match = re.search(rf'(<symbol id="{re.escape(icon_id)}"[\s\S]*?</symbol>)', html)
    if not match:
        raise SystemExit(f"Missing symbol: {icon_id}")
    parts.append(match.group(1))

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text("\n".join(parts) + "\n", encoding="utf-8")
print(f"Wrote {OUT} ({len(parts)} symbols)")
