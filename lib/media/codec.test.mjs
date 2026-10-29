import {test} from "node:test";
import assert from "node:assert/strict";
import {detectVideoCodec} from "./codec.mjs";

// Random-ish filler with an optional ASCII tag embedded in the middle.
function chunk(tag = "") {
  const bytes = new Uint8Array(4096).map((_, i) => (i * 7) % 251);
  const at = 2000;
  [...tag].forEach((c, i) => (bytes[at + i] = c.charCodeAt(0)));
  return bytes;
}

test("detects codecs in the head chunk", () => {
  assert.equal(detectVideoCodec(chunk("hvc1"), chunk()), "hevc");
  assert.equal(detectVideoCodec(chunk("hev1"), chunk()), "hevc");
  assert.equal(detectVideoCodec(chunk("avc1"), chunk()), "h264");
});

test("detects codecs in the tail chunk (moov at the end)", () => {
  assert.equal(detectVideoCodec(chunk(), chunk("hvc1")), "hevc");
  assert.equal(detectVideoCodec(chunk(), chunk("hev1")), "hevc");
  assert.equal(detectVideoCodec(chunk(), chunk("avc1")), "h264");
});

test("unknown when no sample entry is found", () => {
  assert.equal(detectVideoCodec(chunk(), chunk()), "unknown");
  assert.equal(detectVideoCodec(), "unknown");
});

test("hevc wins when both appear", () => {
  assert.equal(detectVideoCodec(chunk("avc1"), chunk("hvc1")), "hevc");
  assert.equal(detectVideoCodec(chunk("hev1"), chunk("avc1")), "hevc");
});

test("finds a tag at the very end of a chunk", () => {
  const bytes = chunk();
  bytes.set([..."avc1"].map(c => c.charCodeAt(0)), bytes.length - 4);
  assert.equal(detectVideoCodec(bytes), "h264");
});
