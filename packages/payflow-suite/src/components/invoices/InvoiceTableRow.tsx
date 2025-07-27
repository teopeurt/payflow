
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Copy } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { InvoiceStatusBadge } from "@/components/shared/InvoiceStatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Invoice } from "@/hooks/useInvoicesData";
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog";
import { getSupabase } from "@payflow/core/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { duplicateInvoice, DuplicationError } from "@/services/invoicesService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InvoiceTableRowProps {
  invoice: Invoice;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  onDownloadPDF: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
}

export const InvoiceTableRow = ({ 
  invoice, 
  formatCurrency, 
  formatDate, 
  onDownloadPDF,
  onDelete
}: InvoiceTableRowProps) => {
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  
  const handleDelete = async () => {
    if (!invoice.id) return;
    
    setIsDeleting(true);
    try {
      const { error } = await getSupabase()
        .from("invoices")
        .delete()
        .eq("id", invoice.id);
      
      if (error) throw error;
      
      toast({
        title: "Invoice deleted",
        description: `Invoice ${invoice.invoice_number} has been deleted.`,
      });
      onDelete(invoice.id);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete invoice."
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };
  
  const getErrorMessage = (errorType?: DuplicationError, defaultMessage?: string) => {
    switch (errorType) {
      case DuplicationError.INVOICE_NOT_FOUND:
        return "The invoice could not be found.";
      case DuplicationError.PERMISSION_DENIED:
        return "You don't have permission to duplicate this invoice.";
      case DuplicationError.INVALID_INVOICE_STATE:
        return "This invoice cannot be duplicated in its current state.";
      case DuplicationError.GENERATION_FAILED:
        return "Failed to generate a new invoice number. Please try again.";
      case DuplicationError.DATABASE_ERROR:
        return "A database error occurred while duplicating the invoice.";
      case DuplicationError.VALIDATION_ERROR:
        return "Invalid invoice data prevented duplication.";
      default:
        return defaultMessage || "Failed to duplicate invoice.";
    }
  };

  const handleDuplicateConfirm = async () => {
    if (!invoice.id) return;
    
    setIsDuplicating(true);
    try {
      const result = await duplicateInvoice(invoice.id);
      
      if (!result.success || !result.invoiceId) {
        throw new Error(result.error || "Failed to duplicate invoice");
      }
      
      toast({
        title: "Invoice duplicated",
        description: `Invoice ${invoice.invoice_number} has been successfully duplicated.`,
      });
      
      setIsDuplicateDialogOpen(false);
      // Navigate to the new invoice
      navigate(`/invoices/${result.invoiceId}`);
    } catch (error) {
      console.error('Duplication error:', error);
      const errorMessage = getErrorMessage(
        (error as any)?.errorType,
        error instanceof Error ? error.message : "Failed to duplicate invoice."
      );
      
      toast({
        variant: "destructive",
        title: "Duplication Failed",
        description: errorMessage
      });
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDuplicateClick = () => {
    setIsDuplicateDialogOpen(true);
  };

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">
          <Link to={`/invoices/${invoice.id}`} className="text-primary hover:underline">
            {invoice.invoice_number}
          </Link>
        </TableCell>
        <TableCell>{invoice.organization?.name || "Unknown"}</TableCell>
        <TableCell>{formatCurrency(invoice.amount)}</TableCell>
        <TableCell>{formatDate(invoice.issue_date)}</TableCell>
        <TableCell>{formatDate(invoice.due_date)}</TableCell>
        <TableCell>
          <InvoiceStatusBadge status={invoice.calculatedStatus as any} />
        </TableCell>
        <TableCell>
          {invoice.purchase_order && (
            <Link to={`/purchase-orders/${invoice.purchase_order}`} className="text-primary hover:underline">
              {invoice.purchase_order}
            </Link>
          )}
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link to={`/invoices/${invoice.id}`} className="w-full">View Details</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link to={`/invoices/${invoice.id}/edit`} className="w-full">Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownloadPDF(invoice)}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Download PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicateClick}>
                <Copy className="mr-2 h-4 w-4" />
                <span>Duplicate</span>
              </DropdownMenuItem>
              {invoice.calculatedStatus !== "paid" && (
                <DropdownMenuItem>
                  <Link to={`/payments/new?invoice=${invoice.id}`} className="w-full">Record Payment</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice ${invoice.invoice_number}? This action cannot be undone.`}
        isDeleting={isDeleting}
      />

      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Invoice</DialogTitle>
            <DialogDescription>
              Create a copy of invoice {invoice.invoice_number}? The duplicated invoice will:
              <br />
              <br />
              • Be created as a draft with a new invoice number
              <br />
              • Copy all line items and client information
              <br />
              • Use organization default payment terms for the due date
              <br />
              • Exclude payment history and status from the original
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDuplicateDialogOpen(false)}
              disabled={isDuplicating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDuplicateConfirm}
              disabled={isDuplicating}
            >
              {isDuplicating ? "Duplicating..." : "Duplicate Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
