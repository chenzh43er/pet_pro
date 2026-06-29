"""Build a clean breed-detail.html from SVG fragments and a HTML template."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DETAIL_ADOPTION = ROOT / "detail-adoption.html"
BREED_DETAIL_OLD = ROOT / "breed-detail.html"
OUTPUT = ROOT / "breed-detail.html"

adoption_text = DETAIL_ADOPTION.read_text(encoding="utf-8")
old_text = BREED_DETAIL_OLD.read_text(encoding="utf-8")

adoption_start = adoption_text.index('<svg xmlns="http://www.w3.org/2000/svg" style="display: none">')
adoption_end = adoption_text.index('</svg>', adoption_start) + len('</svg>')
common_svg = adoption_text[adoption_start:adoption_end]

# Use a one-time backup if the old page was already regenerated.
source_text = old_text
if source_text.count('<symbol id="icon-color"') > 1:
    backup = ROOT / 'breed-detail.html.bak'
    if backup.exists():
        source_text = backup.read_text(encoding='utf-8')

breed_start = source_text.index('<symbol id="icon-color"')
breed_end = source_text.index('</svg>', breed_start)
breed_icons = source_text[breed_start:breed_end]

defs_close = common_svg.rindex('  </defs>')
common_svg = common_svg[:defs_close] + breed_icons + '\n' + common_svg[defs_close:]

html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no,viewport-fit=cover">
  <title>Breed Profile - Find Paw Pal</title>
  <link rel="preload" href="./css/style.css?v-0323" as="style">
  <link rel="stylesheet" href="./css/style.css?v-0323">
  <link rel="canonical" href="https://www.findpawpal.com/dog-breed/">
  <meta name="description" content="Check breed details with characteristics, sizes, and more on Find Paw Pal.">
  <style>body {{ visibility: hidden; }}</style>
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
{common_svg}

<div class="bread-crumbs-wrap">
  <div class="main">
    <div class="bread_crumbs" itemscope itemtype="http://schema.org/BreadcrumbList">
      <span itemprop="itemListElement" itemscope itemtype="http://schema.org/ListItem">
        <a href="./index.html" itemprop="item"><i itemprop="name">Find Paw Pal</i></a>
        <meta itemprop="position" content="1">
      </span>
      <span itemprop="itemListElement" itemscope itemtype="http://schema.org/ListItem">
        <span class="bread-crumbs-icon">&gt;</span>
        <a id="breadcrumb-list-link" href="./pet-breed.html?type=dog" itemprop="item" class="cur-bread-crumbs">
          <i id="breadcrumb-list-label" itemprop="name">Dog Breeds</i>
        </a>
        <meta itemprop="position" content="2">
      </span>
      <span itemprop="itemListElement" itemscope itemtype="http://schema.org/ListItem">
        <span class="bread-crumbs-icon">&gt;</span>
        <a id="breadcrumb-breed-link" href="#" itemprop="item" class="cur-bread-crumbs">
          <i id="breadcrumb-breed-label" itemprop="name">Loading…</i>
        </a>
        <meta itemprop="position" content="3">
      </span>
    </div>
  </div>
</div>

<main>
  <div class="main main-common">
    <div class="container">
      <h1 id="breed-name">Loading…</h1>
    </div>
    <div class="main-bottom">
      <div class="container">
        <div class="animal-info breed" id="animal-info">
          <div class="animal-img">
            <img id="breed-image" src="./img/loading-dog.webp" alt="">
          </div>
          <table cellpadding="0" cellspacing="0" class="animal-table">
            <tbody id="summary-table"></tbody>
          </table>
        </div>

        <div class="animal-detail-item animal-contact">
          <div class="animal-subtitle">
            <h3>Profile</h3>
            <div class="adouptable-me"><a id="profile-adopt-link" href="#">View Adoptable Pets</a></div>
          </div>
          <div class="about-list breed" id="profile-list"></div>
        </div>

        <div class="animal-detail-item animal-contact">
          <div class="animal-subtitle">
            <h3>Upkeep</h3>
            <div class="adouptable-me"><a id="upkeep-adopt-link" href="#">View Adoptable Pets</a></div>
          </div>
          <div class="about-list breed" id="upkeep-list"></div>
        </div>

        <div class="animal-detail-item animal-des">
          <div class="animal-subtitle"><h3>Introduction</h3></div>
          <div class="animal-sampson" id="introduction"></div>
        </div>

        <div class="animal-detail-item animal-des" id="helpful-section" style="display:none">
          <div class="animal-subtitle"><h3>Helpful Information</h3></div>
          <div class="animal-sampson helpful">
            <ul id="helpful-list"></ul>
          </div>
        </div>

        <div class="animal-relative" id="adoption-section">
          <h2 id="adoption-heading">Adoption</h2>
          <div class="adoption-list relative" id="related-adoptions"></div>
        </div>
      </div>

      <div class="aside">
        <div class="aside-tool">
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
                <a class="link-cover" href="./pet-hospital.html"></a>
                <svg class="icon-tool"><use xlink:href="#icon-hosp"></use></svg>
                <span class="tool-text">Hospital</span>
              </div>
            </div>
            <div class="aside-tool-con">
              <div class="aside-tool-item">
                <a class="link-cover" href="./pet-shelter.html"></a>
                <svg class="icon-tool"><use xlink:href="#icon-resc"></use></svg>
                <span class="tool-text">Shelter</span>
              </div>
            </div>
          </div>
        </div>
        <div class="aside-article">
          <h2 id="related-breeds-heading">Related Breeds</h2>
          <div class="aside-list breed" id="related-breeds"></div>
        </div>
      </div>
    </div>
  </div>
</main>

<footer id="footer"></footer>

<script src="./js/jquery.min.js"></script>
<script>
  fetch('./header.html')
    .then((res) => res.text())
    .then((data) => {{
      document.getElementById('mainHeader').innerHTML = data;
      $('.icon-nav').click(function() {{
        $('.nav-cover').toggleClass('expand');
        $('.header-nav').toggleClass('expand');
      }});
      $('.nav-cover').click(function() {{
        $('.nav-cover').toggleClass('expand');
        $('.header-nav').toggleClass('expand');
      }});
      $('.nav-item.expand .nav-con').on('click', function(e) {{
        if ($(e.target).closest('.icon-go').length) {{
          e.preventDefault();
          $(this).parent().find('.nav-sub-list').toggleClass('expand');
        }}
      }});
      $('.icon-menu').click(function() {{
        $('.header-nav').toggle();
        $('.index-cover-header').toggle();
        $('.icon-menu').toggle();
        $('.icon-close').toggle();
      }});
      $('.index-cover-header').click(function() {{
        $('.header-nav').toggle();
        $('.index-cover-header').toggle();
        $('.icon-menu').toggle();
        $('.icon-close').toggle();
      }});
      $('.icon-close').click(function() {{
        $('.header-nav').toggle();
        $('.index-cover-header').toggle();
        $('.icon-menu').toggle();
        $('.icon-close').toggle();
      }});
    }});

  fetch('./footer.html')
    .then((res) => res.text())
    .then((data) => {{
      document.getElementById('footer').innerHTML = data;
    }});
</script>
<script type="module" src="./js/breed-detail.js"></script>
</body>
</html>
'''

OUTPUT.write_text(html, encoding='utf-8')
print(f'Wrote {OUTPUT}')
