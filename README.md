# YAKKA — Ignition (Shopify theme)

An Online Store 2.0 theme built from the `yakka-v2-ignition.html` layout. Every
band of the page is an **independent section**: its own Liquid file, its own
stylesheet, its own JS (only where behaviour is needed) and its own complete set
of settings. Drop a section into any page, reorder it, duplicate it, or delete
it — nothing else in the theme changes.

---

## Architecture

```
layout/theme.liquid          loads base.css only, maps theme settings → CSS variables
assets/base.css              tokens · reset · typography · utilities · button/field/badge
assets/section-<name>.css    one stylesheet per section (loaded by that section)
assets/yk-<feature>.js       one script per behaviour (loaded by the section that needs it)
snippets/yk-section-style     settings → per-instance CSS variables
sections/<name>.liquid       markup + schema
```

Each section declares its own dependencies at the top of the file:

```liquid
{{ 'section-hero.css' | asset_url | stylesheet_tag }}
{% render 'yk-section-style', section: section %}
```

so nothing loads on a page that doesn't use it, and a section can be copied into
another theme with just its `.css` (plus `base.css` for the shared primitives).

### How settings reach CSS

`snippets/yk-section-style.liquid` renders one scoped rule per section instance:

```css
#shopify-section-abc123{ --yk-sec-bg:#17150F; --yk-sec-pt:150px; --yk-sec-cols:3; … }
```

The section stylesheet then reads those variables with fallbacks:

```css
.yk-steps{ grid-template-columns:repeat(var(--yk-sec-cols,4),minmax(0,1fr)) }
```

One shared snippet, static cacheable CSS, no duplicated property blocks, and two
instances of the same section on one page can look completely different.

### Settings every section exposes

| Group | Settings |
|---|---|
| Content | headings, body, images, buttons, toggles for optional parts |
| Layout | columns (desktop / tablet / mobile), image position, ratio, gaps, alignment |
| Colours | background, heading, body, eyebrow, accent — empty = inherit the theme |
| Typography | heading size + separate mobile heading size |
| Section spacing | top / bottom padding **and** separate mobile top / bottom padding |

### Sections

| Section | Blocks | Own CSS | Own JS |
|---|---|---|---|
| `announcement-bar` | message | ✓ | — |
| `header` | — | ✓ | `yk-header.js` |
| `hero-product` | chip, trust | ✓ | — |
| `marquee` | benefit | ✓ | — |
| `stats-bar` | stat | ✓ | — |
| `feature-banner` | — | ✓ | — |
| `image-with-text` | caption, heading, text, button | ✓ | — |
| `how-it-works` | step | ✓ | — |
| `product-buy-box` | spec, assurance | ✓ | `yk-product.js` |
| `included-kit` | item | ✓ | — |
| `multicolumn` | column | ✓ | — |
| `comparison-table` | row | ✓ | — |
| `guarantee` | column | ✓ | — |
| `reviews` | review | ✓ | — |
| `brand-story` | benefit | ✓ | — |
| `faq` | question | ✓ | `yk-faq.js` (only when single-open is on) |
| `cta-band` | — | ✓ | — |
| `contact-form` | — | ✓ | — |
| `footer` | brand, menu, text, social, newsletter | ✓ | — |

### Commerce sections (Dawn structure)

| Section | Template | Own CSS | Own JS |
|---|---|---|---|
| `main-collection-banner` | `collection.json` | shared | — |
| `main-collection-product-grid` | `collection.json` | `section-collection.css` | `yk-facets.js`, `yk-cart.js` |
| `main-search` | `search.json` | shared | `yk-facets.js`, `yk-cart.js` |
| `main-cart-items` | `cart.json` | `section-cart.css` | `yk-cart.js` |
| `main-cart-footer` | `cart.json` | shared | — |
| `related-products` | `product.json` | shared | `yk-recommendations.js` |

Shared commerce components: `snippets/card-product.liquid` (+
`assets/component-card-product.css`), `snippets/facets.liquid`,
`snippets/product-variant-picker.liquid`, `snippets/yk-price.liquid`.

**How the interactive bits work** — every control is a real form first, then
upgraded:

- **Filtering / sorting** — one `<form>` that GETs the collection URL. `yk-facets.js`
  intercepts it, fetches the same URL with `section_id`, swaps the results and the
  facet form (so counts and disabled states stay correct), and `replaceState`s the
  URL. Any failure falls back to a normal navigation.
- **Cart** — quantity, remove and note post to `/cart/change.js` and
  `/cart/update.js` with `sections`, so one request returns the re-rendered cart
  sections and header count. `<noscript>` keeps the update button.
