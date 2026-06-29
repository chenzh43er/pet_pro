export function getAssetRoot() {
  const parts = window.location.pathname.replace(/\/$/, '').split('/').filter(Boolean);
  const quizIndex = parts.indexOf('quiz');
  if (quizIndex === -1) return './';
  const afterQuiz = parts.slice(quizIndex + 1);
  if (afterQuiz.length && afterQuiz[afterQuiz.length - 1] === 'index.html') {
    afterQuiz.pop();
  }
  const depth = afterQuiz.length;
  return '../'.repeat(depth + 1);
}

export function getAssets(assetRoot) {
  return {
    logoB: `${assetRoot}img/logo-b.webp`,
    logoW: `${assetRoot}img/logo-w.webp`,
    loadingCat: `${assetRoot}img/loading-cat.webp`,
    loadingDog: `${assetRoot}img/loading-dog.webp`,
    arrow: `${assetRoot}img/arrow.png`,
    deleteIcon: `${assetRoot}img/generator/delete.webp`,
    dogGenerator: `${assetRoot}img/generator/dog-generator.webp`,
    dogGeneratorMobile: `${assetRoot}img/generator/dog-generator-m.webp`,
    catGenerator: `${assetRoot}img/generator/cat-generator.webp`,
    catGeneratorMobile: `${assetRoot}img/generator/cat-generator-m.webp`,
  };
}

function fixRelativePaths(html, assetRoot, assets) {
  let out = html.replace(/\b(href|src)="\.\//g, `$1="${assetRoot}`);
  out = out.replace(/src="[^"]*logo-b\.webp"/gi, `src="${assets.logoB}"`);
  out = out.replace(/src="[^"]*logo-w\.webp"/gi, `src="${assets.logoW}"`);
  out = out.replace(/href="\/"/g, `href="${assetRoot}index.html"`);
  return out;
}

function extractFragment(html, selector) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const el = doc.querySelector(selector);
  return el ? el.outerHTML : html;
}

function bindHeaderNav() {
  $('.icon-menu').off('click').on('click', function () {
    $('.header-nav').toggle();
    $('.index-cover-header').toggle();
    $('.icon-menu').toggle();
    $('.icon-close').toggle();
  });
  $('.index-cover-header, .icon-close').off('click').on('click', function () {
    $('.header-nav').toggle();
    $('.index-cover-header').toggle();
    $('.icon-menu').toggle();
    $('.icon-close').toggle();
  });
  $('.nav-con').off('click').on('click', function () {
    $(this).toggleClass('hide');
  });
}

export function resolveImagePath(assetRoot, imagePath) {
  if (!imagePath) return '';
  if (/^(https?:)?\/\//.test(imagePath) || imagePath.startsWith('data:')) {
    return imagePath;
  }
  if (imagePath.startsWith('img/')) {
    return `${assetRoot}${imagePath}`;
  }
  return `${assetRoot}img/${imagePath}`;
}

export async function loadSiteLayout(assetRoot) {
  const assets = getAssets(assetRoot);
  const headerRes = await fetch(`${assetRoot}header.html`);
  const footerRes = await fetch(`${assetRoot}footer.html`);
  const headerHtml = fixRelativePaths(await headerRes.text(), assetRoot, assets);
  const footerHtml = fixRelativePaths(await footerRes.text(), assetRoot, assets);

  const headerEl = document.getElementById('mainHeader');
  const footerEl = document.getElementById('footer');
  if (headerEl) {
    headerEl.innerHTML = extractFragment(headerHtml, '#header, .header');
  }
  if (footerEl) {
    footerEl.innerHTML = extractFragment(footerHtml, '.footer');
  }

  if (window.jQuery) {
    bindHeaderNav();
  }
}
