
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { InvoiceFormSchema } from "./schema";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/Spinner";
import { InvoiceDetailsSection } from "./InvoiceDetailsSection";
import { InvoiceItemsSection } from "./InvoiceItemsSection";
import { InvoiceNotesSection } from "./InvoiceNotesSection";
import { InvoiceRecurringSection } from "./InvoiceRecurringSection";

type InvoiceFormProps = {
  defaultValues: z.infer<typeof InvoiceFormSchema>;
  clients: { id: string; name: string }[];
  projects: { id: string; name: string; clientId: string }[];
  onSubmit: (data: z.infer<typeof InvoiceFormSchema>) => void;
  onCancel: () => void;
  isLoading: boolean;
  onClientChange: (clientId: string) => void;
  onLogoChange: (file: File | null) => void;
  logoPreview?: string | null;
};

export const InvoiceForm = ({
  defaultValues,
  clients,
  projects,
  onSubmit,
  onCancel,
  isLoading,
  onClientChange,
  onLogoChange,
  logoPreview
}: InvoiceFormProps) => {
  const form = useForm<z.infer<typeof InvoiceFormSchema>>({
    resolver: zodResolver(InvoiceFormSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Calculate line item amount and update totals
  const calculateLineItemAmount = (index: number) => {
    const items = form.getValues("items");
    const quantity = items[index]?.quantity || 0;
    const rate = items[index]?.rate || 0;
    const amount = quantity * rate;
    
    form.setValue(`items.${index}.amount`, amount);
    
    // Recalculate totals
    calculateTotals();
  };

  // Calculate invoice totals
  const calculateTotals = () => {
    const items = form.getValues("items");
    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const tax = form.getValues("tax") || 0;
    const discount = form.getValues("discount") || 0;
    const total = subtotal + tax - discount;
    
    form.setValue("subtotal", subtotal);
    form.setValue("total", total);
  };

  // Add new line item
  const handleAddItem = () => {
    append({
      id: `item-${Date.now()}`,
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <InvoiceDetailsSection 
          form={form}
          clients={clients}
          projects={projects}
          onClientChange={onClientChange}
          onLogoChange={onLogoChange}
          logoPreview={logoPreview}
        />

        <InvoiceItemsSection
          fields={fields}
          form={form}
          onRemove={remove}
          onAdd={handleAddItem}
          calculateLineItemAmount={calculateLineItemAmount}
          calculateTotals={calculateTotals}
        />

        <InvoiceNotesSection form={form} />

        <InvoiceRecurringSection form={form} />

        <div className="flex justify-end gap-2">
          <Button 
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Spinner size="sm" className="mr-2" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
};
