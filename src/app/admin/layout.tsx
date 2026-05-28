import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AdminAlertBanner } from '@/components/layout/admin-alert-banner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto bg-zinc-50 p-6 lg:p-8">
        <AdminAlertBanner />
        {children}
      </main>
    </div>
  );
}
