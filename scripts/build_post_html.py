"""Rebuild post.html as a dynamic article shell."""
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"
ARTICLE_INDEX = ROOT / "data" / "articles" / "index.json"
OUT = ROOT / "post.html"

ARTICLE_SYMBOLS = [
    "icon-like-article",
    "icon-unlike",
    "icon-long-nav",
    "icon-long-close",
    "icon-adoption",
]


def fetch_article_symbols() -> str:
    url = "https://www.findpawpal.com/pet-training/10-tips-ensure-a-wonderful-travel-with-your-dog/"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")
    parts = []
    for sid in ARTICLE_SYMBOLS:
        m = re.search(rf"(?s)<symbol id=\"{sid}\".*?</symbol>", html)
        if m:
            parts.append("    " + m.group(0).strip())
    return "\n".join(parts)


def extract_svg_block() -> str:
    text = INDEX.read_text(encoding="utf-8").splitlines()
    start = next(i for i, line in enumerate(text) if 'style="display: none"' in line and "<svg" in line)
    end = next(i for i, line in enumerate(text) if i > start and line.strip() == "</svg>")
    svg_lines = text[start : end + 1]
    svg = "\n".join(svg_lines)
    extra = fetch_article_symbols()
    if extra:
        svg = svg.replace("\n    </defs>\n</svg>", f"\n{extra}\n    </defs>\n</svg>", 1)
    return svg


MAIN_SHELL = """
<div class="bread-crumbs-wrap">
  <div class="main">
    <div class="bread_crumbs" itemscope itemtype="http://schema.org/BreadcrumbList">
      <span itemprop="itemListElement" itemscope itemtype="http://schema.org/ListItem">
        <a href="./index.html" itemprop="item"><i itemprop="name">Find Paw Pal</i></a>
        <meta itemprop="position" content="1">
      </span>
      <span itemprop="itemListElement" itemscope itemtype="http://schema.org/ListItem">
        <span class="bread-crumbs-icon">&gt;</span>
        <a href="#" itemprop="item" class="cur-bread-crumbs"><i id="breadcrumb-category" itemprop="name">Article</i></a>
        <meta itemprop="position" content="2">
      </span>
      <span itemprop="itemListElement" itemscope itemtype="http://schema.org/ListItem">
        <span class="bread-crumbs-icon">&gt;</span>
        <a href="#" itemprop="item" class="cur-bread-crumbs"><i id="breadcrumb-title" itemprop="name">Loading…</i></a>
        <meta itemprop="position" content="3">
      </span>
    </div>
  </div>
</div>
<main>
  <div class="index-cover-long"></div>
  <div class="main main-common">
    <div class="container">
      <h1 id="post-title">Loading…</h1>
    </div>
    <div class="main-bottom">
      <div class="container">
        <div class="long-des" id="post-intro"></div>
        <div class="adoption-btn article">
          <a class="adoption-btn-item" href="./pet-adoption.html?type=dog">
            <svg class="icon-category-white"><use xlink:href="#icon-btn-dog"></use></svg>
            <span>Adopt A Dog Now</span>
          </a>
          <a class="adoption-btn-item" href="./pet-adoption.html?type=cat">
            <svg class="icon-category-white"><use xlink:href="#icon-btn-cat"></use></svg>
            <span>Adopt A Cat Now</span>
          </a>
        </div>
        <div class="article-section" id="post-sections"></div>
        <div id="post-next"></div>
        <div class="islike-wrap">
          <div class="islike-t">
            <p class="islike-tit">Was this page helpful? Give us a thumbs up!</p>
            <div class="islike">
              <div class="like isLike_btn" data-islike="1">
                <svg class="icon-like-article" width="32" height="32"><use xlink:href="#icon-like-article"></use></svg>
                Helpful <span class="like_num">0</span>
              </div>
              <div class="unlike isLike_btn" data-islike="0">
                <svg class="icon-unlike" width="32" height="32"><use xlink:href="#icon-unlike"></use></svg>
                Useless <span class="unlike_num">0</span>
              </div>
            </div>
          </div>
          <div class="comment">
            <div id="commentFrom">
              <div class="comment-form-item"><textarea id="commentText" placeholder="Any feedback will be appreciated."></textarea></div>
              <div class="comment-form-item"><input type="email" placeholder="Your e-mail address (optional)" id="commentEmail"></div>
              <div class="comment-form-item"><span id="commentBtn">Submit</span></div>
            </div>
            <div class="feedback-thank" style="display:none;">Thank you for your feedback!</div>
          </div>
        </div>
      </div>
      <div class="aside">
        <div class="long-nav" id="post-nav"></div>
        <div class="long-nav-btn">
          <svg class="icon-long-list" width="32" height="32"><use xlink:href="#icon-long-nav"></use></svg>
          <svg class="icon-long-close" width="32" height="32"><use xlink:href="#icon-long-close"></use></svg>
        </div>
        <div class="aside-tool article">
          <h2>Find a Furry Friend</h2>
          <div class="aside-tool-list">
            <div class="aside-tool-con">
              <div class="aside-tool-item">
                <a class="link-cover" href="./pet-adoption.html?type=dog"></a>
                <svg class="icon-tool"><use xlink:href="#icon-dog"></use></svg>
                <span class="tool-text">Dog</span>
              </div>
            </div>
            <div class="aside-tool-con">
              <div class="aside-tool-item">
                <a class="link-cover" href="./pet-adoption.html?type=cat"></a>
                <svg class="icon-tool"><use xlink:href="#icon-cat"></use></svg>
                <span class="tool-text">Cat</span>
              </div>
            </div>
            <div class="aside-tool-con">
              <div class="aside-tool-item">
                <a class="link-cover" href="./pet-adoption.html?type=hospital"></a>
                <svg class="icon-tool"><use xlink:href="#icon-hosp"></use></svg>
                <span class="tool-text">Hospital</span>
              </div>
            </div>
            <div class="aside-tool-con">
              <div class="aside-tool-item">
                <a class="link-cover" href="./pet-adoption.html?type=shelter"></a>
                <svg class="icon-tool"><use xlink:href="#icon-resc"></use></svg>
                <span class="tool-text">Shelter</span>
              </div>
            </div>
          </div>
        </div>
        <h2 class="menu-name">Headlines</h2>
        <div class="word-article" id="word-article">
{{WORD_ARTICLE}}
        </div>
      </div>
    </div>
  </div>
</main>
<footer id="footer"></footer>

<script src="./js/jquery.min.js"></script>
<script src="./js/post.js"></script>
<script>
  fetch('./header.html').then(function (res) { return res.text(); }).then(function (data) {
    document.getElementById('mainHeader').innerHTML = data;
    $('.icon-menu').click(function () {
      $('.header-nav, .index-cover-header, .icon-menu, .icon-close').toggle();
      checkNav();
    });
    $('.index-cover-header, .icon-close').click(function () {
      $('.header-nav, .index-cover-header, .icon-menu, .icon-close').toggle();
      checkNav();
    });
    $('.nav-con').each(function () {
      $(this).click(function () { $(this).toggleClass('hide'); });
    });
  });
  fetch('./footer.html').then(function (res) { return res.text(); }).then(function (data) {
    document.getElementById('footer').innerHTML = data;
  });
  function checkNav() {
    if ($('.header-nav').css('display') !== 'none') {
      $('body').css({ position: 'fixed', width: '100%', top: 0 });
    } else {
      $('body').css({ position: 'absolute', width: '100%' });
    }
  }
</script>
"""


