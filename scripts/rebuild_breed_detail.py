"""Rebuild breed-detail.html with a clean SVG sprite and HTML shell."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DETAIL_ADOPTION = ROOT / "detail-adoption.html"
BREED_ICONS = ROOT / "partials" / "breed-detail-icons.svg"
OUTPUT = ROOT / "breed-detail.html"

adoption_text = DETAIL_ADOPTION.read_text(encoding="utf-8")
adoption_start = adoption_text.index('<svg xmlns="http://www.w3.org/2000/svg" style="display: none">')
adoption_end = adoption_text.index('    </defs>\n</svg>', adoption_start) + len('    </defs>\n</svg>')
common_svg = adoption_text[adoption_start:adoption_end]

breed_icons = BREED_ICONS.read_text(encoding="utf-8").strip()
marker = '\n    </defs>\n</svg>'
defs_close = common_svg.rindex(marker)
common_svg = (
    common_svg[:defs_close]
    + '\n'
    + breed_icons
    + common_svg[defs_close:]
)

html = Path(__file__).with_name('breed-detail-shell.html').read_text(encoding='utf-8')
OUTPUT.write_text(html.replace('__SVG_SPRITE__', common_svg), encoding='utf-8')
print(f'Wrote {OUTPUT} ({OUTPUT.stat().st_size} bytes)')
