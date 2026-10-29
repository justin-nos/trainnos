// Trainer profile rules shared by the admin API, the admin form and /meet.
// supabase/migrations/20261029000001_trainers.sql enforces the same limits.
import {normalizeUSPhone} from "../quiz/phone.mjs";

// Positions admins can pick. Co-Founder is fixed (seeded for Gavin and
// Brannon) and can't be assigned or changed through the admin tools.
export const TRAINER_POSITIONS = ["Head Coach", "Strength & Conditioning Coach"];
export const FOUNDER_POSITION = "Co-Founder";
export const isFounder = trainer => trainer?.position === FOUNDER_POSITION;
export const BIO_MAX = 400;
export const NAME_MAX = 60;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIELDS = ["name", "position", "bio", "email", "phone"];

const has = (input, key) => input[key] !== undefined;
const text = value => String(value ?? "").trim();

// Validates admin input. {ok: true, trainer} | {ok: false, error}. Empty
// email or phone clears the field (null). partial only checks keys present.
export function validateTrainer(input, {partial = false} = {}) {
  if (!input || typeof input !== "object") return {ok: false, error: "Invalid trainer"};
  const trainer = {};
  for (const key of FIELDS) {
    if (partial && !has(input, key)) continue;
    const value = text(input[key]);
    if (key === "name") {
      if (!value) return {ok: false, error: "Name is required."};
      if (value.length > NAME_MAX) {
        return {ok: false, error: `Name must be ${NAME_MAX} characters or fewer.`};
      }
    } else if (key === "position") {
      if (!TRAINER_POSITIONS.includes(value)) return {ok: false, error: "Pick a position."};
    } else if (key === "bio") {
      if (value.length > BIO_MAX) {
        return {ok: false, error: `Bio must be ${BIO_MAX} characters or fewer.`};
      }
    } else if (key === "email") {
      if (value && (!EMAIL.test(value) || value.length > 254)) {
        return {ok: false, error: "Enter a valid email address."};
      }
      trainer.email = value ? value.toLowerCase() : null;
      continue;
    } else if (key === "phone") {
      const phone = value ? normalizeUSPhone(value) : null;
      if (value && !phone) return {ok: false, error: "Enter a valid US phone number."};
      trainer.phone = phone;
      continue;
    }
    trainer[key] = value;
  }
  return {ok: true, trainer};
}

const time = iso => (iso ? new Date(iso).getTime() : 0);

// Active first by sortOrder; past trainers by removedAt desc.
export function splitTrainers(trainers) {
  const current = trainers
    .filter(t => t.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || time(a.createdAt) - time(b.createdAt));
  const past = trainers
    .filter(t => !t.active)
    .sort((a, b) => time(b.removedAt) - time(a.removedAt));
  return {current, past};
}

// "Add to contacts" link for /meet. null when there's nothing to save.
export function vCardHref({name, email, phone}) {
  if (!email && !phone) return null;
  const parts = name.trim().split(/\s+/);
  const last = parts.length > 1 ? parts.pop() : "";
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${last};${parts.join(" ")};;;`,
    `FN:${name.trim()}`,
    "ORG:NOS;",
    email && `EMAIL;type=INTERNET;type=WORK;type=pref:${email}`,
    phone && `TEL;type=pref:${phone}`,
    "END:VCARD",
  ].filter(Boolean);
  return `data:text/vcard;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
}
