import { supabase } from "@/integrations/supabase/client";
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

// Fetch invoices from the database
export const fetchInvoices = async (): Promise<Invoice[]> => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        organization:organizations(name, default_currency),
        quote:quotes(reference_number)
      `)
      .order('issue_date', { ascending: false });
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return [];
  }
};

// Fetch a single invoice
export const fetchInvoiceById = async (id: string): Promise<Invoice | null> => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        organization:organizations(*),
        quote:quotes(reference_number)
      `)
      .eq('id', id)
      .single();
      
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
    const { data, error } = await supabase
      .from('invoice_items')
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
    const { error } = await supabase
      .from('invoices')
      .update({
        ...invoiceData,
        amount: subtotal,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
      
    if (error) throw error;
    
    // Get existing items
    const { data: existingItems } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id);
    
    // Update or create items
    for (const item of invoiceItems) {
      if (item.id) {
        // Update existing item
        await supabase
          .from('invoice_items')
          .update({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.amount
          })
          .eq('id', item.id);
      } else {
        // Create new item
        await supabase
          .from('invoice_items')
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
        await supabase
          .from('invoice_items')
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

// Duplicate an invoice
export const duplicateInvoice = async (originalInvoiceId: string): Promise<string | null> => {
  try {
    // Fetch the original invoice with its items
    const { data: originalInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items(*)
      `)
      .eq('id', originalInvoiceId)
      .single();
      
    if (fetchError) throw fetchError;
    
    // Generate new invoice number
    const newInvoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;
    
    // Create new invoice (excluding id, created_at, updated_at)
    const { data: newInvoice, error: createError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: newInvoiceNumber,
        organization_id: originalInvoice.organization_id,
        project_id: originalInvoice.project_id,
        quote_id: originalInvoice.quote_id,
        amount: originalInvoice.amount,
        issue_date: new Date().toISOString().split('T')[0], // Today's date
        due_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0], // 30 days from now
        status: 'draft', // Always start as draft
        purchase_order: originalInvoice.purchase_order,
        notes: originalInvoice.notes,
        terms: originalInvoice.terms,
      })
      .select()
      .single();
      
    if (createError) throw createError;
    
    // Duplicate invoice items
    if (originalInvoice.invoice_items && originalInvoice.invoice_items.length > 0) {
      const newItems = originalInvoice.invoice_items.map((item: InvoiceItem) => ({
        invoice_id: newInvoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
      }));
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(newItems);
        
      if (itemsError) throw itemsError;
    }
    
    return newInvoice.id;
  } catch (error) {
    console.error("Error duplicating invoice:", error);
    return null;
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
