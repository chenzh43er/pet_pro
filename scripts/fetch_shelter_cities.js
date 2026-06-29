/**
 * Fetch US states and cities from findpawpal.com/animal-shelter/
 * Output: data/shelters/states.json, data/shelters/cities/{state}.json
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data', 'shelters');
const CITIES_DIR = path.join(DATA_DIR, 'cities');
const BASE = 'https://www.findpawpal.com';

const DELAY_MS = 400;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      Referer: `${BASE}/`,
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.text();
}

function slugFromHref(href) {
  const parts = href.replace(/\/+$/, '').split('/');
  return parts[parts.length - 1] || '';
}

function titleCase(slug) {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractCategoryItems(html) {
  const listMatch = html.match(/<ul class="category-wrap">([\s\S]*?)<\/ul>/);
  if (!listMatch) return [];

  const block = listMatch[1];
  const itemRe = /<li class="category-item only-text category">([\s\S]*?)<\/li>/g;
  const items = [];
  let m;

  while ((m = itemRe.exec(block)) !== null) {
    const chunk = m[1];
    const hrefMatch = chunk.match(/<a href="([^"]+)" class="link-cover"><\/a>/);
    const nameMatch = chunk.match(/<a href="[^"]+">([^<]+)<\/a>/);
    const numMatch = chunk.match(/<span class="category-num category">(\d+)<\/span>/);
    const unitMatch = chunk.match(/<span class="category-unit category">([^<]+)<\/span>/);

    if (!hrefMatch || !nameMatch || !numMatch) continue;

    const href = hrefMatch[1];
    items.push({
      slug: slugFromHref(href),
      name: nameMatch[1].trim(),
      offices: parseInt(numMatch[1], 10),
      unit: unitMatch ? unitMatch[1].trim() : 'Offices',
      url: href.startsWith('http') ? href : BASE + href,
    });
  }

  return items;
}

async function fetchStates() {
  const html = await fetchHtml(`${BASE}/animal-shelter/`);
  const states = extractCategoryItems(html);
  if (!states.length) {
    throw new Error('No states found on /animal-shelter/');
  }
  return states;
}

async function fetchCitiesForState(stateSlug) {
  const html = await fetchHtml(`${BASE}/animal-shelter/${stateSlug}/`);
  return extractCategoryItems(html);
}

async function main() {
  const onlyState = process.argv.find((a) => a.startsWith('--state='))?.split('=')[1];
  const skipExisting = process.argv.includes('--skip-existing');

  fs.mkdirSync(CITIES_DIR, { recursive: true });

  console.log('Fetching states from', `${BASE}/animal-shelter/`);
  const states = await fetchStates();
  console.log(`Found ${states.length} states`);

  const index = {
    fetchedAt: new Date().toISOString(),
    source: `${BASE}/animal-shelter/`,
    states: states.map((s) => ({
      slug: s.slug,
      name: s.name,
      offices: s.offices,
      unit: s.unit,
      url: s.url,
      citiesFile: `cities/${s.slug}.json`,
    })),
  };

  fs.writeFileSync(path.join(DATA_DIR, 'states.json'), JSON.stringify(index, null, 2));
  console.log('Wrote', path.join(DATA_DIR, 'states.json'));

  const targets = onlyState
    ? index.states.filter((s) => s.slug === onlyState)
    : index.states;

  if (onlyState && !targets.length) {
    throw new Error(`State not found: ${onlyState}`);
  }

  for (const state of targets) {
    const outPath = path.join(CITIES_DIR, `${state.slug}.json`);
    if (skipExisting && fs.existsSync(outPath)) {
      console.log(`Skip ${state.slug} (exists)`);
      continue;
    }

    process.stdout.write(`Fetching cities: ${state.name} (${state.slug})... `);
    await sleep(DELAY_MS);

    try {
      const cities = await fetchCitiesForState(state.slug);
      const payload = {
        fetchedAt: new Date().toISOString(),
        state: {
          slug: state.slug,
          name: state.name,
          offices: state.offices,
        },
        source: `${BASE}/animal-shelter/${state.slug}/`,
        cities,
      };
      fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
      console.log(`${cities.length} cities`);
    } catch (err) {
      console.log('FAILED:', err.message);
    }
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
