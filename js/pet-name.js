import { fetchPets } from './supabaseApi.js';

const PAGE_SIZE = 9;

const ORIGIN_IMG = 'https://pub-3eafecaf756244c2a5c330109d4c45e7.r2.dev/';

const ORIGIN_OPTIONS = [
  { value: 'english', label: 'English Names' },
  { value: 'french', label: 'French Names' },
  { value: 'latin', label: 'Latin Names' },
  { value: 'greek', label: 'Greek Names' },
  { value: 'spanish', label: 'Spanish Names' },
  { value: 'german', label: 'German Names' },
  { value: 'irish', label: 'Irish Names' },
  { value: 'japanese', label: 'Japanese Names' },
  { value: 'italian', label: 'Italian Names' },
  { value: 'arabic', label: 'Arabic Names' },
];

const TYPE_CONFIG = {
  dog: {
    title: 'Dog Names - Find Paw Pal',
    listTitle: 'Dog Names',
    description: 'Explore our full dog name database and find the best dog name for your beloved furry friend by genders, origins, meanings, and initials.',
    canonical: 'https://www.findpawpal.com/dog-name/',
    breadcrumbLabel: 'Dog Names',
    dataFile: './data/names/dog-names.json',
    generatorLink: './quiz/dog-name-generator/index.html',
    generatorLabel: 'Dog',
    generatorImg: './img/generator/dog-generator.webp',
    generatorImgMobile: './img/generator/dog-generator-m.webp',
    adoptionLink: './pet-adoption.html?type=dog',
    loadingImage: './img/loading-dog.webp',
    meanings: [
      { value: 'unique', label: 'Unique Names' },
      { value: 'love', label: 'Love Names' },
      { value: 'light', label: 'Light Names' },
      { value: 'beloved', label: 'Beloved Names' },
      { value: 'peace', label: 'Peace Names' },
      { value: 'free', label: 'Free Names' },
      { value: 'bright', label: 'Bright Names' },
      { value: 'noble', label: 'Noble Names' },
      { value: 'brave', label: 'Brave Names' },
      { value: 'beautiful', label: 'Beautiful Names' },
    ],
  },
  cat: {
    title: 'Cat Names - Find Paw Pal',
    listTitle: 'Cat Names',
    description: 'Explore our full cat name database and find the best cat name for your beloved furry friend by genders, origins, meanings, and initials.',
    canonical: 'https://www.findpawpal.com/cat-name/',
    breadcrumbLabel: 'Cat Names',
    dataFile: './data/names/cat-names.json',
    generatorLink: './quiz/cat-name-generator/index.html',
    generatorLabel: 'Cat',
    generatorImg: './img/generator/cat-generator.webp',
    generatorImgMobile: './img/generator/cat-generator-m.webp',
    adoptionLink: './pet-adoption.html?type=cat',
    loadingImage: './img/loading-cat.webp',
    meanings: [
      { value: 'unique', label: 'Unique Names' },
      { value: 'strong', label: 'Strong Names' },
      { value: 'bless', label: 'Bless Names' },
      { value: 'dark', label: 'Dark Names' },
      { value: 'light', label: 'Light Names' },
      { value: 'noble', label: 'Noble Names' },
      { value: 'wise', label: 'Wise Names' },
      { value: 'bright', label: 'Bright Names' },
      { value: 'power', label: 'Power Names' },
      { value: 'brave', label: 'Brave Names' },
    ],
  },
};

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

function getPetType() {
  const params = new URLSearchParams(window.location.search);
  const type = (params.get('type') || 'dog').toLowerCase();
  return type === 'cat' ? 'cat' : 'dog';
}

function getFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    page: Math.max(1, parseInt(params.get('page') || '1', 10)),
    initial: (params.get('initial') || '').toLowerCase(),
    gender: (params.get('gender') || '').toLowerCase(),
    origin: (params.get('origin') || '').toLowerCase(),
    meaning: (params.get('meaning') || '').toLowerCase(),
  };
}

function buildUrl(petType, filters) {
  const params = new URLSearchParams();
  params.set('type', petType);
  if (filters.initial) params.set('initial', filters.initial);
  if (filters.gender) params.set('gender', filters.gender);
  if (filters.origin) params.set('origin', filters.origin);
  if (filters.meaning) params.set('meaning', filters.meaning);
  if (filters.page > 1) params.set('page', String(filters.page));
  return `./pet-name.html?${params.toString()}`;
}

