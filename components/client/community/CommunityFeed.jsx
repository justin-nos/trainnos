"use client";
import Image from "next/image";
import {useEffect, useState} from "react";
import {FaPlay, FaStar} from "react-icons/fa6";
import {formatDuration} from "../../../lib/community/schema.mjs";
import ReelViewer from "./ReelViewer";
import {usePrefersReducedMotion} from "./usePrefersReducedMotion";

const HASH = /^#p-([0-9a-f-]{36})$/i;

// Edge-to-edge grid of 9:16 tiles; tapping one opens the full-screen viewer.
// A #p-<id> hash (shared links) opens the viewer at that post.
export default function CommunityFeed({posts}) {
  const [open, setOpen] = useState(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const openFromHash = () => {
      const id = window.location.hash.match(HASH)?.[1];
      const index = id ? posts.findIndex(p => p.id === id) : -1;
      if (index !== -1) setOpen(index);
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [posts]);

  const close = () => {
    setOpen(null);
    history.replaceState(null, "", window.location.pathname + window.location.search);
  };

  return (
    <>
      <ul role="list" className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4">
        {posts.map((post, i) => (
          <li
            key={post.id}
            className="animate-quiz-in"
            style={reducedMotion ? undefined : {animationDelay: `${Math.min(i, 12) * 40}ms`}}
          >
            <button
              type="button"
              onClick={() => setOpen(i)}
              data-track="community-tile"
              aria-label={post.caption || `Open post ${i + 1}`}
              className="group relative block aspect-[9/16] w-full overflow-hidden bg-gray-900"
            >
              <Image
                src={post.poster?.url ?? post.media.url}
                alt=""
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {post.type === "video" && (
                <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-xs font-semibold text-white">
                  <FaPlay aria-hidden="true" className="size-2.5" />
                  {formatDuration(post.media.duration)}
                </span>
              )}
              {post.pinned && (
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-xs font-semibold text-white">
                  <FaStar aria-hidden="true" className="size-2.5 text-amber-400" /> Featured
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {open !== null && <ReelViewer posts={posts} startIndex={open} onClose={close} />}
    </>
  );
}
