const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const cityPath = path.join(root, 'shelter-city.html');
const statePath = path.join(root, 'shelter-state.html');

const cityRaw = fs.readFileSync(cityPath, 'utf8');
const stateRaw = fs.readFileSync(statePath, 'utf8');

// Extract city list items from original file
const listStart = cityRaw.indexOf('<ul class="category-wrap">');
const listEnd = cityRaw.indexOf('</ul>', listStart) + 6;
if (listStart === -1 || listEnd === -1) {
  console.error('Could not find category-wrap');
  process.exit(1);
}
let cityListInner = cityRaw.slice(listStart, listEnd);
// Remove ad blocks inside list
cityListInner = cityListInner.replace(/<div class="ads-list">[\s\S]*?<\/div>\s*/g, '');

// Extract SVG block from state (full svg through closing tag before bread-crumbs)
const svgStart = stateRaw.indexOf('<div class="index-cover-header"></div>');
const breadStart = stateRaw.indexOf('<div class="bread-crumbs-wrap">', svgStart);
if (breadStart === -1) {
  console.error('Could not find bread-crumbs-wrap');
  process.exit(1);
}
const svgClose = stateRaw.lastIndexOf('</svg>', breadStart);
if (svgClose === -1 || svgClose < svgStart) {
  console.error('Could not find SVG closing tag');
  process.exit(1);
}
const svgBlock = stateRaw.slice(svgStart, svgClose + 6);

// Extract aside from state (aside div only)
const asideStart = stateRaw.indexOf('<div class="aside"');
const asideEnd = stateRaw.indexOf('</main>', asideStart);
let asideBlock = stateRaw.slice(asideStart, asideEnd).replace(/\s*<\/div>\s*<\/div>\s*<\/div>\s*$/, '');

const fixedAside = asideBlock
  .replace(/href="\/dog-adoption\/"/g, 'href="./pet-adoption.html?type=dog"')
  .replace(/href="\/cat-adoption\/"/g, 'href="./pet-adoption.html?type=cat"')
  .replace(/href="\/animal-shelter\/"/g, 'href="./shelter-state.html"');

// Extract scripts from state (jquery through loadRelatedPets, without closing body)
const scriptsStart = stateRaw.indexOf('<script src="./js/jquery.min.js">');
const scriptsEnd = stateRaw.indexOf('</body>', scriptsStart);
const scriptsBlock = stateRaw.slice(scriptsStart, scriptsEnd);

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
                <a href="./shelter-city.html?state=alabama" itemprop="item" class="cur-bread-crumbs" id="breadcrumb-state-link">
            <i itemprop="name" id="breadcrumb-state-name">Alabama</i>
        </a>
        <meta itemprop="position" content="3">
            </span>
        </div>
        <!--breadcrumbs end--></div>
</div>`;

const mainContent = `
<main style="height: auto !important;">
    <div class="main main-common" style="height: auto !important;">
        <div class="container">
            <h1 id="page-title">Animal Shelters in Alabama</h1>
        </div>
        <div class="main-bottom" style="height: auto !important;">
            <div class="container">
                <p class="category-des" id="page-description">Explore all animal shelters in Alabama to get information on adoptable pets, animal adoption services, and more. Select your city to find more details.</p>
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
                <div class="category-list">
                    ${cityListInner}
                </div>
                <div class="animal-relative">
                    <h2>You May Also Like Them</h2>
                    <div class="adoption-list relative" id="related-pets"></div>
                </div>
            </div>
            ${fixedAside}
        </div>
    </div>
</main>`;

const head = `<!DOCTYPE html>
<html lang="en">
<head>

  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no,viewport-fit=cover">
  <title id="meta-title">Animal Shelters in Alabama - Find Paw Pal</title>
  <link rel="preload" href="./css/style.css?v-0323" as="style">
  <link rel="stylesheet" href="./css/style.css?v-0323">
  <link rel="canonical" id="meta-canonical" href="https://www.findpawpal.com/animal-shelter/alabama/">
  <meta name="description" id="meta-description" content="Select Animal Shelters in Alabama to get information on adoptable pets, animal adoption services, and more.">

</head>

<body>
<header id="mainHeader">
</header>

`;

const stateInitScript = `
<script>
  (function initStateFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const stateSlug = params.get('state') || 'alabama';
    const stateName = stateSlug.replace(/-/g, ' ').replace(/\\b\\w/g, function(c) { return c.toUpperCase(); });
    const titleEl = document.getElementById('page-title');
    const metaTitle = document.getElementById('meta-title');
    const metaDesc = document.getElementById('meta-description');
    const metaCanonical = document.getElementById('meta-canonical');
    const breadcrumbName = document.getElementById('breadcrumb-state-name');
    const breadcrumbLink = document.getElementById('breadcrumb-state-link');
    const pageDesc = document.getElementById('page-description');

    if (titleEl) titleEl.textContent = 'Animal Shelters in ' + stateName;
    if (metaTitle) metaTitle.textContent = 'Animal Shelters in ' + stateName + ' - Find Paw Pal';
    if (breadcrumbName) breadcrumbName.textContent = stateName;
    if (breadcrumbLink) breadcrumbLink.href = './shelter-city.html?state=' + stateSlug;
    if (metaCanonical) metaCanonical.href = 'https://www.findpawpal.com/animal-shelter/' + stateSlug + '/';
    if (metaDesc) metaDesc.content = 'Select Animal Shelters in ' + stateName + ' to get information on adoptable pets, animal adoption services, and more.';
    if (pageDesc) pageDesc.textContent = 'Explore all animal shelters in ' + stateName + ' to get information on adoptable pets, animal adoption services, and more. Select your city to find more details.';
  })();
</script>
`;

const output = head + svgBlock + breadcrumbs + mainContent + `
<footer id="footer">

</footer>

` + scriptsBlock + stateInitScript + '\n</body>\n</html>\n';

fs.writeFileSync(cityPath, output);
console.log('refactor-shelter-city.js: wrote', cityPath, 'lines:', output.split('\n').length);