function capitalize(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getPageTitle(config, filters) {
  if (filters.meaning) {
    return `${config.listTitle} That Mean ${capitalize(filters.meaning)}`;
  }
  if (filters.origin) {
    return `${capitalize(filters.origin)} ${config.listTitle}`;
  }
  if (filters.initial) {
    return `${config.listTitle} Starting With ${filters.initial.toUpperCase()}`;
  }
  return config.listTitle;
}

function matchesFilters(name, filters) {
  if (filters.initial && !name.slug.startsWith(filters.initial)) {
    return false;
  }
  if (filters.gender && name.gender !== filters.gender) {
    return false;
  }
  if (filters.meaning) {
    const meaning = (name.meaning || '').toLowerCase();
    if (!meaning.includes(filters.meaning)) {
      return false;
    }
  }
  if (filters.origin) {
    const origin = (name.origin || '').toLowerCase();
    if (!origin.includes(filters.origin)) {
      return false;
    }
  }
  return true;
}

function getGenderIcon(gender) {
  if (gender === 'girl') return 'icon-girl';
  if (gender === 'unisex') return 'icon-unisex';
  return 'icon-boy';
}

function applyMeta(config, petType, filters) {
  const pageTitle = getPageTitle(config, filters);
  document.title = pageTitle === config.listTitle ? config.title : `${pageTitle} - Find Paw Pal`;

  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = config.description;

  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = config.canonical;

  document.getElementById('breadcrumb-link').href = buildUrl(petType, { page: 1 });
  document.getElementById('breadcrumb-label').textContent = config.breadcrumbLabel;
  document.getElementById('page-title').textContent = pageTitle;
}

function renderLetterFilter(petType, filters) {
  const container = document.getElementById('letter-list');
  const baseFilters = { ...filters, page: 1, initial: '' };

  const items = [
    `<div class="letter-con"><span class="letter-item letter-all${filters.initial ? '' : ' active'}"><a href="${buildUrl(petType, baseFilters)}">ALL</a></span></div>`,
    ...LETTERS.map((letter) => {
      const active = filters.initial === letter ? ' active' : '';
      return `<div class="letter-con"><span class="letter-item${active}"><a href="${buildUrl(petType, { ...baseFilters, initial: letter })}">${letter.toUpperCase()}</a></span></div>`;
    }),
  ];

  container.innerHTML = items.join('');
}

function renderGenderFilter(filters) {
  document.querySelectorAll('.gender-item').forEach((item) => {
    const label = item.textContent.trim().toLowerCase();
    const value = label === 'all' ? '' : label;
    item.classList.toggle('active', value === (filters.gender || '') || (label === 'all' && !filters.gender));
  });
}

function bindGenderFilter(petType, filters) {
  document.querySelectorAll('.gender-item').forEach((item) => {
    item.onclick = () => {
      const label = item.textContent.trim().toLowerCase();
      const nextFilters = {
        initial: filters.initial,
        origin: filters.origin,
        meaning: filters.meaning,
        page: 1,
        gender: label === 'all' ? '' : label,
      };
      window.location.href = buildUrl(petType, nextFilters);
    };
  });
}

function renderNameRow(name) {
  const href = name.url || name.path || '#';
  const meaning = name.meaning || '';
  const genderIcon = getGenderIcon(name.gender);

  return `
    <tr>
      <td class="link-cover"><a class="link-cover" href="${href}"></a></td>
      <td class="name-gender">
        <svg class="${genderIcon}"><use xlink:href="#${genderIcon}"></use></svg>
      </td>
      <td class="name-value"><a href="${href}">${name.name}</a></td>
      <td class="name-des"><a href="${href}">${meaning}</a></td>
      <td class="name-fav">
        <svg class="icon-fav icon-empty"><use xlink:href="#icon-empty"></use></svg>
        <svg class="icon-fav icon-fill"><use xlink:href="#icon-fill"></use></svg>
        <div class="add-fly"><span class="add-fly-item"></span></div>
      </td>
    </tr>
  `;
}

function renderPagination(petType, filters, totalPages, currentPage) {
  const container = document.getElementById('page-wrap');
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  const parts = [];
  const pageFilters = { ...filters };

  if (currentPage > 1) {
    parts.push(`<a href="${buildUrl(petType, { ...pageFilters, page: currentPage - 1 })}" class="page-back-active">Previous</a>`);
  } else {
    parts.push('<span class="page-back">Previous</span>');
  }

  const windowSize = 4;
  let start = Math.max(1, currentPage - 1);
  let end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);

  for (let page = start; page <= end; page += 1) {
    if (page === currentPage) {
      parts.push(`<a href="" class="page-cur">${page}</a>`);
    } else {
      parts.push(`<a href="${buildUrl(petType, { ...pageFilters, page })}" title="${page}" class="page-nor">${page}</a>`);
    }
  }

  if (end < totalPages) {
    parts.push('<p class="pageEllipsis">...</p>');
    parts.push(`<a href="${buildUrl(petType, { ...pageFilters, page: totalPages })}" title="${totalPages}" class="page-nor">${totalPages}</a>`);
  }

  if (currentPage < totalPages) {
    parts.push(`<a href="${buildUrl(petType, { ...pageFilters, page: currentPage + 1 })}" title="" class="page-next-active">Next<svg class="icon-next"><use xlink:href="#icon-next"></use></svg></a>`);
  }

  container.innerHTML = `<div class="brpp_pageGo">${parts.join(' ')}</div>`;
}

