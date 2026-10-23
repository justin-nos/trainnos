// Server-only helpers for writing analytics docs with firebase-admin.
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import {RAW_RETENTION_DAYS, SESSION_RETENTION_DAYS} from "./config.mjs";

const DAY_MS = 24 * 60 * 60 * 1000;

// Previews and local dev write to analytics_dev_* so production stays clean.
export const PREFIX =
  process.env.VERCEL_ENV === "production" ? "analytics" : "analytics_dev";
export const col = name => `${PREFIX}_${name}`;

// Plain-number trees from rollup.mjs -> FieldValue.increment trees for
// set(..., {merge: true}). Strings (a CTA's kind) are set as-is.
export function toIncrements(tree) {
  return Object.fromEntries(
    Object.entries(tree).map(([k, v]) => [
      k,
      typeof v === "number"
        ? FieldValue.increment(v)
        : typeof v === "string"
          ? v
          : toIncrements(v),
    ]),
  );
}

const expiresIn = (now, days) => Timestamp.fromMillis(now + days * DAY_MS);

// Adds one sanitized batch's writes (from buildWrites) to a Firestore batch.
export function addTrackWrites(db, batch, {sid, writes, now}) {
  for (const ev of writes.events) {
    batch.set(db.collection(col("events")).doc(), {
      ...ev,
      ts: Timestamp.fromMillis(ev.ts),
      createdAt: FieldValue.serverTimestamp(),
      expireAt: expiresIn(now, RAW_RETENTION_DAYS),
    });
  }

  const {set, inc, reached, paths} = writes.session;
  const session = {
    ...set,
    ...toIncrements(inc),
    lastSeenAt: FieldValue.serverTimestamp(),
    expireAt: expiresIn(now, SESSION_RETENTION_DAYS),
  };
  if (set.startedAt) session.startedAt = Timestamp.fromMillis(set.startedAt);
  if (Object.keys(reached).length) session.reached = reached;
  if (paths.length) session.paths = FieldValue.arrayUnion(...paths);
  batch.set(db.collection(col("sessions")).doc(sid), session, {
    merge: true,
  });

  addDailyWrites(db, batch, writes.daily);
}

export function addDailyWrites(db, batch, daily) {
  for (const [day, tree] of Object.entries(daily)) {
    batch.set(
      db.collection(col("daily")).doc(day),
      {
        date: day,
        ...toIncrements(tree),
        updatedAt: FieldValue.serverTimestamp(),
      },
      {merge: true},
    );
  }
}
