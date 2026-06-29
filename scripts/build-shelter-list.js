const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const cityPath = path.join(root, 'shelter-city.html');
const detailPath = path.join(root, 'detail-adoption.html');
const outPath = path.join(root, 'shelter-list.html');

const cityRaw = fs.readFileSync(cityPath, 'utf8');
const detailRaw = fs.readFileSync(detailPath, 'utf8');

const svgStart = cityRaw.indexOf('<div class="index-cover-header"></div>');
const breadStart = cityRaw.indexOf('<div class="bread-crumbs-wrap">', svgStart);
const svgClose = cityRaw.lastIndexOf('</svg>', breadStart);
let svgBlock = cityRaw.slice(svgStart, svgClose + 6);

const iconLocation = detailRaw.match(/<symbol id="icon-location"[\s\S]*?<\/symbol>/)?.[0] || '';
const iconTel = detailRaw.match(/<symbol id="icon-tel"[\s\S]*?<\/symbol>/)?.[0] || '';
if (iconLocation && !svgBlock.includes('id="icon-location"')) {
  svgBlock = svgBlock.replace('    </defs>\r\n</svg>', `        ${iconLocation}\r\n        ${iconTel}\r\n    </defs>\r\n</svg>`);
  svgBlock = svgBlock.replace('    </defs>\n</svg>', `        ${iconLocation}\n        ${iconTel}\n    </defs>\n</svg>`);
}

const asideStart = cityRaw.indexOf('<div class="aside"');
const asideEnd = cityRaw.indexOf('</main>', asideStart);
let asideBlock = cityRaw.slice(asideStart, asideEnd).replace(/\s*<\/div>\s*<\/div>\s*<\/div>\s*$/, '');

const scriptsStart = cityRaw.indexOf('<script src="./js/jquery.min.js">');
const scriptsEnd = cityRaw.indexOf('<script>\r\n  (function() {', cityRaw.indexOf('loadRelatedPets();'));
if (scriptsEnd === -1) {
  throw new Error('Could not find scripts block end');
}
const scriptsBlock = cityRaw.slice(scriptsStart, scriptsEnd);

const head = `<!DOCTYPE html>
<html lang="en">
<head>

  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no,viewport-fit=cover">
  <title id="meta-title">Animal Shelters in Pensacola, FL - Find Paw Pal</title>
  <link rel="preload" href="./css/style.css?v-0323" as="style">
  <link rel="stylesheet" href="./css/style.css?v-0323">
  <link rel="canonical" id="meta-canonical" href="https://www.findpawpal.com/animal-shelter/florida/pensacola/">
  <meta name="description" id="meta-description" content="Select Animal Shelters in Pensacola, FL to get information on adoptable pets, animal adoption services, and more.">

</head>

<body>
<header id="mainHeader">
</header>

`;

const breadcrumbs = `
<div class="bread-crumbs-wrap">
    <div class="main"><!--breadcrumbs str-->
        <div class="bread_crumbs" itemscope="" itemtype="http://schema.org/BreadcrumbList">
    <span itemprop="itemListElement" itemscope="" itemtype="http://schema.org/ListItem">
        <a href="./index.html" itemprop="item"><i itemprop="name">Find Paw Pal</i></a>
        <meta itemprop="position" content="1">
    </span>
            <span itemprop="itemListElement" itemscope="" itemtype="http://schema.org/ListItem">
        <span class="bread-crumbs-icon">&gt;</span>
                <a href="./shelter-state.html" itemprop="item" class="cur-bread-crumbs">
            <i itemprop="name">Animal Shelters</i>
        </a>
        <meta itemprop="position" content="2">
            </span>
            <span itemprop="itemListElement" itemscope="" itemtype="http://schema.org/ListItem">
        <span class="bread-crumbs-icon">&gt;</span>
                <a href="./shelter-city.html?state=florida" itemprop="item" class="cur-bread-crumbs" id="breadcrumb-state-link">
            <i itemprop="name" id="breadcrumb-state-name">Florida</i>
        </a>
        <meta itemprop="position" content="3">
            </span>
            <span itemprop="itemListElement" itemscope="" itemtype="http://schema.org/ListItem">
        <span class="bread-crumbs-icon">&gt;</span>
                <a href="./shelter-list.html?state=florida&amp;city=pensacola" itemprop="item" class="cur-bread-crumbs" id="breadcrumb-city-link">
            <i itemprop="name" id="breadcrumb-city-name">Pensacola</i>
        </a>
        <meta itemprop="position" content="4">
            </span>
        </div>
        <!--breadcrumbs end--></div>
</div>`;

