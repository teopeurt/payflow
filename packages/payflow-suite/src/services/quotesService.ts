import { schemaClient } from "@/lib/database";
import { format } from "date-fns";

export interface Quote {
  id: string;
  reference_number: string;
  organization?: {
    name: string;
    default_currency?: string;
  };
  amount: number;
  issue_date: string;
  expiry_date: string;
  status: string;
  notes?: string;
  terms?: string;
  estimate_id?: string;
  organization_id: string;
  project_id?: string;
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  quote_id: string;
}

// Fetch quotes from the database
export const fetchQuotes = async (): Promise<Quote[]> => {
  try {
    const { data, error } = await schemaClient.finance
      .estimates()
      .select(`
        *,
        organization:app.organizations(name, default_currency)
      `)
      .order("issue_date", { ascending: false });
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return [];
  }
};

// Fetch a single quote
export const fetchQuoteByReference = async (referenceNumber: string): Promise<Quote | null> => {
  try {
    console.log("Fetching quote with reference number:", referenceNumber);
    const { data, error } = await schemaClient.finance
      .estimates()
      .select(`
        *,
        organization:app.organizations(*)
      `)
      .eq("reference_number", referenceNumber)
      .single();
      
    if (error) {
      console.error("Error fetching quote by reference:", error);
      return null;
    }
    
    if (!data) {
      console.error("No quote found with reference number:", referenceNumber);
      return null;
    }
    
    console.log("Quote found:", data);
    
    return {
      id: data.id,
      reference_number: data.reference_number,
      organization: {
        name: data.organization?.name || "Unknown",
        default_currency: data.organization?.default_currency || "USD"
      },
      amount: Number(data.amount),
      issue_date: data.issue_date,
      expiry_date: data.expiry_date,
      status: data.status,
      notes: data.notes || "",
      terms: data.terms || "",
      estimate_id: data.estimate_id,
      organization_id: data.organization_id,
      project_id: data.project_id
    };
  } catch (error) {
    console.error("Error fetching quote:", error);
    return null;
  }
};

// Fetch quote items
export const fetchQuoteItems = async (quoteId: string): Promise<QuoteItem[]> => {
  try {
    console.log("Fetching items for quote ID:", quoteId);
    const { data, error } = await schemaClient.finance
      .estimate_items()
      .select("*")
      .eq("estimate_id", quoteId);
      
    if (error) {
      console.error("Error fetching quote items:", error);
      throw error;
    }
    
    console.log("Quote items found:", data?.length || 0);
    
    return (data || []).map((item: { id: string; description: string; quantity: number; unit_price: number; amount: number; quote_id: string }) => ({
      id: item.id,
      description: item.description,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      amount: Number(item.amount),
      quote_id: item.quote_id
    }));
  } catch (error) {
    console.error("Error fetching quote items:", error);
    return [];
  }
};

// Update a quote
export const updateQuote = async (
  id: string,
  quoteData: Partial<Quote>,
  quoteItems: QuoteItem[]
): Promise<boolean> => {
  try {
    // Calculate totals
    const subtotal = quoteItems.reduce((sum, item) => sum + item.amount, 0);
    
    // Update quote in database
    const { error } = await schemaClient.finance
      .estimates()
      .update({
        issue_date: quoteData.issue_date,
        expiry_date: quoteData.expiry_date,
        amount: subtotal,
        notes: quoteData.notes,
        terms: quoteData.terms,
        status: quoteData.status
      })
      .eq("id", id);
    
    if (error) throw error;
    
    // Handle quote items
    // First, get existing items
    const { data: existingItems } = await schemaClient.finance
      .estimate_items()
      .select("*")
      .eq("estimate_id", id);
    
    // Update or create items
    for (const item of quoteItems) {
      const isExisting = existingItems?.some(existing => existing.id === item.id);
      
      if (isExisting) {
        // Update existing item
        await schemaClient.finance
          .estimate_items()
          .update({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.amount
          })
          .eq("id", item.id);
      } else {
        // Create new item
        await schemaClient.finance
          .estimate_items()
          .insert({
            estimate_id: id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.amount
          });
      }
    }
    
    // Delete items that are no longer present
    const currentItemIds = quoteItems.map(item => item.id);
    const itemsToDelete = existingItems?.filter(item => !currentItemIds.includes(item.id));
    
    if (itemsToDelete && itemsToDelete.length > 0) {
      for (const item of itemsToDelete) {
        await schemaClient.finance
          .estimate_items()
          .delete()
          .eq("id", item.id);
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error updating quote:", error);
    return false;
  }
};

// Format helpers
export const formatQuoteDate = (dateString: string): string => {
  if (!dateString) return "Not set";
  try {
    return format(new Date(dateString), "MMM dd, yyyy");
  } catch (error) {
    return "Invalid date";
  }
};

// Convert quote to invoice
export const convertQuoteToInvoice = async (quoteId: string): Promise<{ success: boolean; invoiceId?: string; error?: string }> => {
  try {
    // Start a transaction
    const { data: quote, error: quoteError } = await schemaClient.finance
      .estimates()
      .select('*')
      .eq('id', quoteId)
      .single();

    if (quoteError) throw quoteError;
    if (!quote) throw new Error('Quote not found');

    // Generate invoice number
    const invoiceDate = new Date();
    const invoiceNumber = `INV-${invoiceDate.getFullYear()}${String(invoiceDate.getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // Create invoice
    const { data: invoice, error: invoiceError } = await schemaClient.finance
      .invoices()
      .insert([
        {
          organization_id: quote.organization_id,
          project_id: quote.project_id,
          amount: quote.amount,
          status: 'Draft',
          invoice_number: invoiceNumber,
          issue_date: invoiceDate.toISOString(),
          due_date: new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          notes: quote.notes,
          terms: quote.terms
        }
      ])
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Copy line items
    const { data: quoteItems } = await schemaClient.finance
      .estimate_items()
      .select('*')
      .eq('estimate_id', quoteId);

    if (quoteItems && quoteItems.length > 0) {
      const invoiceItems = quoteItems.map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount
      }));

      const { error: itemsError } = await schemaClient.finance
        .invoice_items()
        .insert(invoiceItems);

      if (itemsError) throw itemsError;
    }

    // Update quote status
    const { error: updateError } = await schemaClient.finance
      .estimates()
      .update({ status: 'Converted' })
      .eq('id', quoteId);

    if (updateError) throw updateError;

    return { success: true, invoiceId: invoice.id };
  } catch (error) {
    console.error('Error converting quote to invoice:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Create a new quote
export const createQuote = async (
  quoteData: {
    reference_number: string;
    organization_id: string;
    project_id?: string;
    amount: number;
    issue_date: string;
    expiry_date: string;
    status: string;
    notes?: string;
    terms?: string;
    estimate_id?: string;
  },
  lineItems: Omit<QuoteItem, 'id' | 'quote_id'>[]
): Promise<string | null> => {
  try {
    // Insert quote
    const { data: quote, error: quoteError } = await schemaClient.finance
      .estimates()
      .insert(quoteData)
      .select('id')
      .single();

    if (quoteError) throw quoteError;
    
    if (!quote) throw new Error('Failed to create quote');
    
    // Insert line items
    if (lineItems.length > 0) {
      const itemsToInsert = lineItems.map(item => ({
        estimate_id: quote.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount
      }));
      
      const { error: itemsError } = await schemaClient.finance
        .estimate_items()
        .insert(itemsToInsert);
        
      if (itemsError) throw itemsError;
    }
    
    return quoteData.reference_number;
  } catch (error) {
    console.error("Error creating quote:", error);
    return null;
  }
};
