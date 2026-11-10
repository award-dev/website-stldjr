# Page Blueprints

Section order for each page type. Sections marked (data) must be filled from /site-data; if the data is missing, leave a TODO, do not write filler.

## Home
1. Hero — H1 "{Main service} in {Base city}, {ST}", answer-first sentence, call button, trust strip (years, insured, review count from reviews.json)
2. Services grid (data: services.json) — each card links to its service page
3. Why us — differentiators (data: business.json)
4. Recent jobs (data: latest 3 jobs across locations) — each links to its city page if one exists
5. Reviews (data: 3–6 verbatim reviews)
6. Service areas — links to every city page + text list of mention-tier cities, link to hub
7. FAQ (data) → FAQPage schema
8. Final CTA + NAP

## Service page
1. H1 "{Service} in {Base city}, {ST}" + answer-first intro
2. What's included / not included (data)
3. Pricing — H2 "How much does {service} cost?" (data: pricing_note; never invent numbers)
4. Process steps (data)
5. Recent {service} jobs (data: jobs where service matches) — link each to its city page
6. Reviews mentioning this service (data)
7. Areas we serve for {service} — links to city pages where this service was done
8. Related services (data: related) — links
9. FAQ (data) → FAQPage schema
10. CTA

## City page (only after passing the city gate)
1. H1 "{Main service} in {City}, {ST}" + intro naming a real neighborhood or job
2. Local context — H2 using local_facts (rules, pickup schedules, housing stock, permits). This section must be unique to the city.
3. Jobs we've done in {City} — summaries + photos (data: jobs)
4. Services available in {City} — links to service pages
5. Reviews from {City} customers (data: review_ids)
6. Neighborhoods we cover (data)
7. Helpful local resources — outbound official_links (data)
8. City FAQ (data: unique_faqs) → FAQPage schema
9. Nearby areas — links to nearby cities that have pages + hub
10. CTA

Uniqueness target: under ~30% of body text shared with any other city page. The audit script measures this.

## Service Areas hub
1. H1 "Areas We Serve" + base city statement
2. Map embed or static map image of service area
3. Linked list of city pages, then plain list of mention-tier cities
4. CTA

## About / Contact
About: founding story (data), owner name/photo if provided, licenses, insurance. Contact: NAP, hours, map embed of GBP, form, `tel:` link.