- **Variants** — `product-variant-picker` renders one control per option plus the
  variant JSON; `yk-product.js` resolves the combination, strikes out
  combinations that don't exist, updates price, availability, inventory line,
  gallery image, quantity max, the sticky bar and the URL.
- **Quick add / sticky add** — `/cart/add.js` with `sections`, falling back to a
  real form submit.
- **Recommendations** — fetched from the Recommendations API when the block nears
  the viewport, so it never blocks render.

Every section has a `preset`, so all of them appear under **Add section** in the
customizer and can be used on any template — not just the homepage.

#### Dawn-parity sections

`image-with-text` and `multicolumn` mirror Dawn's settings so they behave the way
you already expect:

**Image with text**

| Setting | Options |
|---|---|
| Desktop layout | Image first · **Text first (reversed)** |
| Content layout | No overlap · Overlap (content card laps the image) |
| Image height | Adapt to ratio · Small · Medium · Large |
| Image ratio | Landscape · Square · Portrait · Wide |
| Desktop image width | Small (⅓) · Medium (½) · Large (⅔) |
| Desktop content position | Top · Middle · Bottom |
| Content alignment | Left · Centre · Right — desktop and mobile set separately |

Reversing swaps the columns *and* mirrors the image-width ratio so the image keeps
its share of the row. Below 990px the image always comes first regardless of the
desktop order, exactly as Dawn does it. The content column is block-driven
(caption / heading / text / button), so it can be reordered in the customizer.

**Multicolumn**

| Setting | Options |
|---|---|
| Columns | 1–6 desktop · 1–4 tablet · 1–2 mobile |
| Image width | Full · Half · One third of the column |
| Image ratio | Adapt · Portrait · Square · **Circle** |
| Column alignment | Left · Centre |
| Column background | None · Card |
| Swipe on mobile | Grid, or one scroll-snapping row |
| Extras | Section eyebrow, heading, body, button; per-column title, text and link |

Both are in `preview/index.html` — image-with-text appears twice, once default and
once reversed with the overlap card, so you can see the flip side by side. Neither
is on the homepage yet: add them in **Customize → Add section**, or say the word
and I'll place them in `templates/index.json`.

---

## SEO

| Area | What the theme does |
|---|---|
| Meta | Title, description (falls back to product / collection / article / shop text), canonical, `theme-color`, Open Graph (with real image dimensions and alt) and Twitter cards — `snippets/meta-tags.liquid` |
| Robots | `index, follow, max-image-preview:large` on real content; `noindex, follow` on search, cart, 404 and every customer page. `templates/robots.txt.liquid` keeps Shopify's defaults and adds the theme's filter / sort / variant query params |
| Structured data | `snippets/structured-data.liquid` emits Organization + WebSite (with SearchAction) on every page, then Product + Offers, CollectionPage, BlogPosting or WebPage per page type, each with a BreadcrumbList. Rendered once from the layout so sections can't duplicate it |
| FAQ rich result | The FAQ section outputs FAQPage JSON-LD, question for question from its blocks (toggle: *Add FAQ structured data*) |
| Headings | Exactly one `<h1>` per page — the section headline. The header logo is a `<div>`, so it never competes |
| Alt text | Taken from the image's own alt, falling back to the section heading; decorative placeholders stay `alt=""` |
| i18n | `hreflang` alternates for every published locale, `lang` on `<html>`, `prev` / `next` on paginated pages |

## Performance

- **CSS** — a slim `base.css` plus one stylesheet per section, so a page downloads only what it renders. The above-the-fold ones (`header`, `hero`) use `stylesheet_tag: preload: true`.
- **LCP** — the hero preloads its image (`preload_tag`) and serves it `loading="eager" fetchpriority="high"`; every other image is `loading="lazy" decoding="async"`.
- **CLS** — every image carries width/height or an `aspect-ratio`, so nothing reflows while loading.
- **JS** — three small per-section files (header, product, FAQ), all `defer`, no framework, no globals. The animation script loads only when *Reveal sections on scroll* is on.
- **Fonts** — Google Fonts load non-blocking (`media="print"` + `onload`) with a `<noscript>` fallback, and are skipped entirely if you switch both typefaces to Shopify fonts.
- **Prices** — `snippets/yk-price.liquid` is the single place money is formatted, honouring *Currency format*.

---

## Install

```bash
cd yakka-shopify
shopify theme dev --store your-store.myshopify.com   # live preview
shopify theme push --unpublished                     # upload as a draft
shopify theme check                                  # lint
```

Or zip it for Admin → Themes → Upload zip:

