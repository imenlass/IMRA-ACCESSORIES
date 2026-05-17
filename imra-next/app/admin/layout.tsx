import { requireAdmin } from '@/lib/admin';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const metadata = {
  title: 'IMRA — Administration',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();

  return (
    <div className="admin-shell">
      <AdminSidebar email={user.email ?? ''} />
      <main className="admin-main">{children}</main>
    </div>
  );
}
