/* ==========================================================================
   Filtering + sorting — progressive enhancement over the facet <form>.
   Without JS the form GETs the collection URL and the page reloads.
   With JS we fetch the same URL, ask for just this section via the Section
   Rendering API, swap the results, and push the URL with history.
   ========================================================================== */
(function () {
  'use strict';

  var DEBOUNCE = 400;

  function each(selector, root, fn) {
    Array.prototype.forEach.call((root || document).querySelectorAll(selector), fn);
  }

  function initFacets(root) {
    each('[data-yk-facets]', root, function (facets) {
      if (facets.dataset.ykBound) return;
      facets.dataset.ykBound = '1';

      var form = facets.querySelector('[data-yk-facet-form]');
      var container = facets.closest('[data-yk-section-id]');
      if (!form || !container) return;

      var sectionId = container.dataset.ykSectionId;
      var results = container.querySelector('[data-yk-facet-results]');
      var timer;
      var controller;

      /* Build the destination URL from the form's current state. */
      function currentUrl() {
        var params = new URLSearchParams(new FormData(form));
        // drop empties so the URL stays readable and cacheable
        Array.from(params.keys()).forEach(function (key) {
          if (params.get(key) === '') params.delete(key);
        });
        var query = params.toString();
        return window.location.pathname + (query ? '?' + query : '');
      }

      function setBusy(busy) {
        container.classList.toggle('is-loading', busy);
        if (results) results.setAttribute('aria-busy', busy ? 'true' : 'false');
      }

      function render(url) {
        setBusy(true);
        if (controller) controller.abort();
        controller = new AbortController();

        var fetchUrl = url + (url.indexOf('?') === -1 ? '?' : '&') + 'section_id=' + sectionId;

        fetch(fetchUrl, { signal: controller.signal })
          .then(function (response) { return response.text(); })
          .then(function (html) {
            var fresh = new DOMParser().parseFromString(html, 'text/html');
            var freshSection = fresh.querySelector('[data-yk-section-id="' + sectionId + '"]');
            if (!freshSection) return;

            // swap results and the facet form (counts and disabled states change)
            var freshResults = freshSection.querySelector('[data-yk-facet-results]');
            var freshFacets = freshSection.querySelector('[data-yk-facets]');

            if (freshResults && results) results.innerHTML = freshResults.innerHTML;
            if (freshFacets) {
              var openState = {};
              each('details', facets, function (details, index) { openState[index] = details.open; });
              facets.innerHTML = freshFacets.innerHTML;
              each('details', facets, function (details, index) {
                if (openState[index] !== undefined) details.open = openState[index];
              });
              facets.dataset.ykBound = '';
              initFacets(container);
            }

            window.history.replaceState({}, '', url);
            setBusy(false);
          })
          .catch(function (error) {
            if (error.name === 'AbortError') return;
            // fall back to a normal navigation rather than leaving a dead UI
            window.location.href = url;
          });
      }

      function schedule() {
        clearTimeout(timer);
        timer = setTimeout(function () { render(currentUrl()); }, DEBOUNCE);
      }

      form.addEventListener('input', function (event) {
        if (event.target.type === 'number') return schedule();     // let typing settle
        render(currentUrl());
      });
      form.addEventListener('change', function (event) {
        if (event.target.type === 'number') return schedule();
        render(currentUrl());
      });
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        render(currentUrl());
      });

      // "clear" links and active-filter chips
      each('[data-yk-facet-link]', facets, function (link) {
        link.addEventListener('click', function (event) {
          event.preventDefault();
          render(link.getAttribute('href'));
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initFacets(document); });
  } else {
    initFacets(document);
  }

  document.addEventListener('shopify:section:load', function (event) { initFacets(event.target); });
  window.addEventListener('popstate', function () { window.location.reload(); });
})();
