import {test} from "node:test";
import assert from "node:assert/strict";
import {
  CAPTION_MAX,
  formatDuration,
  orderPosts,
  relativeTime,
  validatePost,
  validatePostPatch,
} from "./schema.mjs";

const id = "0f8c1c3e-1a2b-4c5d-8e9f-0a1b2c3d4e5f";
const photo = {
  id,
  type: "photo",
  mediaPath: `community/${id}/original.jpg`,
  width: 1200,
  height: 1600,
  caption: "  Saturday crew ",
};
const video = {
  id,
  type: "video",
  mediaPath: `community/${id}/original.mp4`,
  posterPath: `community/${id}/poster.jpg`,
  width: 1080,
  height: 1920,
  duration: 42.5,
  caption: "",
};

test("validatePost accepts a photo and drops video-only fields", () => {
  assert.deepEqual(validatePost({...photo, duration: 3, posterPath: "x"}), {
    ok: true,
    post: {
      id,
      type: "photo",
      mediaPath: `community/${id}/original.jpg`,
      posterPath: null,
      width: 1200,
      height: 1600,
      duration: null,
      caption: "Saturday crew",
    },
  });
});

test("validatePost accepts a video with a poster", () => {
  const result = validatePost(video);
  assert.equal(result.ok, true);
  assert.equal(result.post.posterPath, `community/${id}/poster.jpg`);
  assert.equal(result.post.duration, 42.5);
  assert.equal(validatePost({...video, duration: 90}).ok, true);
});

test("validatePost rejects bad posts", () => {
  const cases = {
    "video without a poster": {...video, posterPath: undefined},
    "video over 90s": {...video, duration: 90.5},
    "zero duration": {...video, duration: 0},
    "path outside community/<id>/": {...photo, mediaPath: `community/other/original.jpg`},
    "trainer path": {...photo, mediaPath: `trainers/${id}/original.jpg`},
    "poster in another folder": {...video, posterPath: `community/other/poster.jpg`},
    "non-UUID id": {...photo, id: "abc", mediaPath: "community/abc/original.jpg"},
    "201-character caption": {...photo, caption: "a".repeat(CAPTION_MAX + 1)},
    "bad type": {...photo, type: "gif"},
    "zero width": {...photo, width: 0},
    "fractional height": {...photo, height: 10.5},
  };
  for (const [label, input] of Object.entries(cases)) {
    const result = validatePost(input);
    assert.equal(result.ok, false, label);
    assert.equal(typeof result.error, "string", label);
  }
  assert.equal(validatePost(null).ok, false);
});

test("validatePostPatch keeps only valid fields", () => {
  assert.deepEqual(validatePostPatch({caption: " Hi ", status: "hidden", pinned: true}), {
    ok: true,
    changes: {caption: "Hi", status: "hidden", pinned: true},
  });
  assert.equal(validatePostPatch({status: "deleted"}).ok, false);
  assert.equal(validatePostPatch({pinned: "yes"}).ok, false);
  assert.equal(validatePostPatch({caption: "a".repeat(201)}).ok, false);
  assert.equal(validatePostPatch({}).ok, false);
});

test("orderPosts: newest pin first, then newest, stable by id", () => {
  const posts = [
    {id: "a", status: "published", pinned: false, createdAt: "2026-10-29T10:00:00Z"},
    {id: "b", status: "hidden", pinned: false, createdAt: "2026-10-29T11:00:00Z"},
    {id: "c", status: "published", pinned: true, pinnedAt: "2026-10-28T00:00:00Z", createdAt: "2026-10-01T00:00:00Z"},
    {id: "d", status: "published", pinned: true, pinnedAt: "2026-10-29T00:00:00Z", createdAt: "2026-10-02T00:00:00Z"},
    {id: "e", status: "published", pinned: false, createdAt: "2026-10-29T10:00:00Z"},
  ];
  assert.deepEqual(orderPosts(posts).map(p => p.id), ["d", "c", "b", "a", "e"]);
  assert.deepEqual(orderPosts(posts, {includeHidden: false}).map(p => p.id), ["d", "c", "a", "e"]);
});

test("formatDuration boundaries", () => {
  assert.equal(formatDuration(0), "0:00");
  assert.equal(formatDuration(59), "0:59");
  assert.equal(formatDuration(60), "1:00");
  assert.equal(formatDuration(90), "1:30");
  assert.equal(formatDuration(42.4), "0:42");
});

test("relativeTime", () => {
  const now = Date.parse("2026-10-29T12:00:00Z");
  const ago = seconds => new Date(now - seconds * 1000).toISOString();
  assert.equal(relativeTime(ago(30), now), "just now");
  assert.equal(relativeTime(ago(60), now), "1 minute ago");
  assert.equal(relativeTime(ago(5 * 60), now), "5 minutes ago");
  assert.equal(relativeTime(ago(3 * 3600), now), "3 hours ago");
  assert.equal(relativeTime(ago(3 * 86400), now), "3 days ago");
  assert.equal(relativeTime(ago(14 * 86400), now), "2 weeks ago");
  assert.equal(relativeTime("2026-08-01T12:00:00Z", now), "Aug 1, 2026");
  assert.equal(relativeTime(ago(-100), now), "just now");
});
