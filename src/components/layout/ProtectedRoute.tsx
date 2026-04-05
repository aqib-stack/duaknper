"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { Loader } from "@/components/ui/Loader";

export function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: UserRole[] }) {
  const router = useRouter();
  const { user, loading, userRole } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && allowedRoles?.length && userRole && !allowedRoles.includes(userRole)) {
      router.replace(userRole === 'super_admin' ? '/admin' : '/app/dashboard');
    }
  }, [allowedRoles, loading, router, user, userRole]);

  if (loading || !user || (allowedRoles?.length && userRole && !allowedRoles.includes(userRole))) {
    return <Loader label="Checking your session..." />;
  }

  return <>{children}</>;
}
