import { eq, desc, sql, and, or } from 'drizzle-orm';
import { db } from '../db/config';
import {
  invoicesInFinance,
  paymentsInFinance,
  profilesInApp,
  organizationsInApp,
  projectsInApp,
  organizationMembersInApp,
  invoiceItemsInFinance
} from '@payflow/core/db/schema';
import { AuthContext } from '../middleware/auth';

// Type definitions for the API responses
export interface InvoiceWithRelations {
  id: string;
  invoiceNumber: string;
  totalAmount: string;
  status: string | null;
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: string;
    name: string;
    companyName: string | null;
  };
  project?: {
    id: string;
    name: string;
    status: string;
  };
  client?: {
    id: string;
    fullName: string;
    email: string;
  };
  items?: Array<{
    id: string;
    description: string;
    quantity: string;
    unitPrice: string;
    totalPrice: string;
  }>;
}

export interface PaymentWithInvoice {
  id: string;
  amount: string;
  status: string | null;
  createdAt: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    client?: {
      id: string;
      fullName: string;
      email: string;
    };
  };
}

export interface OrganizationMemberWithDetails {
  id: string;
  role: string;
  isPrimary: boolean;
  createdAt: string | null;
  organization?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface ProjectWithRelations {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  organization?: {
    id: string;
    name: string;
  };
  client?: {
    id: string;
    fullName: string;
    email: string;
  };
}

/**
 * Get invoices with organization, project, client, and items
 * Filtered by user permissions - admins see all, clients see only their own
 */
export async function getInvoicesWithRelations(limit = 10, user?: AuthContext): Promise<InvoiceWithRelations[]> {
  const result = await db
    .select({
      // Invoice fields
      id: invoicesInFinance.id,
      invoiceNumber: invoicesInFinance.invoiceNumber,
      totalAmount: invoicesInFinance.totalAmount,
      status: invoicesInFinance.status,
      createdAt: invoicesInFinance.createdAt,
      updatedAt: invoicesInFinance.updatedAt,
      // Organization fields
      organizationId: organizationsInApp.id,
      organizationName: organizationsInApp.name,
      organizationCompanyName: organizationsInApp.companyName,
      // Project fields
      projectId: projectsInApp.id,
      projectName: projectsInApp.name,
      projectStatus: projectsInApp.status,
      // Client fields
      clientId: profilesInApp.id,
      clientFullName: profilesInApp.fullName,
      clientEmail: profilesInApp.email,
    })
    .from(invoicesInFinance)
    .leftJoin(organizationsInApp, eq(invoicesInFinance.organizationId, organizationsInApp.id))
    .leftJoin(projectsInApp, eq(invoicesInFinance.projectId, projectsInApp.id))
    .leftJoin(profilesInApp, eq(invoicesInFinance.clientId, profilesInApp.id))
    .where(
      user?.role === 'admin' 
        ? undefined // Admins see all invoices
        : user?.organizationId 
          ? eq(invoicesInFinance.organizationId, user.organizationId) // Users see only their org's invoices
          : eq(invoicesInFinance.clientId, user?.userId) // Fallback: users see only their own invoices
    )
    .orderBy(desc(invoicesInFinance.createdAt))
    .limit(limit);

  // Transform the flat result into nested structure
  return result.map(row => ({
    id: row.id,
    invoiceNumber: row.invoiceNumber,
    totalAmount: row.totalAmount,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    organization: row.organizationId ? {
      id: row.organizationId,
      name: row.organizationName,
      companyName: row.organizationCompanyName,
    } : undefined,
    project: row.projectId ? {
      id: row.projectId,
      name: row.projectName,
      status: row.projectStatus,
    } : undefined,
    client: row.clientId ? {
      id: row.clientId,
      fullName: row.clientFullName,
      email: row.clientEmail,
    } : undefined,
  }));
}

/**
 * Get invoice with all relations including items
 */
export async function getInvoiceWithItems(invoiceId: string, user?: AuthContext): Promise<InvoiceWithRelations | null> {
  const [invoice] = await db
    .select({
      // Invoice fields
      id: invoicesInFinance.id,
      invoiceNumber: invoicesInFinance.invoiceNumber,
      totalAmount: invoicesInFinance.totalAmount,
      status: invoicesInFinance.status,
      createdAt: invoicesInFinance.createdAt,
      updatedAt: invoicesInFinance.updatedAt,
      // Organization fields
      organizationId: organizationsInApp.id,
      organizationName: organizationsInApp.name,
      organizationCompanyName: organizationsInApp.companyName,
      // Project fields
      projectId: projectsInApp.id,
      projectName: projectsInApp.name,
      projectStatus: projectsInApp.status,
      // Client fields
      clientId: profilesInApp.id,
      clientFullName: profilesInApp.fullName,
      clientEmail: profilesInApp.email,
    })
    .from(invoicesInFinance)
    .leftJoin(organizationsInApp, eq(invoicesInFinance.organizationId, organizationsInApp.id))
    .leftJoin(projectsInApp, eq(invoicesInFinance.projectId, projectsInApp.id))
    .leftJoin(profilesInApp, eq(invoicesInFinance.clientId, profilesInApp.id))
    .where(
      and(
        eq(invoicesInFinance.id, invoiceId),
        user?.role === 'admin' 
          ? undefined // Admins can access any invoice
          : user?.organizationId 
            ? eq(invoicesInFinance.organizationId, user.organizationId) // Users can only access their org's invoices
            : eq(invoicesInFinance.clientId, user?.userId) // Fallback: users can only access their own invoices
      )
    );

  if (!invoice) return null;

  // Get invoice items separately
  const items = await db
    .select({
      id: invoiceItemsInFinance.id,
      description: invoiceItemsInFinance.description,
      quantity: invoiceItemsInFinance.quantity,
      unitPrice: invoiceItemsInFinance.unitPrice,
      totalPrice: invoiceItemsInFinance.totalPrice,
    })
    .from(invoiceItemsInFinance)
    .where(eq(invoiceItemsInFinance.invoiceId, invoiceId));

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    totalAmount: invoice.totalAmount,
    status: invoice.status,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
    organization: invoice.organizationId ? {
      id: invoice.organizationId,
      name: invoice.organizationName,
      companyName: invoice.organizationCompanyName,
    } : undefined,
    project: invoice.projectId ? {
      id: invoice.projectId,
      name: invoice.projectName,
      status: invoice.projectStatus,
    } : undefined,
    client: invoice.clientId ? {
      id: invoice.clientId,
      fullName: invoice.clientFullName,
      email: invoice.clientEmail,
    } : undefined,
    items: items.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    })),
  };
}

