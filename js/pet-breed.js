const PAGE_SIZE = 21;

const TYPE_CONFIG = {
  cat: {
    title: 'Cat Breeds - Find Paw Pal',
    description: 'Discover all cat breeds with detailed profiles of their characteristics, sizes, and more, to assist you in finding the perfect cat for adoption!',
    canonical: 'https://www.findpawpal.com/cat-breed/',
    breadcrumbLabel: 'Cat Breeds',
    bannerTitle: 'Cat Breeds',
    bannerImage: './img/cat-banner.webp',
    bannerAlt: 'cat adoption',
    loadingImage: './img/loading-cat.webp',
    dataFile: './data/breeds/cat-breeds.json',
    detailPage: './breed-detail.html',
  },
  dog: {
    title: 'Dog Breeds - Find Paw Pal',
    description: 'Discover all dog breeds with detailed profiles of their characteristics, sizes, and more, to assist you in finding the perfect dog for adoption!',
    canonical: 'https://www.findpawpal.com/dog-breed/',
    breadcrumbLabel: 'Dog Breeds & Types',
    bannerTitle: 'Dog Breeds & Types',
    bannerImage: './img/dog-banner.webp',
    bannerAlt: 'dog adoption',
    loadingImage: './img/loading-dog.webp',
    dataFile: './data/breeds/dog-breeds.json',
    detailPage: './breed-detail.html',
  },
};

const FILTER_CONFIG = {
  cat: [
    {
      key: 'group',
      label: 'Breed Group',
      expanded: true,
      options: [
        { value: 'Western', label: 'Western Breeds' },
        { value: 'Eastern', label: 'Eastern Breeds' },
        { value: 'Persian', label: 'Persian Breeds' },
        { value: 'Exotic', label: 'Exotic Breeds' },
        { value: 'Other', label: 'Other Breeds' },
      ],
    },
    {
      key: 'size',
      label: 'Size',
      expanded: true,
      extraClass: 'breed',
      options: [
        { value: 'Small', label: 'Small' },
        { value: 'Small-to-Medium', label: 'Small To Medium' },
        { value: 'Medium', label: 'Medium' },
        { value: 'Medium-to-Large', label: 'Medium To Large' },
        { value: 'Large', label: 'Large' },
      ],
    },
  ],
  dog: [
    {
      key: 'group',
      label: 'Breed Group',
      expanded: true,
      options: [
        { value: 'Sporting', label: 'Sporting' },
        { value: 'Non-Sporting', label: 'Non-Sporting' },
        { value: 'Herding', label: 'Herding' },
        { value: 'Hound', label: 'Hound' },
        { value: 'Working', label: 'Working' },
        { value: 'Terrier', label: 'Terrier' },
        { value: 'Toy', label: 'Toy' },
      ],
    },
    {
      key: 'size',
      label: 'Size',
      expanded: true,
      options: [
        { value: 'XSmall', label: 'XSmall' },
        { value: 'Small', label: 'Small' },
        { value: 'Medium', label: 'Medium' },
        { value: 'Large', label: 'Large' },
        { value: 'Xlarge', label: 'XLarge' },
      ],
    },
    {
      key: 'activity_level',
      label: 'Activity Level',
      expanded: false,
      options: [
        { value: 'Calm', label: 'Calm' },
        { value: 'Regular Exercise', label: 'Regular Exercise' },
        { value: 'Energetic', label: 'Energetic' },
        { value: 'Needs Lots Of Activity', label: 'Needs Lots Of Activity' },
      ],
    },
    {
      key: 'characteristics',
      label: 'Characteristics',
      expanded: false,
      options: [
        { value: 'Smartest Breeds Of Dogs', label: 'Smartest Breeds Of Dogs' },
        { value: 'Best Family Dogs', label: 'Best Family Dogs' },
        { value: 'Best Dog Breeds For Kids', label: 'Best Dog Breeds For Kids' },
        { value: 'Smallest Dog Breeds', label: 'Smallest Dog Breeds' },
        { value: 'Medium Dog Breeds', label: 'Medium Dog Breeds' },
        { value: 'Best Dogs For Apartments', label: 'Best Dogs For Apartments' },
        { value: 'Best Guard Dogs', label: 'Best Guard Dogs' },
        { value: 'Largest Dog Breeds', label: 'Largest Dog Breeds' },
        { value: 'Hypoallergenic Dogs', label: 'Hypoallergenic Dogs' },
        { value: 'Hairless Dog Breeds', label: 'Hairless Dog Breeds' },
      ],
    },
    {
      key: 'shedding',
      label: 'Shedding',
      expanded: false,
      options: [
        { value: 'Occasional', label: 'Occasional' },
        { value: 'Infrequent', label: 'Infrequent' },
        { value: 'Regularly', label: 'Regularly' },
        { value: 'Seasonal', label: 'Seasonal' },
        { value: 'Frequent', label: 'Frequent' },
      ],
    },
    {
      key: 'coat_type',
      label: 'Coat Type',
      expanded: false,
      options: [
        { value: 'Short', label: 'Short Coat' },
        { value: 'Medium', label: 'Medium Coat' },
        { value: 'Smooth', label: 'Smooth Coat' },
        { value: 'Long', label: 'Long Coat' },
        { value: 'Wire', label: 'Wire Coat' },
        { value: 'Hairless', label: 'Hairless Coat' },
      ],
    },
    {
      key: 'trainability',
      label: 'Trainability',
      expanded: false,
      options: [
        { value: 'Independent', label: 'Independent' },
        { value: 'May Be Stubborn', label: 'May Be Stubborn' },
        { value: 'Agreeable', label: 'Agreeable' },
        { value: 'Easy Training', label: 'Easy Training' },
        { value: 'Eager To Please', label: 'Eager To Please' },
      ],
    },
    {
      key: 'vocality',
      label: 'Barking Level',
      expanded: false,
      extraClass: 'breed',
      options: [
        { value: 'Infrequent', label: 'Infrequent' },
        { value: 'When Necessary', label: 'When Necessary' },
        { value: 'Likes To Be Vocal', label: 'Likes To Be Vocal' },
        { value: 'Medium', label: 'Medium' },
        { value: 'Frequent', label: 'Frequent' },
      ],
    },
  ],
};

