/* ==========================================================================
   Cart — AJAX line updates, removal and quick add.
   Uses Shopify's Cart AJAX API with `sections` so one request returns the
   updated cart sections and header count; nothing is re-implemented client
   side. Without JS the same controls still work as plain form posts.
   ========================================================================== */
(function () {
  'use strict';

  var routes = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';

  function each(selector, root, fn) {
    Array.prototype.forEach.call((root || document).querySelectorAll(selector), fn);
  }

  function sectionIds() {
    var ids = [];
    each('[data-yk-cart-section], [data-yk-cart-footer]', document, function (node) {
      var id = node.dataset.ykSectionId;
      if (id && ids.indexOf(id) === -1) ids.push(id);
    });
    return ids;
  }

  function setBusy(busy) {
    each('[data-yk-cart-section], [data-yk-cart-footer]', document, function (node) {
      node.classList.toggle('is-loading', busy);
      node.setAttribute('aria-busy', busy ? 'true' : 'false');
    });
  }

  function announce(message) {
    var status = document.querySelector('[data-yk-cart-status]');
    if (status) status.textContent = message;
  }

  /* Swap the returned section HTML in place, then re-bind. */
  function applySections(sections) {
    if (!sections) return;

    Object.keys(sections).forEach(function (id) {
      var fresh = new DOMParser().parseFromString(sections[id], 'text/html');
      var freshNode = fresh.querySelector('[data-yk-section-id="' + id + '"]');
      var current = document.querySelector('[data-yk-section-id="' + id + '"]');
      if (!freshNode || !current) return;

      current.innerHTML = freshNode.innerHTML;
      current.hidden = freshNode.hidden;
      current.dataset.ykBound = '';
    });

    init(document);
    document.dispatchEvent(new CustomEvent('yk:cart:updated'));
  }

  function change(body) {
    setBusy(true);
    body.sections = sectionIds().join(',');
    body.sections_url = window.location.pathname;

    return fetch(routes + 'cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    })
      .then(function (response) { return response.json(); })
      .then(function (cart) {
        applySections(cart.sections);
        announce(cart.item_count === 0 ? '' : String(cart.item_count));
        setBusy(false);
        return cart;
      })
      .catch(function () {
        // never leave the shopper stuck with a stale cart
        window.location.href = routes + 'cart';
      });
  }

  /* ------------------------------------------------------------ cart lines */
  function initCartLines(root) {
    each('[data-yk-cart-section]', root, function (section) {
      if (section.dataset.ykBound) return;
      section.dataset.ykBound = '1';

      each('[data-yk-cart-qty]', section, function (widget) {
        var input = widget.querySelector('[data-yk-cart-input]');
        if (!input) return;

        function commit(value) {
          change({ line: parseInt(input.dataset.index, 10), quantity: value });
        }

        widget.querySelector('[data-yk-cart-minus]').addEventListener('click', function () {
          commit(Math.max(0, (parseInt(input.value, 10) || 1) - 1));
        });
        widget.querySelector('[data-yk-cart-plus]').addEventListener('click', function () {
          var max = parseInt(input.max, 10);
          var next = (parseInt(input.value, 10) || 0) + 1;
          commit(isNaN(max) ? next : Math.min(max, next));
        });
        input.addEventListener('change', function () {
          commit(Math.max(0, parseInt(input.value, 10) || 0));
        });
      });

      each('[data-yk-cart-remove]', section, function (link) {
        link.addEventListener('click', function (event) {
          event.preventDefault();
          change({ line: parseInt(link.dataset.index, 10), quantity: 0 });
        });
      });
    });

    /* order note — saved on blur, no button needed */
    each('[data-yk-cart-note]', root, function (note) {
      if (note.dataset.ykBound) return;
      note.dataset.ykBound = '1';

      note.addEventListener('change', function () {
        fetch(routes + 'cart/update.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ note: note.value })
        });
      });
    });
  }

  /* ------------------------------------------------------------- quick add */
  function initQuickAdd(root) {
    each('[data-yk-quick-add]', root, function (form) {
      if (form.dataset.ykBound) return;
      form.dataset.ykBound = '1';

      form.addEventListener('submit', function (event) {
        event.preventDefault();

        var button = form.querySelector('button[type="submit"]');
        var original = button ? button.textContent : '';
        if (button) {
          button.disabled = true;
          button.textContent = button.dataset.labelAdding || '…';
        }

        var data = new FormData(form);
        data.append('sections', sectionIds().join(','));

        fetch(routes + 'cart/add.js', { method: 'POST', body: data, headers: { Accept: 'application/json' } })
          .then(function (response) { return response.json(); })
          .then(function (result) {
            if (result.status) throw new Error(result.description || result.message);
            applySections(result.sections);
            document.dispatchEvent(new CustomEvent('yk:cart:updated'));
            if (button) {
              button.textContent = button.dataset.labelAdded || '✓';
              setTimeout(function () {
                button.textContent = original;
                button.disabled = false;
              }, 1600);
            }
          })
          .catch(function () {
            // fall back to the real form post so the shopper still gets a cart
            form.submit();
          });
      });
    });
  }

  function init(root) {
    initCartLines(root);
    initQuickAdd(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(document); });
  } else {
    init(document);
  }

  document.addEventListener('shopify:section:load', function (event) { init(event.target); });
})();
