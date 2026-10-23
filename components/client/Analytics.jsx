"use client";
import {useEffect} from "react";
import {usePathname} from "next/navigation";
import {initAnalytics, pageview} from "../../lib/analytics/client";

// Mounts the in-house tracker and records a pageview on every route change.
export default function NosAnalytics() {
  const pathname = usePathname();
  useEffect(() => {
    initAnalytics();
  }, []);
  useEffect(() => {
    pageview(pathname);
  }, [pathname]);
  return null;
}
