// Client for cross-schema API calls
const API_BASE_URL = process.env.CROSS_SCHEMA_API_URL || 'http://localhost:3000/api/cross-schema';

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

  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async getInvoicesWithRelations(limit = 10): Promise<InvoiceWithRelations[]> {
    const response = await fetch(`${this.baseUrl}/invoices?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch invoices: ${response.statusText}`);
    }
    return response.json();
  }

  async getInvoiceWithItems(id: string): Promise<InvoiceWithRelations> {
    const response = await fetch(`${this.baseUrl}/invoices/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch invoice: ${response.statusText}`);
    }
    return response.json();
  }

  async getPaymentsWithInvoice(limit = 10): Promise<PaymentWithInvoice[]> {
    const response = await fetch(`${this.baseUrl}/payments?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch payments: ${response.statusText}`);
    }
    return response.json();
  }

  async getOrganizationMembersWithDetails(limit = 10): Promise<OrganizationMemberWithDetails[]> {
    const response = await fetch(`${this.baseUrl}/organization-members?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch organization members: ${response.statusText}`);
    }
    return response.json();
  }

  async getProjectsWithRelations(limit = 10): Promise<ProjectWithRelations[]> {
    const response = await fetch(`${this.baseUrl}/projects?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    return response.json();
  }
}

// Export a default instance
export const crossSchemaApi = new CrossSchemaApiClient();