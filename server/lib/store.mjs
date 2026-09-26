// Storage for booking records and customer photos.
//
// Production: Netlify Blobs (no credentials needed when deployed on Netlify).
// Local dev (LOCAL_DEV=1): files under .data/. Anywhere else, storage is
// reported as unavailable rather than silently dropping data.

import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { env } from "./config.mjs";

export class StoreUnavailable extends Error {
  constructor(msg = "Storage is not available") {
    super(msg);
    this.name = "StoreUnavailable";
    this.code = "store_unavailable";
  }
}

function onNetlify() {
  return Boolean(globalThis.Netlify || env("NETLIFY_BLOBS_CONTEXT") || env("NETLIFY_SITE_ID"));
}

function fileStore(name) {
  const root = join(env("LOCAL_DATA_DIR") || ".data", name);
  const safe = (k) => join(root, k.replace(/[^a-zA-Z0-9._-]/g, "_"));
  return {
    kind: "file",
    async getJSON(key) {
      try {
        return JSON.parse(await readFile(safe(key) + ".json", "utf8"));
      } catch {
        return null;
      }
    },
    async setJSON(key, value) {
      const p = safe(key) + ".json";
      await mkdir(dirname(p), { recursive: true });
      await writeFile(p, JSON.stringify(value, null, 2));
    },
    async setBinary(key, data, metadata) {
      const p = safe(key);
      await mkdir(dirname(p), { recursive: true });
      await writeFile(p, Buffer.from(data));
      await writeFile(p + ".meta", JSON.stringify(metadata || {}));
    },
    async getBinary(key) {
      try {
        await stat(safe(key));
        const data = await readFile(safe(key));
        const metadata = JSON.parse(await readFile(safe(key) + ".meta", "utf8"));
        return { data, metadata };
      } catch {
        return null;
      }
    },
  };
}

async function blobStore(name) {
  const { getStore } = await import("@netlify/blobs");
  const s = getStore({ name, consistency: "strong" });
  return {
    kind: "netlify-blobs",
    getJSON: (key) => s.get(key, { type: "json" }),
    setJSON: (key, value) => s.setJSON(key, value),
    setBinary: (key, data, metadata) => s.set(key, data, { metadata }),
    async getBinary(key) {
      const r = await s.getWithMetadata(key, { type: "arrayBuffer" });
      return r ? { data: Buffer.from(r.data), metadata: r.metadata } : null;
    },
  };
}

const cache = new Map();

export async function openStore(name) {
  if (cache.has(name)) return cache.get(name);
  let store;
  if (onNetlify()) store = await blobStore(name);
  else if (env("LOCAL_DEV") === "1") store = fileStore(name);
  else throw new StoreUnavailable();
  cache.set(name, store);
  return store;
}

/** Memory store for tests. */
export function memoryStore() {
  const m = new Map();
  return {
    kind: "memory",
    getJSON: async (k) => (m.has(k) ? structuredClone(m.get(k)) : null),
    setJSON: async (k, v) => void m.set(k, structuredClone(v)),
    setBinary: async (k, data, metadata) => void m.set(k, { data: Buffer.from(data), metadata }),
    getBinary: async (k) => m.get(k) || null,
    _map: m,
  };
}