/**
 * Get payments with invoice and client information
 */
export async function getPaymentsWithInvoice(limit = 10, user?: AuthContext): Promise<PaymentWithInvoice[]> {
  const result = await db
    .select({
      // Payment fields
      id: paymentsInFinance.id,
      amount: paymentsInFinance.amount,
      status: paymentsInFinance.status,
      createdAt: paymentsInFinance.createdAt,
      // Invoice fields
      invoiceId: invoicesInFinance.id,
      invoiceNumber: invoicesInFinance.invoiceNumber,
      // Client fields
      clientId: profilesInApp.id,
      clientFullName: profilesInApp.fullName,
      clientEmail: profilesInApp.email,
    })
    .from(paymentsInFinance)
    .leftJoin(invoicesInFinance, eq(paymentsInFinance.invoiceId, invoicesInFinance.id))
    .leftJoin(profilesInApp, eq(invoicesInFinance.clientId, profilesInApp.id))
    .where(
      user?.role === 'admin' 
        ? undefined // Admins see all payments
        : user?.organizationId 
          ? eq(invoicesInFinance.organizationId, user.organizationId) // Users see payments for their org's invoices
          : eq(invoicesInFinance.clientId, user?.userId) // Fallback: users see payments for their own invoices
    )
    .orderBy(desc(paymentsInFinance.createdAt))
    .limit(limit);

  return result.map(row => ({
    id: row.id,
    amount: row.amount,
    status: row.status,
    createdAt: row.createdAt,
    invoice: row.invoiceId ? {
      id: row.invoiceId,
      invoiceNumber: row.invoiceNumber,
      client: row.clientId ? {
        id: row.clientId,
        fullName: row.clientFullName,
        email: row.clientEmail,
      } : undefined,
    } : undefined,
  }));
}

