import { fetchPets } from './supabaseApi.js';
import { getAssets } from './layout-loader.js';

const ROOT = '../../../';
const QUIZ_BASE = '../';
const ASSETS = getAssets(ROOT);
const LOADING_IMG = ASSETS.loadingDog;
const NAMES_FILE = `${ROOT}data/names/dog-names.json`;
const RESULT_COUNT = 5;

function getGenderIcon(gender) {
  if (gender === 'girl') return 'icon-girl';
  if (gender === 'unisex') return 'icon-unisex';
  return 'icon-boy';
}

function filterNamesByGender(names, gender) {
  const value = gender.toLowerCase();
  if (value === 'boy') return names.filter((name) => name.gender === 'boy');
  if (value === 'girl') return names.filter((name) => name.gender === 'girl');
  return names;
}

function pickRandomNames(names, count) {
  const pool = [...names];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

function getNameHref(name) {
  if (name.path) return name.path;
  return `/dog-name/${name.slug}/`;
}

function renderResultRows(items) {
  return items.map((item) => {
    const href = getNameHref(item);
    const icon = getGenderIcon(item.gender);
    return `
      <tr>
        <td class="link-cover"><a class="link-cover" href="${href}"></a></td>
        <td class="name-gender">
          <svg class="${icon}">
            <use xlink:href="#${icon}"></use>
          </svg>
        </td>
        <td class="name-value"><a href="${href}">${item.name}</a></td>
        <td class="name-des"><a href="${href}">${item.meaning || ''}</a></td>
        <td class="name-fav">
          <svg class="icon-fav icon-empty">
            <use xlink:href="#icon-empty"></use>
          </svg>
          <svg class="icon-fav icon-fill">
            <use xlink:href="#icon-fill"></use>
          </svg>
          <div class="add-fly"><span class="add-fly-item"></span></div>
        </td>
      </tr>
    `;
  }).join('');
}

async function fetchNameList(gender) {
  try {
    const response = await fetch(NAMES_FILE);
    const names = await response.json();
    const filtered = filterNamesByGender(names, gender);
    return pickRandomNames(filtered, RESULT_COUNT);
  } catch (err) {
    return [];
  }
}

function renderAside() {
  const meanings = [
    ['unique', 'Unique Names'],
    ['love', 'Love Names'],
    ['light', 'Light Names'],
    ['beloved', 'Beloved Names'],
    ['peace', 'Peace Names'],
    ['free', 'Free Names'],
    ['bright', 'Bright Names'],
    ['noble', 'Noble Names'],
    ['brave', 'Brave Names'],
    ['beautiful', 'Beautiful Names'],
  ];
  const origins = [
    ['english', 'English Names'],
    ['french', 'French Names'],
    ['latin', 'Latin Names'],
    ['greek', 'Greek Names'],
    ['spanish', 'Spanish Names'],
    ['german', 'German Names'],
    ['irish', 'Irish Names'],
    ['japanese', 'Japanese Names'],
    ['italian', 'Italian Names'],
    ['arabic', 'Arabic Names'],
  ];

  document.getElementById('aside-meaning-list').innerHTML = meanings.map(([value, label]) => (
    `<li class="name-meaning-item"><a href="${ROOT}pet-name.html?type=dog&meaning=${value}">${label}</a></li>`
  )).join('');

  document.getElementById('aside-origin-list').innerHTML = origins.map(([value, label]) => (
    `<li class="name-origin-item"><a href="${ROOT}pet-name.html?type=dog&origin=${value}">${label}</a></li>`
  )).join('');
}

async function renderRelatedPets() {
  const container = document.getElementById('related-pets');
  if (!container) return;

  try {
    const { data: petsData } = await fetchPets({ type: 'dog', limit: 6, offset: 0 });
    const pets = (petsData?.data || []).slice(0, 6);
    const originImg = 'https://pub-3eafecaf756244c2a5c330109d4c45e7.r2.dev/';

    container.innerHTML = pets.map((pet) => {
      const imgSrc = pet.image ? originImg + pet.image : LOADING_IMG;
      const genderIcon = pet.gender === 'Female' ? 'Female' : 'Male';
      return `
        <div class="adoption-con">
          <div class="adoption-item">
            <a class="link-cover" href="${ROOT}detail-adoption.html?id=${pet.id}"></a>
            <div class="img-clip">
              <img class="section-img" src="${imgSrc}" alt="${pet.name}">
            </div>
            <div class="section-info">
              <svg class="icon-gender"><use xlink:href="#icon-${genderIcon}"></use></svg>
              <div class="info-name">${pet.name}</div>
              <div class="info-feature">
                <span>${pet.size || '-'}</span>
                <span>${pet.age || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = '';
  }
}

async function init() {
  const gender = localStorage.getItem('name-generate-gender');

  if (!gender) {
    window.location = QUIZ_BASE;
    return;
  }

  const items = await fetchNameList(gender);
  $('.search-loading-result').css('display', 'none');
  $('.name-table').css('display', 'table');
  $('.name-table tbody').append(renderResultRows(items));

  if (typeof window.bindNameFavClick === 'function') {
    window.bindNameFavClick();
  }
  if (typeof window.syncNameFavorites === 'function') {
    window.syncNameFavorites();
  }

  renderAside();
  await renderRelatedPets();
}

init();
