// GET /api/photos/:id?t=signature — private photo links for the company.
import { openStore } from "../../server/lib/store.mjs";
import { verify } from "../../server/lib/tokens.mjs";
import { fail } from "../../server/lib/http.mjs";

export default async (req, context) => {
  const url = new URL(req.url);
  const id = context?.params?.id || url.pathname.split("/").pop();
  try {
    if (!verify("photo", id, url.searchParams.get("t") || "")) return new Response("Not found", { status: 404 });
    const store = await openStore("photos");
    const hit = await store.getBinary(id);
    if (!hit) return new Response("Not found", { status: 404 });
    return new Response(hit.data, {
      headers: { "content-type": hit.metadata?.type || "image/jpeg", "cache-control": "private, max-age=86400", "x-robots-tag": "noindex" },
    });
  } catch (err) {
    return fail(err);
  }
};

export const config = { path: "/api/photos/:id" };