```bash
cd yakka-shopify && zip -r ../yakka-ignition.zip . -x '*.DS_Store' 'preview/*' 'pending.md' 'README.md'
```

### After installing

1. **Menus** — create a `main-menu` and a `footer` menu in Navigation.
2. **Product** — Customize → *Product buy box* → pick your product. Until then the
   section shows demo pricing and placeholder images. On the product template the
   current product is used automatically.
3. **Colours / width / base font** — Customize → Theme settings.

---

## Conventions

**CSS** — BEM, namespaced `yk-`:

```
.yk-review              block
.yk-review__quote       element
.yk-btn--ghost          modifier
.is-open / .is-active   state — set by JS only, never styled directly by sections
data-yk-*               JS hooks — never styled, so restyling can't break behaviour
--yk-sec-*              per-instance variables from section settings
--yk-*                  global design tokens (base.css)
```

**Liquid** — `{% liquid %}` blocks for logic up top, markup below; `{%- -%}` to keep
whitespace out of the output; guarded output (`{% if x != blank %}`) so empty
settings don't render empty tags; `section.id`-scoped element ids so two instances
never collide.

**JS** — one file per section, no dependencies, no globals. Every initialiser is
idempotent (`data-ykBound`) and re-runs on `shopify:section:load`, so the theme
editor stays live. Progressive enhancement throughout: the FAQ is native
`<details>`, the forms are native Shopify forms, and the gallery falls back to the
featured image if scripts fail.

---

## Responsive

Shopify's standard breakpoints: **mobile ≤749px**, **tablet 750–989px**,
**desktop ≥990px** (plus 1199px and 479px touch-ups).

| Breakpoint | What changes |
|---|---|
| 1199 | hero chips pull inside the viewport edge |
| 989 | header → burger + centred logo + icons, menu opens as a **drawer** (or dropdown, per setting); hero / feature / buy box / story / contact stack image-first; grids drop to their tablet column count; marquee scrolls; comparison table scrolls inside its card |
| 749 | single column, full-width buttons, stacked qty + add-to-cart, stacked footer and contact form, mobile padding + mobile heading sizes take over |
| 479 | small-handset type and gutter trims |

Column counts at every breakpoint are settings, not hard-coded values. The page
never scrolls horizontally — wide content scrolls inside its own container.

## Hover & interaction

All hover styling sits inside `@media (hover:hover) and (pointer:fine)` so touch
devices never get stuck-on states: button lift + sheen sweep, nav underline wipe,
header icon tint, card lifts (step / kit / review), image scale (gallery, thumbs,
reviews, hero), swatch and quantity highlights, spec and comparison row
highlights, FAQ `+ → ×`, footer link slide, field hover/focus rings. Pressed
states apply on every device; `prefers-reduced-motion` disables the motion.

## Mobile menu

Below 990px the menu opens as an off-canvas **drawer** — Dawn-style — with a dimmed
overlay, its own title row and close button, and an optional footer line. Settings:

| Setting | Options |
|---|---|
| Style | **Drawer (slides in)** · Dropdown (pushes the page) |
| Opens from | Left · Right |
| Drawer width | 260–480px (capped at 86vw) |
| Footer text | Free text, e.g. shipping and returns |
| Background | Own colour setting |

The drawer traps Tab inside itself, closes on overlay click, Escape, or following a
link, locks the page behind it, and returns focus to the burger on close. The
dropdown variant keeps the page interactive and skips the lock and focus move.

## Header icons

`snippets/icon-search.liquid`, `icon-user.liquid`, `icon-cart.liquid` — inline SVG,
`currentColor`, 22px, each toggleable in the header settings. The cart bubble
renders `cart.item_count` from Liquid and refreshes from `/cart.js`; dispatch
`yk:cart:updated` on `document` after an AJAX add to refresh it again.

---

## Notes

- Instrument Serif isn't in Shopify's font library, so it loads from Google Fonts
  in `layout/theme.liquid`. Replace that `<link>` if you self-host.
- Images in `assets/` were extracted from the base64 data URIs in the original
  HTML; replace them through the section image pickers.
- `preview/index.html` is a static mirror using the same CSS and JS files, for
  checking breakpoints and hovers without a store. It isn't part of the theme and
  is excluded from the zip command above.
- Known gaps, unwired settings and unverified areas are tracked in `pending.md`.
- Not yet run against a live store from this machine (no Shopify CLI here). JSON,
  section schemas, setting references, block types, Liquid tag balance,
  snippet/asset references and translation keys are all validated; run
  `shopify theme check` after cloning for the full lint.
