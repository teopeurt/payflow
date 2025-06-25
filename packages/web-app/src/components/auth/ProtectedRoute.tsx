
import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/shared/Spinner";

interface ProtectedRouteProps {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireClient?: boolean;
}

export const ProtectedRoute = ({
  requireAuth = true,
  requireAdmin = false,
  requireClient = false
}: ProtectedRouteProps) => {
  const { user, isAdmin, isClient, isLoading } = useAuth();
  const location = useLocation();

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // If user is not authenticated and route requires auth
  if (requireAuth && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If user is authenticated but route is for non-authenticated users only (like auth page)
  if (!requireAuth && user) {
    return <Navigate to="/" replace />;
  }

  // If route requires admin role but user is not admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // If route requires client role but user is not client
  if (requireClient && !isClient) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
