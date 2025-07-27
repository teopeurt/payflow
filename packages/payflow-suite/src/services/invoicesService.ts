import { schemaClient } from "@/lib/database";
import { format } from "date-fns";

export interface Invoice {
  id: string;
  invoice_number: string;
  organization?: {
    name: string;
    address?: string;
    default_currency?: string;
  };
  amount: number;
  issue_date: string;
  due_date: string;
  status: string;
  purchase_order?: string;
  notes?: string;
  terms?: string;
  organization_id: string;
  project_id?: string;
  quote_id?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  invoice_id: string;
}

// Fetch invoices from the database with role-based filtering
export const fetchInvoices = async (userId?: string, userRole?: string): Promise<Invoice[]> => {
  try {
    let query = schemaClient.finance
      .invoices()
      .select(`
        *,
        organization:app.organizations(name, default_currency),
        quote:finance.estimates(reference_number)
      `);

    // Apply client filtering if user is a client
    if (userId && userRole === 'client') {
      query = query.eq('client_id', userId);
    }

    const { data, error } = await query.order('issue_date', { ascending: false });
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return [];
  }
};

// Fetch a single invoice with permission checking
export const fetchInvoiceById = async (id: string, userId?: string, userRole?: string): Promise<Invoice | null> => {
  try {
    let query = schemaClient.finance
      .invoices()
      .select(`
        *,
        organization:app.organizations(*),
        quote:finance.estimates(reference_number)
      `)
      .eq('id', id);

    // Apply client filtering if user is a client
    if (userId && userRole === 'client') {
      query = query.eq('client_id', userId);
    }

    const { data, error } = await query.single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return null;
  }
};

// Fetch invoice items
export const fetchInvoiceItems = async (invoiceId: string): Promise<InvoiceItem[]> => {
  try {
    const { data, error } = await schemaClient.finance
      .invoice_items()
      .select('*')
      .eq('invoice_id', invoiceId);
      
    if (error) throw error;
    
    return (data || []).map((item: InvoiceItem) => ({
      id: item.id,
      description: item.description,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      amount: Number(item.amount),
      invoice_id: item.invoice_id
    }));
  } catch (error) {
    console.error("Error fetching invoice items:", error);
    return [];
  }
};

