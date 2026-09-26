#!/usr/bin/env node
// Local preview: serves dist/ and runs the Netlify Functions in-process.
//
//   npm run build && npm run preview                 # booking shows "not connected"
//   MOCK_CALENDAR=1 npm run preview                  # demo calendar (clearly labelled)
//   GOOGLE_CALENDAR_ID=... GOOGLE_CALENDAR_CREDENTIALS=... npm run preview   # real calendar
//
// Storage goes to .data/. Quote form posts (Netlify Forms in production) are
// written to .data/quotes/. Not for production use.

import { createServer } from "node:http";
import { readFile, stat, mkdir, writeFile, readdir } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { pathToFileURL } from "node:url";

process.env.LOCAL_DEV = "1";
const PORT = Number(process.env.PORT) || 4321;
const ROOT = join(process.cwd(), "dist");
const FN_DIR = join(process.cwd(), "netlify", "functions");

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain", ".webmanifest": "application/manifest+json",
};

// Load functions and compile their config.path patterns.
const routes = [];
for (const f of await readdir(FN_DIR)) {
  if (!f.endsWith(".mjs")) continue;
  const mod = await import(pathToFileURL(join(FN_DIR, f)).href);
  const paths = [].concat(mod.config?.path || []);
  for (const p of paths) {
    const keys = [];
    const re = new RegExp("^" + p.replace(/:([a-zA-Z]+)/g, (_, k) => (keys.push(k), "([^/]+)")) + "/?$");
    routes.push({ re, keys, handler: mod.default, name: f });
  }
}

async function toRequest(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks);
  return new Request(`http://${req.headers.host}${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: ["GET", "HEAD"].includes(req.method) ? undefined : body,
  });
}

async function send(res, response) {
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}

async function serveStatic(res, pathname) {
  let p = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  let file = join(ROOT, p);
  try {
    const s = await stat(file);
    if (s.isDirectory()) file = join(file, "index.html");
  } catch {
    if (!extname(file)) {
      // /pricing → /pricing/ like Netlify
      try {
        await stat(join(ROOT, p, "index.html"));
        res.writeHead(301, { location: p + "/" });
        return res.end();
      } catch {}
    }
  }
  try {
    const data = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch {
    const nf = await readFile(join(ROOT, "404.html")).catch(() => "Not found");
    res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    res.end(nf);
  }
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    for (const r of routes) {
      const m = url.pathname.match(r.re);
      if (m) {
        const params = Object.fromEntries(r.keys.map((k, i) => [k, m[i + 1]]));
        return send(res, await r.handler(await toRequest(req), { params }));
      }
    }
    if (req.method === "POST" && url.pathname === "/") {
      // Stand-in for Netlify Forms
      const request = await toRequest(req);
      const form = Object.fromEntries(new URLSearchParams(await request.text()));
      await mkdir(".data/quotes", { recursive: true });
      await writeFile(`.data/quotes/${Date.now()}.json`, JSON.stringify(form, null, 2));
      console.log(`[forms] ${form["form-name"]} submission saved`);
      res.writeHead(200, { "content-type": "text/plain" });
      return res.end("ok");
    }
    return serveStatic(res, url.pathname);
  } catch (e) {
    console.error(e);
    res.writeHead(500);
    res.end("Server error");
  }
}).listen(PORT, () => {
  console.log(`Local preview on http://localhost:${PORT}  (calendar: ${process.env.GOOGLE_CALENDAR_ID ? "live" : process.env.MOCK_CALENDAR === "1" ? "demo" : "not configured"})`);
});
