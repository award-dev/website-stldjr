# Linking Rules

## Build the link map from data first
Before writing pages, produce `site-data/link-map.json` (generated, not hand-written):
```json
{ "/services/junk-removal/": ["/services/demolition/", "/service-areas/kirkwood/", "/service-areas/"],
  "/service-areas/kirkwood/": ["/services/junk-removal/", "/service-areas/des-peres/", "/service-areas/"] }
```
Rules used to generate it:
1. Home → every service page, the hub, and top city pages.
2. Service → its `related` services + every city page where a job of that service exists + hub.
3. City page → every service performed there + `nearby` cities that have pages + hub.
4. Hub → every city page.
5. Mention-tier cities get no URL and receive no links.
6. Every page links to Contact and has the click-to-call button.

Then implement exactly that map. If a target page does not exist, don't link to it.

## Anchor text
- Describe the destination: "garage cleanouts in Kirkwood", "our dumpster rental sizes".
- Vary it naturally across pages; don't repeat the exact keyword anchor everywhere.
- Never "click here", "learn more" alone, or bare URLs.
- Contextual links inside paragraphs count more than footer links; put at least 2 in body copy per page.

## Outbound links
- Allowed: URLs in `official_links`, `gbp_url`, `socials`, and sources you have opened and confirmed (city government, county, utility, licensing board, manufacturer).
- Never guess a URL. If you want a source that isn't in data, add a TODO asking for it.
- Open in same tab; add `rel="noopener"` if using `target="_blank"`. No `nofollow` on legitimate citations.
- 1–3 authoritative outbound links per city page is plenty.

## Hygiene
- No orphan pages: everything in sitemap must have at least one internal link in.
- No links to redirects or 404s; use final trailing-slash URLs that match canonicals.
- Max click depth from home: 3.
