
import { InvoiceStatusBadge } from "@/components/shared/InvoiceStatusBadge";

interface InvoiceInfoProps {
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled" | "partially-paid";
  id: string;
  invoiceNumber: string; // Added invoiceNumber field
  purchaseOrder?: string;
  issueDate: string;
  dueDate: string;
  formatDate: (date: string) => string;
}

export const InvoiceInfo = ({ 
  status, 
  id, 
  invoiceNumber, // Added to props
  purchaseOrder, 
  issueDate, 
  dueDate,
  formatDate 
}: InvoiceInfoProps) => {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-medium text-muted-foreground">Invoice Details</h3>
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">Status:</span>
        <InvoiceStatusBadge status={status} />
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">Invoice Number:</span>
        <span>{invoiceNumber}</span>
      </div>
      {purchaseOrder && (
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">PO Number:</span>
          <span>{purchaseOrder}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">Issue Date:</span>
        <span>{formatDate(issueDate)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">Due Date:</span>
        <span>{formatDate(dueDate)}</span>
      </div>
    </div>
  );
};
