"use client";
import {useContext} from "react";
import AdminNavbar from "../../../components/client/AdminNavbar";
import LeadsTable from "../../../components/client/LeadsTable";
import {AdminContext} from "../../../lib/context";
import TestimonialLinkCreation from "../makeTestimonialLink/page";
import {getAuth} from "firebase/auth";

export default function LeadsPage() {
  const auth = getAuth();
  console.log("auth from firestore: " + {...auth});
  return (
    <>
      <div className="min-h-full">
        <AdminNavbar />
        <div className="py-10">
          <header>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Leads
              </h1>
            </div>
          </header>
          <main>
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              <LeadsTable />
              <TestimonialLinkCreation />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
