"use client";
import Link from "next/link";
import {useCallback, useEffect, useLayoutEffect, useRef, useState} from "react";
import {FaXmark} from "react-icons/fa6";
import ReelSlide from "./ReelSlide";
import {usePrefersReducedMotion} from "./usePrefersReducedMotion";

// Full-screen vertical swipe viewer: one post per screen, then an end card.
export default function ReelViewer({posts, startIndex, onClose}) {
  const scroller = useRef(null);
  const [active, setActive] = useState(startIndex);
  // One sound setting for the whole viewer; browsers only autoplay muted.
  const [muted, setMuted] = useState(true);
  const [toast, setToast] = useState(null);
  const reducedMotion = usePrefersReducedMotion();
  const total = posts.length;

  useEffect(() => {
    const {overflow} = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  // Jump (not scroll) to the post that was tapped, before the first paint.
  useLayoutEffect(() => {
    const el = scroller.current;
    el.scrollTop = el.children[startIndex]?.offsetTop ?? 0;
    el.focus({preventScroll: true});
  }, [startIndex]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number(entry.target.dataset.index));
        }
      },
      {root: scroller.current, threshold: 0.6},
    );
    for (const el of scroller.current.children) observer.observe(el);
    return () => observer.disconnect();
  }, [total]);

  // Keeps the address bar shareable; replaceState doesn't fire hashchange.
  useEffect(() => {
    if (active < total) history.replaceState(null, "", `#p-${posts[active].id}`);
  }, [active, total, posts]);

  const scrollTo = useCallback(
    index => {
      const el = scroller.current?.children[Math.max(0, Math.min(index, total))];
      el?.scrollIntoView({behavior: reducedMotion ? "auto" : "smooth", block: "start"});
    },
    [total, reducedMotion],
  );

  useEffect(() => {
    const onKey = e => {
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        scrollTo(active + 1);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        scrollTo(active - 1);
      } else if (e.key === "m") {
        setMuted(m => !m);
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, scrollTo, onClose]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(id);
  }, [toast]);

  const share = async post => {
    const url = `${window.location.origin}/community#p-${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({url, title: "No Off Season", text: post.caption || undefined});
      } catch {
        // Closing the share sheet rejects; nothing to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setToast("Link copied");
    } catch {
      setToast("Couldn't copy the link");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Community reels"
      className="fixed inset-0 z-[60] bg-black text-white"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-linear-to-b from-black/60 to-transparent px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-6">
        <span className="text-sm font-semibold tabular-nums">
          {Math.min(active + 1, total)} / {total}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="pointer-events-auto rounded-full bg-black/40 p-2 hover:bg-black/60"
        >
          <FaXmark aria-hidden="true" className="size-5" />
        </button>
      </div>

      <div
        ref={scroller}
        tabIndex={-1}
        className="h-dvh snap-y snap-mandatory overflow-y-scroll overscroll-contain outline-none"
      >
        {posts.map((post, i) => (
          <ReelSlide
            key={post.id}
            post={post}
            index={i}
            total={total}
            active={i === active}
            preload={Math.abs(i - active) <= 1}
            muted={muted}
            reducedMotion={reducedMotion}
            onToggleMute={() => setMuted(m => !m)}
            onShare={() => share(post)}
          />
        ))}
        <section
          data-index={total}
          className="flex h-dvh snap-start snap-always flex-col items-center justify-center gap-6 bg-linear-to-br from-gray-950 via-red-900 to-red-600 px-6 text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-red-200">
            That&rsquo;s the latest
          </p>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Want in?</h2>
          <p className="max-w-sm text-lg text-gray-200">
            Answer a few quick questions and we&rsquo;ll match you with the right training.
          </p>
          <Link
            href="/start"
            data-track="community-find-your-fit"
            className="rounded-full bg-red-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-red-500/30 hover:bg-red-400"
          >
            Find Your Fit <span aria-hidden="true">&rarr;</span>
          </Link>
          <button
            type="button"
            onClick={() => scrollTo(0)}
            className="text-sm font-semibold text-white/80 underline-offset-4 hover:underline"
          >
            Watch from the start
          </button>
        </section>
      </div>

      {toast && (
        <p
          role="status"
          className="absolute bottom-[max(2rem,env(safe-area-inset-bottom))] left-1/2 z-10 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-lg"
        >
          {toast}
        </p>
      )}
    </div>
  );
}
