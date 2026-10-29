import {test} from "node:test";
import assert from "node:assert/strict";
import {
  BIO_MAX,
  FOUNDER_POSITION,
  TRAINER_POSITIONS,
  isFounder,
  splitTrainers,
  vCardHref,
  validateTrainer,
} from "./schema.mjs";

const valid = {
  name: "  Jane Doe ",
  position: "Head Coach",
  bio: " Loves deadlifts. ",
  email: " Jane@TrainNOS.com ",
  phone: "(251) 555-0134",
};

test("valid input passes and is trimmed", () => {
  assert.deepEqual(validateTrainer(valid), {
    ok: true,
    trainer: {
      name: "Jane Doe",
      position: "Head Coach",
      bio: "Loves deadlifts.",
      email: "jane@trainnos.com",
      phone: "+12515550134",
    },
  });
});

test("contact fields are optional", () => {
  const result = validateTrainer({name: "Jane", position: "Head Coach"});
  assert.deepEqual(result, {
    ok: true,
    trainer: {name: "Jane", position: "Head Coach", bio: "", email: null, phone: null},
  });
});

test("rejects bad input", () => {
  const cases = {
    "empty name": {name: "  "},
    "61-character name": {name: "a".repeat(61)},
    "unknown position": {position: "Co Founder"},
    "401-character bio": {bio: "a".repeat(BIO_MAX + 1)},
    "bad email": {email: "jane@"},
    "bad phone": {phone: "555-1234"},
  };
  for (const [label, override] of Object.entries(cases)) {
    const result = validateTrainer({...valid, ...override});
    assert.equal(result.ok, false, label);
    assert.equal(typeof result.error, "string", label);
  }
});

test("a 400-character bio and 60-character name are allowed", () => {
  const result = validateTrainer({...valid, name: "a".repeat(60), bio: "b".repeat(BIO_MAX)});
  assert.equal(result.ok, true);
});

test("partial mode only checks keys present", () => {
  assert.deepEqual(validateTrainer({bio: " New bio "}, {partial: true}), {
    ok: true,
    trainer: {bio: "New bio"},
  });
  assert.deepEqual(validateTrainer({email: "", phone: ""}, {partial: true}), {
    ok: true,
    trainer: {email: null, phone: null},
  });
  assert.equal(validateTrainer({name: ""}, {partial: true}).ok, false);
});

test("splitTrainers orders current by sortOrder and past by newest removal", () => {
  const trainers = [
    {id: "b", active: true, sortOrder: 2},
    {id: "old", active: false, removedAt: "2026-01-01T00:00:00Z"},
    {id: "a", active: true, sortOrder: 1},
    {id: "new", active: false, removedAt: "2026-03-03T00:00:00Z"},
  ];
  const {current, past} = splitTrainers(trainers);
  assert.deepEqual(current.map(t => t.id), ["a", "b"]);
  assert.deepEqual(past.map(t => t.id), ["new", "old"]);
});

test("vCardHref includes the contact fields that exist", () => {
  const href = vCardHref({name: "Gavin Willisson", email: "gavin@trainnos.com", phone: "+12516566025"});
  assert.ok(href.startsWith("data:text/vcard;charset=utf-8,"));
  const card = decodeURIComponent(href.split(",").slice(1).join(","));
  assert.match(card, /^BEGIN:VCARD\r\n/);
  assert.match(card, /\r\nN:Willisson;Gavin;;;\r\n/);
  assert.match(card, /\r\nFN:Gavin Willisson\r\n/);
  assert.match(card, /EMAIL;type=INTERNET;type=WORK;type=pref:gavin@trainnos.com/);
  assert.match(card, /TEL;type=pref:\+12516566025/);

  const emailOnly = decodeURIComponent(vCardHref({name: "Jane", email: "j@x.com"}));
  assert.doesNotMatch(emailOnly, /TEL/);
  assert.equal(vCardHref({name: "Jane"}), null);
});

test("positions are the two agreed values", () => {
  assert.deepEqual(TRAINER_POSITIONS, ["Head Coach", "Strength & Conditioning Coach"]);
});

test("Co-Founder is fixed: admins can't assign it", () => {
  assert.equal(validateTrainer({...valid, position: FOUNDER_POSITION}).ok, false);
  assert.equal(validateTrainer({position: FOUNDER_POSITION}, {partial: true}).ok, false);
  assert.equal(isFounder({position: "Co-Founder"}), true);
  assert.equal(isFounder({position: "Head Coach"}), false);
});
