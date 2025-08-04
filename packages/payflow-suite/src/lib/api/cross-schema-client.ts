// Client for cross-schema API calls
// Use import.meta.env for Vite applications (browser environment)
const API_BASE_URL = (typeof window !== 'undefined' && import.meta.env?.VITE_CROSS_SCHEMA_API_URL) || 
                    (typeof process !== 'undefined' && process.env?.CROSS_SCHEMA_API_URL) || 
                    'https://d539yuu6hhr8z.cloudfront.net/api/cross-schema';

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

export interface MessageThreadWithRelations {
  id: string;
  subject: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    fullName: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
    status: string;
  };
}

export interface MessageWithSender {
  id: string;
  threadId: string;
  content: string;
  messageType: string;
  createdAt: string;
  isDeleted: boolean;
  sender?: {
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

  async getMessageThreadsWithRelations(limit = 10): Promise<MessageThreadWithRelations[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/message-threads?limit=${limit}`, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch message threads: ${response.statusText}`);
    }
    return response.json();
  }

  async getMessagesForThread(threadId: string): Promise<MessageWithSender[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/messages/${threadId}`, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.statusText}`);
    }
    return response.json();
  }

  async createMessage(threadId: string, content: string): Promise<MessageWithSender> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ threadId, content }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create message: ${response.statusText} - ${errorText}`);
    }
    return response.json();
  }
}

// Token provider function using the shared Supabase client
async function getSupabaseToken(): Promise<string | null> {
  try {
    console.log('getSupabaseToken: Attempting to get token...');
    
    // Use the shared Supabase client instance
    const { getSupabase } = await import('@payflow/core/integrations/supabase/client');
    console.log('getSupabaseToken: Successfully imported getSupabase');
    
    const supabase = getSupabase();
    console.log('getSupabaseToken: Got Supabase client');
    
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('getSupabaseToken: Session data:', { hasSession: !!session, error });
    
    if (error || !session) {
      console.warn('No valid Supabase session for cross-schema API authentication', { error, hasSession: !!session });
      return null;
    }
    
    console.log('getSupabaseToken: Successfully got access token');
    return session.access_token;
  } catch (error) {
    console.error('Error getting Supabase token:', error);
    return null;
  }
}

// Export a default instance with authentication
export const crossSchemaApi = new CrossSchemaApiClient(API_BASE_URL, getSupabaseToken);