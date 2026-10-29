"use client";
import {useState} from "react";
import {FaEye, FaEyeSlash, FaPlay, FaRotateRight, FaStar, FaTrash} from "react-icons/fa6";
import {CAPTION_MAX, formatDuration, orderPosts} from "../../../lib/community/schema.mjs";

const ACTION =
  "rounded-full p-2 text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50";

export default function CommunityLibrary({posts, setPosts, state, onRefresh}) {
  const [error, setError] = useState(null);

  // Update on screen right away; put the old post back if the save fails.
  const patch = async (post, optimistic, body) => {
    setError(null);
    setPosts(ps => orderPosts(ps.map(p => (p.id === post.id ? {...p, ...optimistic} : p))));
    try {
      const res = await fetch(`/api/community/${post.id}`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setPosts(ps => orderPosts(ps.map(p => (p.id === post.id ? data.post : p))));
    } catch (err) {
      console.error("Could not update post", err);
      setPosts(ps => orderPosts(ps.map(p => (p.id === post.id ? post : p))));
      setError(err.message);
    }
  };

  const destroy = async post => {
    if (!window.confirm("Delete this post? It will be removed from the site for good.")) return;
    setError(null);
    setPosts(ps => ps.filter(p => p.id !== post.id));
    try {
      const res = await fetch(`/api/community/${post.id}`, {method: "DELETE"});
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error("Could not delete post", err);
      setPosts(ps => orderPosts([...ps, post]));
      setError(err.message);
    }
  };

  return (
    <section aria-labelledby="library-heading">
      <div className="flex items-center justify-between gap-4">
        <h2 id="library-heading" className="text-xl font-bold tracking-tight text-gray-900">
          Library
          <span className="ml-2 text-sm font-normal text-gray-500">{posts.length} posts</span>
        </h2>
        <button
          type="button"
          onClick={onRefresh}
          disabled={state === "loading"}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
        >
          <FaRotateRight
            aria-hidden="true"
            className={`size-3 ${state === "loading" ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Couldn&rsquo;t save: {error}
        </p>
      )}
      {state === "loading" && posts.length === 0 && (
        <p className="py-10 text-center text-sm text-gray-500">Loading posts…</p>
      )}
      {state === "error" && (
        <p className="py-10 text-center text-sm text-red-600">
          Couldn&rsquo;t load posts. Try Refresh.
        </p>
      )}
      {state === "ready" && posts.length === 0 && (
        <p className="py-10 text-center text-sm text-gray-500">
          Nothing posted yet. Add photos and videos above.
        </p>
      )}

      {posts.length > 0 && (
        <ul role="list" className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {posts.map(post => (
            <PostTile
              key={post.id}
              post={post}
              onCaption={caption => patch(post, {caption}, {caption})}
              onPin={() =>
                patch(
                  post,
                  {pinned: !post.pinned, pinnedAt: post.pinned ? null : new Date().toISOString()},
                  {pinned: !post.pinned},
                )
              }
              onToggleHidden={() => {
                const status = post.status === "hidden" ? "published" : "hidden";
                patch(post, {status}, {status});
              }}
              onDelete={() => destroy(post)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function PostTile({post, onCaption, onPin, onToggleHidden, onDelete}) {
  const [caption, setCaption] = useState(post.caption);
  const hidden = post.status === "hidden";
  const image = post.poster?.url ?? post.media.url;

  const save = () => {
    if (caption.trim() !== post.caption) onCaption(caption.trim());
  };

  return (
    <li className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      <div className={`relative aspect-[9/16] bg-gray-100 ${hidden ? "opacity-40" : ""}`}>
        <img src={image} alt={post.caption || "Community post"} className="size-full object-cover" />
        {post.type === "video" && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-xs font-semibold text-white">
            <FaPlay aria-hidden="true" className="size-2.5" />
            {formatDuration(post.media.duration)}
          </span>
        )}
        {post.pinned && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded bg-amber-400 px-1.5 py-0.5 text-xs font-semibold text-gray-900">
            <FaStar aria-hidden="true" className="size-2.5" /> Pinned
          </span>
        )}
      </div>
      <div className="space-y-2 p-2">
        {hidden && (
          <span className="inline-block rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
            Hidden
          </span>
        )}
        <label htmlFor={`post-caption-${post.id}`} className="sr-only">
          Caption
        </label>
        <textarea
          id={`post-caption-${post.id}`}
          value={caption}
          onChange={e => setCaption(e.target.value)}
          onBlur={save}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          maxLength={CAPTION_MAX}
          rows={2}
          placeholder="Add a caption"
          className="block w-full resize-none rounded-md px-2 py-1 text-xs text-gray-900 ring-1 ring-gray-200 focus:ring-2 focus:ring-gray-900 focus:outline-none"
        />
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onPin}
            aria-label={post.pinned ? "Unpin" : "Pin"}
            title={post.pinned ? "Unpin" : "Pin to the top"}
            className={`${ACTION} ${post.pinned ? "bg-amber-50 text-amber-600" : ""}`}
          >
            <FaStar aria-hidden="true" className="size-3" />
          </button>
          <button
            type="button"
            onClick={onToggleHidden}
            aria-label={hidden ? "Show" : "Hide"}
            title={hidden ? "Show on the site" : "Hide from the site"}
            className={ACTION}
          >
            {hidden ? (
              <FaEye aria-hidden="true" className="size-3" />
            ) : (
              <FaEyeSlash aria-hidden="true" className="size-3" />
            )}
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete"
            title="Delete"
            className={`${ACTION} text-red-600 ring-red-200 hover:bg-red-50`}
          >
            <FaTrash aria-hidden="true" className="size-3" />
          </button>
        </div>
      </div>
    </li>
  );
}
