const fs = require('fs');
const path = require('path');

const cityPath = path.join(__dirname, '..', 'shelter-city.html');
let html = fs.readFileSync(cityPath, 'utf8');

const listStart = html.indexOf('<ul class="category-wrap">');
const listEnd = html.indexOf('</ul>', listStart) + 6;
if (listStart === -1) {
  console.error('category-wrap not found');
  process.exit(1);
}
html =
  html.slice(0, listStart) +
  '<ul class="category-wrap" id="city-list"></ul>' +
  html.slice(listEnd);

const oldInit = `<script>
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
</script>`;

const newInit = `<script>
  (function() {
  function slugToTitle(slug) {
    return slug.replace(/-/g, ' ').replace(/\\b\\w/g, function(c) { return c.toUpperCase(); });
  }

  function formatCategoryNums() {
    if (typeof jQuery !== 'undefined') {
      jQuery('.category-num').each(function () {
        jQuery(this).text(jQuery(this).text().toString().replace(/(\\d)(?=(?:\\d{3})+$)/g, '$1,'));
      });
    }
  }

  function renderCities(cities, stateSlug) {
    const list = document.getElementById('city-list');
    if (!list) return;

    if (!cities.length) {
      list.innerHTML = '<li class="category-item only-text category"><span>No cities found.</span></li>';
      return;
    }

    list.innerHTML = cities.map(function(city) {
      const href = city.url || ('https://www.findpawpal.com/animal-shelter/' + stateSlug + '/' + city.slug + '/');
      return (
        '<li class="category-item only-text category">' +
          '<a href="' + href + '" class="link-cover"></a>' +
          '<a href="' + href + '">' + city.name + '</a>' +
          '<div class="only-text-num category">' +
            '<span class="category-num category">' + city.offices + '</span>&nbsp;' +
            '<span class="category-unit category">' + (city.unit || 'Offices') + '</span>' +
          '</div>' +
        '</li>'
      );
    }).join('');

    formatCategoryNums();
  }

  function updateStateMeta(stateSlug, stateName) {
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
  }

  async function initStatePage() {
    const params = new URLSearchParams(window.location.search);
    const stateSlug = params.get('state') || 'alabama';
    const fallbackName = slugToTitle(stateSlug);
    updateStateMeta(stateSlug, fallbackName);

    const list = document.getElementById('city-list');
    if (list) {
      list.innerHTML = '<li class="category-item only-text category"><span>Loading cities...</span></li>';
    }

    try {
      const res = await fetch('./data/shelters/cities/' + stateSlug + '.json');
      if (!res.ok) throw new Error('City data not found');
      const data = await res.json();
      const stateName = (data.state && data.state.name) || fallbackName;
      updateStateMeta(stateSlug, stateName);
      renderCities(data.cities || [], stateSlug);
    } catch (err) {
      console.error('Failed to load cities:', err);
      if (list) {
        list.innerHTML = '<li class="category-item only-text category"><span>Unable to load cities for this state.</span></li>';
      }
    }
  }

  initStatePage();
  })();
</script>`;

if (!html.includes(oldInit.slice(0, 80))) {
  console.error('init script block not found');
  process.exit(1);
}
html = html.replace(oldInit, newInit);

fs.writeFileSync(cityPath, html);
console.log('patched', cityPath, 'lines:', html.split('\n').length);