function renderGenerator(config) {
  const block = document.getElementById('name-generate');
  block.querySelector('.link-cover').href = config.generatorLink;
  block.querySelector('.name-generate-title span').textContent = config.generatorLabel;
  block.querySelector('.name-generate-img').src = config.generatorImg;
  block.querySelector('.name-generate-img-moile').src = config.generatorImgMobile;
}

function renderAside(config, petType) {
  document.getElementById('aside-dog-link').href = './pet-adoption.html?type=dog';
  document.getElementById('aside-cat-link').href = './pet-adoption.html?type=cat';
  document.getElementById('aside-shelter-link').href = './shelter-state.html';

  document.getElementById('aside-meaning-list').innerHTML = config.meanings.map((item) => {
    return `<li class="name-meaning-item"><a href="${buildUrl(petType, { meaning: item.value, page: 1 })}">${item.label}</a></li>`;
  }).join('');

  document.getElementById('aside-origin-list').innerHTML = ORIGIN_OPTIONS.map((item) => {
    return `<li class="name-origin-item"><a href="${buildUrl(petType, { origin: item.value, page: 1 })}">${item.label}</a></li>`;
  }).join('');
}

function renderRelatedPets(pets, config) {
  const container = document.getElementById('related-pets');
  if (!container) return;

  if (!pets.length) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = pets.map((pet) => {
    const imgSrc = pet.image ? ORIGIN_IMG + pet.image : config.loadingImage;
    const genderIcon = pet.gender === 'Female' ? 'Female' : 'Male';
    return `
      <div class="adoption-con">
        <div class="adoption-item">
          <a class="link-cover" href="./detail-adoption.html?id=${pet.id}"></a>
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
}

async function loadRelatedPets(petType, config) {
  const { data: petsData } = await fetchPets({ type: petType, limit: 6, offset: 0 });
  const related = (petsData?.data || []).slice(0, 6);
  renderRelatedPets(related, config);
}

async function init() {
  const petType = getPetType();
  const config = TYPE_CONFIG[petType];
  const filters = getFiltersFromUrl();

  applyMeta(config, petType, filters);
  renderLetterFilter(petType, filters);
  renderGenderFilter(filters);
  bindGenderFilter(petType, filters);
  renderGenerator(config);
  renderAside(config, petType);

  const response = await fetch(config.dataFile);
  const names = await response.json();
  const filtered = names.filter((name) => matchesFilters(name, filters));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(filters.page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  document.getElementById('name-table-body').innerHTML = pageItems.map(renderNameRow).join('');
  renderPagination(petType, filters, totalPages, currentPage);

  if (typeof window.syncNameFavorites === 'function') {
    window.syncNameFavorites();
  }

  await loadRelatedPets(petType, config);
}

init();
