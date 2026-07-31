/* ==========================================================================
   section: header — mobile menu (drawer or dropdown), search drawer, cart bubble
   Self-contained. Loaded by sections/header.liquid only.
   Re-binds on `shopify:section:load` so the theme editor stays live.
   ========================================================================== */
(function () {
  'use strict';

  var MOBILE_MAX = 989; // keep in sync with section-header.css

  function each(selector, root, fn) {
    Array.prototype.forEach.call((root || document).querySelectorAll(selector), fn);
  }

  /* -------------------------------------------------------- mobile menu */
  function initMobileMenu(root) {
    each('[data-yk-burger]', root, function (burger) {
      if (burger.dataset.ykBound) return;
      burger.dataset.ykBound = '1';

      var menu = document.getElementById(burger.getAttribute('aria-controls'));
      if (!menu) return;

      var isDrawer = menu.classList.contains('yk-mobile-nav--drawer');
      var header = burger.closest('.yk-header');
      var overlay = header ? header.querySelector('[data-yk-nav-overlay]') : null;
      var closeButton = menu.querySelector('[data-yk-nav-close]');

      function setOpen(open) {
        menu.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        burger.setAttribute(
          'aria-label',
          burger.dataset[open ? 'labelClose' : 'labelOpen'] || (open ? 'Close menu' : 'Open menu')
        );

        if (overlay) {
          overlay.hidden = false;
          overlay.classList.toggle('is-open', open);
        }

        // A drawer sits over the page, so lock the page behind it and move
        // focus in. The dropdown leaves the page interactive and does neither.
        if (!isDrawer) return;

        document.body.classList.toggle('yk-no-scroll', open);

        if (open) {
          var target = closeButton || menu.querySelector('a');
          if (target) target.focus();
        } else {
          burger.focus();
        }
      }

      burger.addEventListener('click', function () {
        setOpen(burger.getAttribute('aria-expanded') !== 'true');
      });

      if (closeButton) {
        closeButton.addEventListener('click', function () { setOpen(false); });
      }
      if (overlay) {
        overlay.addEventListener('click', function () { setOpen(false); });
      }

      // following a link closes the menu
      menu.addEventListener('click', function (event) {
        if (event.target.closest('a')) setOpen(false);
      });

      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && menu.classList.contains('is-open')) setOpen(false);
      });

      // keep tabbing inside an open drawer
      menu.addEventListener('keydown', function (event) {
        if (!isDrawer || event.key !== 'Tab' || !menu.classList.contains('is-open')) return;

        var focusable = menu.querySelectorAll('a[href], button:not([disabled])');
        if (!focusable.length) return;

        var first = focusable[0];
        var last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });

      window.addEventListener('resize', function () {
        if (window.innerWidth > MOBILE_MAX && menu.classList.contains('is-open')) setOpen(false);
      });
    });
  }

  /* ------------------------------------------------------- search drawer */
  function initSearch(root) {
    each('[data-yk-search-toggle]', root, function (toggle) {
      if (toggle.dataset.ykBound) return;
      toggle.dataset.ykBound = '1';

      var panel = document.getElementById(toggle.getAttribute('aria-controls'));
      if (!panel) return;

      function setOpen(open) {
        panel.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (!open) return;
        var input = panel.querySelector('input[type="search"]');
        if (input) input.focus();
      }

      toggle.addEventListener('click', function () {
        setOpen(!panel.classList.contains('is-open'));
      });
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && panel.classList.contains('is-open')) {
          setOpen(false);
          toggle.focus();
        }
      });
    });
  }

  /* ---------------------------------------------------------- cart bubble */
  /* The Liquid-rendered count is correct on load; this catches later changes
     made by AJAX carts or apps. Dispatch `yk:cart:updated` to refresh it.   */
  function refreshCartCount() {
    var bubbles = document.querySelectorAll('[data-yk-cart-count]');
    if (!bubbles.length) return;

    var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';

    fetch(root + 'cart.js', { headers: { Accept: 'application/json' } })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (cart) {
        if (!cart) return;
        Array.prototype.forEach.call(bubbles, function (bubble) {
          bubble.textContent = cart.item_count > 0 ? cart.item_count : '';
          bubble.hidden = cart.item_count === 0;
        });
      })
      .catch(function () { /* offline or preview — keep the rendered value */ });
  }

  function init(root) {
    initMobileMenu(root);
    initSearch(root);
  }

  function boot() {
    init(document);
    refreshCartCount();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  document.addEventListener('shopify:section:load', function (event) { init(event.target); });
  document.addEventListener('shopify:section:unload', function () {
    document.body.classList.remove('yk-no-scroll');
  });
  document.addEventListener('yk:cart:updated', refreshCartCount);
})();
