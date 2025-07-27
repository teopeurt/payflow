import { dbQueries, UserRole } from '@/lib/database';

export interface PermissionConfig {
  resource: string;
  actions: string[];
  scope?: 'organization' | 'global' | 'own';
}

const PERMISSION_MATRIX: Record<UserRole, PermissionConfig[]> = {
  admin: [
    { resource: '*', actions: ['*'], scope: 'organization' },
  ],
  team_member: [
    { resource: 'invoices', actions: ['read', 'create', 'update'], scope: 'organization' },
    { resource: 'estimates', actions: ['read', 'create', 'update'], scope: 'organization' },
    { resource: 'projects', actions: ['read', 'create', 'update'], scope: 'organization' },
    { resource: 'clients', actions: ['read', 'create', 'update'], scope: 'organization' },
    { resource: 'files', actions: ['read', 'create', 'update'], scope: 'organization' },
    { resource: 'time_entries', actions: ['read', 'create', 'update'], scope: 'own' },
    { resource: 'messages', actions: ['read', 'create'], scope: 'organization' },
  ],
  client: [
    { resource: 'invoices', actions: ['read'], scope: 'own' },
    { resource: 'estimates', actions: ['read'], scope: 'own' },
    { resource: 'projects', actions: ['read'], scope: 'own' },
    { resource: 'files', actions: ['read'], scope: 'own' },
    { resource: 'messages', actions: ['read', 'create'], scope: 'own' },
    { resource: 'payments', actions: ['read', 'create'], scope: 'own' },
  ],
};

export class PermissionChecker {
  constructor(private userId: string, private organizationId?: string) {}

  async hasPermission(resource: string, action: string): Promise<boolean> {
    try {
      return await dbQueries.hasPermission(
        this.userId,
        resource,
        action,
        this.organizationId
      );
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  async getUserRole(): Promise<UserRole | null> {
    try {
      return await dbQueries.getUserRole(this.userId, this.organizationId);
    } catch (error) {
      console.error('Failed to get user role:', error);
      return null;
    }
  }

  async canAccessResource(resource: string, resourceId?: string): Promise<boolean> {
    const role = await this.getUserRole();
    if (!role) return false;

    const permissions = PERMISSION_MATRIX[role];
    if (!permissions) return false;

    // Check if user has wildcard permissions
    const wildcardPermission = permissions.find(p => p.resource === '*');
    if (wildcardPermission) return true;

    // Check specific resource permissions
    const resourcePermission = permissions.find(p => p.resource === resource);
    if (!resourcePermission) return false;

    // For 'own' scope, we would need additional logic to check ownership
    if (resourcePermission.scope === 'own' && resourceId) {
      return await this.checkOwnership(resource, resourceId);
    }

    return true;
  }

  private async checkOwnership(resource: string, resourceId: string): Promise<boolean> {
    // This would need to be implemented based on specific resource ownership rules
    // For now, return true as a placeholder
    return true;
  }
}

export function createPermissionChecker(userId: string, organizationId?: string) {
  return new PermissionChecker(userId, organizationId);
}

// Permission decorators/higher-order functions
export function requirePermission(resource: string, action: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // This would need access to current user context
      // Implementation depends on how user context is managed
      const hasPermission = true; // Placeholder
      
      if (!hasPermission) {
        throw new Error(`Permission denied: ${action} on ${resource}`);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// React hooks for permission checking
export function usePermissions(userId: string, organizationId?: string) {
  const checker = createPermissionChecker(userId, organizationId);

  return {
    hasPermission: (resource: string, action: string) => 
      checker.hasPermission(resource, action),
    canAccessResource: (resource: string, resourceId?: string) =>
      checker.canAccessResource(resource, resourceId),
    getUserRole: () => checker.getUserRole(),
  };
}