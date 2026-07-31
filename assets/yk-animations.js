/* ==========================================================================
   Theme setting: Animations › Reveal sections on scroll
   Loaded from layout/theme.liquid only when that setting is on, so the default
   page ships zero animation JS. Anything already in view is revealed on the
   first frame, so nothing above the fold flashes empty.
   ========================================================================== */
(function () {
  'use strict';

  var SELECTOR = '.yk-section, .yk-marquee, .yk-stats';

  function observe(root) {
    var targets = (root || document).querySelectorAll(SELECTOR);
    if (!targets.length) return;

    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(targets, function (el) { el.classList.add('is-revealed'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });

    Array.prototype.forEach.call(targets, function (target) {
      if (target.dataset.ykRevealBound) return;
      target.dataset.ykRevealBound = '1';
      observer.observe(target);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { observe(document); });
  } else {
    observe(document);
  }

  document.addEventListener('shopify:section:load', function (event) { observe(event.target); });
})();
