import { schemaClient } from './schema-client';
import type { UserWithProfile, UserRole } from './types';

export class DatabaseQueries {
  constructor(private db = schemaClient) {}

  async getUserWithProfile(userId: string): Promise<UserWithProfile | null> {
    const { data: profile, error } = await this.db.app
      .profiles()
      .select(`
        *,
        organization_members(*)
      `)
      .eq('id', userId)
      .single();

    if (error || !profile) return null;

    return {
      id: userId,
      email: profile.email,
      profile,
      organization_members: profile.organization_members || []
    };
  }

  async getOrganizationsByUserId(userId: string) {
    const { data, error } = await this.db.app
      .organization_members()
      .select(`
        role,
        organizations(*)
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data?.map(member => ({
      ...member.organizations,
      user_role: member.role
    })) || [];
  }

  async getProjectsByOrganization(organizationId: string, userId?: string) {
    let query = this.db.app
      .projects()
      .select('*')
      .eq('organization_id', organizationId);

    if (userId) {
      const userProfile = await this.getUserWithProfile(userId);
      if (userProfile?.profile.role === 'client') {
        query = query.eq('client_id', userId);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getInvoicesByOrganization(organizationId: string, userId?: string) {
    let query = this.db.finance
      .invoices()
      .select(`
        *,
        invoice_items(*),
        payments(*)
      `)
      .eq('organization_id', organizationId);

    if (userId) {
      const userProfile = await this.getUserWithProfile(userId);
      if (userProfile?.profile.role === 'client') {
        query = query.eq('client_id', userId);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getMessageThreadsByUser(userId: string) {
    const { data, error } = await this.db.messaging
      .message_threads()
      .select(`
        *,
        messages(*),
        participants:message_participants(*)
      `)
      .in('id', 
        this.db.messaging
          .message_participants()
          .select('thread_id')
          .eq('user_id', userId)
      );

    if (error) throw error;
    return data || [];
  }

  async createAuditLog(action: string, resource_type: string, resource_id: string, userId: string, details?: any) {
    const { data, error } = await this.db.audit
      .audit_logs()
      .insert({
        action,
        resource_type,
        resource_id,
        user_id: userId,
        details: details || {},
        timestamp: new Date().toISOString()
      });

    if (error) throw error;
    return data;
  }

  async getUserRole(userId: string, organizationId?: string): Promise<UserRole | null> {
    const userProfile = await this.getUserWithProfile(userId);
    if (!userProfile) return null;

    if (organizationId) {
      const orgMember = userProfile.organization_members.find(
        member => member.organization_id === organizationId
      );
      return orgMember?.role as UserRole || userProfile.profile.role as UserRole;
    }

    return userProfile.profile.role as UserRole;
  }

  async hasPermission(userId: string, resource: string, action: string, organizationId?: string): Promise<boolean> {
    const role = await this.getUserRole(userId, organizationId);
    if (!role) return false;

    const permissions = {
      admin: ['*'],
      team_member: ['read', 'create', 'update'],
      client: ['read']
    };

    const userPermissions = permissions[role] || [];
    return userPermissions.includes('*') || userPermissions.includes(action);
  }
}

export const dbQueries = new DatabaseQueries();