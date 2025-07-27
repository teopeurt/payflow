import { UserOptions, ThemeType } from 'jspdf-autotable';

export type PdfThemeName = 'classic' | 'modern' | 'minimal' | 'professional' | 'colorful';

interface ThemeOptions {
  headStyles: UserOptions['headStyles'];
  bodyStyles: UserOptions['bodyStyles'];
  alternateRowStyles?: UserOptions['alternateRowStyles'];
  tableLineColor?: [number, number, number];
  tableLineWidth?: number;
  theme?: ThemeType;
}

export interface PdfThemeConfig {
  name: PdfThemeName;
  label: string;
  description: string;
  options: ThemeOptions;
  titleColor: [number, number, number];
  accentColor: [number, number, number];
}

export const PDF_THEMES: Record<PdfThemeName, PdfThemeConfig> = {
  classic: {
    name: 'classic',
    label: 'Classic',
    description: 'Traditional business style with grid lines',
    options: {
      headStyles: { 
        fillColor: [240, 240, 240], 
        textColor: [0, 0, 0], 
        fontStyle: 'bold',
        cellPadding: 4
      },
      bodyStyles: {
        cellPadding: 4
      },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.5,
      theme: 'grid'
    },
    titleColor: [0, 0, 0],
    accentColor: [70, 70, 70]
  },
  
  modern: {
    name: 'modern',
    label: 'Modern',
    description: 'Clean, minimalist design with subtle row stripes',
    options: {
      headStyles: { 
        fillColor: [250, 250, 250], 
        textColor: [70, 70, 70], 
        fontStyle: 'bold',
        cellPadding: 6
      },
      bodyStyles: {
        cellPadding: 6
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      theme: 'striped'
    },
    titleColor: [50, 50, 50],
    accentColor: [100, 100, 100]
  },
  
  minimal: {
    name: 'minimal',
    label: 'Minimal',
    description: 'Ultra-clean design with no grid lines',
    options: {
      headStyles: { 
        fillColor: [255, 255, 255], 
        textColor: [80, 80, 80], 
        fontStyle: 'bold',
        cellPadding: 5
      },
      bodyStyles: {
        cellPadding: 5
      },
      theme: 'plain'
    },
    titleColor: [60, 60, 60],
    accentColor: [120, 120, 120]
  },
  
  professional: {
    name: 'professional',
    label: 'Professional',
    description: 'Elegant blue-tone business theme',
    options: {
      headStyles: { 
        fillColor: [41, 128, 185], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold',
        cellPadding: 5
      },
      bodyStyles: {
        cellPadding: 5
      },
      alternateRowStyles: {
        fillColor: [240, 248, 255]
      },
      theme: 'striped'
    },
    titleColor: [41, 128, 185],
    accentColor: [52, 152, 219]
  },
  
  colorful: {
    name: 'colorful',
    label: 'Colorful',
    description: 'Vibrant modern design with color accents',
    options: {
      headStyles: { 
        fillColor: [155, 89, 182], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold',
        cellPadding: 5
      },
      bodyStyles: {
        cellPadding: 5
      },
      alternateRowStyles: {
        fillColor: [245, 240, 255]
      },
      theme: 'striped'
    },
    titleColor: [155, 89, 182],
    accentColor: [142, 68, 173]
  }
};

// Default theme
export const DEFAULT_PDF_THEME: PdfThemeName = 'professional';

export const getPdfTheme = (themeName?: PdfThemeName): PdfThemeConfig => {
  return PDF_THEMES[themeName || DEFAULT_PDF_THEME];
};
