
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateEstimatePDF } from "@/lib/pdfGenerator";
import { PdfGenerateData } from "@/types/pdf";

export const useEstimatePDF = (estimate: any) => {
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    if (estimate) {
      setLoadingPdf(true);
      try {
        const pdfData: PdfGenerateData = {
          id: estimate.id,
          clientName: estimate.client.name,
          clientAddress: estimate.client.address || "",
          date: new Date(estimate.date).toLocaleDateString(),
          dueDate: new Date(estimate.dueDate).toLocaleDateString(),
          notes: estimate.notes,
          terms: estimate.terms,
          lineItems: estimate.lineItems,
          subtotal: estimate.subtotal,
          tax: estimate.tax || 0,
          total: estimate.amount,
          currency: estimate.currency,
          companyName: estimate.companyName || "Your Company",
          companyAddress: estimate.companyAddress || "",
          companyEmail: estimate.companyEmail || "",
          companyPhone: estimate.companyPhone || ""
        };
        const generatedPdf = generateEstimatePDF(pdfData, undefined, 'ESTIMATE');
        setPdfBlob(generatedPdf);
      } catch (error) {
        console.error("Error generating PDF:", error);
        toast({
          variant: "destructive",
          title: "PDF Generation Failed",
          description: "Could not generate the estimate PDF."
        });
      } finally {
        setLoadingPdf(false);
      }
    }
  }, [estimate, toast]);

  return { pdfBlob, loadingPdf };
};
