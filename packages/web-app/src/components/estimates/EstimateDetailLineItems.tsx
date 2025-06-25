
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface EstimateDetailLineItemsProps {
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  discount: number;
  amount: number;
  currency: string;
}

export const EstimateDetailLineItems = ({
  lineItems,
  subtotal,
  tax,
  discount,
  amount,
  currency
}: EstimateDetailLineItemsProps) => {
  const formatCurrency = (amount: number) => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  return (
    <div>
      <h3 className="font-medium mb-4">Line Items</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Rate</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lineItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.description}</TableCell>
              <TableCell className="text-right">{item.quantity}</TableCell>
              <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
              <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={3} className="text-right font-medium">
              Subtotal
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(subtotal)}
            </TableCell>
          </TableRow>
          {tax > 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-right font-medium">
                Tax
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(tax)}
              </TableCell>
            </TableRow>
          )}
          {discount > 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-right font-medium">
                Discount
              </TableCell>
              <TableCell className="text-right">
                -{formatCurrency(discount)}
              </TableCell>
            </TableRow>
          )}
          <TableRow>
            <TableCell colSpan={3} className="text-right font-semibold">
              Total
            </TableCell>
            <TableCell className="text-right font-semibold">
              {formatCurrency(amount)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
