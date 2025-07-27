import { PdfThemeName } from "@/lib/pdf/themes";

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface PdfGenerateData {
  id: string;
  clientName: string;
  clientAddress: string;
  date: string;
  dueDate: string;
  notes: string;
  terms: string;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency?: string;
  logo_url?: string;
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  theme?: PdfThemeName; // Optional theme selection
}