// Update an invoice
export const updateInvoice = async (
  id: string,
  invoiceData: Partial<Invoice>,
  invoiceItems: InvoiceItem[]
): Promise<boolean> => {
  try {
    // Calculate totals
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
    
    // Update invoice in database
    const { error } = await schemaClient.finance
      .invoices()
      .update({
        ...invoiceData,
        amount: subtotal,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
      
    if (error) throw error;
    
    // Get existing items
    const { data: existingItems } = await schemaClient.finance
      .invoice_items()
      .select('*')
      .eq('invoice_id', id);
    
    // Update or create items
    for (const item of invoiceItems) {
      if (item.id) {
        // Update existing item
        await schemaClient.finance
          .invoice_items()
          .update({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.amount
          })
          .eq('id', item.id);
      } else {
        // Create new item
        await schemaClient.finance
          .invoice_items()
          .insert({
            invoice_id: id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.amount
          });
      }
    }
    
    // Delete items that are no longer present
    const currentItemIds = invoiceItems.map(item => item.id).filter(Boolean);
    const itemsToDelete = existingItems?.filter(item => !currentItemIds.includes(item.id));
    
    if (itemsToDelete && itemsToDelete.length > 0) {
      for (const item of itemsToDelete) {
        await schemaClient.finance
          .invoice_items()
          .delete()
          .eq('id', item.id);
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error updating invoice:", error);
    return false;
  }
};

// Error types for invoice duplication
export enum DuplicationError {
  INVOICE_NOT_FOUND = "Invoice not found",
  PERMISSION_DENIED = "You don't have permission to duplicate this invoice",
  GENERATION_FAILED = "Failed to generate new invoice number",
  INVALID_INVOICE_STATE = "Cannot duplicate cancelled or deleted invoices",
  DATABASE_ERROR = "Database operation failed",
  VALIDATION_ERROR = "Invalid invoice data"
}

export class InvoiceDuplicationError extends Error {
  constructor(
    public type: DuplicationError,
    public details?: string
  ) {
    super(`${type}${details ? `: ${details}` : ''}`);
  }
}

// Interface for duplication options
export interface DuplicateInvoiceOptions {
  newDueDate?: Date;
  newStatus?: string;
  copyRecurringSettings?: boolean;
  newProjectId?: string;
  customInvoiceNumber?: string;
  organizationId?: string; // For permission validation
}

// Generate sequential invoice number
const generateInvoiceNumber = async (organizationId: string): Promise<string> => {
  try {
    // Get the highest invoice number for this organization
    const { data: lastInvoice, error } = await schemaClient.finance
      .invoices()
      .select('invoice_number')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows" error
      throw new InvoiceDuplicationError(DuplicationError.GENERATION_FAILED, error.message);
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    
    if (!lastInvoice?.invoice_number) {
      // First invoice for this organization
      return `INV-${currentYear}${currentMonth}-001`;
    }

    // Extract number from last invoice (assumes format INV-YYYYMM-NNN)
    const numberMatch = lastInvoice.invoice_number.match(/-([0-9]+)$/);
    if (!numberMatch) {
      // Fallback if format doesn't match
      return `INV-${currentYear}${currentMonth}-001`;
    }

    const lastNumber = parseInt(numberMatch[1], 10);
    const nextNumber = String(lastNumber + 1).padStart(3, '0');
    
    return `INV-${currentYear}${currentMonth}-${nextNumber}`;
  } catch (error) {
    if (error instanceof InvoiceDuplicationError) {
      throw error;
    }
    throw new InvoiceDuplicationError(DuplicationError.GENERATION_FAILED, error instanceof Error ? error.message : 'Unknown error');
  }
};

// Validate user permissions
const validateDuplicationPermissions = async (invoiceId: string, organizationId?: string): Promise<any> => {
  const { data: invoice, error } = await schemaClient.finance
    .invoices()
    .select('*, organization:app.organizations(*)')
    .eq('id', invoiceId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new InvoiceDuplicationError(DuplicationError.INVOICE_NOT_FOUND);
    }
    throw new InvoiceDuplicationError(DuplicationError.DATABASE_ERROR, error.message);
  }

  if (!invoice) {
    throw new InvoiceDuplicationError(DuplicationError.INVOICE_NOT_FOUND);
  }

  // Check if invoice can be duplicated (not cancelled or deleted)
  if (invoice.status === 'cancelled') {
    throw new InvoiceDuplicationError(DuplicationError.INVALID_INVOICE_STATE, 'Cannot duplicate cancelled invoices');
  }

  // Basic organization validation - can be enhanced with proper auth
  if (organizationId && invoice.organization_id !== organizationId) {
    throw new InvoiceDuplicationError(DuplicationError.PERMISSION_DENIED);
  }

  return invoice;
};

// Get organization defaults for due date calculation
const getOrganizationDefaults = async (organizationId: string) => {
  const { data: org, error } = await schemaClient.app
    .organizations()
    .select('default_payment_terms, default_currency')
    .eq('id', organizationId)
    .single();

  if (error) {
    console.warn('Could not fetch organization defaults:', error);
    return { defaultPaymentTerms: 30, defaultCurrency: 'USD' };
  }

  return {
    defaultPaymentTerms: org?.default_payment_terms || 30,
    defaultCurrency: org?.default_currency || 'USD'
  };
};

// Duplicate an invoice with improved error handling and transaction safety
export const duplicateInvoice = async (
  invoiceId: string,
  options: DuplicateInvoiceOptions = {}
): Promise<{ success: boolean; invoiceId?: string; error?: string; errorType?: DuplicationError }> => {
  try {
    // Step 1: Validate permissions and fetch original invoice
    const originalInvoice = await validateDuplicationPermissions(invoiceId, options.organizationId);
    
    // Step 2: Fetch invoice items
    const { data: originalItems, error: itemsError } = await schemaClient.finance
      .invoice_items()
      .select('*')
      .eq('invoice_id', invoiceId);
    
    if (itemsError) {
      throw new InvoiceDuplicationError(DuplicationError.DATABASE_ERROR, `Failed to fetch invoice items: ${itemsError.message}`);
    }

    // Step 3: Get organization defaults
    const orgDefaults = await getOrganizationDefaults(originalInvoice.organization_id);
    
    // Step 4: Generate new invoice number
    const invoiceNumber = options.customInvoiceNumber || await generateInvoiceNumber(originalInvoice.organization_id);
    
    // Step 5: Prepare new invoice data with comprehensive field mapping
    const invoiceDate = new Date();
    const defaultDueDate = new Date(invoiceDate.getTime() + orgDefaults.defaultPaymentTerms * 24 * 60 * 60 * 1000);
    
    const newInvoiceData = {
      organization_id: originalInvoice.organization_id,
      project_id: options.newProjectId || originalInvoice.project_id,
      client_id: originalInvoice.client_id,
      amount: originalInvoice.amount,
      subtotal: originalInvoice.subtotal || originalInvoice.amount,
      tax: originalInvoice.tax || 0,
      discount: originalInvoice.discount || 0,
      status: options.newStatus || 'draft',
      invoice_number: invoiceNumber,
      issue_date: invoiceDate.toISOString(),
      due_date: (options.newDueDate || defaultDueDate).toISOString(),
      notes: originalInvoice.notes,
      terms: originalInvoice.terms,
      purchase_order: originalInvoice.purchase_order,
      quote_id: originalInvoice.quote_id,
      // Handle recurring fields based on options
      is_recurring: options.copyRecurringSettings ? originalInvoice.is_recurring : false,
      recurring_frequency: options.copyRecurringSettings ? originalInvoice.recurring_frequency : null,
      recurring_start_date: options.copyRecurringSettings ? originalInvoice.recurring_start_date : null,
      recurring_until: options.copyRecurringSettings ? originalInvoice.recurring_until : null,
      recurring_end_date: options.copyRecurringSettings ? originalInvoice.recurring_end_date : null,
      recurring_count: options.copyRecurringSettings ? originalInvoice.recurring_count : null,
      // Add reference to original invoice for audit trail
      duplicated_from_id: originalInvoice.id,
      created_at: invoiceDate.toISOString(),
      updated_at: invoiceDate.toISOString()
    };

    // Step 6: Execute transaction-safe duplication
    const { data: newInvoice, error: createError } = await supabase
      .rpc('duplicate_invoice_with_items', {
        original_invoice_id: invoiceId,
        new_invoice_data: newInvoiceData,
        invoice_items: originalItems || []
      });

    // If RPC function doesn't exist, fall back to manual transaction
    if (createError && createError.code === '42883') { // Function doesn't exist
      return await manualDuplicationTransaction(newInvoiceData, originalItems || []);
    }

    if (createError) {
      throw new InvoiceDuplicationError(DuplicationError.DATABASE_ERROR, createError.message);
    }

    return { success: true, invoiceId: newInvoice[0]?.id || newInvoice.id };
    
  } catch (error) {
    console.error('Error duplicating invoice:', error);
    
    if (error instanceof InvoiceDuplicationError) {
      return {
        success: false,
        error: error.message,
        errorType: error.type
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorType: DuplicationError.DATABASE_ERROR
    };
  }
};

// Manual transaction fallback when RPC function is not available
const manualDuplicationTransaction = async (newInvoiceData: any, originalItems: any[]) => {
  try {
    // Create new invoice
    const { data: newInvoice, error: createError } = await schemaClient.finance
      .invoices()
      .insert([newInvoiceData])
      .select()
      .single();

    if (createError) {
      throw new InvoiceDuplicationError(DuplicationError.DATABASE_ERROR, `Failed to create invoice: ${createError.message}`);
    }

    // Copy line items if they exist
    if (originalItems && originalItems.length > 0) {
      const invoiceItems = originalItems.map(item => ({
        invoice_id: newInvoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
        tax_rate: item.tax_rate,
        discount_rate: item.discount_rate
      }));

      const { error: itemsError } = await schemaClient.finance
        .invoice_items()
        .insert(invoiceItems);

      if (itemsError) {
        // Rollback: delete the created invoice
        await schemaClient.finance.invoices().delete().eq('id', newInvoice.id);
        throw new InvoiceDuplicationError(DuplicationError.DATABASE_ERROR, `Failed to create invoice items: ${itemsError.message}`);
      }
    }

    return { success: true, invoiceId: newInvoice.id };
    
  } catch (error) {
    if (error instanceof InvoiceDuplicationError) {
      throw error;
    }
    throw new InvoiceDuplicationError(DuplicationError.DATABASE_ERROR, error instanceof Error ? error.message : 'Transaction failed');
  }
};

// Format helpers
export const formatInvoiceDate = (dateString: string): string => {
  if (!dateString) return "Not set";
  try {
    return format(new Date(dateString), "MMM dd, yyyy");
  } catch (error) {
    return "Invalid date";
  }
};
