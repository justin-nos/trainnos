// Seeds Gavin and Brannon into `trainers` with their photos, using the
// details that used to be hard-coded on /meet. Safe to repeat: trainers that
// already exist are left alone, so admin edits are never overwritten.
//
//   node --env-file=.env.local scripts/seedTrainers.mjs [--confirm]
//
// Targets other than local Supabase need --confirm.
import {readFileSync} from "node:fs";
import {createClient} from "@supabase/supabase-js";

const TRAINERS = [
  {
    id: "gavin-willisson",
    name: "Gavin Willisson",
    position: "Co-Founder",
    bio: "We have seen God do great things in this gym to allow it to happen. From being funded by a guy we had only known for a few months to the step by step oddities that have led to what we are today, The Lord has allowed us to do what we enjoy doing: train all ages for great things in life and pour into their lives even outside of the gym.",
    email: "gavin@trainnos.com",
    phone: "+12516566025",
    sort_order: 0,
    photo: "public/Gavin_MeetUs.png",
  },
  {
    id: "brannon-willisson",
    name: "Brannon Willisson",
    position: "Co-Founder",
    bio: "When Gavin and I were growing up we always had a dream of opening a gym and calling it No Off Season. We wanted to have a place where kids in the community could come and get better at their sports but also grow in a relationship with Christ. I wanted to invest in the kids and local community the way a mentor of mine did for me.",
    email: "brannon@trainnos.com",
    phone: "+12518954302",
    sort_order: 1,
    photo: "public/Brannon_MeetUs.png",
  },
];

function fail(message) {
  console.error(message);
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const isLocal = /^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(supabaseUrl ?? "");
if (!supabaseUrl || !process.env.SUPABASE_SECRET_KEY) {
  fail("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set.");
}
if (!isLocal && !process.argv.includes("--confirm")) {
  fail(`Target is ${supabaseUrl}. Re-run with --confirm to seed it.`);
}

const supabase = createClient(supabaseUrl, process.env.SUPABASE_SECRET_KEY, {
  auth: {persistSession: false, autoRefreshToken: false},
});

for (const {photo, ...trainer} of TRAINERS) {
  const {data: existing, error: readError} = await supabase
    .from("trainers")
    .select("id")
    .eq("id", trainer.id)
    .maybeSingle();
  if (readError) fail(`Reading ${trainer.id}: ${readError.message}`);
  if (existing) {
    console.log(`${trainer.name}: already seeded, skipped`);
    continue;
  }

  // Photo first, so the row never points at a missing object.
  const photoPath = `trainers/${trainer.id}/original.png`;
  const {error: uploadError} = await supabase.storage
    .from("media")
    .upload(photoPath, readFileSync(photo), {
      contentType: "image/png",
      cacheControl: "31536000",
      upsert: true,
    });
  if (uploadError) fail(`Uploading ${photo}: ${uploadError.message}`);

  const {error} = await supabase
    .from("trainers")
    .insert({...trainer, photo_path: photoPath});
  if (error) fail(`Inserting ${trainer.id}: ${error.message}`);
  console.log(`${trainer.name}: seeded`);
}
