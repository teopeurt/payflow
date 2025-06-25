import { useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { InvoiceHeader } from "@/components/invoices/InvoiceHeader";
import { ClientDetails } from "@/components/invoices/InvoiceDetails/ClientDetails";
import { InvoiceInfo } from "@/components/invoices/InvoiceDetails/InvoiceInfo";
import { InvoiceSummary } from "@/components/invoices/InvoiceDetails/InvoiceSummary";
import { RecurringInfo } from "@/components/invoices/InvoiceDetails/RecurringInfo";
import { LineItems } from "@/components/invoices/InvoiceDetails/LineItems";
import { NotesAndTerms } from "@/components/invoices/InvoiceDetails/NotesAndTerms";
import { PaymentHistory } from "@/components/invoices/PaymentHistory";
import { RecordPaymentDialog } from "@/components/invoices/RecordPaymentDialog";
import { InvoiceSidebar } from "@/components/invoices/InvoiceDetails/InvoiceSidebar";
import { InvoiceNotFound } from "@/components/invoices/InvoiceNotFound";
import { InvoiceLoading } from "@/components/invoices/InvoiceLoading";
import { useInvoiceData } from "@/hooks/useInvoiceData";
import { useInvoiceOperations } from "@/components/invoices/InvoiceOperations";
import { toast } from "@/components/ui/use-toast";
import { InvoicePDFViewer } from "@/components/invoices/InvoicePDFViewer";

const InvoiceDetails = () => {
  const { id } = useParams();
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { 
    invoice, 
    isLoadingInvoice, 
    displayStatus, 
    remainingBalance, 
    formatDate, 
    pdfBlob, 
    loadingPdf 
  } = useInvoiceData(id);
  
  const {
    isPaymentDialogOpen,
    setIsPaymentDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isEmailDialogOpen,
    setIsEmailDialogOpen,
    handleDelete,
    handleMarkAsPaid,
    handleSendEmail
  } = useInvoiceOperations({
    invoice,
    remainingBalance,
    onInvoiceUpdated: () => setRefreshKey(prev => prev + 1)
  });

  // Track download attempts for debugging
  const downloadAttemptRef = useRef(0);

  // Create a stable download handler that won't cause re-renders
  const handleDownloadPDF = useCallback(() => {
    // Increment and log download attempt count
    downloadAttemptRef.current += 1;
    console.log(`Download attempt #${downloadAttemptRef.current}`, { 
      hasPdfBlob: !!pdfBlob, 
      isLoading: loadingPdf,
      invoiceId: invoice?.id
    });
    
    if (!pdfBlob) {
      console.log('Download aborted: PDF blob not available');
      toast({
        title: "PDF not ready",
        description: "Please wait for the PDF to be generated.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Creating object URL for PDF download');
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice?.id || 'download'}.pdf`;
      console.log('Adding download element to DOM');
      document.body.appendChild(a);
      console.log('Triggering download click');
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('Download process completed successfully');
      
      toast({
        title: "PDF Downloaded",
        description: "Invoice has been downloaded successfully."
      });
    } catch (error) {
      console.error('Error during PDF download:', error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading the PDF.",
        variant: "destructive"
      });
    }
  }, [pdfBlob, invoice?.id, loadingPdf]);

  if (isLoadingInvoice) {
    return <InvoiceLoading />;
  }
  
  if (!invoice) {
    return <InvoiceNotFound />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <InvoiceHeader 
        id={invoice.id}
        invoiceNumber={invoice.invoiceNumber}
        clientName={invoice.client.name}
        projectName={invoice.project?.name || ""}
        isDeleteDialogOpen={isDeleteDialogOpen}
        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
        isEmailDialogOpen={isEmailDialogOpen}
        setIsEmailDialogOpen={setIsEmailDialogOpen}
        handleDelete={handleDelete}
        handleSendEmail={handleSendEmail}
        clientEmail={invoice.client.email}
      />
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="col-span-1 xl:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ClientDetails 
                  clientName={invoice.client.name} 
                  clientAddress={invoice.client.address || ""}
                  clientEmail={invoice.client.email}
                  clientPhone={invoice.client.phone || ""}
                />
                
                <InvoiceInfo 
                  status={displayStatus}
                  id={invoice.id}
                  invoiceNumber={invoice.invoiceNumber || invoice.id}
                  purchaseOrder={invoice.purchaseOrder}
                  issueDate={invoice.issueDate}
                  dueDate={invoice.dueDate}
                  formatDate={formatDate}
                />
                
                <InvoiceSummary 
                  subtotal={invoice.subtotal}
                  tax={invoice.tax}
                  discount={invoice.discount || 0}
                  total={invoice.amount}
                  amountPaid={invoice.payments.reduce((sum, payment) => sum + payment.amount, 0)}
                  remainingBalance={remainingBalance}
                  currency={invoice.client.currency}
                />
              </div>
              
              {invoice.isRecurring && (
                <RecurringInfo 
                  recurringFrequency={invoice.recurringFrequency || ""}
                  recurringStartDate={invoice.recurringStartDate || ""}
                  recurringUntil={invoice.recurringUntil || "indefinitely"}
                  recurringEndDate={invoice.recurringEndDate}
                  recurringCount={invoice.recurringCount}
                  formatDate={formatDate}
                />
              )}
              
              <Separator className="my-6" />
              
              <LineItems 
                items={invoice.items}
                subtotal={invoice.subtotal}
                tax={invoice.tax}
                discount={invoice.discount || 0}
                total={invoice.amount}
              />
              
              <NotesAndTerms 
                notes={invoice.notes || ""} 
                terms={invoice.terms || ""} 
              />
            </CardContent>
          </Card>
          
          <PaymentHistory 
            payments={invoice.payments}
            formatDate={formatDate}
            currency={invoice.client.currency}
          />
        </div>
        
        <div className="col-span-1">
          <div className="space-y-6">
            <InvoicePDFViewer
              pdfBlob={pdfBlob}
              loading={loadingPdf}
              invoiceId={invoice.id}
              onDownload={handleDownloadPDF}
            />
            
            <InvoiceSidebar 
              invoiceId={invoice.id}
              isPaid={remainingBalance <= 0}
              onRecordPayment={() => setIsPaymentDialogOpen(true)}
            />
          </div>
        </div>
      </div>
      
      <RecordPaymentDialog 
        isOpen={isPaymentDialogOpen}
        setIsOpen={setIsPaymentDialogOpen}
        invoiceId={invoice.id}
        invoiceAmount={invoice.amount}
        remainingBalance={remainingBalance}
        onRecordPayment={handleMarkAsPaid}
      />
    </div>
  );
};

export default InvoiceDetails;
