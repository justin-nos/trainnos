"use client";
import AdminNavbar from "../../../components/client/AdminNavbar";
import AnalyticsDashboard from "../../../components/client/analytics/AnalyticsDashboard";

export default function AnalyticsPage() {
  return (
    <div className="min-h-full">
      <AdminNavbar />
      <div className="py-10">
        <header>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Analytics
            </h1>
          </div>
        </header>
        <main>
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <AnalyticsDashboard />
          </div>
        </main>
      </div>
    </div>
  );
}
