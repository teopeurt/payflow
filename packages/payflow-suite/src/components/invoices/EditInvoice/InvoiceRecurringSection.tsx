
import { format } from "date-fns";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { InvoiceFormValues } from "./schema";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

type InvoiceRecurringSectionProps = {
  form: UseFormReturn<InvoiceFormValues>;
};

export const InvoiceRecurringSection = ({ form }: InvoiceRecurringSectionProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="isRecurring"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Recurring Invoice</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    This invoice will be automatically regenerated on a schedule.
                  </p>
                </div>
              </FormItem>
            )}
          />

          {form.watch("isRecurring") && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <FormField
                control={form.control}
                name="recurringFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="biannually">Bi-annually</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recurringStartDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recurringUntil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Condition</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select end condition" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="indefinitely">Until cancelled</SelectItem>
                        <SelectItem value="on_date">On specific date</SelectItem>
                        <SelectItem value="count">After number of occurrences</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("recurringUntil") === "on_date" && (
                <FormField
                  control={form.control}
                  name="recurringEndDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.watch("recurringUntil") === "count" && (
                <FormField
                  control={form.control}
                  name="recurringCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Occurrences</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          min={1}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
