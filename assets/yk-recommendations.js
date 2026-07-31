/* ==========================================================================
   Product recommendations — fetches the section markup from Shopify's
   Product Recommendations API once the block is near the viewport.
   ========================================================================== */
(function () {
  'use strict';

  function load(container) {
    var url = container.dataset.url;
    if (!url || container.dataset.ykLoaded) return;
    container.dataset.ykLoaded = '1';

    fetch(url)
      .then(function (response) { return response.text(); })
      .then(function (html) {
        var fresh = new DOMParser().parseFromString(html, 'text/html');
        var freshInner = fresh.querySelector('[data-yk-recommendations]');
        if (!freshInner) return;

        container.innerHTML = freshInner.innerHTML;

        // let the cart script bind any quick-add forms that just arrived
        document.dispatchEvent(new CustomEvent('shopify:section:load', { detail: {}, bubbles: false }));
      })
      .catch(function () { /* recommendations are non-critical — fail quietly */ });
  }

  function init(root) {
    Array.prototype.forEach.call(
      (root || document).querySelectorAll('[data-yk-recommendations]'),
      function (container) {
        if (!('IntersectionObserver' in window)) return load(container);

        new IntersectionObserver(function (entries, observer) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            load(container);
            observer.disconnect();
          });
        }, { rootMargin: '0px 0px 400px 0px' }).observe(container);
      }
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(document); });
  } else {
    init(document);
  }
})();
