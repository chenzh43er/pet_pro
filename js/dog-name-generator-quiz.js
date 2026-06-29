import { fetchPets } from './supabaseApi.js';
import { getAssets, resolveImagePath } from './layout-loader.js';

const ROOT = '../../';
const QUIZ_BASE = './';
const RESULT_URL = './result/';
const ASSETS = getAssets(ROOT);
const LOADING_IMG = ASSETS.loadingDog;
const GENDER_OPTIONS = ['Boy', 'Girl', 'No preference'];

function getPageFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const page = parseInt(params.get('page') || '1', 10);
  return Number.isNaN(page) || page < 1 ? 1 : page;
}

function getQuizPageUrl(page) {
  if (page <= 1) return QUIZ_BASE;
  return `${QUIZ_BASE}?page=${page}`;
}

function renderOptions(options) {
  return options.map((option) => {
    const src = resolveImagePath(ROOT, option.image);
    return `
    <div class="generate-con">
      <div class="generate-item">
        <div class="generate-img">
          <img src="${src}" alt="${option.label}">
        </div>
        <div class="generate-name">${option.label}</div>
      </div>
    </div>
  `;
  }).join('');
}

function bindQuizNavigation(page, pageCount) {
  $('.generate-item').each(function () {
    $(this).click(function () {
      $(this).addClass('active');
      const label = $(this).children('.generate-name').text();

      if (GENDER_OPTIONS.includes(label)) {
        if (localStorage.getItem('name-generate-gender')) {
          localStorage.removeItem('name-generate-gender');
        }
        localStorage.setItem('name-generate-gender', label);
      }

      if (Number(page) < pageCount) {
        window.location = getQuizPageUrl(Number(page) + 1);
      } else {
        window.location = RESULT_URL;
      }
    });
  });
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
  const page = getPageFromUrl();
  const gender = localStorage.getItem('name-generate-gender');

  if (!gender && page >= 2) {
    window.location = QUIZ_BASE;
    return;
  }

  const response = await fetch(`${ROOT}data/quiz/dog-questions.json`);
  const quiz = await response.json();
  const question = quiz.questions.find((item) => item.page === page);

  if (!question) {
    window.location = QUIZ_BASE;
    return;
  }

  const introEl = document.getElementById('quiz-intro');
  if (introEl) {
    introEl.style.display = page === 1 ? 'block' : 'none';
  }

  document.getElementById('quiz-title').textContent = question.title;
  document.getElementById('generate-list').innerHTML = renderOptions(question.options);

  bindQuizNavigation(page, quiz.pageCount);
  renderAside();
  await renderRelatedPets();
}

init();
