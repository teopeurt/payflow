import React, { useEffect, useState } from 'react';
import { useAuth } from '@payflow/core/auth';
import { usePermissions, UserRole } from '@/lib/database';
import { Navigate } from 'react-router-dom';
import { Spinner } from '@/components/shared/Spinner';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: {
    resource: string;
    action: string;
  };
  fallbackComponent?: React.ComponentType;
  redirectTo?: string;
  organizationId?: string;
}

export function RoleGuard({
  children,
  allowedRoles,
  requiredPermission,
  fallbackComponent: FallbackComponent,
  redirectTo = '/unauthorized',
  organizationId,
}: RoleGuardProps) {
  const { user, profile, isLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (!user || !profile) {
        setHasAccess(false);
        setIsChecking(false);
        return;
      }

      try {
        // Check role-based access
        if (allowedRoles) {
          const userRole = profile.role;
          if (!allowedRoles.includes(userRole)) {
            setHasAccess(false);
            setIsChecking(false);
            return;
          }
        }

        // Check permission-based access
        if (requiredPermission) {
          const permissions = usePermissions(user.id, organizationId);
          const hasPermission = await permissions.hasPermission(
            requiredPermission.resource,
            requiredPermission.action
          );
          setHasAccess(hasPermission);
        } else {
          setHasAccess(true);
        }
      } catch (error) {
        console.error('Access check failed:', error);
        setHasAccess(false);
      } finally {
        setIsChecking(false);
      }
    }

    if (!isLoading) {
      checkAccess();
    }
  }, [user, profile, isLoading, allowedRoles, requiredPermission, organizationId]);

  // Still loading authentication state
  if (isLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Spinner />
      </div>
    );
  }

  // User not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // User doesn't have access
  if (hasAccess === false) {
    if (FallbackComponent) {
      return <FallbackComponent />;
    }
    return <Navigate to={redirectTo} replace />;
  }

  // User has access
  return <>{children}</>;
}

// Specific role guard components for common use cases
export function AdminGuard({ children, ...props }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard allowedRoles={['admin']} {...props}>
      {children}
    </RoleGuard>
  );
}

export function TeamMemberGuard({ children, ...props }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard allowedRoles={['admin', 'team_member']} {...props}>
      {children}
    </RoleGuard>
  );
}

export function ClientGuard({ children, ...props }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard allowedRoles={['client']} {...props}>
      {children}
    </RoleGuard>
  );
}