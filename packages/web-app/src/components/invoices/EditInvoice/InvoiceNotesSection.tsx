
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { InvoiceFormValues } from "./schema";

type InvoiceNotesSectionProps = {
  form: UseFormReturn<InvoiceFormValues>;
};

export const InvoiceNotesSection = ({ form }: InvoiceNotesSectionProps) => {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Notes to the customer that will display on the invoice"
                    className="min-h-24"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Terms and Conditions (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Terms and conditions for this invoice"
                    className="min-h-24"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};
