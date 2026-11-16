---
title: "Blog format sample (draft, never published)"
description: "A draft-only sample that shows the blog post file format: frontmatter fields, a cover photo, a small photo gallery and a link to a related service page."
date: 2026-11-16
cover: ../../assets/blog/blog-format-sample/florissant-sleigh-bed-removal.jpg
coverAlt: "Crew member in an STL shirt carrying a wooden sleigh bed frame across a Florissant front porch to the truck"
photos:
  - src: ../../assets/blog/blog-format-sample/florissant-sleigh-bed-removal.jpg
    alt: "Crew member in an STL shirt carrying a wooden sleigh bed frame across a Florissant front porch to the truck"
service: junk-removal
draft: true
---

This file is a format sample for the blog. It stays a draft (`draft: true`), so it is never built, linked or listed in the sitemap. Copy its frontmatter when you add a real post, and leave this file as a draft.

## How a post file is laid out

Each post is one Markdown file in `src/content/blog/`. The file name is the web address: `my-post.md` becomes `/blog/my-post/`. Photos go in `src/assets/blog/my-post/` and are only the company's own job photos.

### What the page adds for you

- The title as the page's main heading, with the date and the cover photo
- A link to the related service page when `service` is set
- The booking and quote buttons, and a gallery of any extra `photos`

## What the body should hold

Write plain paragraphs, `##` and `###` headings and simple lists. Keep paragraphs short, two to four sentences, and only state facts the owner has confirmed.