const mainContent = `
<main style="height: auto !important;">
    <div class="main main-common" style="height: auto !important;">
        <div class="container">
            <h1 id="page-title">Animal Shelters in Pensacola, FL</h1>
        </div>
        <div class="main-bottom" style="height: auto !important;">
            <div class="container">
                <p class="category-des" id="page-description">Explore all animal shelters in Pensacola, FL to get information on adoptable pets, animal adoption services, and more. Select the shelter to find more details.</p>
                <div class="adoption-btn">
                    <a class="adoption-btn-item" href="./pet-adoption.html?type=dog">
                        <svg class="icon-category-white"><use xlink:href="#icon-btn-dog"></use></svg>
                        <span>Adopt A Dog Now</span>
                    </a>
                    <a class="adoption-btn-item" href="./pet-adoption.html?type=cat">
                        <svg class="icon-category-white"><use xlink:href="#icon-btn-cat"></use></svg>
                        <span>Adopt A Cat Now</span>
                    </a>
                </div>
                <div class="store-list">
                    <ul class="store-list-wrap" id="shelter-list"></ul>
                </div>
                <div class="animal-relative">
                    <h2>You May Also Like Them</h2>
                    <div class="adoption-list relative" id="related-pets"></div>
                </div>
            </div>
            ${asideBlock}
        </div>
    </div>
</main>`;

