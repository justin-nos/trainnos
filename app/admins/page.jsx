"use client";
import {useContext} from "react";
import AdminNavbar from "../../components/client/AdminNavbar";
import {AdminContext} from "../../lib/context";
import {useAdminReroute} from "../../lib/hooks";

export default function Dashboard() {
  const {admin} = useContext(AdminContext);
  const checkSource = useAdminReroute();
  return (
    <>
      {/*
        This example requires updating your template:

        ```
        <html class="h-full bg-gray-100">
        <body class="h-full">
        ```
      */}
      <div className="min-h-full">
        <AdminNavbar />

        <div className="py-10">
          <header>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Dashboard
              </h1>
            </div>
          </header>
          <main>
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              {/* Your content */}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
