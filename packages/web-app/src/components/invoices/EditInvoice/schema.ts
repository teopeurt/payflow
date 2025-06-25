
import * as z from "zod";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled" | "partially-paid";
export type RecurringType = "indefinitely" | "on_date" | "count";

export const InvoiceFormSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  projectId: z.string().min(1, "Project is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  purchaseOrder: z.string().optional(),
  issueDate: z.date({
    required_error: "Issue date is required",
  }),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  status: z.string().min(1, "Status is required"),
  items: z.array(z.object({
    id: z.string(),
    description: z.string().min(1, "Description is required"),
    quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
    rate: z.coerce.number().min(0, "Rate must be greater than or equal to 0"),
    amount: z.coerce.number()
  })).min(1, "At least one item is required"),
  subtotal: z.coerce.number(),
  tax: z.coerce.number(),
  discount: z.coerce.number(),
  total: z.coerce.number(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.string().optional(),
  recurringStartDate: z.date().optional(),
  recurringUntil: z.string().optional(),
  recurringEndDate: z.date().optional(),
  recurringCount: z.coerce.number().optional(),
});

export type InvoiceFormValues = z.infer<typeof InvoiceFormSchema>;
