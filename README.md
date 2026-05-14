# Praali

This repo holds two things:

- **Shopify theme** at the repo root (`layout/`, `sections/`, `snippets/`, `templates/`, `assets/`, `config/`, `locales/`). Designed to be connected to a Shopify store via the GitHub integration.
- **Static prototype** at [`prototype/`](prototype/) — the original HTML/CSS/JS prototype used as the visual reference. Kept around for diffing and re-styling.

## Connecting the theme to a Shopify store

1. In Shopify admin: **Online Store** → **Themes** → **Add theme** → **Connect from GitHub**.
2. Authorize Shopify to access this repo.
3. Pick the branch (`main`).
4. Shopify will pull the theme files from the root and create a draft theme.

For local development with Shopify CLI:

```bash
npm install -g @shopify/cli @shopify/theme
shopify theme dev --store=<your-store>.myshopify.com
```

## What's in the theme

- `layout/theme.liquid` — page shell (header, footer, content slot, product modal)
- `templates/index.json` — homepage: hero, featured products, photo gallery, our mission
- `templates/product.liquid` — `/products/<handle>` page
- `templates/cart.liquid` — `/cart`
- `templates/404.liquid` — branded 404
- `sections/` — hero, featured-products, photo-gallery, our-mission, header, footer
- `snippets/product-card.liquid` — single product card
- `snippets/product-card-placeholder.liquid` — fallback card when no products exist yet
- `snippets/product-modal.liquid` — click-in modal with product data as inline JSON
- `assets/theme.css` and `assets/theme.js`
- `assets/` — product photos, gallery photos, hero, illustration, video, border, mark

## Prototype shortcuts (TODO for real launch)

- The modal's product data lives inline as JSON in `snippets/product-modal.liquid`. Replace with Liquid that reads from real product metafields (`custom.tagline`, `custom.bullets`, `custom.fit_note`, `custom.size_chart`).
- The featured-products section falls back to placeholder cards when no collection is picked. Point it at a real collection in the theme editor once products are loaded.
- Hero image, mission video, and gallery photos have asset-file fallbacks but can be overridden per-store in the theme editor.
