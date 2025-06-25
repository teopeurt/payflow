
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
import { supabase } from "@/integrations/supabase/client";
import { duplicateInvoice } from "@/services/invoicesService";
import { toast } from "@/hooks/use-toast";

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
  
  const handleDuplicate = async () => {
    if (!invoice.id) return;
    
    setIsDuplicating(true);
    try {
      const newInvoiceId = await duplicateInvoice(invoice.id);
      
      if (newInvoiceId) {
        toast({
          title: "Invoice duplicated",
          description: `Invoice ${invoice.invoice_number} has been duplicated successfully.`,
        });
        navigate(`/invoices/${newInvoiceId}/edit`);
      } else {
        throw new Error("Failed to duplicate invoice");
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to duplicate invoice."
      });
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice.id) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
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
              <DropdownMenuItem 
                onClick={handleDuplicate}
                disabled={isDuplicating}
              >
                <Copy className="mr-2 h-4 w-4" />
                <span>{isDuplicating ? "Duplicating..." : "Duplicate"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownloadPDF(invoice)}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Download PDF</span>
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
    </>
  );
};
