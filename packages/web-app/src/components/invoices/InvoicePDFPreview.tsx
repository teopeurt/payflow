
import { useState, useEffect } from 'react';
import { PDFPreview } from '@/components/shared/PDFPreview';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye } from 'lucide-react';
import { Spinner } from '@/components/shared/Spinner';
import { PdfGenerateData, LineItem } from '@/types/pdf';
import { generateEstimatePDF } from '@/lib/pdfGenerator';

interface InvoicePDFPreviewProps {
  invoiceData: {
    id: string;
    client: {
      name: string;
      address: string;
      currency: string;
    };
    organization?: {
      name: string;
      email?: string;
      phone?: string;
      address?: string;
      logo_url?: string;
    };
    issueDate: string;
    dueDate: string;
    notes: string;
    terms: string;
    items: {
      id: string;
      description: string;
      quantity: number;
      rate: number;
      amount: number;
    }[];
    subtotal: number;
    tax: number;
    amount: number;
    logo_url?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InvoicePDFPreview = ({ invoiceData, open, onOpenChange }: InvoicePDFPreviewProps) => {
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      setLoading(true);
      
      // Transform invoice data to PDF generation format
      const lineItems: LineItem[] = invoiceData.items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.rate,
        amount: item.amount
      }));

      const pdfData: PdfGenerateData = {
        id: invoiceData.id,
        clientName: invoiceData.client.name,
        clientAddress: invoiceData.client.address || "",
        date: invoiceData.issueDate,
        dueDate: invoiceData.dueDate,
        notes: invoiceData.notes || "",
        terms: invoiceData.terms || "",
        lineItems,
        subtotal: invoiceData.subtotal,
        tax: invoiceData.tax,
        total: invoiceData.amount,
        currency: invoiceData.client.currency,
        logo_url: invoiceData.organization?.logo_url || invoiceData.logo_url,
        companyName: invoiceData.organization?.name || "Your Company",
        companyAddress: invoiceData.organization?.address || "",
        companyEmail: invoiceData.organization?.email || "",
        companyPhone: invoiceData.organization?.phone || ""
      };
      
      // Generate PDF
      try {
        const blob = generateEstimatePDF(pdfData);
        setPdfBlob(blob);
      } catch (error) {
        console.error("Error generating PDF:", error);
      } finally {
        setLoading(false);
      }
    } else {
      setPdfBlob(null);
    }
  }, [open, invoiceData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice PDF Preview - {invoiceData.id}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center items-center p-10">
            <Spinner />
          </div>
        ) : (
          <PDFPreview pdfBlob={pdfBlob} estimateId={invoiceData.id} />
        )}
      </DialogContent>
    </Dialog>
  );
};
