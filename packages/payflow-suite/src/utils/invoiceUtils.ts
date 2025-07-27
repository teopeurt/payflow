import { format } from "date-fns";
import { InvoiceData, InvoiceStatus, RecurringType } from "@/types/invoice";

/**
 * Transform raw invoice data from Supabase into a structured InvoiceData object
 */
export const transformInvoiceData = (rawData: any): InvoiceData | null => {
  if (!rawData) return null;
  
  const subtotal = rawData.invoice_items?.reduce(
    (sum: number, item: any) => sum + Number(item.amount || 0), 
    0
  ) || 0;
  
  const items = rawData.invoice_items?.map((item: any) => ({
    id: item.id,
    description: item.description,
    quantity: Number(item.quantity),
    rate: Number(item.unit_price),
    amount: Number(item.amount)
  })) || [];
  
  const payments = rawData.payments?.map((payment: any) => ({
    id: payment.id,
    date: payment.payment_date,
    amount: Number(payment.amount),
    method: payment.method,
    reference: payment.reference
  })) || [];

  return {
    id: rawData.id,
    invoiceNumber: rawData.invoice_number || rawData.id,
    client: {
      id: rawData.organization_id,
      name: rawData.organization?.name || "Unknown",
      email: rawData.organization?.company_email || "",
      address: rawData.organization?.company_address || "",
      phone: rawData.organization?.company_phone || "",
      currency: rawData.organization?.default_currency || "USD"
    },
    organization: {
      name: rawData.organization?.company_name || rawData.organization?.name || "",
      email: rawData.organization?.company_email || "",
      phone: rawData.organization?.company_phone || "",
      address: rawData.organization?.company_address || "",
      logo_url: rawData.organization?.company_logo_url
    },
    project: rawData.project ? {
      id: rawData.project.id,
      name: rawData.project.name
    } : undefined,
    amount: Number(rawData.amount),
    subtotal,
    tax: Number(rawData.tax || 0),
    discount: Number(rawData.discount || 0),
    issueDate: rawData.issue_date,
    dueDate: rawData.due_date,
    status: rawData.status as InvoiceStatus,
    purchaseOrder: rawData.purchase_order,
    notes: rawData.notes,
    terms: rawData.terms,
    isRecurring: rawData.is_recurring || false,
    recurringFrequency: rawData.recurring_frequency,
    recurringStartDate: rawData.recurring_start_date,
    recurringUntil: rawData.recurring_until as RecurringType,
    recurringEndDate: rawData.recurring_end_date,
    recurringCount: rawData.recurring_count ? Number(rawData.recurring_count) : undefined,
    items,
    payments,
    logo_url: rawData.logo_url
  };
};

/**
 * Calculate the current status of an invoice based on payments and due date
 */
export const calculateInvoiceStatus = (invoice: InvoiceData | null): InvoiceStatus => {
  if (!invoice) return "draft";
  
  const remainingBalance = invoice.amount - invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const isPaid = remainingBalance <= 0;
  const isPartiallyPaid = invoice.payments.length > 0 && !isPaid;
  
  if (isPaid) return "paid";
  if (isPartiallyPaid) return "partially-paid";
  
  if (invoice.status === "sent" && new Date() > new Date(invoice.dueDate)) {
    return "overdue";
  }
  
  return invoice.status;
};

/**
 * Format a date string for display
 */
export const formatInvoiceDate = (dateString: string): string => {
  if (!dateString) return "Not set";
  try {
    const date = new Date(dateString);
    return format(date, "MMM dd, yyyy");
  } catch (error) {
    return "Invalid date";
  }
};
