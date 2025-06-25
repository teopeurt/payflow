
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceData } from "@/types/invoice";
import { transformInvoiceData, calculateInvoiceStatus, formatInvoiceDate } from "@/utils/invoiceUtils";
import { useInvoicePDF } from "@/hooks/useInvoicePDF";

export type { InvoiceData, InvoiceStatus, RecurringType, Payment, InvoiceItem } from "@/types/invoice";

export const useInvoiceData = (invoiceId: string | undefined) => {
  const { data: invoiceRaw, isLoading: isLoadingInvoice } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          organization:organizations(*, default_currency),
          project:projects(*),
          invoice_items(*),
          payments(*)
        `)
        .eq("id", invoiceId)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!invoiceId,
  });

  const invoice = invoiceRaw ? transformInvoiceData(invoiceRaw) : null;
  
  const displayStatus = invoice ? calculateInvoiceStatus(invoice) : "draft";
  
  const remainingBalance = invoice 
    ? invoice.amount - invoice.payments.reduce((sum, payment) => sum + payment.amount, 0)
    : 0;
  
  const { pdfBlob, loadingPdf } = useInvoicePDF(invoice);

  return { 
    invoice, 
    isLoadingInvoice, 
    displayStatus, 
    remainingBalance, 
    formatDate: formatInvoiceDate,
    pdfBlob, 
    loadingPdf 
  };
};
