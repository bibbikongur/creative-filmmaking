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

## Edit the fleet — admin panel

Go to **`/admin`** and log in with the password set in `NUXT_ADMIN_PASSWORD`.
From there you can add, edit, delete and reorder vehicles (both languages, specs,
highlights) and upload photos. Changes go live immediately — the catalogue, detail
pages, sitemap and contact-form dropdown all read from the same store.

How it works:

- The fleet lives in **`<data dir>/vehicles.json`**, seeded on first run from
  `app/data/vehicles.ts` (which is only the initial content after that).
- Uploaded photos land in `<data dir>/uploads/` and are served at `/uploads/*`.
- The data dir defaults to `./.data` (gitignored). In production set
  `NUXT_DATA_DIR` to a persistent volume — otherwise edits are lost on redeploy.
- Icelandic fields are optional; the site falls back to English when empty.

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
   vars above, `NUXT_ADMIN_PASSWORD`, and optionally `NUXT_PUBLIC_CONTACT_ADDRESS/PHONE/EMAIL`.
3. **Persist admin edits**: service → right-click → **Attach Volume**, mount path `/data`,
   and set `NUXT_DATA_DIR=/data`. Without this, vehicles edited in `/admin` and uploaded
   photos reset on every redeploy.
4. Settings → Networking → **Generate Domain** (or attach a custom domain, then update
   `NUXT_PUBLIC_SITE_URL`).
