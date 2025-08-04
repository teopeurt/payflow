// Client for cross-schema API calls
const API_BASE_URL = process.env.CROSS_SCHEMA_API_URL || 'https://d539yuu6hhr8z.cloudfront.net/api/cross-schema';

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

export class CrossSchemaApiClient {
  private baseUrl: string;
  private getToken?: () => Promise<string | null>;

  constructor(baseUrl = API_BASE_URL, tokenProvider?: () => Promise<string | null>) {
    this.baseUrl = baseUrl;
    this.getToken = tokenProvider;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.getToken) {
      const token = await this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async getInvoicesWithRelations(limit = 10): Promise<InvoiceWithRelations[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/invoices?limit=${limit}`, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch invoices: ${response.statusText}`);
    }
    return response.json();
  }

  async getInvoiceWithItems(id: string): Promise<InvoiceWithRelations> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/invoices/${id}`, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch invoice: ${response.statusText}`);
    }
    return response.json();
  }

  async getPaymentsWithInvoice(limit = 10): Promise<PaymentWithInvoice[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/payments?limit=${limit}`, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch payments: ${response.statusText}`);
    }
    return response.json();
  }

  async getOrganizationMembersWithDetails(limit = 10): Promise<OrganizationMemberWithDetails[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/organization-members?limit=${limit}`, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch organization members: ${response.statusText}`);
    }
    return response.json();
  }

  async getProjectsWithRelations(limit = 10): Promise<ProjectWithRelations[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/projects?limit=${limit}`, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    return response.json();
  }
}

// Token provider function using Supabase
async function getSupabaseToken(): Promise<string | null> {
  // Import Supabase client dynamically to avoid circular dependencies
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase configuration missing for cross-schema API authentication');
      return null;
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return null;
    }
    
    return session.access_token;
  } catch (error) {
    console.error('Error getting Supabase token:', error);
    return null;
  }
}

// Export a default instance with authentication
export const crossSchemaApi = new CrossSchemaApiClient(API_BASE_URL, getSupabaseToken);