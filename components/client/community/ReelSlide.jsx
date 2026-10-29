"use client";
import Image from "next/image";
import {useEffect, useRef, useState} from "react";
import {FaPlay, FaShareNodes, FaVolumeHigh, FaVolumeXmark} from "react-icons/fa6";
import logo from "../../../public/NOSWHITE_1.png";
import {relativeTime} from "../../../lib/community/schema.mjs";

const RAIL_BUTTON = "rounded-full bg-black/40 p-3 backdrop-blur hover:bg-black/60";

// One full-screen post. Media is letterboxed over its own blurred image so
// portrait and landscape both fill the screen without stretching.
export default function ReelSlide({
  post,
  index,
  total,
  active,
  preload,
  muted,
  reducedMotion,
  onToggleMute,
  onShare,
}) {
  const video = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [flash, setFlash] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isVideo = post.type === "video";
  const backdrop = post.poster?.url ?? post.media.url;

  useEffect(() => {
    if (video.current) video.current.muted = muted;
  }, [muted]);

  // Only the post on screen plays. Others pause and start over next time.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (active && !reducedMotion) {
      v.play().catch(() => {});
    } else {
      v.pause();
      if (!active) {
        v.currentTime = 0;
        setProgress(0);
      }
    }
  }, [active, reducedMotion]);

  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(false), 600);
    return () => clearTimeout(id);
  }, [flash]);

  // Tap toggles sound while playing; it starts playback when paused (reduced
  // motion, or a browser that blocked autoplay).
  const tap = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else if (reducedMotion) {
      v.pause();
    } else {
      onToggleMute();
      setFlash(true);
    }
  };

  const SoundIcon = muted ? FaVolumeXmark : FaVolumeHigh;

  return (
    <section
      data-index={index}
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${total}`}
      className="relative h-dvh snap-start snap-always overflow-hidden"
    >
      <img
        src={backdrop}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 size-full scale-110 object-cover opacity-60 blur-2xl"
      />

      {isVideo ? (
        <button
          type="button"
          onClick={tap}
          aria-label={playing ? (muted ? "Unmute" : "Mute") : "Play"}
          className="absolute inset-0 size-full"
        >
          <video
            ref={video}
            src={post.media.url}
            poster={post.poster?.url}
            preload={preload ? "auto" : "none"}
            muted={muted}
            playsInline
            loop
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={e => {
              const {currentTime, duration} = e.currentTarget;
              if (duration) setProgress(currentTime / duration);
            }}
            className="relative size-full object-contain"
          />
          {active && !playing && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full bg-black/50 p-6">
                <FaPlay aria-hidden="true" className="size-8 translate-x-0.5" />
              </span>
            </span>
          )}
          {flash && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full bg-black/50 p-5">
                <SoundIcon aria-hidden="true" className="size-8" />
              </span>
            </span>
          )}
        </button>
      ) : (
        <img
          src={post.media.url}
          alt={post.caption || "Community photo"}
          className="absolute inset-0 size-full object-contain"
        />
      )}

      <div className="absolute right-3 bottom-32 z-10 flex flex-col gap-4">
        <button type="button" onClick={onShare} aria-label="Share" className={RAIL_BUTTON}>
          <FaShareNodes aria-hidden="true" className="size-5" />
        </button>
        {isVideo && (
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
            className={RAIL_BUTTON}
          >
            <SoundIcon aria-hidden="true" className="size-5" />
          </button>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/40 to-transparent px-4 pt-16 pr-20 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <Image src={logo} alt="No Off Season" className="h-5 w-auto" />
        {post.caption && (
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            className={`pointer-events-auto mt-2 block text-left text-sm leading-snug ${
              expanded ? "" : "line-clamp-2"
            }`}
          >
            {post.caption}
          </button>
        )}
        <p className="mt-1 text-xs text-white/70">{relativeTime(post.createdAt)}</p>
      </div>

      {isVideo && active && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/20">
          <div className="h-full bg-white" style={{width: `${progress * 100}%`}} />
        </div>
      )}
    </section>
  );
}
