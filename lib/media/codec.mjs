// Finds the video sample entry in an MP4/MOV's stsd box. Camera files often
// write moov at the end, so callers pass both the first and last few MB.
const CODECS = {hvc1: "hevc", hev1: "hevc", avc1: "h264", avc3: "h264"};
const ENTRIES = Object.keys(CODECS).map(tag => ({
  bytes: [...tag].map(c => c.charCodeAt(0)),
  codec: CODECS[tag],
}));

function findCodec(chunk) {
  const found = new Set();
  for (let i = 0; i + 4 <= chunk.length; i++) {
    for (const {bytes, codec} of ENTRIES) {
      if (
        chunk[i] === bytes[0] &&
        chunk[i + 1] === bytes[1] &&
        chunk[i + 2] === bytes[2] &&
        chunk[i + 3] === bytes[3]
      ) {
        found.add(codec);
      }
    }
  }
  return found;
}

// "hevc" | "h264" | "unknown". HEVC wins if both appear, since one HEVC
// track is enough to make the file unplayable on many devices.
export function detectVideoCodec(...chunks) {
  const found = new Set(chunks.flatMap(chunk => [...findCodec(chunk)]));
  if (found.has("hevc")) return "hevc";
  if (found.has("h264")) return "h264";
  return "unknown";
}

export const HEVC_HELP =
  "This video is HEVC, which many phones can't play. On iPhone: Settings → Camera → Formats → Most Compatible, then re-record — or export it as H.264 first.";
export const UNKNOWN_CODEC_WARNING =
  "Couldn't check this video's format; preview it on an Android phone after posting.";
