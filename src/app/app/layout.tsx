import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

export default function SellerAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["seller"]}>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
