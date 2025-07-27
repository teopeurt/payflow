
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateEstimatePDF } from "@/lib/pdfGenerator";
import { PdfGenerateData } from "@/types/pdf";

export const useQuotePDF = (quote: any) => {
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    if (quote) {
      setLoadingPdf(true);
      try {
        const pdfData: PdfGenerateData = {
          id: quote.id,
          clientName: quote.client.name,
          clientAddress: quote.client.address || "",
          date: new Date(quote.date).toLocaleDateString(),
          dueDate: new Date(quote.dueDate).toLocaleDateString(),
          notes: quote.notes,
          terms: quote.terms,
          lineItems: quote.lineItems,
          subtotal: quote.subtotal,
          tax: quote.tax || 0,
          total: quote.amount,
          currency: quote.currency,
          companyName: "Your Company",
          companyAddress: "",
          companyEmail: "",
          companyPhone: ""
        };
        
        const generatedPdf = generateEstimatePDF(pdfData, undefined, 'QUOTE');
        setPdfBlob(generatedPdf);
      } catch (error) {
        console.error("Error generating PDF:", error);
        toast({
          variant: "destructive",
          title: "PDF Generation Failed",
          description: "Could not generate the quote PDF."
        });
      } finally {
        setLoadingPdf(false);
      }
    }
  }, [quote, toast]);

  return { pdfBlob, loadingPdf };
};
