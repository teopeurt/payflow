
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Spinner } from "@/components/shared/Spinner";

interface PDFPreviewProps {
  pdfBlob: Blob | null;
  estimateId?: string;
  quoteId?: string;
  invoiceId?: string;
}

export const PDFPreview = ({ pdfBlob, estimateId, quoteId, invoiceId }: PDFPreviewProps) => {
  const documentType = estimateId ? 'Estimate' : quoteId ? 'Quote' : 'Invoice';
  const documentId = estimateId || quoteId || invoiceId || '';
  
  const handleDownload = () => {
    if (!pdfBlob) return;
    
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentType}-${documentId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!pdfBlob) {
    return (
      <div className="flex justify-center items-center h-60 bg-muted rounded-md">
        <p className="text-muted-foreground">PDF preview not available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[3/4] w-full bg-muted rounded-md overflow-hidden">
        <iframe
          src={URL.createObjectURL(pdfBlob)}
          className="w-full h-full"
          title={`${documentType} ${documentId} PDF Preview`}
        />
      </div>
      
      <Button
        variant="outline"
        size="sm"
        className="w-full flex items-center justify-center gap-1"
        onClick={handleDownload}
      >
        <Download size={14} />
        Download PDF
      </Button>
    </div>
  );
};
