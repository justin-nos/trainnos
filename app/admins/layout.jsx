"use client";
import AuthProvider from "../../components/client/AdminAuthProvider";
import AuthCheck from "../../components/client/CheckForAuth";
export default function AdminLayout({children}) {
  return (
    <main>
      <AuthProvider>
        <AuthCheck>{children}</AuthCheck>
      </AuthProvider>
    </main>
  );
}
