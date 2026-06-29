(function () {
  var DEFAULT_SLUG = '10-tips-ensure-a-wonderful-travel-with-your-dog';

  function getSlug() {
    var params = new URLSearchParams(window.location.search);
    return params.get('slug') || DEFAULT_SLUG;
  }

  function slugToNextPath(slug) {
    return './post.html?slug=' + encodeURIComponent(slug);
  }

  function adoptionPromo() {
    return '<div class="adoption-status article">' +
      '<a href="./pet-adoption.html?type=dog" class="link-cover"></a>' +
      '<div class="adoption-content">' +
      '<svg class="icon-adoption"><use xlink:href="#icon-adoption"></use></svg>' +
      '<span class="adoption-text">Find Your Furry Friend</span>' +
      '<svg fill="#ffffff" class="icon-info"><use xlink:href="#icon-go"></use></svg>' +
      '</div>' +
      '<img src="./img/adoption.webp" alt="adoption">' +
      '</div>';
  }

  function renderSections(article) {
    var html = '';
    article.sections.forEach(function (sec, idx) {
      html += '<h3 id="' + sec.id + '" class="long-title">' + sec.title + '</h3>';
      if (idx > 0 && idx % 2 === 0) {
        html += adoptionPromo();
      }
      sec.paragraphs.forEach(function (p) {
        html += '<p>' + p + '</p>';
      });
      if (sec.image) {
        html += '<img class="long-img" src="' + sec.image + '" alt="' + sec.title + '">';
      }
    });
    return html;
  }

  function renderNav(article) {
    var nav = article.nav && article.nav.length ? article.nav : article.sections.map(function (s) {
      return { id: s.id, label: s.title };
    });
    var items = nav.map(function (item) {
      return '<a href="#' + item.id + '" class="long-nav-item">' + item.label + '</a>';
    }).join('');
    return '<div class="long-nav-title">On This Page</div>' + items;
  }

  function renderNav(article) {    if (!article.nextPath) return '';
    var nextSlug = article.nextPath.replace(/^\/pet-[^/]+\//, '').replace(/\/$/, '');
    var found = index.find(function (i) { return i.slug === nextSlug; });
    if (!found) return '';
    return '<ul class="pageNext"><li class="pageNext-r">' +
      '<a href="' + slugToNextPath(found.slug) + '" class="page-next">Next</a>' +
      '</li></ul>';
  }

  function bindLongNav() {
    $('.long-nav-btn').off('click').on('click', function () {
      $('.long-nav').css('display', 'flex');
      $('.index-cover-long').toggle();
      $('.icon-long-list').toggle();
      $('.icon-long-close').toggle();
    });
    $('.index-cover-long').off('click').on('click', closeLongNav);
    $('.icon-long-close').off('click').on('click', closeLongNav);
    $('.long-nav-item').off('click').on('click', function () {
      if ($(window).width() < 1024) closeLongNav();
    });
  }

  function closeLongNav() {
    $('.long-nav').css('display', 'none');
    $('.index-cover-long').hide();
    $('.icon-long-list').show();
    $('.icon-long-close').hide();
  }

  function loadArticle(slug, index) {
    return fetch('./data/articles/' + slug + '.json')
      .then(function (res) {
        if (!res.ok) throw new Error('Article not found');
        return res.json();
      })
      .then(function (article) {
        document.title = article.title + ' - Find Paw Pal';
        $('meta[name="description"]').attr('content', article.description);

        $('#breadcrumb-category').text(article.categoryLabel);
        $('#breadcrumb-title').text(article.title);
        $('#post-title').text(article.title);
        $('#post-intro').text(article.description);
        $('#post-sections').html(renderSections(article));
        $('#post-nav').html(renderNav(article));
        $('#post-next').html(renderNext(article, index));
        bindLongNav();
        scrollToHash();
      });
  }

  function scrollToHash() {
    var hash = window.location.hash;
    if (!hash) return;
    setTimeout(function () {
      var el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  fetch('./data/articles/index.json')
    .then(function (res) { return res.json(); })
    .then(function (index) {
      return loadArticle(getSlug(), index);
    })
    .catch(function (err) {
      console.error(err);
      $('#post-title').text('Article not found');
    });

  $('#commentBtn').on('click', function () {
    $('.feedback-thank').show();
    $('#commentFrom').hide();
  });
})();
