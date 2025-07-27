
import { jsPDF } from "jspdf";
import { DEFAULT_PDF_THEME, PdfThemeName, getPdfTheme } from "./themes";

export const PDF_FONTS = {
  TITLE: 20,
  HEADER: 12,
  NORMAL: 10,
  SMALL: 8
};

export const setupPdfStyles = (doc: jsPDF, themeName?: PdfThemeName) => {
  const theme = getPdfTheme(themeName);
  
  // Set default colors based on theme
  if (theme.options.tableLineColor) {
    doc.setDrawColor(...theme.options.tableLineColor);
  } else {
    doc.setDrawColor(200, 200, 200);
  }
  
  doc.setLineWidth(theme.options.tableLineWidth || 0.5);
};

export const addLogo = (doc: jsPDF, logo_url: string | undefined, x: number, y: number) => {
  if (!logo_url) return;
  
  try {
    doc.addImage(logo_url, 'JPEG', x, 15, 30, 30, undefined, 'FAST');
  } catch (error) {
    console.error("Error adding logo to PDF:", error);
  }
};

export const getThemeColors = (themeName?: PdfThemeName) => {
  const theme = getPdfTheme(themeName);
  return {
    titleColor: theme.titleColor,
    accentColor: theme.accentColor
  };
};

