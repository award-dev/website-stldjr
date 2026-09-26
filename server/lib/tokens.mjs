// Signed, unguessable links for "manage my booking" and private photo URLs.

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "./config.mjs";

function secret() {
  const s = env("BOOKING_SIGNING_SECRET");
  if (s) return s;
  if (env("LOCAL_DEV") === "1") return "local-dev-only-secret";
  const err = new Error("BOOKING_SIGNING_SECRET is not set");
  err.code = "signing_unconfigured";
  throw err;
}

export function sign(purpose, value) {
  return createHmac("sha256", secret()).update(`${purpose}:${value}`).digest("base64url").slice(0, 32);
}

export function verify(purpose, value, token) {
  if (typeof token !== "string" || typeof value !== "string" || !value) return false;
  const expected = Buffer.from(sign(purpose, value));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Short, readable, unguessable id: "STL-7K3M-Q9XD" style prefix + random tail. */
export function newId(prefix = "") {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = randomBytes(10);
  let s = "";
  for (const b of bytes) s += alphabet[b % alphabet.length];
  return `${prefix}${s.slice(0, 4)}-${s.slice(4, 8)}${s.slice(8)}`;
}
