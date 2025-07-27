import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { EstimateFormValues } from './EstimateFormSchema';
import { FormLabel } from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  billable: boolean;
  unit_type: 'hours' | 'days' | 'months' | 'fixed';
}

interface EstimateLineItemsProps {
  form: UseFormReturn<EstimateFormValues>;
}

export const EstimateLineItems = ({ form }: EstimateLineItemsProps) => {
  const calculateAmount = (item: LineItem) => {
    return item.quantity * item.unit_price;
  };

  const handleLineItemChange = (index: number, field: keyof LineItem, value: LineItem[keyof LineItem]) => {
    const items = form.getValues("lineItems");
    items[index][field] = value;
    items[index].amount = calculateAmount(items[index]);
    form.setValue("lineItems", items);
  };

  const addLineItem = () => {
    const items = form.getValues("lineItems");
    form.setValue("lineItems", [...items, { 
      description: "", 
      quantity: 1, 
      unit_price: 0, 
      amount: 0, 
      billable: true,
      unit_type: 'hours'
    }]);
  };

  const removeLineItem = (index: number) => {
    const items = form.getValues("lineItems");
    items.splice(index, 1);
    form.setValue("lineItems", [...items]);
  };

  return (
    <div>
      <FormLabel>Line Items</FormLabel>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Description</TableHead>
            <TableHead>Billable</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {form.watch("lineItems")?.map((item: LineItem, index) => (
            <TableRow key={index}>
              <TableCell>
                <Input
                  type="text"
                  value={item.description}
                  onChange={(e) => handleLineItemChange(index, "description", e.target.value)}
                />
              </TableCell>
              <TableCell>
                <Switch
                  checked={item.billable}
                  onCheckedChange={(checked) => handleLineItemChange(index, "billable", checked)}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    handleLineItemChange(index, "quantity", isNaN(value) ? 0 : value);
                  }}
                />
              </TableCell>
              <TableCell>
                <Select
                  value={item.unit_type}
                  onValueChange={(value) => handleLineItemChange(index, "unit_type", value)}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={item.unit_price}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    handleLineItemChange(index, "unit_price", isNaN(value) ? 0 : value);
                  }}
                />
              </TableCell>
              <TableCell>{item.amount}</TableCell>
              <TableCell className="text-right">
                <Button type="button" variant="ghost" size="sm" onClick={() => removeLineItem(index)}>
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={7}>
              <Button type="button" size="sm" onClick={addLineItem}>
                Add Line Item
              </Button>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};
