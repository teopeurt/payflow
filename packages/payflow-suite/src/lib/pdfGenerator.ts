
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import { PdfGenerateData } from "@/types/pdf";
import { PDF_FONTS, setupPdfStyles, addLogo, getThemeColors } from "./pdf/styling";
import { addCompanyHeader, addClientHeader } from "./pdf/header";
import { addDetailsTable, addLineItemsTable } from "./pdf/summary";
import { addPaymentInfo, addTotalsSummary } from "./pdf/footer";
import { DEFAULT_PDF_THEME, PdfThemeName } from "./pdf/themes";

export type DocumentType = 'INVOICE' | 'ESTIMATE' | 'QUOTE';

export const generateEstimatePDF = (data: PdfGenerateData, themeName?: PdfThemeName, documentType: DocumentType = 'INVOICE'): Blob => {
  const {
    id, clientName, clientAddress, date, dueDate,
    notes, terms, lineItems, subtotal, tax, total,
    currency = 'USD', logo_url, companyName,
    companyAddress, companyEmail, companyPhone
  } = data;

  // Use default theme if not specified
  const themeToUse = themeName || DEFAULT_PDF_THEME;

  const doc = new jsPDF();
  setupPdfStyles(doc, themeToUse);
  
  // Get theme colors
  const { titleColor } = getThemeColors(themeToUse);
  
  // Add logo and title
  addLogo(doc, logo_url, 20, 15);
  doc.setFontSize(PDF_FONTS.TITLE);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...titleColor);
  doc.text(documentType, logo_url ? 70 : 20, 25);
  doc.setTextColor(0, 0, 0); // Reset text color
  
  // Add company and client info
  const yStartPosition = logo_url ? 50 : 35;
  addCompanyHeader(doc, companyName, companyAddress, companyEmail, companyPhone, !!logo_url, yStartPosition);
  addClientHeader(doc, clientName, clientAddress, yStartPosition);
  
  // Add invoice details
  addDetailsTable(doc, id, date, dueDate, total, currency, yStartPosition, documentType);
  
  // Add horizontal line
  const lineY = yStartPosition + 75;
  doc.line(20, lineY, 190, lineY);
  
  // Add items table and get its final Y position
  const tableY = lineY + 10;
  addLineItemsTable(doc, lineItems, currency, tableY, themeToUse);
  
  // Type-safe way to access lastAutoTable
  interface DocWithAutoTable extends jsPDF {
    lastAutoTable?: { finalY: number };
  }
  
  const finalY = (doc as DocWithAutoTable).lastAutoTable?.finalY || 200;
  
  // Add summary and payment info
  addTotalsSummary(doc, subtotal, tax, total, currency, finalY);
  const summaryFinalY = (doc as DocWithAutoTable).lastAutoTable?.finalY || 250;
  addPaymentInfo(doc, terms, notes, summaryFinalY);
  
  return doc.output('blob');
};
