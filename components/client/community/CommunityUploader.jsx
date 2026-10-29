"use client";
import {useEffect, useRef, useState} from "react";
import {FaCheck, FaPlay, FaXmark} from "react-icons/fa6";
import {CAPTION_MAX, formatDuration} from "../../../lib/community/schema.mjs";
import {HEVC_HELP, UNKNOWN_CODEC_WARNING} from "../../../lib/media/codec.mjs";
import {ACCEPT, MEDIA_RULES, checkUpload, mediaKind} from "../../../lib/media/rules.mjs";
import {imageSize, inspectVideo, resizeImage, sniffCodec, uploadFile} from "../media/upload";

const megabytes = bytes => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
let nextKey = 0;

// Checks one picked file and returns the fields its queue row needs.
async function prepare(file) {
  const kind = mediaKind(file.type);
  // Photos are checked for size after resizing, so only the type matters here.
  const typeCheck = checkUpload({purpose: "community", contentType: file.type, size: 1});
  if (!typeCheck.ok) return {status: "blocked", error: typeCheck.error};

  if (kind === "image") {
    const blob = await resizeImage(file);
    const check = checkUpload({purpose: "community", contentType: blob.type, size: blob.size});
    if (!check.ok) return {status: "blocked", error: check.error};
    const {width, height} = await imageSize(blob);
    return {status: "ready", type: "photo", blob, width, height, size: blob.size, thumb: URL.createObjectURL(blob)};
  }

  const check = checkUpload({purpose: "community", contentType: file.type, size: file.size});
  if (!check.ok) return {status: "blocked", error: check.error};
  const codec = await sniffCodec(file);
  if (codec === "hevc") return {status: "blocked", error: HEVC_HELP};
  const {duration, width, height, poster} = await inspectVideo(file);
  const thumb = URL.createObjectURL(poster);
  if (duration > MEDIA_RULES.video.maxSeconds) {
    return {
      status: "blocked",
      thumb,
      error: `This video is ${formatDuration(duration)}; the limit is ${formatDuration(MEDIA_RULES.video.maxSeconds)}.`,
    };
  }
  return {
    status: "ready",
    type: "video",
    blob: file,
    poster,
    width,
    height,
    duration,
    size: file.size,
    thumb,
    warning: codec === "unknown" ? UNKNOWN_CODEC_WARNING : null,
  };
}

