
import { UseFormReturn, FieldArrayWithId } from "react-hook-form";
import { Plus, Trash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { InvoiceFormValues } from "./schema";

type InvoiceItemsSectionProps = {
  form: UseFormReturn<InvoiceFormValues>;
  fields: FieldArrayWithId<InvoiceFormValues, "items", "id">[];
  onRemove: (index: number) => void;
  onAdd: () => void;
  calculateLineItemAmount: (index: number) => void;
  calculateTotals: () => void;
};

export const InvoiceItemsSection = ({
  form,
  fields,
  onRemove,
  onAdd,
  calculateLineItemAmount,
  calculateTotals,
}: InvoiceItemsSectionProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium mb-4">Line Items</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-2 font-medium text-sm">
            <div className="col-span-5">Description</div>
            <div className="col-span-2">Quantity</div>
            <div className="col-span-2">Rate</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-1"></div>
          </div>

          {fields.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 gap-2">
              <div className="col-span-5">
                <Input
                  {...form.register(`items.${index}.description`)}
                  placeholder="Item description"
                  onChange={(e) => {
                    form.setValue(`items.${index}.description`, e.target.value);
                  }}
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  {...form.register(`items.${index}.quantity`, { 
                    valueAsNumber: true 
                  })}
                  placeholder="Qty"
                  onChange={(e) => {
                    form.setValue(`items.${index}.quantity`, parseFloat(e.target.value) || 0);
                    calculateLineItemAmount(index);
                  }}
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  {...form.register(`items.${index}.rate`, { 
                    valueAsNumber: true 
                  })}
                  placeholder="Rate"
                  onChange={(e) => {
                    form.setValue(`items.${index}.rate`, parseFloat(e.target.value) || 0);
                    calculateLineItemAmount(index);
                  }}
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  {...form.register(`items.${index}.amount`, { 
                    valueAsNumber: true 
                  })}
                  disabled
                />
              </div>
              <div className="col-span-1 flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    onRemove(index);
                    calculateTotals();
                  }}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={onAdd}
            className="mt-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>

          <div className="flex justify-end mt-6">
            <div className="w-64 space-y-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <Input
                  type="number"
                  {...form.register("subtotal", { valueAsNumber: true })}
                  className="w-32 text-right"
                  disabled
                />
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <Input
                  type="number"
                  {...form.register("tax", { valueAsNumber: true })}
                  className="w-32 text-right"
                  onChange={(e) => {
                    form.setValue("tax", parseFloat(e.target.value) || 0);
                    calculateTotals();
                  }}
                />
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <Input
                  type="number"
                  {...form.register("discount", { valueAsNumber: true })}
                  className="w-32 text-right"
                  onChange={(e) => {
                    form.setValue("discount", parseFloat(e.target.value) || 0);
                    calculateTotals();
                  }}
                />
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <Input
                  type="number"
                  {...form.register("total", { valueAsNumber: true })}
                  className="w-32 text-right font-medium"
                  disabled
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
