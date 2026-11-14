import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const faqs = JSON.parse(readFileSync(path.join(root, "config/faqs.json"), "utf8"));

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".html") ? [p] : [];
  });
}

test("FAQ loaders skip confirmed:false", () => {
  const services = readFileSync(path.join(root, "src/data/services.ts"), "utf8");
  const content = readFileSync(path.join(root, "src/data/content.ts"), "utf8");
  const site = readFileSync(path.join(root, "src/lib/site.ts"), "utf8");
  assert.match(services, /confirmed === false/);
  assert.match(content, /confirmed !== false/);
  assert.match(site, /confirmed !== false/);
});

test("unconfirmed FAQ text is absent from dist when a build exists", () => {
  const dist = path.join(root, "dist");
  if (!existsSync(dist)) return;
  const html = walk(dist).map((f) => readFileSync(f, "utf8")).join("\n");
  for (const item of faqs.items.filter((f) => f.confirmed === false)) {
    assert.equal(html.includes(item.q), false, item.id);
  }
  assert.equal(/we pull it|we pull the permit/i.test(html), false);
});