function getPetType() {
  const params = new URLSearchParams(window.location.search);
  const type = (params.get('type') || 'cat').toLowerCase();
  return type === 'dog' ? 'dog' : 'cat';
}

function parseArrayParam(params, key) {
  const value = params.get(key);
  if (!value) return [];
  return value.split(',').map((item) => decodeURIComponent(item.replace(/\+/g, ' ')));
}

function getFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const filters = { page: parseInt(params.get('page') || '1', 10) };

  ['group', 'size', 'activity_level', 'characteristics', 'shedding', 'coat_type', 'trainability', 'vocality'].forEach((key) => {
    filters[key] = parseArrayParam(params, key);
  });

  return filters;
}

function buildUrl(page, petType, filters) {
  const params = new URLSearchParams();
  params.set('type', petType);

  ['group', 'size', 'activity_level', 'characteristics', 'shedding', 'coat_type', 'trainability', 'vocality'].forEach((key) => {
    if (filters[key] && filters[key].length) {
      params.set(key, filters[key].join(','));
    }
  });

  if (page > 1) {
    params.set('page', String(page));
  }

  const query = params.toString();
  return query ? `./pet-breed.html?${query}` : './pet-breed.html';
}

function normalizeText(value) {
  return (value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function matchesListFilters(breed, filters) {
  const features = breed.features || breed.listFeatures || [];

  if (filters.group.length && !filters.group.includes(features[0])) {
    return false;
  }

  if (filters.size.length && !filters.size.includes(features[1])) {
    return false;
  }

  return true;
}

function applyMeta(config, petType) {
  document.title = config.title;

  let description = document.querySelector('meta[name="description"]');
  if (!description) {
    description = document.createElement('meta');
    description.name = 'description';
    document.head.appendChild(description);
  }
  description.content = config.description;

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = config.canonical;

  document.getElementById('breadcrumb-link').href = `./pet-breed.html?type=${petType}`;
  document.getElementById('breadcrumb-label').textContent = config.breadcrumbLabel;
  document.getElementById('banner-title').textContent = config.bannerTitle;

  const bannerImage = document.getElementById('banner-image');
  bannerImage.src = config.bannerImage;
  bannerImage.alt = config.bannerAlt;
}

function renderFilters(petType, filters) {
  const container = document.getElementById('breed-filter-list');
  const groups = FILTER_CONFIG[petType];

  container.innerHTML = groups.map((group) => {
    const nameClass = group.expanded ? 'filter-name' : 'filter-name hide';
    const listClass = group.expanded ? 'filter-check-list' : 'filter-check-list hide';
    const extraClass = group.extraClass ? ` ${group.extraClass}` : '';

    const options = group.options.map((option) => {
      const checked = filters[group.key].includes(option.value) ? ' checked' : '';
      return `
        <div class="filter-check-item">
          <input type="checkbox" name="${group.key}" value="${option.value}"${checked}>
          <label class="checkbox-label"></label>
          <svg class="filter-checkbox"><use xlink:href="#icon-checkbox"></use></svg>
          <span class="filter-text">${option.label}</span>
        </div>`;
    }).join('');

    return `
      <div class="filter-con${extraClass}">
        <div class="${nameClass}">
          <span class="filter-name-text">${group.label}</span>
          <svg class="icon-arrow"><use xlink:href="#icon-arrow"></use></svg>
        </div>
        <div class="${listClass}">
          ${options}
        </div>
      </div>`;
  }).join('') + '<div class="filter-confirm">Confirm</div>';
}

function renderBreeds(breeds, config, petType) {
  const container = document.querySelector('.adoption-list');
  const loadingImage = config.loadingImage;

  container.innerHTML = breeds.map((breed, index) => {
    const features = breed.features || breed.listFeatures || [];
    const detailHref = `${config.detailPage}?type=${petType}&slug=${encodeURIComponent(breed.slug)}`;
    const imageSrc = breed.listImage || breed.image || '';
    const lazyAttrs = index >= 9
      ? ` lazyload="" data-src="${imageSrc}" src="${loadingImage}"`
      : ` src="${imageSrc}"`;

    const featureHtml = features.map((feature) => `<span>${feature}</span>`).join('');

    return `
      <div class="adoption-con">
        <div class="adoption-item">
          <a class="link-cover" href="${detailHref}"></a>
          <div class="img-clip">
            <img class="section-img breed"${lazyAttrs} alt="${breed.alt || breed.name}">
          </div>
          <div class="section-info">
            <div class="info-name">${breed.name}</div>
            <div class="info-feature">${featureHtml}</div>
          </div>
        </div>
      </div>`;
  }).join('');
}

function initLazyImages() {
  const images = document.querySelectorAll('.adoption-list img[data-src]');
  if (!images.length) return;

  const loadImage = (img) => {
    const src = img.getAttribute('data-src');
    if (!src) return;

    img.onload = () => {
      img.removeAttribute('data-src');
    };
    img.onerror = () => {
      img.removeAttribute('data-src');
    };
    img.src = src;
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadImage(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '200px 0px' });

    images.forEach((img) => observer.observe(img));
  } else {
    images.forEach(loadImage);
  }
}

function renderPagination(currentPage, totalPages, petType, filters) {
  const container = document.querySelector('.page-wrap');

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i += 1) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i += 1) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  let html = '<div class="brpp_pageGo"><span class="page-back">Previous</span> ';

  pages.forEach((page) => {
    if (page === '...') {
      html += '<p class="pageEllipsis">...</p>';
    } else if (page === currentPage) {
      html += `<a href="" class="page-cur">${page}</a>`;
    } else {
      html += `<a href="${buildUrl(page, petType, filters)}" title="${page}" class="page-nor">${page}</a>`;
    }
  });

  const nextPage = currentPage < totalPages ? currentPage + 1 : totalPages;
  html += ` <a href="${buildUrl(nextPage, petType, filters)}" title="" class="page-next-active">Next<svg class="icon-next"><use xlink:href="#icon-next"></use></svg></a></div>`;

  container.innerHTML = html;
}

