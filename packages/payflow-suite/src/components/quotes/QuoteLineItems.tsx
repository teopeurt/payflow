
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface QuoteLineItemsProps {
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  discount: number;
  amount: number;
  currency: string;
}

export const QuoteLineItems = ({
  lineItems,
  subtotal,
  tax,
  discount,
  amount,
  currency
}: QuoteLineItemsProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">Line Items</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice, currency)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.amount, currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-6 flex justify-end">
          <div className="w-72 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{formatCurrency(subtotal, currency)}</span>
            </div>
            {tax > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax:</span>
                <span>{formatCurrency(tax, currency)}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount:</span>
                <span>-{formatCurrency(discount, currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium pt-2 border-t">
              <span>Total:</span>
              <span>{formatCurrency(amount, currency)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
