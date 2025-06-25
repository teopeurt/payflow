
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { fetchQuoteByReference, fetchQuoteItems, updateQuote, type QuoteItem, type Quote } from "@/services/quotesService";

// Define FormValues interface directly here instead of importing from EditQuote
export interface FormValues {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  projectName: string;
  date: string;
  dueDate: string;
  notes?: string;
  terms?: string;
  tax?: number;
}

export const useEditQuoteData = (quoteId: string) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [lineItems, setLineItems] = useState<QuoteItem[]>([]);
  const { toast } = useToast();

  // Fetch quote data
  useEffect(() => {
    const fetchQuote = async () => {
      if (!quoteId) return;
      
      setLoading(true);
      try {
        // Get quote data
        const quoteData = await fetchQuoteByReference(quoteId);
        
        if (quoteData) {
          // Fetch project data if available
          let projectData = null;
          if (quoteData.project_id) {
            // Get project data from Supabase
            try {
              const { data: project } = await supabase
                .from("projects")
                .select("*")
                .eq("id", quoteData.project_id)
                .single();
                
              projectData = project;
            } catch (err) {
              console.error("Error fetching project:", err);
            }
          }
          
          // Set the quote data - Fixed referenceNumber to reference_number
          setQuote(quoteData);
          
          // Get line items
          const items = await fetchQuoteItems(quoteData.id);
          setLineItems(items);
        }
      } catch (error) {
        console.error("Error fetching quote:", error);
        toast({
          variant: "destructive",
          title: "Error Loading Quote",
          description: "Could not load the quote data."
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuote();
  }, [quoteId, toast]);

  // Update line item in state
  const updateLineItem = (index: number, field: string, value: string | number) => {
    const updatedItems = [...lineItems];
    
    if (field === 'quantity' || field === 'unit_price') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      const fieldName = field === 'unit_price' ? 'unit_price' : 'quantity';
      (updatedItems[index] as any)[fieldName] = isNaN(numValue) ? 0 : numValue;
      // Recalculate amount
      updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].unit_price;
    } else if (field === 'description') {
      // Ensure field is assignable
      updatedItems[index].description = value as string;
    }
    
    setLineItems(updatedItems);
  };

  // Add new line item
  const addLineItem = () => {
    const newItem = {
      id: `new-${Date.now()}`,
      description: "",
      quantity: 1,
      unit_price: 0,
      amount: 0,
      quote_id: quote?.id || ''
    };
    
    setLineItems([...lineItems, newItem]);
  };

  // Remove line item
  const removeLineItem = (index: number) => {
    const updatedItems = lineItems.filter((_, i) => i !== index);
    setLineItems(updatedItems);
  };

  // Save quote changes
  const saveQuote = async (formData: FormValues) => {
    if (!quote) return false;
    
    setSaving(true);
    try {
      // Update quote data
      const quoteData = {
        issue_date: formData.date,
        expiry_date: formData.dueDate,
        notes: typeof formData.notes === 'string' ? formData.notes : '',
        terms: typeof formData.terms === 'string' ? formData.terms : '',
        status: quote.status
      };
      
      // Call update function
      const success = await updateQuote(quote.id, quoteData, lineItems);
      
      if (success) {
        toast({
          title: "Quote updated",
          description: `Quote ${quoteId} has been updated successfully`,
        });
      } else {
        throw new Error("Failed to update quote");
      }
      
      return success;
    } catch (error) {
      console.error("Error updating quote:", error);
      toast({
        variant: "destructive",
        title: "Error Updating Quote",
        description: "Could not update the quote. Please try again."
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    quote,
    lineItems,
    loading,
    saving,
    updateLineItem,
    addLineItem,
    removeLineItem,
    saveQuote
  };
};
