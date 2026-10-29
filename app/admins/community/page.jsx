"use client";
import {useEffect, useState} from "react";
import AdminNavbar from "../../../components/client/AdminNavbar";
import CommunityLibrary from "../../../components/client/community/CommunityLibrary";
import CommunityUploader from "../../../components/client/community/CommunityUploader";
import {orderPosts} from "../../../lib/community/schema.mjs";

export default function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [state, setState] = useState("loading");

  const load = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/community", {cache: "no-store"});
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setPosts((await res.json()).posts);
      setState("ready");
    } catch (error) {
      console.error("Could not load community posts", error);
      setState("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <div className="min-h-full">
        <AdminNavbar />
        <div className="py-10">
          <header>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Community
              </h1>
            </div>
          </header>
          <main>
            <div className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6 lg:px-8">
              <CommunityUploader
                onPosted={post => setPosts(ps => orderPosts([post, ...ps]))}
              />
              <CommunityLibrary
                posts={posts}
                setPosts={setPosts}
                state={state}
                onRefresh={load}
              />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
