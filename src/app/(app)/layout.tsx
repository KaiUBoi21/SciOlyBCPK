import { requireUser } from "@/lib/dal";
import SiteNav from "@/components/site-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Proxy already gates auth on every request; this is defense in depth.
  await requireUser();

  return (
    <div className="flex flex-1 flex-col">
      <SiteNav />
      {children}
    </div>
  );
}
