
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { Spinner } from "@/components/shared/Spinner";

interface QuotePDFViewerProps {
  pdfBlob: Blob | null;
  loading: boolean;
  quoteId: string;
  onDownload?: () => void;
  onRefresh?: () => void;
}

export const QuotePDFViewer = ({
  pdfBlob,
  loading,
  quoteId,
  onDownload,
  onRefresh
}: QuotePDFViewerProps) => {
  const handleDownload = () => {
    if (!pdfBlob) return;
    
    if (onDownload) {
      onDownload();
      return;
    }
    
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Quote-${quoteId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">Preview</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={onRefresh}
            >
              <RefreshCw size={14} />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleDownload}
              disabled={loading || !pdfBlob}
            >
              <Download size={14} />
              PDF
            </Button>
          </div>
        </div>
        
        <div className="relative aspect-[3/4] w-full bg-muted rounded-md overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner />
            </div>
          ) : pdfBlob ? (
            <iframe
              src={URL.createObjectURL(pdfBlob)}
              className="w-full h-full"
              title={`Quote ${quoteId} PDF Preview`}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground">Preview not available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
