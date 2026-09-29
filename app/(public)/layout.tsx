import { BottomNav, Header } from "@/components/AppChrome";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))]">{children}</main>
      <BottomNav />
    </>
  );
}
