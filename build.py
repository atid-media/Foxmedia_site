#!/usr/bin/env python3
"""Fox Media Agency — static site builder.
Run `python3 build.py` from the repo root. Writes finished HTML into ./dist (what Netlify publishes).
No dependencies. Edit the page content below or the partials in ./src.
"""
import os, re, shutil, datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")
DIST = os.path.join(ROOT, "dist")
SITE_URL = "https://www.foxmediaagency.co.uk"
EMAIL = "hello@foxmediaagency.co.uk"

def read(p):
    with open(os.path.join(SRC, p), encoding="utf-8") as f:
        return f.read()

LAYOUT = read("layout.html")

# Cache-bust: /assets/* is served with a one-year immutable cache (static/_headers), so stamp the CSS and JS
# links with a short content hash. A changed file gets a new URL and returning visitors pick it up.
import hashlib
def _ver(rel):
    with open(os.path.join(ROOT, rel), "rb") as f:
        return hashlib.md5(f.read()).hexdigest()[:8]
for _rel in ("assets/css/site.css", "assets/js/site.js"):
    LAYOUT = LAYOUT.replace('"/%s"' % _rel, '"/%s?v=%s"' % (_rel, _ver(_rel)))
NAV = read("nav.html")
FOOTER = read("footer.html")

def page(path, title, desc, body, nav_key="", extra_head="", og_type="website"):
    url = SITE_URL + path
    nav = NAV
    nav = re.sub(r'(<a href="/%s/"[^>]*class=")' % re.escape(nav_key), r'\1on ', nav) if nav_key else nav
    html = (LAYOUT
            .replace("{{title}}", title)
            .replace("{{desc}}", desc)
            .replace("{{url}}", url)
            .replace("{{og_type}}", og_type)
            .replace("{{extra_head}}", extra_head)
            .replace("{{nav}}", nav)
            .replace("{{body}}", body)
            .replace("{{footer}}", FOOTER)
            .replace("{{email}}", EMAIL))
    out = os.path.join(DIST, path.strip("/"), "index.html") if path != "/" else os.path.join(DIST, "index.html")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        f.write(html)
    return url

def main():
    if os.path.exists(DIST):
        shutil.rmtree(DIST)
    os.makedirs(DIST)
    shutil.copytree(os.path.join(ROOT, "assets"), os.path.join(DIST, "assets"))
    for f in ("_headers", "_redirects", "robots.txt"):
        if os.path.exists(os.path.join(ROOT, "static", f)):
            shutil.copy(os.path.join(ROOT, "static", f), DIST)
    shutil.copy(os.path.join(ROOT, "assets", "img", "favicon.png"), os.path.join(DIST, "favicon.png"))

    pages = [p for p in sorted(os.listdir(os.path.join(SRC, "pages"))) if p.endswith(".html")]
    urls = []
    for p in pages:
        raw = read(os.path.join("pages", p))
        meta = dict(re.findall(r"<!--\s*(\w+):\s*(.*?)\s*-->", raw.split("\n<!-- end-meta -->")[0]))
        body = raw.split("<!-- end-meta -->", 1)[1]
        urls.append(page(meta["path"], meta["title"], meta["desc"], body, meta.get("nav", ""), meta.get("head", "")))

    today = datetime.date.today().isoformat()
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        if "/thanks/" in u: continue
        sm.append("  <url><loc>%s</loc><lastmod>%s</lastmod></url>" % (u, today))
    sm.append("</urlset>")
    with open(os.path.join(DIST, "sitemap.xml"), "w") as f:
        f.write("\n".join(sm))
    print("Built %d pages into dist/" % len(urls))

if __name__ == "__main__":
    main()
