
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, ArrowRight, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface QuoteSidebarProps {
  id: string;
  status: string;
  onPreview?: () => void;
  onDownload?: () => void;
}

export const QuoteSidebar = ({ 
  id, 
  status, 
  onPreview, 
  onDownload 
}: QuoteSidebarProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleEditQuote = () => {
    navigate(`/quotes/${id}/edit`);
  };

  const handleConvertToPurchaseOrder = () => {
    toast({
      title: "Converting to purchase order",
      description: `Redirecting to create a purchase order based on quote ${id}`
    });
    navigate(`/purchase-orders/new?from=${id}`);
  };

  const handleDownloadPDF = () => {
    if (onDownload) {
      onDownload();
    } else {
      toast({
        title: "Download started",
        description: "Your quote PDF is being downloaded"
      });
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-3">Actions</h3>
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            onClick={handleEditQuote}
          >
            <Edit className="mr-2" size={16} />
            Edit Quote
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            onClick={handleDownloadPDF}
          >
            <FileText className="mr-2" size={16} />
            Download PDF
          </Button>
          {status === "approved" && (
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={handleConvertToPurchaseOrder}
            >
              <ArrowRight className="mr-2" size={16} />
              Create Purchase Order
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
