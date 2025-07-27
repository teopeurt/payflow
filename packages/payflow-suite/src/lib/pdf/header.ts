
import { jsPDF } from "jspdf";
import { PDF_FONTS } from "./styling";

export const addCompanyHeader = (
  doc: jsPDF,
  companyName: string,
  companyAddress: string,
  companyEmail: string,
  companyPhone: string,
  hasLogo: boolean,
  yStartPosition: number
) => {
  doc.setFontSize(PDF_FONTS.NORMAL);
  doc.setFont("helvetica", "bold");
  
  doc.text("From", 20, yStartPosition);
  doc.setFont("helvetica", "normal");
  doc.text(companyName, 20, yStartPosition + 7);
  doc.setFontSize(PDF_FONTS.SMALL);

  if (companyAddress) {
    const addressLines = companyAddress.split("\n");
    addressLines.forEach((line, i) => {
      doc.text(line, 20, yStartPosition + 13 + (i * 5));
    });
  }

  if (companyEmail) {
    doc.text(companyEmail, 20, yStartPosition + 25);
  }

  if (companyPhone) {
    doc.text(companyPhone, 20, yStartPosition + 31);
  }
};

export const addClientHeader = (
  doc: jsPDF,
  clientName: string,
  clientAddress: string,
  yStartPosition: number
) => {
  doc.setFontSize(PDF_FONTS.NORMAL);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To", 20, yStartPosition + 45);
  doc.setFont("helvetica", "normal");
  doc.text(clientName, 20, yStartPosition + 52);

  if (clientAddress) {
    const addressLines = clientAddress.split("\n");
    addressLines.forEach((line, i) => {
      doc.text(line, 20, yStartPosition + 59 + (i * 5));
    });
  }
};

