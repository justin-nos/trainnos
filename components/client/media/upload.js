// Browser-side upload helpers shared by the trainer and community admin tools.
import {detectVideoCodec} from "../../../lib/media/codec.mjs";

const SNIFF_BYTES = 2 * 1024 * 1024;
const POSTER_MAX_EDGE = 1080;

// Signs, then PUTs straight to Supabase Storage with progress (fetch has no upload
// progress). Resolves {id, path}; the caller's API route finalizes the path.
export async function uploadFile(file, {purpose, id, variant, onProgress} = {}) {
  const res = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({purpose, contentType: file.type, size: file.size, id, variant}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Couldn't start the upload");

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", data.uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    // Stored as the object's Cache-Control; paths are never reused.
    xhr.setRequestHeader("cache-control", "max-age=31536000");
    xhr.upload.onprogress = e => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and retry."));
    xhr.send(file);
  });
  onProgress?.(1);
  return {id: data.id, path: data.path};
}

const canvasToBlob = (canvas, quality) =>
  new Promise((resolve, reject) =>
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error("Couldn't process this image"))),
      "image/jpeg",
      quality,
    ),
  );

function scaledSize(width, height, maxEdge) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {width: Math.round(width * scale), height: Math.round(height * scale)};
}

// Phone photos are 4–12 MB; shrink to ≤1600px JPEG before upload. Images
// already within maxEdge are returned unchanged.
export async function resizeImage(file, maxEdge = 1600, quality = 0.85) {
  const bitmap = await createImageBitmap(file, {imageOrientation: "from-image"});
  try {
    if (Math.max(bitmap.width, bitmap.height) <= maxEdge) return file;
    const {width, height} = scaledSize(bitmap.width, bitmap.height, maxEdge);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
    return await canvasToBlob(canvas, quality);
  } finally {
    bitmap.close();
  }
}

const once = (target, event) =>
  new Promise((resolve, reject) => {
    target.addEventListener(event, resolve, {once: true});
    target.addEventListener("error", () => reject(new Error("Couldn't read this video")), {
      once: true,
    });
  });

// Duration, size and a poster frame for a local video file.
export async function inspectVideo(file) {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  try {
    const loaded = once(video, "loadeddata");
    video.src = url;
    await loaded;
    const {duration, videoWidth: width, videoHeight: height} = video;
    const seeked = once(video, "seeked");
    video.currentTime = Math.min(0.5, duration / 2);
    await seeked;
    const size = scaledSize(width, height, POSTER_MAX_EDGE);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    canvas.getContext("2d").drawImage(video, 0, 0, size.width, size.height);
    const poster = await canvasToBlob(canvas, 0.8);
    return {duration, width, height, poster};
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

// Head + tail 2 MB → detectVideoCodec ("hevc" | "h264" | "unknown").
export async function sniffCodec(file) {
  const head = file.slice(0, SNIFF_BYTES);
  const tail = file.slice(Math.max(0, file.size - SNIFF_BYTES));
  const [a, b] = await Promise.all([head.arrayBuffer(), tail.arrayBuffer()]);
  return detectVideoCodec(new Uint8Array(a), new Uint8Array(b));
}
