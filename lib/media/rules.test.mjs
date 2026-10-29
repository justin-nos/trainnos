import {test} from "node:test";
import assert from "node:assert/strict";
import {ACCEPT, MEDIA_RULES, checkUpload, mediaKind, objectPath} from "./rules.mjs";

const MB = 1024 * 1024;

test("trainer uploads are photos only", () => {
  assert.equal(checkUpload({purpose: "trainer", contentType: "video/mp4", size: MB}).ok, false);
  assert.deepEqual(checkUpload({purpose: "trainer", contentType: "image/png", size: MB}), {
    ok: true,
    kind: "image",
    ext: "png",
  });
});

test("community accepts mp4, mov, jpeg, png and webp", () => {
  const cases = {
    "video/mp4": ["video", "mp4"],
    "video/quicktime": ["video", "mov"],
    "image/jpeg": ["image", "jpg"],
    "image/png": ["image", "png"],
    "image/webp": ["image", "webp"],
  };
  for (const [contentType, [kind, ext]] of Object.entries(cases)) {
    assert.deepEqual(
      checkUpload({purpose: "community", contentType, size: MB}),
      {ok: true, kind, ext},
      contentType,
    );
  }
});

test("rejects HEIC, GIF and empty types", () => {
  for (const contentType of ["image/heic", "image/gif", "", undefined]) {
    const result = checkUpload({purpose: "community", contentType, size: MB});
    assert.equal(result.ok, false, String(contentType));
    assert.match(result.error, /JPEG/);
  }
  assert.equal(mediaKind("image/heic"), null);
});

test("rejects unknown purposes and empty files", () => {
  assert.equal(checkUpload({purpose: "avatar", contentType: "image/png", size: MB}).ok, false);
  assert.equal(checkUpload({purpose: "community", contentType: "image/png", size: 0}).ok, false);
  assert.equal(checkUpload({purpose: "community", contentType: "image/png"}).ok, false);
});

test("size limits per kind", () => {
  for (const [kind, contentType] of [["image", "image/jpeg"], ["video", "video/mp4"]]) {
    const max = MEDIA_RULES[kind].maxBytes;
    assert.equal(checkUpload({purpose: "community", contentType, size: max}).ok, true, kind);
    const over = checkUpload({purpose: "community", contentType, size: max + 1});
    assert.equal(over.ok, false, kind);
    assert.match(over.error, /limit/);
  }
});

test("objectPath shapes", () => {
  assert.equal(objectPath({purpose: "community", id: "abc", ext: "mp4"}), "community/abc/original.mp4");
  assert.equal(
    objectPath({purpose: "community", id: "abc", ext: "jpg", variant: "poster"}),
    "community/abc/poster.jpg",
  );
  assert.equal(objectPath({purpose: "trainer", id: "t1", ext: "png"}), "trainers/t1/original.png");
});

test("ACCEPT strings match MEDIA_RULES", () => {
  const images = Object.keys(MEDIA_RULES.image.types);
  const videos = Object.keys(MEDIA_RULES.video.types);
  assert.deepEqual(ACCEPT.trainer.split(",").sort(), [...images].sort());
  assert.deepEqual(ACCEPT.community.split(",").sort(), [...images, ...videos].sort());
});
