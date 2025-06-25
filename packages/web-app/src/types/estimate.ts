/**
 * Type definitions for Estimate-related data structures
 */

export type EstimateStatus = 'Draft' | 'Sent' | 'Accepted' | 'Declined' | 'Expired';

export interface EstimateItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface EstimateClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
}

export interface EstimateProject {
  id: string;
  name: string;
}

export interface EstimateData {
  // Core Info
  id: string; // Reference number
  amount: number;
  status: EstimateStatus;
  date: string;
  dueDate: string;
  currency: string;
  notes: string | null;
  terms: string | null;

  // Associated Info
  client: EstimateClient;
  project: EstimateProject | null;

  // Company Info (From associated Organization)
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;

  // Items and Calculated Fields
  lineItems: EstimateItem[];
  subtotal: number;
  tax: number;
  discount?: number;
}

// Raw data structure from Supabase
export interface RawEstimateItem {
  id: string;
  description: string;
  quantity: string | number;
  unit_price: string | number;
  amount: string | number;
}

export interface RawOrganization {
  id: string;
  name: string;
  company_name: string | null;
  company_address: string | null;
  company_email: string | null;
  company_phone: string | null;
  default_currency: string | null;
}

export interface RawProject {
  id: string;
  name: string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface RawEstimate {
  id: string;
  reference_number: string;
  organization_id: string;
  project_id: string | null;
  amount: string | number;
  issue_date: string;
  expiry_date: string;
  status: string;
  notes: string | null;
  terms: string | null;
  organization?: RawOrganization;
  estimate_items: RawEstimateItem[];
}

/**
 * Utility functions to convert between raw database types and DTO types
 */

/**
 * Convert a raw estimate item from the database to an EstimateItem DTO
 */
export function toEstimateItem(rawItem: RawEstimateItem): EstimateItem {
  return {
    id: rawItem.id,
    description: rawItem.description,
    quantity: Number(rawItem.quantity),
    unitPrice: Number(rawItem.unit_price),
    amount: Number(rawItem.amount)
  };
}

/**
 * Convert a raw organization to an EstimateClient DTO
 */
export function toEstimateClient(organization: RawOrganization): EstimateClient {
  return {
    id: organization.id,
    name: organization.company_name || organization.name || "Unknown Client",
    email: "",  // These fields would need to be populated from client data if available
    phone: "",
    address: "",
    currency: organization.default_currency || "USD"
  };
}

/**
 * Convert a raw project to an EstimateProject DTO
 */
export function toEstimateProject(project: RawProject | null): EstimateProject | null {
  if (!project) return null;
  
  return {
    id: project.id,
    name: project.name
  };
}

/**
 * Convert a raw estimate from the database to an EstimateData DTO
 * Note: Company information should come from the authenticated user's organization,
 * not from the organization associated with the estimate (which is the client).
 * This function doesn't fetch the user's organization - that should be handled separately.
 */
export function toEstimateData(rawEstimate: RawEstimate, project: RawProject | null = null): EstimateData {
  // Calculate subtotal from line items
  const lineItems = rawEstimate.estimate_items.map(toEstimateItem);
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  
  // Get client organization data
  const clientOrganization = rawEstimate.organization;
  
  return {
    // Core Info
    id: rawEstimate.reference_number,
    amount: Number(rawEstimate.amount),
    status: rawEstimate.status as EstimateStatus,
    date: rawEstimate.issue_date,
    dueDate: rawEstimate.expiry_date,
    currency: clientOrganization?.default_currency || "USD",
    notes: rawEstimate.notes,
    terms: rawEstimate.terms,
    
    // Client Info (from the organization associated with the estimate)
    client: clientOrganization ? toEstimateClient(clientOrganization) : {
      id: rawEstimate.organization_id,
      name: "Unknown Client",
      email: "",
      phone: "",
      address: "",
      currency: "USD"
    },
    project: toEstimateProject(project),
    
    // Company Info fields are placeholders - should be populated with the authenticated user's org data
    companyName: "",  // Will be populated from user's organization
    companyAddress: "",
    companyEmail: "",
    companyPhone: "",
    
    // Items and Calculated Fields
    lineItems,
    subtotal,
    tax: Number(rawEstimate.amount) - subtotal, // Assuming difference is tax
    discount: 0 // Default value, update if discount data is available
  };
}

/**
 * Convert an EstimateData DTO to a raw estimate for database operations
 * Useful for update operations
 */
export function toRawEstimate(estimateData: EstimateData): Partial<RawEstimate> {
  return {
    amount: estimateData.amount,
    issue_date: estimateData.date,
    expiry_date: estimateData.dueDate,
    status: estimateData.status,
    notes: estimateData.notes,
    terms: estimateData.terms,
    // We don't include organization_id or project_id as those typically don't change
    // and would require additional validation
  };
}

/**
 * Convert an EstimateItem DTO to a raw estimate item for database operations
 */
export function toRawEstimateItem(item: EstimateItem, estimate_id: string): Partial<RawEstimateItem> & { estimate_id: string } {
  return {
    estimate_id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    amount: item.amount
  };
}
