import { GOOGLE_MAPS_EMBED_KEY } from './site-config.js';

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function detailHref(slug) {
  return './shelter-detail.html?slug=' + encodeURIComponent(slug);
}

function buildDescription(office) {
  const cityLabel = office.cityLabel || office.addressCity || '';
  const zip = office.zip ? ' ' + office.zip : '';
  return 'Find ' + office.name + ' in ' + cityLabel + zip
    + ' to get information on adoptable pet list and adoption service.'
    + ' Also, check nearby rescue centers, SPCA, and humane societies.';
}

function renderStoreInfo(office) {
  const list = document.getElementById('store-info');
  if (!list) return;

  const rows = [
    { icon: 'icon-user', text: office.name },
    { icon: 'icon-location', text: office.address },
    { icon: 'icon-tel', text: office.phone },
  ].filter(function(row) { return row.text; });

  list.innerHTML = rows.map(function(row) {
    return (
      '<li class="store-info-item">' +
        '<svg class="icon-category"><use xlink:href="#' + row.icon + '"></use></svg>' +
        '<span>' + escapeHtml(row.text) + '</span>' +
      '</li>'
    );
  }).join('');
}

function buildGoogleMapEmbedUrl(office, detail) {
  if (detail && detail.mapEmbedUrl) {
    return detail.mapEmbedUrl;
  }
  if (!GOOGLE_MAPS_EMBED_KEY) {
    return null;
  }
  const query = office.address || office.name;
  return (
    'https://www.google.com/maps/embed/v1/place?key=' +
    encodeURIComponent(GOOGLE_MAPS_EMBED_KEY) +
    '&q=' + encodeURIComponent(query)
  );
}

function renderMapFallback(mapEl, office) {
  const query = encodeURIComponent(office.address || office.name);
  mapEl.innerHTML =
    '<a class="map-link" href="https://www.google.com/maps/search/?api=1&query=' + query + '" target="_blank" rel="noopener noreferrer">' +
      'View ' + escapeHtml(office.name) + ' on Google Maps' +
    '</a>';
}

function renderMap(office, detail) {
  const mapEl = document.getElementById('shelter-map');
  if (!mapEl || !office.address) {
    if (mapEl) mapEl.innerHTML = '';
    return;
  }

  const embedUrl = buildGoogleMapEmbedUrl(office, detail);
  if (!embedUrl) {
    renderMapFallback(mapEl, office);
    return;
  }

  mapEl.innerHTML =
    '<iframe width="100%" height="100%" style="border:0" loading="lazy" allowfullscreen="" ' +
    'referrerpolicy="no-referrer-when-downgrade" title="Map location" ' +
    'src="' + escapeHtml(embedUrl) + '"></iframe>';
}

const NEARBY_COUNT = 4;

