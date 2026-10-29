// One-shot copy of production Firestore + testimonial photos into Supabase.
// Firestore and GCS are only read. Run right after the cutover deploy:
//
//   node --env-file=.env.local scripts/importFirestore.mjs --dry-run [--out=<file>]
//   node --env-file=.env.local scripts/importFirestore.mjs [--confirm]
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
import {buildPayload, payloadCounts} from "./lib/firestoreRows.mjs";

const PROJECT_ID = "nos-training-facility";
const BUCKET = "nos-training-facility.appspot.com";
const IMAGE_TYPES = {".png": "image/png", ".jpeg": "image/jpeg"};

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const confirmed = args.includes("--confirm");
const skipImages = args.includes("--skip-images");
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
  if (!isLocal && !confirmed) {
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

if (dryRun) {
  writeFileSync(out, JSON.stringify(payload, null, 2));
  console.log(`Dry run: wrote ${out}. Nothing was imported.`);
  process.exit(0);
}

console.log(`Importing into ${supabaseUrl}...`);
const {data, error} = await supabase.rpc("import_firestore", {p: payload});
if (error) fail(`Import failed: ${error.message}`);
console.log("Imported:", data);