/**
 * Get organization members with organization and user details
 */
export async function getOrganizationMembersWithDetails(limit = 10, user?: AuthContext): Promise<OrganizationMemberWithDetails[]> {
  const result = await db
    .select({
      // Member fields
      id: organizationMembersInApp.id,
      role: organizationMembersInApp.role,
      isPrimary: organizationMembersInApp.isPrimary,
      createdAt: organizationMembersInApp.createdAt,
      // Organization fields
      organizationId: organizationsInApp.id,
      organizationName: organizationsInApp.name,
      // User fields
      userId: profilesInApp.id,
      userFullName: profilesInApp.fullName,
      userEmail: profilesInApp.email,
    })
    .from(organizationMembersInApp)
    .leftJoin(organizationsInApp, eq(organizationMembersInApp.organizationId, organizationsInApp.id))
    .leftJoin(profilesInApp, eq(organizationMembersInApp.userId, profilesInApp.id))
    .where(
      user?.role === 'admin' 
        ? undefined // Admins see all org members
        : user?.organizationId 
          ? eq(organizationMembersInApp.organizationId, user.organizationId) // Users see only their org's members
          : eq(organizationMembersInApp.userId, user?.userId) // Fallback: users see only themselves
    )
    .limit(limit);

  return result.map(row => ({
    id: row.id,
    role: row.role,
    isPrimary: row.isPrimary,
    createdAt: row.createdAt,
    organization: row.organizationId ? {
      id: row.organizationId,
      name: row.organizationName,
    } : undefined,
    user: row.userId ? {
      id: row.userId,
      fullName: row.userFullName,
      email: row.userEmail,
    } : undefined,
  }));
}

/**
 * Get projects with organization and client details
 */
export async function getProjectsWithRelations(limit = 10, user?: AuthContext): Promise<ProjectWithRelations[]> {
  const result = await db
    .select({
      // Project fields
      id: projectsInApp.id,
      name: projectsInApp.name,
      description: projectsInApp.description,
      status: projectsInApp.status,
      createdAt: projectsInApp.createdAt,
      // Organization fields
      organizationId: organizationsInApp.id,
      organizationName: organizationsInApp.name,
      // Client fields
      clientId: profilesInApp.id,
      clientFullName: profilesInApp.fullName,
      clientEmail: profilesInApp.email,
    })
    .from(projectsInApp)
    .leftJoin(organizationsInApp, eq(projectsInApp.organizationId, organizationsInApp.id))
    .leftJoin(profilesInApp, eq(projectsInApp.clientId, profilesInApp.id))
    .where(
      user?.role === 'admin' 
        ? undefined // Admins see all projects
        : user?.organizationId 
          ? eq(projectsInApp.organizationId, user.organizationId) // Users see only their org's projects
          : eq(projectsInApp.clientId, user?.userId) // Fallback: users see only their own projects
    )
    .orderBy(desc(projectsInApp.createdAt))
    .limit(limit);

  return result.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    createdAt: row.createdAt,
    organization: row.organizationId ? {
      id: row.organizationId,
      name: row.organizationName,
    } : undefined,
    client: row.clientId ? {
      id: row.clientId,
      fullName: row.clientFullName,
      email: row.clientEmail,
    } : undefined,
  }));
}