function pickRandomItems(items, count, excludeSlug) {
  const pool = items.filter(function(item) {
    return item && item.slug && item.slug !== excludeSlug;
  });
  if (!pool.length) return [];

  const shuffled = pool.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function normalizeShelterImage(office) {
  return office.imageUrl || office.image || '';
}

function normalizeOfficeRecord(office) {
  return {
    slug: office.slug,
    name: office.name,
    address: office.address,
    phone: office.phone || '',
    image: office.imageUrl || office.image || '',
  };
}

async function loadCityShelters(stateSlug, citySlug, excludeSlug) {
  if (!stateSlug || !citySlug) return [];

  try {
    const res = await fetch('./data/shelters/offices/' + stateSlug + '/' + citySlug + '.json');
    if (!res.ok) return [];
    const data = await res.json();
    const offices = (data.offices || []).map(normalizeOfficeRecord);
    return pickRandomItems(offices, NEARBY_COUNT, excludeSlug);
  } catch (err) {
    console.warn('Failed to load city shelters', err);
    return [];
  }
}

async function loadStateShelters(stateSlug, excludeSlug) {
  if (!stateSlug) return [];

  try {
    const res = await fetch('./data/shelters/states/' + stateSlug + '.json');
    if (!res.ok) return [];
    const data = await res.json();
    return pickRandomItems(data.shelters || [], NEARBY_COUNT, excludeSlug);
  } catch (err) {
    console.warn('Failed to load state shelters', err);
    return [];
  }
}

async function loadNearbyShelters(office) {
  const cityShelters = await loadCityShelters(office.stateSlug, office.citySlug, office.slug);
  if (cityShelters.length) {
    return cityShelters;
  }
  return loadStateShelters(office.stateSlug, office.slug);
}

function renderNearby(offices) {
  const section = document.getElementById('nearby-section');
  const list = document.getElementById('nearby-list');
  if (!section || !list) return;

  if (!offices.length) {
    list.innerHTML = '';
    return;
  }

  list.innerHTML = offices.map(function(office) {
    const href = detailHref(office.slug);
    const img = normalizeShelterImage(office);
    const phoneHtml = office.phone
      ? '<div class="store-tel"><svg width="14" height="14"><use xlink:href="#icon-tel"></use></svg><span>' + escapeHtml(office.phone) + '</span></div>'
      : '';
    const addrHtml = office.address
      ? '<div class="store-location"><svg width="14" height="14"><use xlink:href="#icon-location"></use></svg><span>' + escapeHtml(office.address) + '</span></div>'
      : '';

    return (
      '<li class="store-list-item">' +
        '<a href="' + escapeHtml(href) + '" class="link-cover"></a>' +
        '<div class="store-img"><img src="' + escapeHtml(img) + '" alt="' + escapeHtml(office.name) + '"></div>' +
        '<div class="store-content">' +
          '<div class="store-left">' +
            '<div class="store-slug"><a href="' + escapeHtml(href) + '"><h3>' + escapeHtml(office.name) + '</h3></a></div>' +
            addrHtml +
            phoneHtml +
          '</div>' +
          '<div class="store-right">' +
            '<svg fill="#ffffff" width="14" height="14"><use xlink:href="#icon-go"></use></svg>' +
          '</div>' +
        '</div>' +
      '</li>'
    );
  }).join('');
}

function updateMeta(office) {
  const cityLabel = office.cityLabel || '';
  const titleText = office.name + ' in ' + cityLabel + ' - Find Paw Pal';
  const description = buildDescription(office);
  const canonical = office.url || ('https://www.findpawpal.com/animal-shelter/' + office.slug + '/');

  document.title = titleText;
  const metaTitle = document.getElementById('meta-title');
  const metaDesc = document.getElementById('meta-description');
  const metaCanonical = document.getElementById('meta-canonical');
  const pageTitle = document.getElementById('page-title');
  const pageDesc = document.getElementById('page-description');

  if (metaTitle) metaTitle.textContent = titleText;
  if (metaDesc) metaDesc.setAttribute('content', description);
  if (metaCanonical) metaCanonical.setAttribute('href', canonical);
  if (pageTitle) pageTitle.textContent = office.name;
  if (pageDesc) pageDesc.textContent = description;

  const stateLink = document.getElementById('breadcrumb-state-link');
  const stateName = document.getElementById('breadcrumb-state-name');
  const cityLink = document.getElementById('breadcrumb-city-link');
  const cityName = document.getElementById('breadcrumb-city-name');
  const shelterName = document.getElementById('breadcrumb-shelter-name');

  if (stateLink && office.stateSlug) {
    stateLink.href = './shelter-city.html?state=' + encodeURIComponent(office.stateSlug);
  }
  if (stateName && office.stateName) stateName.textContent = office.stateName;
  if (cityLink && office.stateSlug && office.citySlug) {
    cityLink.href = './shelter-list.html?state=' + encodeURIComponent(office.stateSlug)
      + '&city=' + encodeURIComponent(office.citySlug);
  }
  if (cityName && office.cityName) cityName.textContent = office.cityName;
  if (shelterName) shelterName.textContent = office.name;
}

async function loadOffice(slug) {
  const itemRes = await fetch('./data/shelters/items/' + slug + '.json');
  if (!itemRes.ok) throw new Error('Shelter not found');
  const office = await itemRes.json();

  let detail = null;
  try {
    const detailRes = await fetch('./data/shelters/details/' + slug + '.json');
    if (detailRes.ok) {
      detail = await detailRes.json();
    }
  } catch (_) {}

  return { office, detail };
}

function showError(message) {
  const pageTitle = document.getElementById('page-title');
  const pageDesc = document.getElementById('page-description');
  if (pageTitle) pageTitle.textContent = 'Shelter Not Found';
  if (pageDesc) pageDesc.textContent = message;
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) {
    showError('Missing shelter slug in URL.');
    return;
  }

  try {
    const { office, detail } = await loadOffice(slug);
    updateMeta(office);
    renderStoreInfo(office);
    renderMap(office, detail);
    const nearby = await loadNearbyShelters(office);
    renderNearby(nearby);
  } catch (err) {
    console.error(err);
    showError('Unable to load shelter details.');
  }
}

init();
