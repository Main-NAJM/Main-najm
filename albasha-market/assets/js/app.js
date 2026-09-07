/* eslint-env browser */
(function () {
  'use strict';

  var CONFIG = window.SITE_CONFIG || {};
  var DICT = window.I18N || { ar: {}, en: {} };
  var CATEGORIES = window.CATEGORIES || [];
  var PRODUCTS = window.PRODUCTS || [];

  var STORAGE_LANG = 'albasha.lang';
  var STORAGE_THEME = 'albasha.theme';

  var state = {
    lang: document.documentElement.lang === 'en' ? 'en' : 'ar',
    theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
    category: 'all',
    query: '',
  };

  /* ────────────────────────── أدوات مساعدة ────────────────────────── */

  function store(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* التخزين قد يكون معطّلاً في وضع التصفح الخاص */
    }
  }

  function t(key) {
    var pack = DICT[state.lang] || {};
    return Object.prototype.hasOwnProperty.call(pack, key) ? pack[key] : key;
  }

  /** النص المحلّي لكائن يحمل الحقلين ar / en. */
  function local(obj) {
    if (!obj) return '';
    return obj[state.lang] || obj.ar || obj.en || '';
  }

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function svgIcon(paths, opts) {
    var o = opts || {};
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', o.width || '1.6');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    paths.forEach(function (d) {
      var p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', d);
      svg.appendChild(p);
    });
    return svg;
  }

  var CATEGORY_ICONS = {
    book: ['M4 5.5A1.5 1.5 0 015.5 4H11v16H5.5A1.5 1.5 0 014 18.5z', 'M20 5.5A1.5 1.5 0 0018.5 4H13v16h5.5a1.5 1.5 0 001.5-1.5z'],
    template: ['M3.5 6.5A2 2 0 015.5 4.5h13a2 2 0 012 2v11a2 2 0 01-2 2h-13a2 2 0 01-2-2z', 'M3.5 9.5h17M9.5 9.5v10'],
    design: ['M12 3.5l2.4 5.3 5.8.7-4.3 4 1.1 5.7L12 16.4l-5 2.8 1.1-5.7-4.3-4 5.8-.7z'],
    play: ['M5 12a7 7 0 1114 0 7 7 0 01-14 0z', 'M10.5 9.3l4.2 2.7-4.2 2.7z'],
    tag: ['M4 11.5V5.5A1.5 1.5 0 015.5 4h6l8.5 8.5-7.5 7.5z', 'M8.2 8.2h.01'],
  };

  function categoryIcon(id) {
    var cat = CATEGORIES.filter(function (c) {
      return c.id === id;
    })[0];
    var key = (cat && cat.icon) || 'tag';
    return svgIcon(CATEGORY_ICONS[key] || CATEGORY_ICONS.tag);
  }

  function categoryName(id) {
    var cat = CATEGORIES.filter(function (c) {
      return c.id === id;
    })[0];
    return cat ? local(cat) : id;
  }

  function formatPrice(product) {
    var value = Number(product.price);
    if (!isFinite(value) || value <= 0) return t('free');
    var currency = product.currency || CONFIG.currency || 'USD';
    /* السعر يُنسَّق بالإنجليزية في اللغتين ($9) ويُعزَل اتجاهه في CSS: التنسيق
       العربي لعملة مثل USD يُنتج «9 US$» فيقلبها محرّك الاتجاه ويصعب قراءتها. */
    try {
      return new Intl.NumberFormat('en', {
        style: 'currency',
        currency: currency,
        currencyDisplay: 'narrowSymbol',
        maximumFractionDigits: value % 1 === 0 ? 0 : 2,
      }).format(value);
    } catch (e) {
      return value + ' ' + currency;
    }
  }

  /** رابط الشراء: صفحة المنتج إن وُجدت، وإلا صفحة المتجر. */
  function buyUrl(product) {
    return product.url || CONFIG.storeUrl || '#';
  }

  /* ────────────────────────── الترجمة ────────────────────────── */

  function applyLanguage() {
    var html = document.documentElement;
    html.lang = state.lang;
    html.dir = state.lang === 'ar' ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var value = t(el.dataset.i18n);
      if (el.dataset.i18n === 'copy') {
        value = value.replace('{year}', String(new Date().getFullYear()));
      }
      el.textContent = value;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder));
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel));
    });

    var langBtn = document.querySelector('[data-action="toggle-lang"]');
    if (langBtn) {
      langBtn.setAttribute('aria-label', t('switchLang'));
      var label = langBtn.querySelector('[data-lang-label]');
      if (label) label.textContent = state.lang === 'ar' ? 'EN' : 'ع';
    }

    document.title =
      state.lang === 'ar'
        ? 'متجر الباشا — منتجات رقمية جاهزة للتحميل'
        : 'Albasha Market — digital products, instant download';

    renderCatalog();
    renderCategoryChips();
    renderSocial();
  }

  /* ────────────────────────── السمة ────────────────────────── */

  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    var meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = state.theme === 'dark' ? '#0c0a09' : '#faf9f7';
  }

  /* ────────────────────────── الكتالوج ────────────────────────── */

  function renderCategoryChips() {
    var wrap = document.getElementById('category-chips');
    if (!wrap) return;
    wrap.textContent = '';

    var used = CATEGORIES.filter(function (cat) {
      return PRODUCTS.some(function (p) {
        return p.category === cat.id;
      });
    });

    var entries = [{ id: 'all', label: t('allCategories') }].concat(
      used.map(function (cat) {
        return { id: cat.id, label: local(cat) };
      })
    );

    entries.forEach(function (entry) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.textContent = entry.label;
      btn.dataset.category = entry.id;
      btn.setAttribute('aria-pressed', String(state.category === entry.id));
      btn.addEventListener('click', function () {
        state.category = entry.id;
        renderCategoryChips();
        renderCatalog();
      });
      wrap.appendChild(btn);
    });
  }

  function matches(product) {
    if (state.category !== 'all' && product.category !== state.category) return false;
    var q = state.query.trim().toLowerCase();
    if (!q) return true;
    var haystack = [
      local(product.name),
      local(product.desc),
      categoryName(product.category),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.indexOf(q) !== -1;
  }

  function productCard(product) {
    var card = document.createElement('article');
    card.className = 'card product';

    /* الصورة أو البديل الرسومي */
    var media = document.createElement('div');
    media.className = 'product-media';
    media.dataset.category = product.category;
    if (product.image) {
      var img = document.createElement('img');
      img.src = product.image;
      img.alt = local(product.name);
      img.loading = 'lazy';
      img.decoding = 'async';
      media.appendChild(img);
    } else {
      media.appendChild(categoryIcon(product.category));
      media.classList.add('is-placeholder');
    }
    if (product.badge) {
      var badge = document.createElement('span');
      badge.className = 'badge badge-float';
      badge.textContent = local(product.badge);
      media.appendChild(badge);
    }
    card.appendChild(media);

    var body = document.createElement('div');
    body.className = 'product-body';

    var cat = document.createElement('p');
    cat.className = 'product-category';
    cat.textContent = categoryName(product.category);
    body.appendChild(cat);

    var title = document.createElement('h3');
    title.className = 'product-title';
    title.textContent = local(product.name);
    body.appendChild(title);

    var desc = document.createElement('p');
    desc.className = 'product-desc';
    desc.textContent = local(product.desc);
    body.appendChild(desc);

    var foot = document.createElement('div');
    foot.className = 'product-foot';

    var price = document.createElement('span');
    price.className = 'price';
    price.textContent = formatPrice(product);
    foot.appendChild(price);

    var actions = document.createElement('div');
    actions.className = 'product-actions';

    var detailsBtn = document.createElement('button');
    detailsBtn.type = 'button';
    detailsBtn.className = 'btn btn-ghost btn-sm';
    detailsBtn.textContent = t('details');
    detailsBtn.setAttribute('aria-label', t('detailsOf') + ' ' + local(product.name));
    detailsBtn.addEventListener('click', function () {
      openDialog(product);
    });
    actions.appendChild(detailsBtn);

    var buy = document.createElement('a');
    buy.className = 'btn btn-primary btn-sm';
    buy.href = buyUrl(product);
    buy.target = '_blank';
    buy.rel = 'noopener';
    buy.textContent = t('buy');
    buy.setAttribute('aria-label', t('buyOf') + ' ' + local(product.name));
    actions.appendChild(buy);

    foot.appendChild(actions);
    body.appendChild(foot);
    card.appendChild(body);
    return card;
  }

  function renderCatalog() {
    var grid = document.getElementById('product-grid');
    var empty = document.getElementById('empty-state');
    if (!grid) return;

    grid.textContent = '';
    var visible = PRODUCTS.filter(matches);
    visible.forEach(function (product) {
      grid.appendChild(productCard(product));
    });
    if (empty) empty.hidden = visible.length !== 0;
    document.dispatchEvent(new CustomEvent('catalog:rendered'));
  }

  /* ────────────────────────── نافذة التفاصيل ────────────────────────── */

  var dialog = document.getElementById('product-dialog');
  var lastFocused = null;

  function openDialog(product) {
    if (!dialog) return;
    lastFocused = document.activeElement;

    var media = document.getElementById('dialog-media');
    media.textContent = '';
    media.dataset.category = product.category;
    media.classList.toggle('is-placeholder', !product.image);
    if (product.image) {
      var img = document.createElement('img');
      img.src = product.image;
      img.alt = local(product.name);
      media.appendChild(img);
    } else {
      media.appendChild(categoryIcon(product.category));
    }

    document.getElementById('dialog-category').textContent = categoryName(product.category);
    document.getElementById('dialog-title').textContent = local(product.name);
    document.getElementById('dialog-desc').textContent = local(product.desc);
    document.getElementById('dialog-price').textContent = formatPrice(product);

    var list = document.getElementById('dialog-includes');
    list.textContent = '';
    (product.includes || []).forEach(function (item) {
      var li = document.createElement('li');
      li.appendChild(svgIcon(['M5 12.5l4 4 10-10'], { width: '2' }));
      var span = document.createElement('span');
      span.textContent = local(item);
      li.appendChild(span);
      list.appendChild(li);
    });

    var buy = document.getElementById('dialog-buy');
    buy.href = buyUrl(product);
    buy.querySelector('[data-i18n]').textContent = t('buyNow');

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  }

  function closeDialog() {
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  if (dialog) {
    dialog.addEventListener('click', function (event) {
      /* النقر على الخلفية خارج المحتوى يغلق النافذة */
      if (event.target === dialog) closeDialog();
    });
    dialog.addEventListener('close', function () {
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    });
    var closeBtn = dialog.querySelector('[data-action="close-dialog"]');
    if (closeBtn) closeBtn.addEventListener('click', closeDialog);
  }

  /* ────────────────────────── الروابط والتواصل ────────────────────────── */

  var SOCIAL_ICONS = {
    email: ['M3.5 7.5A2 2 0 015.5 5.5h13a2 2 0 012 2v9a2 2 0 01-2 2h-13a2 2 0 01-2-2z', 'M4 7l8 5.5L20 7'],
    whatsapp: ['M20.5 11.6a8.5 8.5 0 01-12.3 7.6L3.5 20.5l1.4-4.6a8.5 8.5 0 1115.6-4.3z', 'M8.8 9.2c0 3 2.2 5.2 5.2 5.2.6 0 1.1-.5 1.1-1l-1.4-.8-1 .8a5 5 0 01-2-2l.8-1-.8-1.4c-.5 0-1.1.5-1.1 1.1z'],
    instagram: ['M4.5 8A3.5 3.5 0 018 4.5h8A3.5 3.5 0 0119.5 8v8a3.5 3.5 0 01-3.5 3.5H8A3.5 3.5 0 014.5 16z', 'M12 8.6a3.4 3.4 0 100 6.8 3.4 3.4 0 000-6.8z', 'M16.6 7.6h.01'],
    telegram: ['M20.5 5.2L3.9 11.4l4.4 1.5 1.7 5 2.4-2.9 4.2 3.1z', 'M8.3 12.9l9-6.4-5.9 8.5'],
    x: ['M4.5 4.5l15 15', 'M19.5 4.5l-15 15'],
    facebook: ['M14.5 8.5h2.2V5.6h-2.4c-2 0-3.3 1.3-3.3 3.4v1.6H8.8v2.9H11v6h3v-6h2.3l.4-2.9H14v-1.3c0-.6.2-.8.5-.8z'],
    payhip: ['M12 3.5l7.5 4v9l-7.5 4-7.5-4v-9z', 'M12 8.5v7', 'M8.8 10.2h6.4'],
  };

  function socialHref(kind, value) {
    if (kind === 'email') return 'mailto:' + value;
    if (kind === 'whatsapp') return 'https://wa.me/' + String(value).replace(/[^\d]/g, '');
    return value;
  }

  /** أول قناة تواصل متاحة — تُستخدم في زر «راسلنا». */
  function primaryContact() {
    var c = CONFIG.contact || {};
    var order = ['whatsapp', 'email', 'telegram', 'instagram', 'x', 'facebook'];
    for (var i = 0; i < order.length; i++) {
      if (c[order[i]]) return socialHref(order[i], c[order[i]]);
    }
    return CONFIG.storeUrl || '#';
  }

  function renderSocial() {
    var row = document.getElementById('social-row');
    if (!row) return;
    row.textContent = '';

    var contact = CONFIG.contact || {};
    var entries = Object.keys(SOCIAL_ICONS)
      .filter(function (kind) {
        return kind !== 'payhip' && contact[kind];
      })
      .map(function (kind) {
        return { kind: kind, href: socialHref(kind, contact[kind]), label: t(kind) };
      });

    /* متجر Payhip حاضر دائماً */
    entries.push({ kind: 'payhip', href: CONFIG.storeUrl || '#', label: t('payhip') });

    entries.forEach(function (entry) {
      var a = document.createElement('a');
      a.className = 'social-btn';
      a.href = entry.href;
      a.setAttribute('aria-label', entry.label);
      a.title = entry.label;
      if (entry.kind !== 'email' && entry.kind !== 'whatsapp') {
        a.target = '_blank';
        a.rel = 'noopener';
      }
      a.appendChild(svgIcon(SOCIAL_ICONS[entry.kind]));
      row.appendChild(a);
    });
  }

  function applyLinks() {
    document.querySelectorAll('[data-store-link]').forEach(function (a) {
      a.href = CONFIG.storeUrl || '#';
      a.target = '_blank';
      a.rel = 'noopener';
    });
    document.querySelectorAll('[data-contact-link]').forEach(function (a) {
      a.href = primaryContact();
    });
  }

  /* ────────────────────────── التفاعلات العامة ────────────────────────── */

  function bindHeader() {
    var langBtn = document.querySelector('[data-action="toggle-lang"]');
    if (langBtn) {
      langBtn.addEventListener('click', function () {
        state.lang = state.lang === 'ar' ? 'en' : 'ar';
        store(STORAGE_LANG, state.lang);
        applyLanguage();
      });
    }

    var themeBtn = document.querySelector('[data-action="toggle-theme"]');
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        store(STORAGE_THEME, state.theme);
        applyTheme();
      });
    }

    var navToggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('site-nav');
    if (navToggle && nav) {
      navToggle.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        navToggle.setAttribute('aria-expanded', String(open));
      });
      nav.addEventListener('click', function (event) {
        if (event.target.tagName === 'A') {
          nav.classList.remove('is-open');
          navToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    var header = document.querySelector('.site-header');
    if (header) {
      var onScroll = function () {
        header.classList.toggle('is-stuck', window.scrollY > 8);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  }

  function bindSearch() {
    var input = document.getElementById('product-search');
    if (!input) return;
    var timer = null;
    input.addEventListener('input', function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        state.query = input.value;
        renderCatalog();
      }, 150);
    });
  }

  /** ظهور تدريجي للبطاقات، مع احترام تفضيل تقليل الحركة. */
  function bindReveal() {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('has-reveal');

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          /* boundingClientRect.top < 0 يعالج التمرير السريع: قد يمرّ العنصر ويخرج
             من الشاشة قبل وصول الإشعار، فلا يُبلَّغ عنه كمتقاطع ويبقى مخفياً. */
          if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    var watch = function () {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      document.querySelectorAll('.card:not(.is-visible), .section-head:not(.is-visible)').forEach(function (el) {
        /* ما هو داخل الشاشة أصلاً يظهر فوراً بلا انتظار — يهمّ عند إعادة رسم
           الكتالوج بعد تبديل اللغة والزائر واقف عند قسم المنتجات. */
        var rect = el.getBoundingClientRect();
        if (rect.top < vh && rect.bottom > 0) {
          el.classList.add('is-visible');
          return;
        }
        observer.observe(el);
      });
    };
    watch();
    document.addEventListener('catalog:rendered', watch);
  }

  /* ────────────────────────── الإقلاع ────────────────────────── */

  applyTheme();
  applyLinks();
  bindHeader();
  bindSearch();
  bindReveal();
  applyLanguage();
})();
