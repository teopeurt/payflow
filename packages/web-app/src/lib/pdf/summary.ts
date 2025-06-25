import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { LineItem } from "@/types/pdf";
import { getCurrencySymbol } from "@/utils/currencyUtils";
import { PdfThemeName, getPdfTheme } from "./themes";
import { DocumentType } from "../pdfGenerator";

export const addDetailsTable = (
  doc: jsPDF,
  id: string,
  date: string,
  dueDate: string,
  total: number,
  currency: string,
  yStartPosition: number,
  documentType: DocumentType = 'INVOICE'
) => {
  const currencySymbol = getCurrencySymbol(currency);
  const detailsX = 140;
  
  doc.setFont("helvetica", "bold");
  
  // Use the right label based on document type
  const numberLabel = documentType === 'INVOICE' ? 'Invoice #' :
                       documentType === 'ESTIMATE' ? 'Estimate #' : 
                       'Quote #';
                       
  doc.text(numberLabel, detailsX, yStartPosition);
  doc.text(`Issue Date`, detailsX, yStartPosition + 7);
  doc.text(documentType === 'INVOICE' ? `Due Date` : `Valid Until`, detailsX, yStartPosition + 14);
  doc.text(`Amount`, detailsX, yStartPosition + 21);
  
  doc.setFont("helvetica", "normal");
  const detailsValueX = detailsX + 30;
  doc.text(id, detailsValueX, yStartPosition);
  doc.text(date, detailsValueX, yStartPosition + 7);
  doc.text(dueDate, detailsValueX, yStartPosition + 14);
  doc.text(`${currencySymbol}${total.toFixed(2)}`, detailsValueX, yStartPosition + 21);
};

export const addLineItemsTable = (
  doc: jsPDF,
  lineItems: LineItem[],
  currency: string,
  startY: number,
  themeName?: PdfThemeName
) => {
  const currencySymbol = getCurrencySymbol(currency);
  const theme = getPdfTheme(themeName);
  const tableHeaders = [["Item", "Description", "Qty", "Rate", "Amount"]];
  const tableData = lineItems.map(item => [
    "Service",
    item.description,
    item.quantity.toString(),
    `${currencySymbol}${item.unitPrice.toFixed(2)}`,
    `${currencySymbol}${item.amount.toFixed(2)}`
  ]);

  // Configure table for optimal fit on A4 paper (210mm × 297mm)
  autoTable(doc, {
    head: tableHeaders,
    body: tableData,
    startY,
    margin: { left: 20, right: 20 },
    theme: theme.options.theme || 'grid',
    headStyles: theme.options.headStyles,
    bodyStyles: theme.options.bodyStyles,
    alternateRowStyles: theme.options.alternateRowStyles,
    // Fixed widths for columns to ensure proper fit
    columnStyles: {
      0: { cellWidth: 25 },  // Item column (narrower)
      1: { cellWidth: 'auto' }, // Description column (flexible)
      2: { cellWidth: 15 },  // Qty column (smallest)
      3: { cellWidth: 25 },  // Rate column 
      4: { cellWidth: 25 }   // Amount column
    },
    // Enable content wrapping for better layout
    styles: {
      overflow: 'linebreak',
      cellWidth: 'wrap',
      fontSize: 9, // Slightly smaller font to better fit content
      cellPadding: 3 // Reduced padding to save space
    },
    didDrawPage: (data) => {
      // This helps debug page width issues
      // console.log('Page width:', data.pageSize.width, 'Table width:', data.table.width);
    }
  });
};
