(function initNameGeneratorFavorites() {
  function getDeleteIconSrc() {
    const parts = window.location.pathname.replace(/\/$/, '').split('/').filter(Boolean);
    const quizIndex = parts.indexOf('quiz');
    if (quizIndex === -1) return 'img/generator/delete.webp';
    const afterQuiz = parts.slice(quizIndex + 1);
    if (afterQuiz.length && afterQuiz[afterQuiz.length - 1] === 'index.html') {
      afterQuiz.pop();
    }
    const depth = afterQuiz.length;
    return '../'.repeat(depth + 1) + 'img/generator/delete.webp';
  }

  const DELETE_ICON = getDeleteIconSrc();
  $('.fav-list-btn').click(function (event) {
    event.stopPropagation();
    $('.fav-list').toggleClass('expanded');
  });

  $('body').click(function () {
    $('.fav-list').removeClass('expanded');
  });

  window.syncNameFavorites = function () {
    $('.name-value a').each(function () {
      $(this).parent().siblings('.name-fav').removeClass('active');
    });

    if (!localStorage.nameArr) {
      $('.total').text('0');
      $('.fav-unit').text('names');
      return;
    }

    const nameArr = localStorage.getItem('nameArr');
    const arr = nameArr.substring(0, nameArr.length - 1).split('/').filter(Boolean);
    $('.total').text(arr.length);
    $('.fav-unit').text(arr.length > 1 ? 'names' : 'name');

    arr.forEach(function (name) {
      $('.name-value a').each(function () {
        if ($(this).text() === name) {
          $(this).parent().siblings('.name-fav').addClass('active');
        }
      });
    });
  };

  function refreshFavorites() {
    let mark = '';
    $('.content-item .content-name').each(function () {
      mark += $(this).text() + '/';
    });
    localStorage.setItem('nameArr', mark);
  }

  function bindNameFavClick() {
    $('.name-fav').off('click').on('click', function () {
      if ($(this).hasClass('active')) {
        const removeName = $(this).siblings('.name-value').children().text();
        localStorage.removeItem(removeName);
        $('.content-item .content-name').each(function () {
          if ($(this).children().text() === removeName) {
            $(this).parent().remove();
          }
        });
      } else {
        const txt2 = $(this).siblings('.name-value').children().text();
        const href2 = $(this).siblings('.name-value').children().attr('href') || window.location.href;
        const str2 = `
          <div class="content-item">
            <span class="content-name"><a href="${href2}">${txt2}</a></span>
                    <span class="content-delete"><img src="${DELETE_ICON}" alt=""></span>
          </div>
        `;
        $('.content-list').append(str2);
        $('.content-list').addClass('active');
        localStorage.setItem(txt2, href2);

        const eleTop = $(this).offset().top - $(document).scrollTop();
        const eleLeft = $(this).offset().left;
        const likeTop = $('.fav-list-btn').offset().top - $(document).scrollTop();
        const likeLeft = $('.fav-list-btn').offset().left;
        const tranlateY = likeTop - eleTop - 5;
        const tranlateX = likeLeft - eleLeft + 5;
        const eleFly = $(this).children('.add-fly');
        const eleFlyItem = eleFly.children('.add-fly-item');
        eleFly.css('visibility', 'visible');
        eleFly.css('transform', 'translateX(' + tranlateX + 'px)');
        eleFlyItem.css('transform', 'translateY(' + tranlateY + 'px)');
        setTimeout(function () {
          eleFly.css({ visibility: 'hidden', transform: 'translateX(0px)' });
          eleFlyItem.css('transform', 'translateY(0px)');
        }, 290);
      }

      const numItems = $('.content-item').length;
      $('.total').text(numItems);
      if (numItems === 0) {
        $('.content-list').removeClass('active');
      }
      $(this).toggleClass('active');
      $('.fav-unit').text(numItems > 1 ? 'names' : 'name');
      refreshFavorites();
    });
  }

  window.bindNameFavClick = bindNameFavClick;

  if (localStorage.nameArr) {
    const nameArr = localStorage.getItem('nameArr');
    const arr = nameArr.substring(0, nameArr.length - 1).split('/');
    $('.total').text(arr.length);
    $('.fav-unit').text(arr.length > 1 ? 'names' : 'name');

    arr.forEach(function (item) {
      if (!item) return;
      const href1 = localStorage.getItem(item);
      const str1 = `
        <div class="content-item">
          <span class="content-name"><a href="${href1}">${item}</a></span>
                    <span class="content-delete"><img src="${DELETE_ICON}" alt=""></span>
        </div>
      `;
      $('.content-list').append(str1);
      $('.content-list').addClass('active');
    });
  }

  $(document).on('click', '.content-delete', function (event) {
    $('.fav-list').addClass('expanded');
    event.stopPropagation();
    $(this).parent().remove();
    const deletext = $(this).siblings().children().text();
    localStorage.removeItem(deletext);
    refreshFavorites();

    $('.name-value a').each(function () {
      if ($(this).text() === deletext) {
        $(this).parent().siblings('.name-fav').removeClass('active');
      }
    });

    const numItems = $('.content-item').length;
    if (numItems === 0) {
      $('.content-list').removeClass('active');
    }
    $('.total').text(numItems);
    $('.fav-unit').text(numItems > 1 ? 'names' : 'name');
    return false;
  });
})();
