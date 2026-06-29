const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const listPath = path.join(root, 'shelter-list.html');
const detailAdoptionPath = path.join(root, 'detail-adoption.html');
const outPath = path.join(root, 'shelter-detail.html');

const listRaw = fs.readFileSync(listPath, 'utf8');
const detailRaw = fs.readFileSync(detailAdoptionPath, 'utf8');

const svgStart = listRaw.indexOf('<div class="index-cover-header"></div>');
const breadStart = listRaw.indexOf('<div class="bread-crumbs-wrap">', svgStart);
const svgClose = listRaw.lastIndexOf('</svg>', breadStart);
let svgBlock = listRaw.slice(svgStart, svgClose + 6);

const iconUser = detailRaw.match(/<symbol id="icon-user"[\s\S]*?<\/symbol>/)?.[0]
  || `<symbol id="icon-user" viewBox="0 0 512 512"><path d="M256,256a112,112,0,1,0-112-112A112,112,0,0,0,256,256Zm0,48c-70.7,0-192,35.4-192,106.7V448a32,32,0,0,0,32,32H416a32,32,0,0,0,32-32V410.7C448,339.4,326.7,304,256,304Z"></path></symbol>`;

if (!svgBlock.includes('id="icon-user"')) {
  svgBlock = svgBlock.replace('    </defs>\r\n</svg>', `        ${iconUser}\r\n    </defs>\r\n</svg>`);
  svgBlock = svgBlock.replace('    </defs>\n</svg>', `        ${iconUser}\n    </defs>\n</svg>`);
}

const asideStart = listRaw.indexOf('<div class="aside"');
const asideEnd = listRaw.indexOf('</main>', asideStart);
const asideBlock = listRaw.slice(asideStart, asideEnd).replace(/\s*<\/div>\s*<\/div>\s*<\/div>\s*$/, '');

const headerFooterScriptsStart = listRaw.indexOf('<script src="./js/jquery.min.js">');
const headerFooterScriptsEnd = listRaw.indexOf('<script type="module">', headerFooterScriptsStart);
const headerFooterScripts = listRaw.slice(headerFooterScriptsStart, headerFooterScriptsEnd);

const head = `<!DOCTYPE html>
<html lang="en">
<head>

  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no,viewport-fit=cover">
  <title id="meta-title">Animal Shelter - Find Paw Pal</title>
  <link rel="preload" href="./css/style.css?v-0323" as="style">
  <link rel="stylesheet" href="./css/style.css?v-0323">
  <link rel="canonical" id="meta-canonical" href="https://www.findpawpal.com/animal-shelter/">
  <meta name="description" id="meta-description" content="Find animal shelter information on adoptable pets and adoption services.">

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
                <a href="./shelter-city.html?state=alabama" itemprop="item" class="cur-bread-crumbs" id="breadcrumb-state-link">
            <i itemprop="name" id="breadcrumb-state-name">Alabama</i>
        </a>
        <meta itemprop="position" content="3">
            </span>
            <span itemprop="itemListElement" itemscope="" itemtype="http://schema.org/ListItem">
        <span class="bread-crumbs-icon">&gt;</span>
                <a href="./shelter-list.html?state=alabama&amp;city=alabaster" itemprop="item" class="cur-bread-crumbs" id="breadcrumb-city-link">
            <i itemprop="name" id="breadcrumb-city-name">Alabaster</i>
        </a>
        <meta itemprop="position" content="4">
            </span>
            <span itemprop="itemListElement" itemscope="" itemtype="http://schema.org/ListItem">
        <span class="bread-crumbs-icon">&gt;</span>
                <span class="cur-bread-crumbs" id="breadcrumb-shelter-name">Shelter</span>
        <meta itemprop="position" content="5">
            </span>
        </div>
        <!--breadcrumbs end--></div>
</div>
<main>
    <div class="main main-common">
        <div class="container">
            <h1 id="page-title">Animal Shelter</h1>
        </div>
        <div class="main-bottom">
            <div class="container">
                <p class="category-des" id="page-description"></p>
                <div class="store-detail">
                    <ul class="store-info" id="store-info"></ul>
                    <div class="store-detail-map" id="shelter-map"></div>
                </div>
                <div class="store-list detail" id="nearby-section">
                    <h2>Nearby Animal Shelters</h2>
                    <ul class="store-list-wrap common" id="nearby-list"></ul>
                </div>
            </div>
            ${asideBlock}
    </div>
</main>
<footer id="footer">

</footer>

${headerFooterScripts}
<script type="module" src="./js/shelter-detail.js"></script>
</body>
</html>
`;

const html = head + svgBlock + breadcrumbs;
fs.writeFileSync(outPath, html, 'utf8');
console.log('Wrote', outPath, `(${html.length} bytes)`);
