"use client";
import {AdminContext} from "../../lib/context";
import {useAdminData} from "../../lib/hooks";

export default function AdminLayout({children}) {
  const AdminContextDefault = useAdminData();
  return (
    <main>
      <AdminContext.Provider value={AdminContextDefault}>
        {children}
      </AdminContext.Provider>
    </main>
  );
}
