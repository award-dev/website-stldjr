# JSON-LD Patterns

Output as `<script type="application/ld+json">` in the head. Fill every value from /site-data. Use one `@graph` per page.

## Site-wide business node (on every page, same @id)
```json
{
  "@type": "HomeAndConstructionBusiness",
  "@id": "https://www.example.com/#business",
  "name": "", "url": "https://www.example.com/", "telephone": "+13145550100",
  "email": "", "image": "", "logo": "",
  "address": { "@type": "PostalAddress", "streetAddress": "", "addressLocality": "", "addressRegion": "", "postalCode": "", "addressCountry": "US" },
  "geo": { "@type": "GeoCoordinates", "latitude": 0, "longitude": 0 },
  "openingHoursSpecification": [{ "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday"], "opens": "07:00", "closes": "18:00" }],
  "areaServed": [{ "@type": "City", "name": "Kirkwood, MO" }],
  "sameAs": ["GBP url", "facebook", "instagram"],
  "foundingDate": "2016"
}
```
- Pick the most specific subtype that fits (HomeAndConstructionBusiness, Plumber, RoofingContractor, AutoRepair, ...).
- If `hide_address` is true (service-area business), omit streetAddress/postalCode, keep locality/region + areaServed.
- `areaServed` lists every location in locations.json (both tiers).

## WebPage + BreadcrumbList (every page)
```json
{ "@type": "WebPage", "@id": "{url}#webpage", "url": "{url}", "name": "{title}", "isPartOf": { "@id": "https://www.example.com/#website" }, "about": { "@id": "https://www.example.com/#business" }, "breadcrumb": { "@id": "{url}#breadcrumb" } },
{ "@type": "BreadcrumbList", "@id": "{url}#breadcrumb", "itemListElement": [
  { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.example.com/" },
  { "@type": "ListItem", "position": 2, "name": "Service Areas", "item": "https://www.example.com/service-areas/" },
  { "@type": "ListItem", "position": 3, "name": "Kirkwood", "item": "https://www.example.com/service-areas/kirkwood/" } ] }
```
Render a matching visible breadcrumb on the page.

## Service (service pages, and city pages for the main service)
```json
{ "@type": "Service", "@id": "{url}#service", "name": "Junk Removal", "serviceType": "Junk Removal",
  "provider": { "@id": "https://www.example.com/#business" },
  "areaServed": { "@type": "City", "name": "Kirkwood, MO" },
  "description": "{summary from services.json}" }
```

## FAQPage (only when Q&A is visible on the page)
```json
{ "@type": "FAQPage", "mainEntity": [ { "@type": "Question", "name": "Q", "acceptedAnswer": { "@type": "Answer", "text": "A" } } ] }
```
Google rarely shows FAQ rich results for business sites now, but the markup still helps search engines and AI answers read the Q&A. Text must match the visible FAQ exactly.

## Reviews
- Show reviews as visible text. Do NOT add self-written `AggregateRating`/`Review` to your own LocalBusiness — Google treats it as self-serving and ignores or penalizes it. Let the Google Business Profile carry stars.

## Validate
After building, test 1–2 pages at https://search.google.com/test/rich-results and https://validator.schema.org/.