const initScript = `
<script>
  (function() {
    function slugToTitle(slug) {
      return slug.replace(/-/g, ' ').replace(/\\b\\w/g, function(c) { return c.toUpperCase(); });
    }

    function escapeHtml(text) {
      return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function resolveOfficeImage(office) {
      var oid = office.officeId;
      if (!oid && office.slug) {
        var m = String(office.slug).match(/-(\d+)$/);
        if (m) oid = m[1];
      }
      if (oid) {
        return './img/shelter/office/' + oid + '.webp';
      }
      var img = office.image || '';
      if (img.indexOf('./') === 0) return img;
      return img;
    }

    function renderOffices(offices) {
      var list = document.getElementById('shelter-list');
      if (!list) return;

      if (!offices.length) {
        list.innerHTML = '<li class="store-list-item"><span>No shelters found.</span></li>';
        return;
      }

      list.innerHTML = offices.map(function(office) {
        var href = office.slug
          ? './shelter-detail.html?slug=' + encodeURIComponent(office.slug)
          : (office.url || '#');
        var img = resolveOfficeImage(office);
        var fallbackImg = './img/adoption.webp';
        var phoneHtml = office.phone
          ? '<div class="store-tel"><svg class="icon-info"><use xlink:href="#icon-tel"></use></svg><span>' + escapeHtml(office.phone) + '</span></div>'
          : '';
        var addrHtml = office.address
          ? '<div class="store-location"><svg class="icon-info"><use xlink:href="#icon-location"></use></svg><span>' + escapeHtml(office.address) + '</span></div>'
          : '';
        return (
          '<li class="store-list-item">' +
            '<a href="' + escapeHtml(href) + '" class="link-cover"></a>' +
            '<div class="store-img"><img src="' + escapeHtml(img) + '" alt="' + escapeHtml(office.name) + '" onerror="this.onerror=null;this.src=\\'' + fallbackImg + '\\';"></div>' +
            '<div class="store-content">' +
              '<div class="store-left">' +
                '<div class="store-slug"><a href="' + escapeHtml(href) + '">' + escapeHtml(office.name) + '</a></div>' +
                addrHtml +
                phoneHtml +
              '</div>' +
              '<div class="store-right">' +
                '<svg fill="#ffffff" class="icon-info"><use xlink:href="#icon-go"></use></svg>' +
              '</div>' +
            '</div>' +
          '</li>'
        );
      }).join('');
    }

    function updatePageMeta(stateSlug, citySlug, stateName, cityLabel) {
      var titleText = 'Animal Shelters in ' + cityLabel;
      var titleEl = document.getElementById('page-title');
      var metaTitle = document.getElementById('meta-title');
      var metaDesc = document.getElementById('meta-description');
      var metaCanonical = document.getElementById('meta-canonical');
      var pageDesc = document.getElementById('page-description');
      var breadcrumbStateName = document.getElementById('breadcrumb-state-name');
      var breadcrumbStateLink = document.getElementById('breadcrumb-state-link');
      var breadcrumbCityName = document.getElementById('breadcrumb-city-name');
      var breadcrumbCityLink = document.getElementById('breadcrumb-city-link');

      if (titleEl) titleEl.textContent = titleText;
      if (metaTitle) metaTitle.textContent = titleText + ' - Find Paw Pal';
      if (metaDesc) metaDesc.content = 'Select Animal Shelters in ' + cityLabel + ' to get information on adoptable pets, animal adoption services, and more.';
      if (pageDesc) pageDesc.textContent = 'Explore all animal shelters in ' + cityLabel + ' to get information on adoptable pets, animal adoption services, and more. Select the shelter to find more details.';
      if (breadcrumbStateName) breadcrumbStateName.textContent = stateName;
      if (breadcrumbStateLink) breadcrumbStateLink.href = './shelter-city.html?state=' + stateSlug;
      if (breadcrumbCityName) breadcrumbCityName.textContent = cityLabel.split(',')[0].trim();
      if (breadcrumbCityLink) breadcrumbCityLink.href = './shelter-list.html?state=' + stateSlug + '&city=' + citySlug;
      if (metaCanonical) metaCanonical.href = 'https://www.findpawpal.com/animal-shelter/' + stateSlug + '/' + citySlug + '/';
    }

    async function initShelterListPage() {
      var params = new URLSearchParams(window.location.search);
      var stateSlug = params.get('state') || 'florida';
      var citySlug = params.get('city') || 'pensacola';
      var fallbackState = slugToTitle(stateSlug);
      var fallbackCity = slugToTitle(citySlug);
      var fallbackLabel = fallbackCity + ', ' + fallbackState;

      updatePageMeta(stateSlug, citySlug, fallbackState, fallbackLabel);

      var list = document.getElementById('shelter-list');
      if (list) {
        list.innerHTML = '<li class="store-list-item"><span>Loading shelters...</span></li>';
      }

      try {
        var res = await fetch('./data/shelters/offices/' + stateSlug + '/' + citySlug + '.json');
        if (!res.ok) throw new Error('Shelter data not found');
        var data = await res.json();
        var stateName = (data.state && data.state.name) || fallbackState;
        var cityLabel = (data.city && data.city.label) || fallbackLabel;
        updatePageMeta(stateSlug, citySlug, stateName, cityLabel);
        renderOffices(data.offices || []);
      } catch (err) {
        console.error('Failed to load shelters:', err);
        if (list) {
          list.innerHTML = '<li class="store-list-item"><span>Unable to load shelters for this city.</span></li>';
        }
      }
    }

    initShelterListPage();
  })();
</script>`;

const output = head + svgBlock + breadcrumbs + mainContent + `
<footer id="footer">

</footer>

` + scriptsBlock + initScript + '\n</body>\n</html>\n';

fs.writeFileSync(outPath, output);
console.log('build-shelter-list.js: wrote', outPath, 'lines:', output.split('\n').length);
