const fs = require('fs');
const path = require('path');

const statePath = path.join(__dirname, '..', 'shelter-state.html');
let html = fs.readFileSync(statePath, 'utf8');

html = html.replace(
  /href="\/" itemprop="item"><i itemprop="name">Find Paw Pal/g,
  'href="./index.html" itemprop="item"><i itemprop="name">Find Paw Pal'
);
html = html.replace(
  /href="\/animal-shelter\/" itemprop="item" class="cur-bread-crumbs"/g,
  'href="./shelter-state.html" itemprop="item" class="cur-bread-crumbs"'
);
html = html.replace(/href="\/animal-shelter\/([^/]+)\/"/g, 'href="./shelter-city.html?state=$1"');
html = html.replace(/href="\/dog-adoption\/"/g, 'href="./pet-adoption.html?type=dog"');
html = html.replace(/href="\/cat-adoption\/"/g, 'href="./pet-adoption.html?type=cat"');
html = html.replace(/href="\/animal-shelter\/"/g, 'href="./shelter-state.html"');

fs.writeFileSync(statePath, html);
console.log('fix-shelter-state-links.js: updated', statePath);