def render_word_article_html(articles: list) -> str:
    blocks = []
    for item in articles:
        href = f"./post.html?slug={item['slug']}"
        title = item["title"]
        img = item["listImage"]
        tag = item["categoryLabel"]
        blocks.append(
            f"""                    <div class="word-article-item">
                        <a href="{href}" class="link-cover"></a>
                        <div class="word-item-l">
                            <img src="{img}" alt="{title}" class="word-item-img">
                        </div>
                        <div class="word-item-r">
                            <a href="{href}" class="word-item-link">{title}</a>
                            <div class="word-item-tag">{tag}</div>
                        </div>
                    </div>"""
        )
    return "\n".join(blocks)


def build():
    head = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no,viewport-fit=cover">
  <title>Article - Find Paw Pal</title>
  <link rel="preload" href="./css/style.css?v-0323" as="style">
  <link rel="stylesheet" href="./css/style.css?v-0323">
  <meta name="description" content="">
  <script src="./js/utlParam.js"></script>
</head>
<body>
<header id="mainHeader"></header>
<div id="popup-back">
  <div class="popup-inner">
    <img class="popup-arrow" src="./img/arrow.png" alt="">
    <span class="popup-text">Click <strong>Allow</strong> to stay updated with new arrivals of adoptable pets for free!</span>
  </div>
</div>
<div class="index-cover-header"></div>
"""
    svg = extract_svg_block()
    articles = json.loads(ARTICLE_INDEX.read_text(encoding="utf-8"))
    word_article = render_word_article_html(articles)
    shell = MAIN_SHELL.replace("{{WORD_ARTICLE}}", word_article)
    html = head + svg + "\n" + shell + "\n</body>\n</html>\n"
    OUT.write_text(html, encoding="utf-8")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build()
