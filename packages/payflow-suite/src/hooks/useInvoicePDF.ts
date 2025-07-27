import { useState, useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { generateEstimatePDF, DocumentType } from "@/lib/pdfGenerator";
import { PdfGenerateData } from "@/types/pdf";
import { InvoiceData } from "@/types/invoice";
import { PdfThemeName } from "@/lib/pdf/themes";
import { useAuth } from "@payflow/core/auth";
import { getSupabase } from "@payflow/core/integrations/supabase/client";

interface OrganizationWithTheme {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  pdf_theme?: PdfThemeName;
  default_currency?: string;
  company_name?: string;
  company_address?: string;
  company_email?: string;
  company_phone?: string;
}

export const useInvoicePDF = (invoice: InvoiceData | null, documentType: DocumentType = 'INVOICE') => {
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const { profile } = useAuth();
  
  const pdfGeneratedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (invoice !== null && !pdfGeneratedRef.current) {
      console.log(`Starting PDF generation for ${documentType.toLowerCase()}`, invoice.id);
      
      if (mountedRef.current) {
        setLoadingPdf(true);
      }
      
      const fetchUserOrganization = async () => {
        try {
          const lineItems = invoice.items.map(item => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.rate,
            amount: item.amount
          }));
          
          let userOrganization: OrganizationWithTheme | null = null;
          
          if (profile?.organization_id) {
            const { data: orgData, error: orgError } = await getSupabase()
              .from('organizations')
              .select('*')
              .eq('id', profile.organization_id)
              .single();
              
            if (!orgError && orgData) {
              userOrganization = orgData as OrganizationWithTheme;
            }
          }
          
          const clientOrganization = invoice.organization as OrganizationWithTheme | undefined;
          const theme = clientOrganization?.pdf_theme;
          
          const pdfData: PdfGenerateData = {
            id: invoice.invoiceNumber,
            clientName: invoice.client.name,
            clientAddress: invoice.client.address || "",
            date: invoice.issueDate,
            dueDate: invoice.dueDate,
            notes: invoice.notes || "",
            terms: invoice.terms || "",
            lineItems,
            subtotal: invoice.subtotal,
            tax: invoice.tax,
            total: invoice.amount,
            currency: invoice.client.currency,
            logo_url: userOrganization?.logo_url || invoice.organization?.logo_url,
            companyName: userOrganization?.name || invoice.organization?.name || "Your Company",
            companyAddress: userOrganization?.company_address || invoice.organization?.address || "",
            companyEmail: userOrganization?.company_email || invoice.organization?.email || "",
            companyPhone: userOrganization?.company_phone || invoice.organization?.phone || "",
            theme
          };
          
          const generatedPdf = generateEstimatePDF(pdfData, pdfData.theme, documentType);
          
          if (mountedRef.current) {
            pdfGeneratedRef.current = true;
            setPdfBlob(generatedPdf);
            console.log('PDF generated successfully');
            setLoadingPdf(false);
          }
        } catch (error) {
          console.error("Error generating PDF:", error);
          
          if (mountedRef.current) {
            toast({
              variant: "destructive",
              title: "PDF Generation Failed",
              description: "Could not generate the invoice PDF."
            });
            setLoadingPdf(false);
          }
        }
      };
      
      fetchUserOrganization();
    }
  }, [invoice, profile, documentType]);

  return { pdfBlob, loadingPdf };
};

interface InvoiceDownloadData {
  id: string;
  invoice_number?: string;
  organization?: OrganizationWithTheme;
  client?: {
    name: string;
    address?: string;
    currency?: string;
  };
  invoice_items?: Array<{
    id: string;
    description: string;
    quantity: number | string;
    unit_price: number | string;
    amount: number | string;
  }>;
  issue_date: string;
  due_date: string;
  notes?: string;
  terms?: string;
  tax?: number | string;
  amount?: number | string;
  logo_url?: string;
}

export const useInvoiceDownloadPDF = () => {
  const handleDownloadPDF = async (invoice: InvoiceDownloadData, documentType: DocumentType = 'INVOICE') => {
    try {
      const clientData = {
        name: invoice.client?.name || invoice.organization?.name || "Unknown Client",
        address: invoice.client?.address || invoice.organization?.company_address || "No address provided",
        currency: invoice.client?.currency || invoice.organization?.default_currency || "USD"
      };
      
      const lineItems = invoice.invoice_items?.map(item => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        amount: Number(item.amount)
      })) || [];
      
      const subtotal = lineItems.reduce((sum: number, item) => sum + item.amount, 0);
      
      const pdfData = {
        id: invoice.invoice_number || invoice.id,
        clientName: clientData.name,
        clientAddress: clientData.address,
        date: invoice.issue_date,
        dueDate: invoice.due_date,
        notes: invoice.notes || "",
        terms: invoice.terms || "",
        lineItems,
        subtotal: subtotal,
        tax: Number(invoice.tax || 0),
        total: Number(invoice.amount || 0),
        currency: clientData.currency,
        logo_url: invoice.logo_url,
        companyName: invoice.organization?.company_name || invoice.organization?.name || "Your Company",
        companyAddress: invoice.organization?.company_address || "",
        companyEmail: invoice.organization?.company_email || "",
        companyPhone: invoice.organization?.company_phone || ""
      };
      
      const pdfBlob = generateEstimatePDF(pdfData, undefined, documentType);
      
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentType.toLowerCase()}-${invoice.invoice_number || invoice.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "PDF Downloaded",
        description: `${documentType} ${invoice.invoice_number || invoice.id} has been downloaded.`,
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading the PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return { handleDownloadPDF };
};
