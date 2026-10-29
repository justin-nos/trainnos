// One-shot copy of production Firestore + testimonial photos into Supabase.
// Firestore and GCS are only read. Run right after the cutover deploy:
//
//   node --env-file=.env.local scripts/importFirestore.mjs --dry-run [--out=<file>]
//   node --env-file=.env.local scripts/importFirestore.mjs [--confirm]
//   node --env-file=.env.local scripts/importFirestore.mjs --verify
//
// --verify only reads: it checks that every Firestore lead, testimonial,
// email signup and session is in Supabase and that every daily number is
// covered (Supabase may be higher, never lower). Exits 1 if anything is short.
//
// --skip-images leaves every testimonial without a photo (image_path null)
// and never touches GCS, e.g. while the Firebase project's billing is closed.
//
// --dry-run writes the payload to a file and prints counts; nothing is written
// anywhere. A real run copies photos (safe to repeat), then calls
// import_firestore once; a second call fails ("already ran"). Targets other
// than local Supabase need --confirm.
import {writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {cert, initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {getStorage} from "firebase-admin/storage";
import {createClient} from "@supabase/supabase-js";
import {buildPayload, payloadCounts, verifyReport} from "./lib/firestoreRows.mjs";

const PROJECT_ID = "nos-training-facility";
const BUCKET = "nos-training-facility.appspot.com";
const IMAGE_TYPES = {".png": "image/png", ".jpeg": "image/jpeg"};

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const confirmed = args.includes("--confirm");
const verify = args.includes("--verify");
const skipImages = verify || args.includes("--skip-images");
const out =
  args.find(a => a.startsWith("--out="))?.slice("--out=".length) ??
  join(tmpdir(), `firestore-import-${Date.now()}.json`);

function fail(message) {
  console.error(message);
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const isLocal = /^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(supabaseUrl ?? "");
if (!dryRun) {
  if (!supabaseUrl || !process.env.SUPABASE_SECRET_KEY) {
    fail("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set.");
  }
  if (!isLocal && !confirmed && !verify) {
    fail(`Target is ${supabaseUrl}. Re-run with --confirm to import into it.`);
  }
}

initializeApp({
  credential: cert({
    projectId: PROJECT_ID,
    clientEmail: process.env.FIREBASESERVER_CLIENT_EMAIL,
    privateKey: process.env.FIREBASESERVER_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
  storageBucket: BUCKET,
});
const firestore = getFirestore();
const bucket = getStorage().bucket(BUCKET);

async function readCollection(name) {
  const snap = await firestore.collection(name).get();
  return snap.docs.map(d => ({id: d.id, data: d.data(), createTime: d.createTime}));
}

// testimonialImages/<id>.png, else .jpeg (the old page's lookup order).
async function findImage(id) {
  for (const ext of Object.keys(IMAGE_TYPES)) {
    const file = bucket.file(`testimonialImages/${id}${ext}`);
    const [exists] = await file.exists();
    if (exists) return {file, path: file.name, contentType: IMAGE_TYPES[ext]};
  }
  return null;
}

console.log(`Reading Firestore project ${PROJECT_ID}...`);
const [leads, testimonials, emails, sessions, events, daily] = await Promise.all(
  ["leads", "testimonials", "emails", "analytics_sessions", "analytics_events", "analytics_daily"].map(
    readCollection,
  ),
);

const supabase = dryRun
  ? null
  : createClient(supabaseUrl, process.env.SUPABASE_SECRET_KEY, {
      auth: {persistSession: false, autoRefreshToken: false},
    });

const imagePaths = {};
for (const {id} of skipImages ? [] : testimonials) {
  let image;
  try {
    image = await findImage(id);
  } catch (error) {
    fail(
      `Couldn't read testimonial photos from gs://${BUCKET}: ${error.message}\n` +
        "Fix access, or re-run with --skip-images to import without photos.",
    );
  }
  if (!image) {
    console.warn(`No photo found for testimonial ${id}`);
    continue;
  }
  imagePaths[id] = image.path;
  if (dryRun) continue;
  const [bytes] = await image.file.download();
  const {error} = await supabase.storage
    .from("media")
    .upload(image.path, bytes, {contentType: image.contentType, upsert: true});
  if (error) fail(`Couldn't copy ${image.path}: ${error.message}`);
  console.log(`Copied ${image.path}`);
}

const payload = buildPayload({leads, testimonials, emails, sessions, events, daily, imagePaths});
console.log("Payload:", payloadCounts(payload));

// PostgREST returns at most 1,000 rows per request.
async function readAll(table, columns, filter = q => q) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const {data, error} = await filter(supabase.from(table).select(columns)).range(from, from + 999);
    if (error) fail(`Couldn't read ${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}

if (verify) {
  console.log(`Checking ${supabaseUrl}...`);
  const prod = q => q.eq("env", "prod");
  const ids = rows => new Set(rows.map(r => r.id));
  const found = {
    leads: ids(await readAll("leads", "id")),
    testimonials: ids(await readAll("testimonials", "id")),
    emails: new Set((await readAll("email_signups", "email")).map(r => r.email)),
    sessions: ids(await readAll("analytics_sessions", "id", prod)),
    daily: Object.fromEntries(
      (await readAll("analytics_daily", "day,data", prod)).map(r => [r.day, r.data]),
    ),
  };
  const {ok, report} = verifyReport(payload, found);
  for (const [name, list] of Object.entries(report)) {
    if (!list.length) {
      console.log(`ok       ${name}`);
    } else if (name === "daily") {
      // Per day: how many numbers are short, with the headline totals.
      const byDay = Object.groupBy(list, line => line.split(" ")[0]);
      for (const [day, lines] of Object.entries(byDay)) {
        const totals = lines.filter(l => l.includes(" totals.")).map(l => l.split(" ").slice(1).join(" "));
        console.log(`MISSING  daily ${day}: ${lines.length} numbers short${totals.length ? ` (${totals.join(", ")})` : ""}`);
      }
    } else {
      console.log(`MISSING  ${name}: ${list.join(", ")}`);
    }
  }
  if (!ok) fail("Some Firestore data is not in Supabase.");
  console.log("Everything in Firestore is in Supabase.");
  process.exit(0);
}

if (dryRun) {
  writeFileSync(out, JSON.stringify(payload, null, 2));
  console.log(`Dry run: wrote ${out}. Nothing was imported.`);
  process.exit(0);
}

console.log(`Importing into ${supabaseUrl}...`);
const {data, error} = await supabase.rpc("import_firestore", {p: payload});
if (error) fail(`Import failed: ${error.message}`);
console.log("Imported:", data);
