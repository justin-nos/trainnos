// Map-key encoding and path normalization for analytics docs.
import {ROUTES, ROUTE_PREFIXES} from "./config.mjs";

// "%" first so decoding is an exact inverse.
const ESCAPED = /[%./`~*[\]]/g;
const hex = c =>
  `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`;

// Paths and CTA ids become Firestore map keys. A leading "_" is escaped too,
// because keys shaped like __name__ are reserved.
export function encodeKey(key) {
  const s = String(key).replace(ESCAPED, hex);
  if (!s) return "%00";
  return s.startsWith("_") ? `%5F${s.slice(1)}` : s;
}

export function decodeKey(key) {
  if (key === "%00") return "";
  return key.replace(/%([0-9A-F]{2})/g, (_, h) =>
    String.fromCharCode(parseInt(h, 16)),
  );
}

// Recursively decodes the keys of a stored map (leaves values untouched).
export function decodeKeys(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  if (Object.getPrototypeOf(value) !== Object.prototype) return value;
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [decodeKey(k), decodeKeys(v)]),
  );
}

const ROUTE_SET = new Set(ROUTES);

// Returns the allowlisted route, "other", or null for paths never tracked.
export function normalizePath(pathname) {
  if (typeof pathname !== "string" || !pathname.startsWith("/")) return null;
  let path = pathname.split(/[?#]/)[0];
  if (path.length > 1) path = path.replace(/\/+$/, "") || "/";
  if (/^\/(admins|api)(\/|$)/.test(path)) return null;
  if (ROUTE_SET.has(path)) return path;
  for (const [prefix, route] of ROUTE_PREFIXES) {
    if (path.startsWith(prefix)) return route;
  }
  return "other";
}
