// POST /api/uploads — one photo per request, raw image bytes as the body.
// The browser downsizes photos before upload, so 5 MB is generous.
import { openStore } from "../../server/lib/store.mjs";
import { newId, sign } from "../../server/lib/tokens.mjs";
import { json, fail, sameOrigin } from "../../server/lib/http.mjs";

const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic", "image/heif": "heif" };
const MAX = 5 * 1024 * 1024;

function sniff(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50) return "image/png";
  if (buf.slice(8, 12).toString() === "WEBP") return "image/webp";
  if (buf.slice(4, 8).toString() === "ftyp") return "image/heic";
  return null;
}

export default async (req) => {
  if (req.method !== "POST") return json({ status: "error", code: "method" }, 405);
  if (!sameOrigin(req)) return json({ status: "error", code: "origin" }, 403);
  try {
    const declared = (req.headers.get("content-type") || "").split(";")[0];
    if (!TYPES[declared]) return json({ status: "error", code: "type", message: "That file isn't a photo we can use. Try a JPG or PNG." }, 415);
    const buf = Buffer.from(await req.arrayBuffer());
    if (buf.length === 0) return json({ status: "error", code: "empty", message: "That photo was empty." }, 400);
    if (buf.length > MAX) return json({ status: "error", code: "too_large", message: "That photo is too large. Try a smaller one." }, 413);
    const type = sniff(buf);
    if (!type) return json({ status: "error", code: "type", message: "That file isn't a photo we can use. Try a JPG or PNG." }, 415);
    const store = await openStore("photos");
    const id = newId("P").replace(/[^A-Za-z0-9-]/g, "");
    await store.setBinary(id, buf, { type, size: buf.length, uploadedAt: new Date().toISOString() });
    return json({ status: "ok", id, url: `/api/photos/${id}?t=${sign("photo", id)}` }, 201);
  } catch (err) {
    return fail(err);
  }
};

export const config = {
  path: "/api/uploads",
  rateLimit: { windowLimit: 40, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
