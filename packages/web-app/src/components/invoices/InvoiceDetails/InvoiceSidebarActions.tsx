
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { duplicateInvoice } from "@/services/invoicesService";
import { toast } from "@/hooks/use-toast";

interface InvoiceSidebarActionsProps {
  invoiceId: string;
  isPaid: boolean;
  onRecordPayment: () => void;
}

export const InvoiceSidebarActions = ({ 
  invoiceId, 
  isPaid, 
  onRecordPayment
}: InvoiceSidebarActionsProps) => {
  const navigate = useNavigate();
  const [isDuplicating, setIsDuplicating] = useState(false);

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const newInvoiceId = await duplicateInvoice(invoiceId);
      
      if (newInvoiceId) {
        toast({
          title: "Invoice duplicated",
          description: "Invoice has been duplicated successfully.",
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
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <h3 className="text-lg font-medium mb-2">Actions</h3>
        
        <div className="space-y-3">
          {!isPaid && (
            <Button 
              variant="default" 
              className="w-full" 
              onClick={onRecordPayment}
            >
              Record Payment
            </Button>
          )}
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => window.print()}
          >
            Print Invoice
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleDuplicate}
            disabled={isDuplicating}
          >
            <Copy className="mr-2 h-4 w-4" />
            {isDuplicating ? "Duplicating..." : "Duplicate Invoice"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