function collectFiltersFromDom() {
  const filters = {
    group: [],
    size: [],
    activity_level: [],
    characteristics: [],
    shedding: [],
    coat_type: [],
    trainability: [],
    vocality: [],
  };

  document.querySelectorAll('#breed-filter-list input[type="checkbox"]').forEach((input) => {
    if (input.checked) {
      filters[input.name].push(input.value);
    }
  });

  return filters;
}

function bindFilterUi(petType) {
  let backTop = 0;

  function checkFilter() {
    if ($('.filter-aside').css('display') !== 'none') {
      const top = $(window).scrollTop();
      backTop = top;
      $('body').css({ position: 'fixed', width: '100%', top: -top });
    } else {
      $('body').css({ position: 'absolute', width: '100%', top: 0 });
      window.scrollTo(0, backTop);
    }
  }

  $('.filter-name').off('click').on('click', function onFilterNameClick() {
    $(this).toggleClass('hide');
    $(this).next().toggleClass('hide');
  });

  $('.filter-btn').off('click').on('click', function onFilterBtnClick() {
    $('.filter-cover').toggle();
    $('.filter-aside').toggle();
    checkFilter();
  });

  $('.filter-cover, .filter-close').off('click').on('click', function onFilterCloseClick() {
    $('.filter-cover').toggle();
    $('.filter-aside').toggle();
    checkFilter();
  });

  $('.filter-check-item').off('click').on('click', function onFilterItemClick(e) {
    if (e.target.tagName === 'INPUT') return;
    const checkbox = $(this).find('input[type="checkbox"]');
    checkbox.prop('checked', !checkbox.prop('checked'));

    if (document.documentElement.clientWidth >= 1024) {
      const filters = collectFiltersFromDom();
      window.location.href = buildUrl(1, petType, filters);
    }
  });

  $('.filter-check-item input[type="checkbox"]').off('click').on('click', function onCheckboxClick(e) {
    e.stopPropagation();
  });

  $('.filter-clear').off('click').on('click', function onFilterClearClick() {
    window.location.href = `./pet-breed.html?type=${petType}`;
  });

  $('.filter-confirm').off('click').on('click', function onFilterConfirmClick() {
    const filters = collectFiltersFromDom();
    window.location.href = buildUrl(1, petType, filters);
  });
}

async function init() {
  const petType = getPetType();
  const config = TYPE_CONFIG[petType];
  const filters = getFiltersFromUrl();

  applyMeta(config, petType);
  renderFilters(petType, filters);

  const response = await fetch(config.dataFile);
  const breeds = await response.json();

  const filtered = breeds.filter((breed) => matchesListFilters(breed, filters));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(filters.page, 1), totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  document.querySelector('.adoption-num').textContent = `${filtered.length} ${petType} breeds`;

  renderBreeds(pageItems, config, petType);
  initLazyImages();
  renderPagination(currentPage, totalPages, petType, filters);
  bindFilterUi(petType);

  document.body.style.visibility = 'visible';
}

init().catch((error) => {
  console.error(error);
  document.body.style.visibility = 'visible';
});
