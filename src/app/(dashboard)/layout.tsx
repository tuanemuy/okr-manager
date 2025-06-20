import { Suspense } from "react";
import { requireAuth } from "@/actions/session";
import { Navbar } from "@/components/navigation/navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div className="h-16 bg-white border-b" />}>
        <AuthenticatedNavbar />
      </Suspense>
      <main>{children}</main>
    </div>
  );
}

async function AuthenticatedNavbar() {
  await requireAuth();
  return <Navbar />;
}
