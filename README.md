# Fox Media Agency — website

Static site for Fox Media Ltd (foxmediaagency.co.uk). Built by ATID Media Ltd.
No framework, no CMS: a tiny Python build script stitches shared partials into finished HTML.

## Layout

```
build.py            builds ./dist from ./src and ./assets (Netlify runs this)
netlify.toml        build command + publish folder
src/layout.html     <head>, nav, footer wrapper for every page
src/nav.html        the menu (Creators link is commented out until the roster arrives)
src/footer.html
src/pages/*.html    one file per page; a few <!-- meta --> comments at the top set path, title, description
assets/css/site.css all styles
assets/js/site.js   all behaviour (motion, nav, forms)
assets/img/         logo cut-outs, founder photos, favicon, OG image
assets/video/       EMPTY — drop hero clips here (see below)
static/             _headers, _redirects, robots.txt (copied into dist)
dist/               build output — don't edit by hand
```

Build locally: `python3 build.py` then open `dist/index.html` via a local server (absolute `/assets/` paths need one):
`python3 -m http.server 8000 --directory dist`

## Dropping in the hero videos

The two phones on the homepage look for:

- `assets/video/mj.mp4`
- `assets/video/wayne.mp4`

If a file is missing the phone shows the founder's photo instead, so the site works either way.
Spec: vertical 9:16, 1080×1920 or 720×1280, H.264 MP4, **no audio track** (muted autoplay is more reliable without one), 10–30 seconds, under ~4 MB each. Export from CapCut or `ffmpeg -i in.mov -an -vf scale=720:1280 -c:v libx264 -crf 26 -movflags +faststart mj.mp4`.
If the files end up large, host them on Cloudflare Stream / Bunny instead and change the `<source src>` in `src/pages/00-home.html`.

## Adding creators to the roster

`src/pages/03-creators.html` has six placeholder cards with comments explaining each field. Fill in handle, niche, follower count and profile link; optionally add a photo (`assets/img/creators/`) or clip (`assets/video/creators/`). Then uncomment the Creators link in `src/nav.html`.

## Forms

Two Netlify Forms: `apply` (3-step application) and `enquiry` (training page). Both redirect to `/thanks/`.
After the first deploy, in Netlify → Forms → each form → Notifications: add email notification to the client's inbox. For the Google Sheet, use Netlify's Zapier integration or a Zap triggered on "New Form Submission".
Spam: honeypot field is set (`bot-field`). Turn on Netlify's Akismet filtering too.
Note: Netlify only detects forms if Forms is enabled on the site *before* the deploy runs (Project → Forms → Enable). If you enable it later, trigger a redeploy.

## Deploying

1. Push this folder to a GitHub repo (ATID account; add the client as collaborator).
2. Netlify → Add new site → Import from Git. Build command and publish dir are read from `netlify.toml`.
3. Domain management → Add domain → buy `foxmediaagency.co.uk` through Netlify (or point DNS at Netlify if bought elsewhere). Set `www` as primary; Netlify handles the apex redirect and HTTPS.
4. Email: add ImprovMX MX + TXT records in Netlify DNS so `hello@foxmediaagency.co.uk` forwards to the client's Gmail.
5. Handover: client creates a free Netlify team → Site settings → Transfer site. Domain goes with it.

## Before go-live checklist

- [ ] Replace `[ICO NUMBER]` in `src/pages/08-privacy.html` once the client has registered (ico.org.uk, ~£40/yr).
- [ ] Confirm TikTok profile URLs in `src/footer.html` (`@kernow_pastyland`, `@topdogcornwall`) resolve.
- [ ] Confirm Sarah E. and Dave P. are happy to be quoted; switch to full names if they are.
- [ ] Hero videos in `assets/video/` (optional for launch).
- [ ] Form notifications set up in Netlify and a test submission received.
- [ ] Creator agreement and image/stats release form in place before the roster goes public.

## Design notes

Dark charcoal `#0b0c10`, metallic greys from the logo, one accent `#ff5a1f`. Chakra Petch for display, Manrope for body (Google Fonts). Motion: masked word-rise headings, 1.2s expo-out scroll reveals, ticker, Fox Method line draw, roster cards from the right with frosted glass. All motion respects `prefers-reduced-motion`.
