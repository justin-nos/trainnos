import Link from "next/link";
import CommunityFeed from "../../components/client/community/CommunityFeed";
import {getPublishedPosts} from "../../lib/community/queries";

// Admin changes revalidate immediately; hourly covers dashboard edits.
export const revalidate = 3600;

export const metadata = {
  title: "Community | No Off Season",
  description:
    "Photos and videos from inside No Off Season: training sessions, wins, and the people who make the gym what it is.",
};

export default async function Community() {
  const posts = await getPublishedPosts();
  return (
    <main className="bg-gray-950">
      <section
        data-section="community-hero"
        className="relative isolate overflow-hidden px-6 pt-32 pb-12 text-center sm:pt-40 lg:px-8"
      >
        <div
          aria-hidden="true"
          className="absolute -left-24 -top-24 -z-10 size-96 rounded-full bg-red-600/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -right-24 -z-10 size-96 rounded-full bg-orange-500/30 blur-3xl"
        />
        <p className="text-sm font-semibold uppercase tracking-widest text-red-400">
          Life at NOS
        </p>
        <h1 className="mx-auto mt-4 max-w-2xl text-balance text-4xl font-bold tracking-tight text-white sm:text-6xl">
          No off season. Just this crew.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-8 text-gray-300">
          Training days, PRs, and the people who show up. Tap anything to watch.
        </p>
      </section>

      {posts.length > 0 ? (
        <section data-section="community-feed">
          <CommunityFeed posts={posts} />
        </section>
      ) : (
        <section data-section="community-empty" className="px-6 pb-24 text-center">
          <p className="text-lg text-gray-300">
            Fresh photos and videos are on the way. Come see it in person in the meantime.
          </p>
          <Link
            href="/start"
            data-track="community-empty-find-your-fit"
            className="mt-8 inline-block rounded-full bg-red-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-red-500/30 hover:bg-red-400"
          >
            Find Your Fit <span aria-hidden="true">&rarr;</span>
          </Link>
        </section>
      )}
    </main>
  );
}
