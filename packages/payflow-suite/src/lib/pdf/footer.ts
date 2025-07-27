
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { getCurrencySymbol } from "@/utils/currencyUtils";
import { PDF_FONTS } from "./styling";

export const addPaymentInfo = (
  doc: jsPDF,
  terms: string,
  notes: string,
  finalY: number
) => {
  if (terms) {
    doc.setFontSize(PDF_FONTS.HEADER);
    doc.setFont("helvetica", "bold");
    doc.text("Payment Terms", 20, finalY + 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(PDF_FONTS.NORMAL);
    doc.text(terms, 20, finalY + 25);
  }

  if (notes) {
    const notesY = terms ? finalY + 45 : finalY + 15;
    doc.setFontSize(PDF_FONTS.HEADER);
    doc.setFont("helvetica", "bold");
    doc.text("Notes", 20, notesY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(PDF_FONTS.NORMAL);
    doc.text(notes, 20, notesY + 10);
  }
};

export const addTotalsSummary = (
  doc: jsPDF,
  subtotal: number,
  tax: number,
  total: number,
  currency: string,
  finalY: number
) => {
  const currencySymbol = getCurrencySymbol(currency);
  const summaryData = [
    ["Subtotal", `${currencySymbol}${subtotal.toFixed(2)}`],
    ["Tax", `${currencySymbol}${tax.toFixed(2)}`],
    ["Total", `${currencySymbol}${total.toFixed(2)}`]
  ];

  autoTable(doc, {
    body: summaryData,
    startY: finalY + 10,
    margin: { left: 100, right: 20 },
    theme: 'plain',
    styles: {
      fontSize: PDF_FONTS.NORMAL
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 40, halign: 'right' }
    }
  });
};

