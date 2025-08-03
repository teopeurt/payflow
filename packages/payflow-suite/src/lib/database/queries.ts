import { schemaClient } from './schema-client';
import type { UserWithProfile, UserRole } from './types';

export class DatabaseQueries {
  constructor(private db = schemaClient) {}

  async getUserWithProfile(userId: string): Promise<UserWithProfile | null> {
    const { data: profile, error } = await this.db.app
      .profiles()
        .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) return null;

    // Query organization memberships directly instead of using join
    const { data: organizationMembers, error: membersError } = await this.db.app
      .organization_members()
      .select('*')
      .eq('user_id', userId);

    if (membersError) {
      console.error('Error fetching organization memberships:', membersError);
      // Continue with empty memberships rather than failing
    }

    return {
      id: userId,
      email: profile.email,
      profile,
      organization_members: organizationMembers || []
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
    // First get the thread IDs for this user
    const { data: threadIds, error: threadIdsError } = await this.db.messaging
      .message_participants()
      .select('thread_id')
      .eq('user_id', userId);

    if (threadIdsError) throw threadIdsError;

    if (!threadIds || threadIds.length === 0) {
      return [];
    }

    // Then get the threads with their messages and participants
    const { data, error } = await this.db.messaging
      .message_threads()
      .select(`
        *,
        messages(*),
        participants:message_participants(*)
      `)
      .in('id', threadIds.map(t => t.thread_id));

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
    if (!userProfile) {
      console.log(`getUserRole: No user profile found for userId: ${userId}`);
      return null;
    }

    console.log(`getUserRole: Found ${userProfile.organization_members.length} organization memberships for user ${userId}`);
    userProfile.organization_members.forEach((member, index) => {
      console.log(`  ${index + 1}. Organization: ${member.organization_id}, Role: ${member.role}`);
    });

    if (organizationId) {
      const orgMember = userProfile.organization_members.find(
        member => member.organization_id === organizationId
      );
      const role = orgMember?.role as UserRole || null;
      console.log(`getUserRole: Looking for org ${organizationId}, found role: ${role}`);
      return role;
    }

    // In the new schema, roles are stored in organization_members table
    // If no organizationId is provided, return the role from the first organization membership
    if (userProfile.organization_members.length > 0) {
      const role = userProfile.organization_members[0].role as UserRole;
      console.log(`getUserRole: No org specified, using first membership role: ${role}`);
      return role;
    }

    console.log(`getUserRole: No organization memberships found for user ${userId}`);
    return null;
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