export default function CommunityUploader({onPosted}) {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const update = (key, changes) =>
    setRows(rs => rs.map(r => (r.key === key ? {...r, ...changes} : r)));

  // Leaving mid-upload loses the rest of the batch.
  useEffect(() => {
    if (!busy) return;
    const warn = e => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  // Release thumbnails when the uploader goes away.
  useEffect(
    () => () => rowsRef.current.forEach(r => r.thumb && URL.revokeObjectURL(r.thumb)),
    [],
  );

  const addFiles = files => {
    for (const file of files) {
      const key = ++nextKey;
      setRows(rs => [
        ...rs,
        {key, name: file.name, size: file.size, caption: "", status: "checking", progress: 0},
      ]);
      prepare(file)
        .then(result => update(key, result))
        .catch(error => {
          console.error("Could not read file", error);
          update(key, {status: "blocked", error: "Couldn't read this file. Try another one."});
        });
    }
  };

  const removeRow = key =>
    setRows(rs => {
      const row = rs.find(r => r.key === key);
      if (row?.thumb) URL.revokeObjectURL(row.thumb);
      return rs.filter(r => r.key !== key);
    });

  const uploadRow = async row => {
    update(row.key, {status: "uploading", progress: 0, error: null});
    try {
      // The poster is small, so the media gets most of the bar.
      const share = row.type === "video" ? 0.9 : 1;
      const media = await uploadFile(row.blob, {
        purpose: "community",
        onProgress: p => update(row.key, {progress: p * share}),
      });
      let posterPath = null;
      if (row.type === "video") {
        ({path: posterPath} = await uploadFile(row.poster, {
          purpose: "community",
          id: media.id,
          variant: "poster",
          onProgress: p => update(row.key, {progress: share + p * (1 - share)}),
        }));
      }
      const res = await fetch("/api/community", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          id: media.id,
          type: row.type,
          mediaPath: media.path,
          posterPath,
          caption: row.caption,
          width: row.width,
          height: row.height,
          duration: row.duration,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      update(row.key, {status: "posted", progress: 1});
      onPosted(data.post);
    } catch (error) {
      console.error("Could not post", error);
      update(row.key, {status: "failed", error: error.message});
    }
  };

  // One at a time, so a phone on cellular isn't pushing several videos at once.
  const uploadAll = async () => {
    setBusy(true);
    for (const row of rowsRef.current.filter(r => r.status === "ready")) {
      await uploadRow(rowsRef.current.find(r => r.key === row.key));
    }
    setBusy(false);
  };

  const retry = async row => {
    setBusy(true);
    await uploadRow(row);
    setBusy(false);
  };

  const ready = rows.filter(r => r.status === "ready").length;
  const checking = rows.some(r => r.status === "checking");

  return (
    <section aria-labelledby="upload-heading">
      <h2 id="upload-heading" className="text-xl font-bold tracking-tight text-gray-900">
        Post to Community
      </h2>
      <label
        onDragOver={e => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-6 py-12 text-center ${
          dragging ? "border-gray-900 bg-gray-100" : "border-gray-300 bg-gray-50 hover:bg-gray-100"
        }`}
      >
        <span className="text-base font-semibold text-gray-900">Add photos &amp; videos</span>
        <span className="text-sm text-gray-500">
          Tap to choose from your camera roll, or drop files here. Videos up to{" "}
          {formatDuration(MEDIA_RULES.video.maxSeconds)}.
        </span>
        <input
          type="file"
          multiple
          accept={ACCEPT.community}
          onChange={e => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
          className="sr-only"
        />
      </label>

      {rows.length > 0 && (
        <>
          <ul role="list" className="mt-4 divide-y divide-gray-100 rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
            {rows.map(row => (
              <QueueRow
                key={row.key}
                row={row}
                busy={busy}
                onCaption={caption => update(row.key, {caption})}
                onRemove={() => removeRow(row.key)}
                onRetry={() => retry(row)}
              />
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
            {rows.some(r => r.status === "posted") && !busy && (
              <button
                type="button"
                onClick={() => rows.filter(r => r.status === "posted").forEach(r => removeRow(r.key))}
                className="text-sm font-semibold text-gray-600 hover:text-gray-900"
              >
                Clear posted
              </button>
            )}
            <button
              type="button"
              onClick={uploadAll}
              disabled={busy || checking || ready === 0}
              className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {busy ? "Uploading…" : `Upload & publish (${ready})`}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function QueueRow({row, busy, onCaption, onRemove, onRetry}) {
  const blocked = row.status === "blocked";
  const editable = row.status === "ready" || row.status === "failed";
  return (
    <li className={`flex gap-3 p-3 ${blocked ? "bg-red-50" : ""}`}>
      <div className="relative h-28 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {row.thumb && <img src={row.thumb} alt="" className="size-full object-cover" />}
        {row.type === "video" && (
          <span className="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded bg-black/70 px-1 text-[10px] font-semibold text-white">
            <FaPlay aria-hidden="true" className="size-2" />
            {formatDuration(row.duration)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium text-gray-900">
            {row.name}
            <span className="ml-2 font-normal text-gray-500">{megabytes(row.size)}</span>
          </p>
          {row.status !== "uploading" && row.status !== "posted" && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${row.name}`}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <FaXmark aria-hidden="true" className="size-4" />
            </button>
          )}
        </div>

        {row.status === "checking" && <p className="text-sm text-gray-500">Checking…</p>}
        {blocked && <p className="text-sm text-red-700">{row.error}</p>}
        {row.warning && editable && <p className="text-sm text-amber-700">{row.warning}</p>}

        {(editable || row.status === "uploading") && (
          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor={`caption-${row.key}`} className="text-xs font-medium text-gray-600">
                Caption
              </label>
              <span className="text-xs text-gray-400">
                {row.caption.length} / {CAPTION_MAX}
              </span>
            </div>
            <input
              id={`caption-${row.key}`}
              value={row.caption}
              onChange={e => onCaption(e.target.value)}
              maxLength={CAPTION_MAX}
              disabled={!editable || busy}
              className="mt-1 block w-full rounded-lg px-3 py-1.5 text-sm text-gray-900 ring-1 ring-gray-300 focus:ring-2 focus:ring-gray-900 focus:outline-none disabled:bg-gray-50"
            />
          </div>
        )}

        {row.status === "uploading" && (
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full bg-gray-900 transition-[width]"
              style={{width: `${Math.round(row.progress * 100)}%`}}
            />
          </div>
        )}
        {row.status === "posted" && (
          <p className="inline-flex items-center gap-1 text-sm font-semibold text-green-700">
            <FaCheck aria-hidden="true" className="size-3" /> Posted
          </p>
        )}
        {row.status === "failed" && (
          <p className="text-sm text-red-700">
            {row.error}{" "}
            <button
              type="button"
              onClick={onRetry}
              disabled={busy}
              className="font-semibold underline disabled:opacity-50"
            >
              Retry
            </button>
          </p>
        )}
      </div>
    </li>
  );
}
