
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash, Send, Copy } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { duplicateInvoice, DuplicationError } from "@/services/invoicesService";
import { toast } from "@/hooks/use-toast";

interface InvoiceHeaderProps {
  id: string;
  invoiceNumber?: string;
  clientName: string;
  projectName: string;
  isDeleteDialogOpen: boolean;
  setIsDeleteDialogOpen: (open: boolean) => void;
  isEmailDialogOpen: boolean;
  setIsEmailDialogOpen: (open: boolean) => void;
  handleDelete: () => void;
  handleSendEmail: () => void;
  clientEmail: string;
}

export const InvoiceHeader = ({
  id,
  invoiceNumber,
  clientName,
  projectName,
  isDeleteDialogOpen,
  setIsDeleteDialogOpen,
  isEmailDialogOpen,
  setIsEmailDialogOpen,
  handleDelete,
  handleSendEmail,
  clientEmail,
}: InvoiceHeaderProps) => {
  const navigate = useNavigate();
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);

  const displayNumber = invoiceNumber || id;

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
    setIsDuplicating(true);
    try {
      const result = await duplicateInvoice(id);
      
      if (!result.success || !result.invoiceId) {
        throw new Error(result.error || "Failed to duplicate invoice");
      }
      
      toast({
        title: "Invoice duplicated",
        description: `Invoice ${displayNumber} has been successfully duplicated.`,
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
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => navigate("/invoices")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader 
          title={`Invoice #${displayNumber}`}
          description={`${clientName} - ${projectName}`}
        />
      </div>
      
      <div className="flex gap-2">
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Trash className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Invoice</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete invoice #{displayNumber}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Button variant="outline" size="icon" onClick={() => navigate(`/invoices/${id}/edit`)}>
          <Edit className="h-4 w-4" />
        </Button>
        
        <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleDuplicateClick}
              title="Duplicate Invoice"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Duplicate Invoice</DialogTitle>
              <DialogDescription>
                Create a copy of invoice #{displayNumber}? The duplicated invoice will:
                <br />
                <br />
                • Be created as a draft with a new invoice number
                • Copy all line items and client information
                • Use organization default payment terms for the due date
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
        
        <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Invoice</DialogTitle>
              <DialogDescription>
                Send invoice #{displayNumber} to the client via email.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="mb-2">Recipient: {clientEmail}</p>
              <p>The invoice will be attached as a PDF to the email.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSendEmail}>Send Email</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
