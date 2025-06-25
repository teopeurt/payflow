
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { Edit, Trash2, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface QuoteHeaderProps {
  id: string;
  date: string;
  status: string;
}

export const QuoteHeader = ({ id, date, status }: QuoteHeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleConvertToPurchaseOrder = () => {
    toast({
      title: "Converting to purchase order",
      description: `Redirecting to create a purchase order based on quote ${id}`
    });
    navigate(`/purchase-orders/new?from=${id}`);
  };
  
  const handleEditQuote = () => {
    navigate(`/quotes/${id}/edit`);
  };
  
  const handleDeleteQuote = () => {
    toast({
      title: "Quote deleted",
      description: "The quote has been deleted"
    });
    navigate("/quotes");
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <PageHeader
        title={`Quote: ${id}`}
        description={`Created on ${new Date(date).toLocaleDateString()}`}
        className="mb-0"
      />
      <div className="flex flex-wrap gap-2">
        {status === "approved" && (
          <Button size="sm" onClick={handleConvertToPurchaseOrder} className="flex items-center gap-1">
            Create Purchase Order
            <ArrowRight size={16} />
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handleEditQuote} className="flex items-center gap-1">
          <Edit size={16} />
          Edit
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-1 text-destructive border-destructive hover:bg-destructive/10">
              <Trash2 size={16} />
              Delete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <p className="py-4">Are you sure you want to delete this quote? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteQuote}>Delete Quote</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
