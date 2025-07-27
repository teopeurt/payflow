
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
        </div>
      </CardContent>
    </Card>
  );
};
