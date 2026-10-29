"use client";
import Image from "next/image";
import Link from "next/link";
import {useEffect, useRef} from "react";
import {FaPlay} from "react-icons/fa6";
import {formatDuration} from "../../../lib/community/schema.mjs";
import {usePrefersReducedMotion} from "./usePrefersReducedMotion";

// Homepage reels row linking into /community. The first video plays muted
// while the strip is on screen; the rest are posters.
export default function CommunityStrip({posts}) {
  const strip = useRef(null);
  const preview = useRef(null);
  const reducedMotion = usePrefersReducedMotion();
  const firstVideo = posts.find(p => p.type === "video");

  useEffect(() => {
    const v = preview.current;
    if (!v || reducedMotion) return;
    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? v.play().catch(() => {}) : v.pause()),
      {threshold: 0.5},
    );
    observer.observe(strip.current);
    return () => observer.disconnect();
  }, [reducedMotion]);

  if (!posts.length) return null;

  return (
    <section data-section="community" className="px-6 py-12 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <h1 className="font-sans text-5xl font-thin md:text-7xl">Inside NOS</h1>
        <Link
          href="/community"
          data-track="home-community-see-all"
          className="shrink-0 text-base font-semibold text-red-600 hover:text-red-500"
        >
          See all <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
      <ul
        ref={strip}
        role="list"
        className="-mx-6 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-6 px-6 pb-2 md:mt-12 lg:-mx-8 lg:scroll-px-8 lg:px-8"
      >
        {posts.map(post => (
          <li key={post.id} className="shrink-0 snap-start">
            <Link
              href={`/community#p-${post.id}`}
              data-track="home-community-tile"
              aria-label={post.caption || "Open community post"}
              className="relative block aspect-[9/16] w-40 overflow-hidden rounded-2xl bg-gray-900 sm:w-52"
            >
              {post === firstVideo && !reducedMotion ? (
                <video
                  ref={preview}
                  src={post.media.url}
                  poster={post.poster?.url}
                  muted
                  playsInline
                  loop
                  preload="none"
                  className="size-full object-cover"
                />
              ) : (
                <Image
                  src={post.poster?.url ?? post.media.url}
                  alt=""
                  fill
                  sizes="208px"
                  className="object-cover"
                />
              )}
              {post.type === "video" && (
                <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-xs font-semibold text-white">
                  <FaPlay aria-hidden="true" className="size-2.5" />
                  {formatDuration(post.media.duration)}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
