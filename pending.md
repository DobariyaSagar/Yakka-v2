# Pending — YAKKA Ignition theme

Status of the theme as built, verified against the code (not from memory).
Last updated **30 July 2026** after the Dawn-structured commerce build. Everything here is *known missing or unverified* — the built and
validated parts are documented in `README.md`.

Tick items off as they land. Not part of the theme; exclude it from the upload zip
along with `preview/`.

---

## 1. Blockers before a real store launch

- [ ] **Never run against a store.** No Shopify CLI on the build machine, so no
  Liquid has ever executed and `shopify theme check` has never run. Everything is
  statically validated only (JSON, schemas, setting references, tag balance,
  snippet/asset/locale references). Highest-risk spots to check first:
  `preload_tag`, `stylesheet_tag: preload: true`, the `decoding` / `fetchpriority`
  params on `image_tag`, the hyphenated `data-yk-variants` attribute on the
  `form` tag, the `settings[key]` dynamic lookup in `snippets/yk-social-links.liquid`,
  and the `color_scheme_group` role mapping in `config/settings_schema.json`.
- [ ] **JSON-LD unvalidated.** `snippets/structured-data.liquid` is structurally
  sound but has never been parsed by Google. Run every page type through the Rich
  Results Test — one Liquid quirk breaks the whole graph silently.
- [x] ~~**Cart is read-only.**~~ Built: `sections/main-cart-items.liquid` +
  `main-cart-footer.liquid` + `assets/yk-cart.js` — AJAX quantity, remove, order
  note, line and cart-level discounts, express checkout, `templates/cart.json`.
  **Still missing:** discount-code entry (Shopify only allows it at checkout for
  most plans), shipping estimator, and a cart drawer / add-to-cart notification.
- [x] ~~**Variant picker is single-option.**~~ Built:
  `snippets/product-variant-picker.liquid` (one control per option, buttons or
  dropdowns) with combination resolution, unavailable-combination striking,
  inventory-aware quantity max, `?variant=` URL sync, and gallery + inventory
  updates in `assets/yk-product.js`.
- [x] ~~**Sticky bar doesn't follow the picker.**~~ It now syncs its variant id
  and price, and adds via AJAX without leaving the page.
- [ ] **Nav drops child links.** `link.links` is never rendered in
  `sections/header.liquid`, so dropdowns / mega menus disappear in both the
  desktop nav and the mobile drawer. Any two-level menu loses its second level.

## 2. Commerce features not built

- [x] ~~**Collection**~~ Built: `main-collection-banner` +
  `main-collection-product-grid` + `snippets/facets.liquid` +
  `assets/yk-facets.js` — storefront filters (list, boolean, price range), sort,
  active-filter chips, pagination, and fetch-and-swap via the Section Rendering
  API with a no-JS form fallback. `snippets/card-product.liquid` has vendor,
  sale/sold-out badges, second image on hover, ratings and quick add.
- [x] ~~**Search results**~~ Built: `sections/main-search.liquid` reusing the same
  card and facet components, plus page/article results.
  **Still missing:** predictive (type-ahead) search.
- [x] ~~Product recommendations~~ Built: `sections/related-products.liquid` +
  `assets/yk-recommendations.js` (Recommendations API, lazy-fetched, related or
  complementary), added to `templates/product.json`.
- [x] ~~Inventory messaging~~ Built: in-stock / low-stock ("Only 4 left") /
  sold-out line with a configurable threshold, updated live per variant.
- [ ] **Product** — still no video or 3D media, no zoom or lightbox, no SKU /
  vendor display in the buy box, and no ratings (so the Product schema still has
  no `aggregateRating`).
- [ ] **Blog** — no comments, tags or share links.
- [ ] **Customer accounts** — minimal. No forgot-password form, no address
  edit/delete, no country/province selectors; the order page lacks addresses, tax
  lines and fulfilment tracking.
- [ ] **Localization** — `hreflang` is emitted, but there's no country / language
  selector form anywhere.
- [ ] **App blocks** — no section accepts `"@app"` blocks, so merchants can't drop
  app widgets (reviews, subscriptions, upsells) into the sections. Dawn supports
  this.

## 3. Settings that exist but do nothing yet

These show up in the customizer and will read as broken to a merchant who moves
them.

- [ ] **Per-section Color scheme picker.** The plumbing is done —
  `snippets/yk-section-style.liquid` applies a scheme and lets the per-section
  colour pickers override it, and `layout/theme.liquid` emits the
  `.yk-color-scheme-*` classes — but the `color_scheme` schema entry isn't on the
  19 sections, so schemes only apply globally from `:root`. One line per section.
- [ ] `spacing_grid_horizontal` / `spacing_grid_vertical` — tokens defined in
  `base.css`, but no section grid reads them (each uses its own `grid_gap`).
- [ ] `buttons_shadow_opacity`, `card_shadow_opacity`, `media_shadow_opacity` —
  inert. The `color-mix()` shadow wiring was in the edit that was stopped.
- [ ] `card_border_thickness` — inert; sections hardcode `1px`.
- [ ] `brand_image_width` — inert; the footer logo uses a fixed max-height
  (`--yk-footer-logo`).

## 4. Verification not done

- [ ] No Lighthouse / PageSpeed run — the performance work is structural, not
  measured.
- [ ] Chrome headless only. No Safari / iOS, Firefox or real device. Likely iOS
  friction: `backdrop-filter`, `aspect-ratio`, scroll-snap on the multicolumn
  swipe row, and the drawer's full-height panel.
- [ ] No colour-contrast audit against WCAG AA.
- [ ] The search drawer isn't a focus trap (the nav drawer is). The cart has an
  `aria-live` status region, but price changes from the variant picker aren't
  announced.

## 5. Maintenance debt

- [ ] `preview/index.html` duplicates every section's markup by hand and will
  drift from the Liquid unless updated in lockstep.
- [ ] Only `locales/en.default.json`. No `en.default.schema.json`, so customizer
  labels aren't translatable, and no second language.
- [ ] `image-with-text` and `multicolumn` aren't in `templates/index.json` — this
  one is deliberate, so the approved homepage order stays untouched. Add them via
  **Customize → Add section** when wanted.

---

## Suggested order

1. Nav child links (silent content loss — cheapest real fix)
2. `shopify theme check` + a dev-store pass over the new commerce sections —
   nothing in this build has executed yet
3. Cart drawer / add-to-cart notification (the AJAX plumbing is already there)
4. Predictive search
5. The five inert settings in §3
6. Per-section colour schemes on the remaining 19 sections (the six new commerce
   sections already have the picker)
7. Product media: video, 3D, zoom
8. Rich Results Test + Lighthouse
