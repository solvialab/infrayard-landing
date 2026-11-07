# Infrayard website

The public landing page, technical documentation and resources for **Infrayard by Solvia Lab**, a commercial self-service portal for Oracle Kubernetes Engine (OKE).

This repository contains the website, not the product source, Helm chart or customer credentials.

## Local development

Node.js 20 or newer is sufficient. No package installation is needed; the Markdown build dependency is vendored with its MIT licence.

```sh
npm run build
npm run check
npm test
npm run preview
```

The optional preview serves only on `http://127.0.0.1:4173/`. Localhost contact forms validate and retain entries but do not send email. Set `PORT` to change the port. Building and previewing do not publish anything, create an order or collect payment.

## Source files

| Source | Purpose |
| --- | --- |
| `src/index.html`, `src/demo.html` | Landing and demo structure with English copy |
| `src/sk/index.html`, `src/sk/demo.html` | Slovak landing and demo page, served under `/sk/` |
| `content/site.mjs` | Shared prices, metadata, FAQ and docs navigation |
| `content/sk.mjs` | Slovak metadata, FAQ and offers, and the list of pages that exist in both languages (hreflang, sitemap, EN/SK switch) |
| `legal/*.html`, `sk/legal/*.html` | English and Slovak legal pages; the build regenerates their head, header, footer and breadcrumbs |
| `content/docs/*.md` | Documentation; subscription copy is generated from shared prices |
| `scripts/build.mjs` | Generates landing HTML, 12 static docs pages, section search, AI summaries and sitemap |
| `content/seo.mjs`, `scripts/seo.mjs` | Shared search metadata, breadcrumbs, resource titles and demo publication metadata |
| `scripts/check-seo.mjs` | Canonical, crawlability, sitemap, structured-data and AI context checks |
| `scripts/export.mjs`, `vercel.json` | Local public-only artifact and future Vercel build/routing configuration |
| `assets/site.css`, `assets/docs.css` | Responsive styles and light/dark themes |
| `assets/site.js`, `assets/docs.js` | Pricing controls, forms, navigation and search |
| `assets/contact-request.js` | Validates contact processor responses |
| `resources/*.html` | Educational articles |

Run the build after changing source content. Commit generated pages and data with the source. Do not edit generated HTML directly. The landing page and docs have no remote CSS or client-side Markdown dependency.

The landing, demo and legal pages exist in English and Slovak. When you change English copy in one of them, change the Slovak version too. The documentation and the resource guides are English only; their SK link leads to the Slovak landing page, and Slovak pages mark links to them with an `EN` tag.

Resource and legal bodies remain editable HTML. The build refreshes their common search metadata and preserves the original resource publication dates. Edit resource search titles in `content/seo.mjs`. Update `site.updated` only for a substantive editorial change; it is not generated from the build time.

## Search and release preparation

The Slovak [Google Search Console guide](SEARCH-CONSOLE.md) covers domain verification, the single sitemap submission, URL inspection and post-release checks. `npm run export` prepares `dist/` locally; it never deploys. Vercel is configured to publish only that directory on a future authorised deployment. Keep the existing Google verification file.

The `/demo/` watch page and video sitemap are ready. Before the first public release of the music version, set its real `demo.publishedAt` in `content/seo.mjs` and rebuild to add complete VideoObject metadata. Until then the build does not invent an upload date. Do not change that original publication date on subsequent builds.

## Commercial model

<!-- pricing:start -->
- Business: **€3,000/month** with monthly billing and commitment, or **€30,000/year** paid upfront.
- Founding Business: **40% off for the first 12 months**, for the first 5 qualifying customers — **€1,800/month** or **€18,000 for the first year** paid upfront.
- Enterprise: from **€6,500/month**, with scope, billing and commitment in the proposal.
- Optional non-production evaluation: **€1,500 for 30 days**, starting after readiness confirmation. Credited against the first production invoice if the order is accepted within 30 days after evaluation ends.
<!-- pricing:end -->

Oracle usage is separate. Subscription activation, invoicing, renewals, cancellation and entitlements are arranged through the commercial agreement. This static website is not a recurring billing backend. A website edit does not change separately issued licence rights or existing agreements.

The shared source of truth is `content/site.mjs`. Customer-facing details are in [subscription, billing and licensing](https://www.infrayard.eu/docs/subscription/). Planned work stays on the dedicated [roadmap](https://www.infrayard.eu/docs/releases/).

## Demo media

Workflow cards link to full-HD frames in a keyboard-accessible viewport viewer, with image navigation, actual-size zoom and native image-link fallbacks. Preview images retain the original 16:9 proportions. The website uses self-hosted Inter 4.1 fonts; their OFL licence is included under `assets/fonts/`.

The landing player uses `assets/infrayard-demo-with-music.mp4`, with quiet instrumental music and gentle fades. The original `assets/final_hq_infrayard.mp4` is preserved; the new version copies its video stream without re-encoding. Music attribution, licensing, sharing credit and optional offline rebuild instructions are in [the music credits](assets/music/credits.md). Keep that credit when reusing the video on another platform.

## Documentation

Docs have static URLs and readable HTML without JavaScript, plus section-level search. The public Markdown entry points remain. Legacy `#readme` and `#features` links map to current pages.

The content preserves Basic/Enhanced worker-refresh differences, BYON ownership rules, compartment scope, template-limit exceptions, state handling and access prerequisites. Exact release-specific installation, upgrade and recovery commands are supplied in customer runbooks.

## Forms and verification

Production forms use the existing FormSubmit destinations: `hello@infrayard.eu` and `support@infrayard.eu`. Success requires a successful HTTP status and explicit processor confirmation. Errors preserve entered data. Automated tests mock responses and never send email.

Actual processor activation and inbox delivery must be checked as part of a separately authorised live release. Local tests do not prove mailbox delivery.

This change is prepared for local review. It does not perform deployment, remote push, payment setup or customer subscription activation.
