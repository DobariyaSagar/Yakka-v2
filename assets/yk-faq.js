/* ==========================================================================
   section: faq — optional single-open (accordion) behaviour
   <details>/<summary> does the opening; this only closes the siblings when
   the section's "One answer open at a time" setting is on.
   ========================================================================== */
(function () {
  'use strict';

  function init(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll('[data-yk-faq]'), function (faq) {
      if (faq.dataset.ykBound) return;
      faq.dataset.ykBound = '1';
      if (faq.dataset.ykSingle !== 'true') return;

      var items = Array.prototype.slice.call(faq.querySelectorAll('details'));
      items.forEach(function (item) {
        item.addEventListener('toggle', function () {
          if (!item.open) return;
          items.forEach(function (other) { if (other !== item) other.open = false; });
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(document); });
  } else {
    init(document);
  }

  document.addEventListener('shopify:section:load', function (event) { init(event.target); });
})();
