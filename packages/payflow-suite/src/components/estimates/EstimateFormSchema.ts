import { z } from "zod";

export const estimateFormSchema = z.object({
  organization_id: z.string().min(1, {
    message: "Please select an organization.",
  }),
  project_id: z.string().optional(),
  issue_date: z.date(),
  expiry_date: z.date(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  lineItems: z.array(
    z.object({
      description: z.string().min(1, {
        message: "Description must be at least 1 character.",
      }),
      quantity: z.number().min(1, {
        message: "Quantity must be at least 1.",
      }),
      unit_price: z.number().min(0, {
        message: "Unit price must be at least 0.",
      }),
      amount: z.number(),
      billable: z.boolean().default(true),
      unit_type: z.enum(['hours', 'days', 'months', 'fixed']).default('hours'),
    })
  ).optional(),
});

export type EstimateFormValues = z.infer<typeof estimateFormSchema>;
