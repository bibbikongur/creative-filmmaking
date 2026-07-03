# Creative Filmmaking

Catalogue website for production vehicles rented to film & TV productions in Iceland.
Dark, cinematic design. No prices — every vehicle has a **"Request an offer"** call-to-action.

Bilingual: English at the root (`/`), Icelandic under `/is/*`.

## Stack

Nuxt 4 · Tailwind CSS · @nuxtjs/i18n · @nuxtjs/seo · @nuxt/image · @nuxt/fonts · nodemailer

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
```

## Edit the fleet

All vehicle content lives in **`app/data/vehicles.ts`** — one entry per vehicle with
English + Icelandic text side by side (`{ en: '...', is: '...' }`). Add, remove or edit
entries there; the catalogue, detail pages, sitemap and contact-form dropdown all update
automatically.

To replace the placeholder Unsplash photos with real ones:

1. Drop images in `public/images/` (e.g. `public/images/arctic-base-1.jpg`)
2. Change the vehicle's `images` array to `['/images/arctic-base-1.jpg', ...]`

UI text (buttons, labels, headings) lives in `i18n/locales/en.json` and `is.json`.

## Offer-request emails

The contact form posts to `/api/contact`, which sends email via SMTP. Configure with
env vars (see `.env.example`): `NUXT_SMTP_HOST`, `NUXT_SMTP_PORT`, `NUXT_SMTP_USER`,
`NUXT_SMTP_PASS`, `NUXT_CONTACT_TO`. Without SMTP config, dev logs submissions to the
console; production returns an error so the UI shows the direct email address instead.

## Deploy (Railway)

1. Railway dashboard → **New Project → Deploy from GitHub repo** → select this repo.
   `railway.json` drives the build (`NIXPACKS`) and start (`node .output/server/index.mjs`).
2. Set service variables: `NUXT_PUBLIC_SITE_URL` (the Railway/custom domain), the SMTP
   vars above, and optionally `NUXT_PUBLIC_CONTACT_ADDRESS/PHONE/EMAIL`.
3. Settings → Networking → **Generate Domain** (or attach a custom domain, then update
   `NUXT_PUBLIC_SITE_URL`).
