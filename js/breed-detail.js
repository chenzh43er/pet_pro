import { fetchPets } from './supabaseApi.js';

const ORIGIN_IMG = 'https://pub-3eafecaf756244c2a5c330109d4c45e7.r2.dev/';

const TYPE_CONFIG = {
  cat: {
    label: 'Cat Breeds',
    listPage: './pet-breed.html?type=cat',
    adoptionPage: './pet-adoption.html?type=cat',
    adoptionLabel: 'Cat Adoption',
    adoptionMore: 'Cats',
    loadingImage: './img/loading-cat.webp',
    groupHeading: (group) => `${group || 'Related'} Breeds`,
  },
  dog: {
    label: 'Dog Breeds',
    listPage: './pet-breed.html?type=dog',
    adoptionPage: './pet-adoption.html?type=dog',
    adoptionLabel: 'Dog Adoption',
    adoptionMore: 'Dogs',
    loadingImage: './img/loading-dog.webp',
    groupHeading: (group) => `${group || 'Related'} Breeds`,
  },
};

const PROFILE_FIELDS = [
  { key: 'nickname', label: 'Nickname', icon: 'icon-nickname' },
  { key: 'color', label: 'Color', icon: 'icon-color' },
  { key: 'height', label: 'Height', icon: 'icon-height' },
  { key: 'weight', label: 'Weight', icon: 'icon-weight' },
  { key: 'life_span', label: 'Life Span', icon: 'icon-lifespan' },
  { key: 'litter_size', label: 'Litter Size', icon: 'icon-litter' },
];

const UPKEEP_FIELDS = [
  { key: 'exercise', label: 'Exercise', icon: 'icon-exercise' },
  { key: 'personality', label: 'Personality', icon: 'icon-personality' },
  { key: 'groom_needs', label: 'Groom Needs', icon: 'icon-needs' },
  { key: 'shedding', label: 'Shedding', icon: 'icon-shedding' },
  { key: 'trainability', label: 'Trainability', icon: 'icon-trainability' },
  { key: 'vocality', label: 'Vocality', icon: 'icon-vocality' },
  { key: 'good_with', label: 'Good with', icon: 'icon-good' },
];

const SUMMARY_LABELS = {
  group: 'Group',
  size: 'Size',
  coat: 'Coat',
  origin: 'Origin',
  intelligence: 'Intelligence',
  playfulness: 'Playfulness',
};

function getParams() {
  const params = new URLSearchParams(window.location.search);
  const type = (params.get('type') || 'dog').toLowerCase() === 'cat' ? 'cat' : 'dog';
  const slug = (params.get('slug') || '').trim().toLowerCase();
  return { type, slug };
}

