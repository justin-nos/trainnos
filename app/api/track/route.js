import {initializeAdminApp} from "../../../lib/initFirebaseAdmin";
import {MAX_BODY_BYTES} from "../../../lib/analytics/config.mjs";
import {addTrackWrites} from "../../../lib/analytics/firestore";
import {buildWrites} from "../../../lib/analytics/rollup.mjs";
import {
  isAllowedOrigin,
  sanitizeBatch,
} from "../../../lib/analytics/schema.mjs";
import {deviceFromUA, isBot} from "../../../lib/analytics/source.mjs";

export const dynamic = "force-dynamic";

const firestoreDB = initializeAdminApp();
const noContent = () => new Response(null, {status: 204});

// "Daphne, AL" in the US, the country code elsewhere, null locally.
// Only Vercel's geo headers are read, never the IP.
function geoFrom(headers) {
  const country = headers.get("x-vercel-ip-country");
  if (!country) return null;
  if (country !== "US") return country;
  const region = headers.get("x-vercel-ip-country-region");
  let city = headers.get("x-vercel-ip-city");
  try {
    city = city ? decodeURIComponent(city) : null;
  } catch {
    city = null;
  }
  if (city && region) return `${city}, ${region}`.slice(0, 60);
  return region ? `${region}, US` : "US";
}

export async function POST(req) {
  if (!isAllowedOrigin(req.headers.get("origin"))) {
    return Response.json({error: "Forbidden"}, {status: 403});
  }

  const declared = Number(req.headers.get("content-length"));
  if (declared > MAX_BODY_BYTES) {
    return Response.json({error: "Too large"}, {status: 413});
  }
  const text = await req.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    return Response.json({error: "Too large"}, {status: 413});
  }
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json({error: "Invalid JSON"}, {status: 400});
  }

  // Bots get a success response so they don't retry, and nothing is stored.
  const ua = req.headers.get("user-agent") ?? "";
  if (isBot(ua)) return noContent();

  const now = Date.now();
  const parsed = sanitizeBatch(body, {now});
  if (!parsed.ok) return Response.json({error: parsed.error}, {status: 400});
  const {batch} = parsed;
  if (!batch.events.length) return noContent();

  const writes = buildWrites(batch, {
    geo: geoFrom(req.headers),
    device: deviceFromUA(ua),
  });
  try {
    const fsBatch = firestoreDB.batch();
    addTrackWrites(firestoreDB, fsBatch, {sid: batch.sid, writes, now});
    await fsBatch.commit();
  } catch (error) {
    console.error("Error writing analytics to Firestore", error);
    return Response.json({error: "Server Error"}, {status: 500});
  }
  return noContent();
}
