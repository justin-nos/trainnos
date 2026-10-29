import {test} from "node:test";
import assert from "node:assert/strict";
import {isAdminUser, safeNext} from "./allowed.mjs";

const confirmed = email => ({email, email_confirmed_at: "2026-10-28T00:00:00Z"});

test("isAdminUser accepts confirmed trainnos.com accounts, any case", () => {
  assert.equal(isAdminUser(confirmed("coach@trainnos.com")), true);
  assert.equal(isAdminUser(confirmed("Coach@TrainNOS.com")), true);
});

test("isAdminUser rejects other domains and lookalikes", () => {
  assert.equal(isAdminUser(confirmed("a@trainnos.com.evil.io")), false);
  assert.equal(isAdminUser(confirmed("a@nottrainnos.com")), false);
  assert.equal(isAdminUser(confirmed("a@gmail.com")), false);
});

test("isAdminUser rejects unconfirmed and missing users", () => {
  assert.equal(isAdminUser({email: "coach@trainnos.com"}), false);
  assert.equal(isAdminUser(null), false);
  assert.equal(isAdminUser(undefined), false);
});

test("safeNext keeps same-site paths", () => {
  assert.equal(safeNext("/admins/leads"), "/admins/leads");
  assert.equal(safeNext("/admins?tab=visits"), "/admins?tab=visits");
});

test("safeNext rejects open redirects and non-strings", () => {
  assert.equal(safeNext("//evil.com"), "/admins");
  assert.equal(safeNext("/\\evil.com"), "/admins");
  assert.equal(safeNext("https://evil.com"), "/admins");
  assert.equal(safeNext(null), "/admins");
  assert.equal(safeNext(["/admins/leads"]), "/admins");
  assert.equal(safeNext("evil", "/"), "/");
});