function formatSummaryLabel(key) {
  if (SUMMARY_LABELS[key]) return SUMMARY_LABELS[key];
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function displayValue(value) {
  const text = value == null ? '' : String(value).trim();
  return text || '-';
}

function renderAboutItems(container, fields, data) {
  const items = fields
    .map(({ key, label, icon }) => {
      const value = displayValue(data[key]);
      if (value === '-') return '';
      return `
        <div class="about-item">
          <div class="about-top">
            <svg class="icon-about"><use xlink:href="#${icon}"></use></svg>
            <span class="about-text">${escapeHtml(label)}</span>
          </div>
          <div class="about-des">${escapeHtml(value)}</div>
        </div>`;
    })
    .filter(Boolean)
    .join('');

  container.innerHTML = items;
}

function renderSummaryTable(tbody, summary) {
  const rows = Object.entries(summary || {})
    .filter(([, value]) => displayValue(value) !== '-')
    .map(([key, value]) => `
      <tr>
        <td>${escapeHtml(formatSummaryLabel(key))}</td>
        <td>${escapeHtml(displayValue(value))}</td>
      </tr>`)
    .join('');

  tbody.innerHTML = rows;
}

function renderHelpfulInfo(section, list, items) {
  if (!items || !items.length) {
    section.style.display = 'none';
    return;
  }

  section.style.display = '';
  list.innerHTML = items.map((item) => {
    const value = item.value || '';
    const isLink = /^https?:\/\//i.test(value);
    const renderedValue = isLink
      ? `<a href="${escapeHtml(value)}" target="_blank" rel="noopener noreferrer">${escapeHtml(value)}</a>`
      : escapeHtml(displayValue(value));

    return `<li><span>${escapeHtml(item.label)}:</span> ${renderedValue}</li>`;
  }).join('');
}

function renderRelatedAdoptions(pets, config) {
  const container = document.getElementById('related-adoptions');
  const section = document.getElementById('adoption-section');

  if (!pets.length) {
    section.style.display = 'none';
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
            <img class="section-img" src="${escapeHtml(imgSrc)}" alt="${escapeHtml(pet.name)}">
          </div>
          <div class="section-info">
            <svg class="icon-gender"><use xlink:href="#icon-${genderIcon}"></use></svg>
            <div class="info-name">${escapeHtml(pet.name)}</div>
            <div class="info-feature">
              <span>${escapeHtml(pet.size || '-')}</span>
              <span>${escapeHtml(pet.age || '-')}</span>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');

  section.style.display = '';
}

function renderRelatedBreeds(container, breeds, config, petType) {
  container.innerHTML = breeds.map((breed) => {
    const features = breed.listFeatures || breed.features || [];
    const href = `./breed-detail.html?type=${petType}&slug=${encodeURIComponent(breed.slug)}`;
    const image = breed.listImage || breed.detailImage || config.loadingImage;

    return `
      <div class="adoption-con">
        <div class="adoption-item">
          <a class="link-cover" href="${href}"></a>
          <div class="img-clip">
            <img class="section-img" src="${escapeHtml(image)}" alt="${escapeHtml(breed.alt || breed.name)}">
          </div>
          <div class="section-info">
            <div class="info-name">${escapeHtml(breed.name)}</div>
            <div class="info-feature">${features.map((f) => `<span>${escapeHtml(f)}</span>`).join('')}</div>
          </div>
        </div>
      </div>`;
  }).join('');
}

function getRelatedBreeds(allBreeds, breed) {
  const sameType = allBreeds.filter((item) => item.type === breed.type && item.slug !== breed.slug);
  const group = (breed.listFeatures || [])[0];

  const sameGroup = sameType.filter((item) => {
    const itemGroup = (item.listFeatures || item.features || [])[0];
    return group && itemGroup === group;
  });

  const pool = sameGroup.length >= 4 ? sameGroup : sameType;
  return pool.slice(0, 4);
}

function applyMeta(breed, config, petType) {
  document.title = `${breed.name} Profile - Find Paw Pal`;

  const description = document.querySelector('meta[name="description"]');
  if (description) {
    description.content = breed.metaDescription
      || `Check all the details of ${breed.name} with their characteristics, sizes, and more. Adopt a ${breed.name} today!`;
  }

  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    canonical.href = breed.url || `https://www.findpawpal.com/${petType}-breed/${breed.slug}/`;
  }

  document.getElementById('breadcrumb-list-link').href = config.listPage;
  document.getElementById('breadcrumb-list-label').textContent = config.label;
  document.getElementById('breadcrumb-breed-link').href = `./breed-detail.html?type=${petType}&slug=${encodeURIComponent(breed.slug)}`;
  document.getElementById('breadcrumb-breed-label').textContent = breed.name;
}

async function init() {
  const { type: petType, slug } = getParams();
  const config = TYPE_CONFIG[petType];

  if (!slug) {
    window.location.href = config.listPage;
    return;
  }

  const response = await fetch('./data/breeds/breeds-all.json');
  const data = await response.json();
  const breeds = data.breeds || data;
  const breed = breeds.find((item) => item.type === petType && item.slug === slug);

  if (!breed) {
    document.getElementById('breed-name').textContent = 'Breed Not Found';
    document.body.style.visibility = 'visible';
    return;
  }

  applyMeta(breed, config, petType);

  const animalInfo = document.getElementById('animal-info');
  animalInfo.classList.remove('cat', 'dog');
  animalInfo.classList.add('breed', petType);

  document.getElementById('breed-name').textContent = breed.name;

  const image = document.getElementById('breed-image');
  image.src = breed.detailImage || breed.listImage || config.loadingImage;
  image.alt = breed.alt || breed.name;

  renderSummaryTable(document.getElementById('summary-table'), breed.summary || {});
  renderAboutItems(document.getElementById('profile-list'), PROFILE_FIELDS, breed.profile || {});
  renderAboutItems(document.getElementById('upkeep-list'), UPKEEP_FIELDS, breed.upkeep || {});

  const adoptUrl = `${config.adoptionPage}&breed=${encodeURIComponent(breed.name)}`;
  document.getElementById('profile-adopt-link').href = adoptUrl;
  document.getElementById('upkeep-adopt-link').href = adoptUrl;

  const intro = document.getElementById('introduction');
  intro.innerHTML = breed.introduction
    ? `<p>${escapeHtml(breed.introduction)}</p>`
    : '';

  renderHelpfulInfo(
    document.getElementById('helpful-section'),
    document.getElementById('helpful-list'),
    breed.helpfulInfo || [],
  );

  document.getElementById('adoption-heading').textContent = `${breed.name} Adoption`;

  const group = (breed.listFeatures || breed.features || [])[0] || '';
  document.getElementById('related-breeds-heading').textContent = config.groupHeading(group);

  renderRelatedBreeds(
    document.getElementById('related-breeds'),
    getRelatedBreeds(breeds, breed),
    config,
    petType,
  );

  const { data: petsData } = await fetchPets({ type: petType, limit: 7, offset: 0 });
  const related = (petsData?.data || []).slice(0, 6);
  renderRelatedAdoptions(related, config);

  document.body.style.visibility = 'visible';
}

init().catch((error) => {
  console.error(error);
  document.body.style.visibility = 'visible';
});
