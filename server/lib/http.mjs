// Small helpers shared by the Netlify Functions.

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}

/** Map any thrown error to a customer-safe JSON response. */
export function fail(err) {
  const code = err?.code;
  if (code === "calendar_unconfigured" || code === "store_unavailable" || code === "signing_unconfigured") {
    console.error(`[booking] not configured: ${code}`);
    return json({ status: "unavailable", code, message: "Online booking isn't available right now." }, 503);
  }
  if (err?.status && err.status < 500 && code) {
    return json({ status: "error", code, message: err.message, fields: err.fields, alternatives: err.alternatives }, err.status);
  }
  console.error("[booking] error", err);
  return json({ status: "error", code: "server_error", message: "Something went wrong on our end." }, 502);
}

export async function readJson(req, limit = 64_000) {
  const text = await req.text();
  if (text.length > limit) {
    const e = new Error("Request too large");
    e.status = 413;
    e.code = "too_large";
    throw e;
  }
  try {
    return JSON.parse(text);
  } catch {
    const e = new Error("Invalid request");
    e.status = 400;
    e.code = "bad_json";
    throw e;
  }
}

/** Reject cross-site POSTs from browsers (defence in depth; no cookies are used). */
export function sameOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(req.url).host || process.env.LOCAL_DEV === "1";
  } catch {
    return false;
  }
}
