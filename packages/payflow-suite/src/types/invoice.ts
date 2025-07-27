export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled" | "partially-paid";
export type RecurringType = "indefinitely" | "on_date" | "count";

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: string;
  reference?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  client: {
    id: string;
    name: string;
    email: string;
    address?: string;
    phone?: string;
    currency: string;
  };
  organization?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    logo_url?: string;
  };
  project?: {
    id: string;
    name: string;
  };
  amount: number;
  subtotal: number;
  tax: number;
  discount: number;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  purchaseOrder?: string;
  notes?: string;
  terms?: string;
  isRecurring?: boolean;
  recurringFrequency?: string;
  recurringStartDate?: string;
  recurringUntil?: RecurringType;
  recurringEndDate?: string;
  recurringCount?: number;
  items: InvoiceItem[];
  payments: Payment[];
  logo_url?: string;
}
