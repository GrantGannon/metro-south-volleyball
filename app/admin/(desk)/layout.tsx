import { redirect } from "next/navigation";
import { AdminFrame } from "@/components/admin/AdminFrame";
import { AdminNav } from "@/components/admin/AdminNav";
import { isAdmin } from "@/lib/auth";

export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");
  return (
    <>
      <AdminNav />
      <AdminFrame>{children}</AdminFrame>
    </>
  );
}
