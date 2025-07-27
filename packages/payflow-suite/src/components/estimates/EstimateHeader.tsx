
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { Edit, Trash2, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { EstimateActions } from "./EstimateActions";

interface EstimateHeaderProps {
  id: string;
  date: string;
  status: string;
}

export const EstimateHeader = ({ id, date, status }: EstimateHeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleConvertToQuote = () => {
    toast({
      title: "Converting to quote",
      description: `Redirecting to create a quote based on estimate ${id}`
    });
    navigate(`/quotes/new?from=${id}`);
  };
  
  const handleConvertToInvoice = () => {
    toast({
      title: "Converting to invoice",
      description: `Redirecting to create an invoice based on estimate ${id}`
    });
    navigate(`/invoices/new?from=${id}`);
  };
  
  const handleEditEstimate = () => {
    navigate(`/estimates/${id}/edit`);
  };
  
  const handleDeleteEstimate = () => {
    toast({
      title: "Estimate deleted",
      description: "The estimate has been deleted"
    });
    navigate("/estimates");
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <PageHeader
        title={`Estimate: ${id}`}
        description={`Created on ${new Date(date).toLocaleDateString()}`}
        className="mb-0"
      />
      <div className="flex flex-wrap gap-2">
        {status === "pending" && (
          <>
            <Button variant="outline" size="sm" onClick={handleConvertToQuote} className="flex items-center gap-1">
              Convert to Quote
              <ArrowRight size={16} />
            </Button>
            <Button size="sm" onClick={handleConvertToInvoice} className="flex items-center gap-1">
              Convert to Invoice
              <ArrowRight size={16} />
            </Button>
          </>
        )}
        <Button variant="outline" size="sm" onClick={handleEditEstimate} className="flex items-center gap-1">
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
            <p className="py-4">Are you sure you want to delete this estimate? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteEstimate}>Delete Estimate</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
