import { AdminShell } from '@/components/layout/AdminShell';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['super_admin']}>
      <AdminShell>{children}</AdminShell>
    </ProtectedRoute>
  );
}
