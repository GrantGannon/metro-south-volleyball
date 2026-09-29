import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { isAdmin } from "@/lib/auth";

export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");
  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-xl px-4 pt-4 pb-16">{children}</main>
    </>
  );
}
