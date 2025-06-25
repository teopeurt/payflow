
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash, Send } from "lucide-react";
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

interface InvoiceHeaderProps {
  id: string;
  invoiceNumber?: string; // Added invoiceNumber prop
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
  invoiceNumber, // Added to props
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

  const displayNumber = invoiceNumber || id;

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
