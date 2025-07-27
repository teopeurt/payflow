
import { Card, CardContent } from "@/components/ui/card";

interface InvoiceSummaryProps {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  remainingBalance: number;
  currency?: string; // Add optional currency prop
}

export const InvoiceSummary = ({ 
  subtotal, 
  tax, 
  discount, 
  total, 
  amountPaid, 
  remainingBalance,
  currency = "USD" // Default to USD
}: InvoiceSummaryProps) => {
  const formatCurrency = (amount: number) => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Invoice Summary</h3>
      <Card className="bg-muted/40">
        <CardContent className="p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          
          {discount > 0 && (
            <div className="flex justify-between">
              <span>Discount</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          
          <hr />
          
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Amount Paid</span>
            <span>{formatCurrency(amountPaid)}</span>
          </div>
          
          <hr />
          
          <div className="flex justify-between font-bold">
            <span>Balance Due</span>
            <span>{formatCurrency(remainingBalance)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
