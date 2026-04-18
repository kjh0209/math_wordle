import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AppHeader } from "@/components/ui/AppHeader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="flex-1 flex max-w-6xl mx-auto w-full px-4 py-6 gap-6">
        <AdminSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
