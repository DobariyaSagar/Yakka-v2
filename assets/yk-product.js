/* ==========================================================================
   section: product-buy-box — gallery, quantity, variant swatches, sticky bar
   Self-contained. Loaded by sections/product-buy-box.liquid only.
   ========================================================================== */
(function () {
  'use strict';

  function each(selector, root, fn) {
    Array.prototype.forEach.call((root || document).querySelectorAll(selector), fn);
  }
  function list(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  /* Formats cents with the shop's money format when available. */
  function formatMoney(cents) {
    var amount = (Number(cents) || 0) / 100;
    if (window.Shopify && window.Shopify.currency && window.Intl) {
      try {
        return new Intl.NumberFormat(document.documentElement.lang || 'en', {
          style: 'currency',
          currency: window.Shopify.currency.active
        }).format(amount);
      } catch (error) { /* fall through */ }
    }
    return '$' + amount.toFixed(2);
  }

  /* ------------------------------------------------------------ gallery */
  function initGallery(root) {
    each('[data-yk-gallery]', root, function (gallery) {
      if (gallery.dataset.ykBound) return;
      gallery.dataset.ykBound = '1';

      var main = gallery.querySelector('[data-yk-gallery-main]');
      var thumbs = list('[data-yk-gallery-thumb]', gallery);
      if (!main || !thumbs.length) return;

      function select(thumb) {
        if (thumb.dataset.image) {
          main.src = thumb.dataset.image;
          main.removeAttribute('srcset');
        }
        main.style.objectPosition = thumb.dataset.position || '50% 50%';
        thumbs.forEach(function (item) {
          var active = item === thumb;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-selected', active ? 'true' : 'false');
        });
      }

      thumbs.forEach(function (thumb) {
        thumb.addEventListener('click', function () { select(thumb); });
        thumb.addEventListener('keydown', function (event) {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          select(thumb);
        });
      });
    });
  }

  /* ----------------------------------------------------------- quantity */
  function initQuantity(root) {
    each('[data-yk-qty]', root, function (widget) {
      if (widget.dataset.ykBound) return;
      widget.dataset.ykBound = '1';

      var input = widget.querySelector('input');
      if (!input) return;

      function step(delta) {
        var min = parseInt(input.min, 10) || 1;
        var max = parseInt(input.max, 10) || Infinity;
        var next = (parseInt(input.value, 10) || min) + delta;
        input.value = Math.min(max, Math.max(min, next));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }

      each('[data-yk-qty-down]', widget, function (button) {
        button.addEventListener('click', function () { step(-1); });
      });
      each('[data-yk-qty-up]', widget, function (button) {
        button.addEventListener('click', function () { step(1); });
      });
    });
  }

  /* ----------------------------------------------------------- variants */
  /* Resolves the selected option combination against the variant JSON that
     snippets/product-variant-picker.liquid renders, then updates the form id,
     price, availability, inventory line, gallery image, URL and sticky bar.  */
  function initVariants(root) {
    each('[data-yk-variants]', root, function (form) {
      if (form.dataset.ykBound) return;
      form.dataset.ykBound = '1';

      var picker = form.querySelector('[data-yk-variant-picker]');
      var idInput = form.querySelector('[data-yk-variant-id]');
      if (!picker || !idInput) return;

      var dataScript = picker.querySelector('[data-yk-variant-data]');
      var variants;
      try {
        variants = JSON.parse(dataScript.textContent);
      } catch (error) {
        return; // malformed data — leave the server-rendered state alone
      }

      var groups = list('[data-yk-option-index]', picker);
      var priceEl = form.querySelector('[data-yk-price-current]');
      var compareEl = form.querySelector('[data-yk-price-compare]');
      var submit = form.querySelector('[data-yk-submit]');
      var qtyInput = form.querySelector('[data-yk-qty-input]');
      var inventoryEl = document.querySelector('[data-yk-inventory]');
      var galleryMain = document.querySelector('[data-yk-gallery-main]');
      var stickyId = document.querySelector('[data-yk-sticky-variant-id]');
      var stickyPrice = document.querySelector('[data-yk-sticky-price]');

      /* the value chosen in each option group, in option order */
      function selection() {
        return groups.map(function (group) {
          var checked = group.querySelector('input[data-yk-option-input]:checked');
          if (checked) return checked.value;
          var select = group.querySelector('select[data-yk-option-input]');
          return select ? select.value : null;
        });
      }

      function matchFor(values) {
        return variants.find(function (variant) {
          return variant.options.every(function (option, index) { return option === values[index]; });
        });
      }

      /* grey out combinations that don't exist at all */
      function markUnavailable(values) {
        groups.forEach(function (group, groupIndex) {
          each('input[data-yk-option-input]', group, function (input) {
            var probe = values.slice();
            probe[groupIndex] = input.value;
            var candidate = matchFor(probe);
            var label = group.querySelector('label[for="' + input.id + '"]');
            if (!label) return;
            label.classList.toggle('is-unavailable', !candidate || !candidate.available);
          });
        });
      }

      function updateSelectedLabels(values) {
        groups.forEach(function (group, index) {
          var output = group.querySelector('[data-yk-option-selected]');
          if (output) output.textContent = values[index];
        });
      }

      function apply() {
        var values = selection();
        var variant = matchFor(values);

        updateSelectedLabels(values);
        markUnavailable(values);

        if (!variant) {
          if (submit) {
            submit.disabled = true;
            submit.classList.add('is-disabled');
            submit.textContent = submit.dataset.labelUnavailable || submit.dataset.labelSoldOut || 'Unavailable';
          }
          return;
        }

        idInput.value = variant.id;
        if (stickyId) stickyId.value = variant.id;

        var formatted = formatMoney(variant.price);
        if (priceEl) priceEl.textContent = formatted;
        if (stickyPrice) stickyPrice.textContent = formatted;

        if (compareEl) {
          var discounted = variant.compare_at_price > variant.price;
          compareEl.textContent = discounted ? formatMoney(variant.compare_at_price) : '';
          compareEl.hidden = !discounted;
        }

        if (submit) {
          submit.disabled = !variant.available;
          submit.classList.toggle('is-disabled', !variant.available);
          submit.textContent = variant.available
            ? (submit.dataset.labelDefault || submit.textContent)
            : (submit.dataset.labelSoldOut || 'Sold out');
        }

        /* respect inventory when the shop denies overselling */
        if (qtyInput) {
          if (variant.inventory_management && variant.inventory_policy === 'deny') {
            qtyInput.max = variant.inventory_quantity;
            if (parseInt(qtyInput.value, 10) > variant.inventory_quantity) {
              qtyInput.value = Math.max(1, variant.inventory_quantity);
            }
          } else {
            qtyInput.removeAttribute('max');
          }
        }

        if (inventoryEl) updateInventory(inventoryEl, variant);
        if (variant.media && galleryMain) {
          galleryMain.src = variant.media;
          galleryMain.removeAttribute('srcset');
        }

        /* keep the URL shareable without adding history entries */
        if (variant.url) {
          window.history.replaceState({}, '', variant.url);
        }

        form.dispatchEvent(new CustomEvent('yk:variant:change', { detail: { variant: variant }, bubbles: true }));
      }

      /* Labels come from the section as data attributes, so they stay localised. */
      function updateInventory(element, variant) {
        var threshold = parseInt(element.dataset.threshold, 10) || 0;
        var dot = 'yk-product__inventory-dot';
        var modifier = '';
        var label;

        if (!variant.available) {
          modifier = ' ' + dot + '--out';
          label = element.dataset.labelOutOfStock || 'Sold out';
        } else if (variant.inventory_management && variant.inventory_quantity <= threshold) {
          modifier = ' ' + dot + '--low';
          label = (element.dataset.labelLowStock || '').replace('__count__', variant.inventory_quantity);
        } else {
          label = element.dataset.labelInStock || 'In stock';
        }

        element.innerHTML = '<span class="' + dot + modifier + '"></span>' + label;
      }

      picker.addEventListener('change', apply);
      markUnavailable(selection());
    });
  }

  /* --------------------------------------------------------- sticky bar */
  function initStickyBar(root) {
    each('[data-yk-sticky-bar]', root, function (bar) {
      if (bar.dataset.ykBound) return;
      bar.dataset.ykBound = '1';

      var target = document.querySelector(bar.dataset.ykWatch || '[data-yk-buy-box]');
      if (!target || !('IntersectionObserver' in window)) return;

      // Reveal once the main buy box has scrolled past the top of the viewport.
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var scrolledPast = !entry.isIntersecting && entry.boundingClientRect.top < 0;
          bar.classList.toggle('is-visible', scrolledPast);
        });
      }, { threshold: 0 }).observe(target);
    });
  }

  function init(root) {
    initGallery(root);
    initQuantity(root);
    initVariants(root);
    initStickyBar(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(document); });
  } else {
    init(document);
  }

  document.addEventListener('shopify:section:load', function (event) { init(event.target); });
})();
