import {redirect} from "next/navigation";
import {getAdminSession} from "../../lib/admin/session";

export default async function AdminLayout({children}) {
  if (!(await getAdminSession())) redirect("/auth/login");
  return <main>{children}</main>;
}
