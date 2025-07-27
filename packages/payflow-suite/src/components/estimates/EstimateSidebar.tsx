
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EstimateActions } from "./EstimateActions";
import { useToast } from "@/hooks/use-toast";

interface EstimateSidebarProps {
  id: string;
  status: string;
  onPreview?: () => void;
}

export const EstimateSidebar = ({ id, status, onPreview }: EstimateSidebarProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleEditEstimate = () => {
    navigate(`/estimates/${id}/edit`);
  };

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

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-3">Actions</h3>
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            onClick={handleEditEstimate}
          >
            <Edit className="mr-2" size={16} />
            Edit Estimate
          </Button>
          {status === "pending" && (
            <>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={handleConvertToQuote}
              >
                <ArrowRight className="mr-2" size={16} />
                Convert to Quote
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={handleConvertToInvoice}
              >
                <ArrowRight className="mr-2" size={16} />
                Convert to Invoice
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
