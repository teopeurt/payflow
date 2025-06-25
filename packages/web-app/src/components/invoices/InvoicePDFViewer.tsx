import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PDFPreview } from "@/components/shared/PDFPreview";
import { Spinner } from "@/components/shared/Spinner";
import { Button } from "@/components/ui/button";
import { Download, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";

interface InvoicePDFViewerProps {
  pdfBlob: Blob | null;
  loading: boolean;
  invoiceId: string;
  onDownload?: () => void;
}

export const InvoicePDFViewer = ({ pdfBlob, loading, invoiceId, onDownload }: InvoicePDFViewerProps) => {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  
  // Debug state changes
  useEffect(() => {
    console.log('InvoicePDFViewer state changed:', { isViewerOpen, pdfBlobExists: !!pdfBlob, loading });
  }, [isViewerOpen, pdfBlob, loading]);
  
  // Isolate toggle logic with useCallback to prevent recreation on rerenders
  const toggleViewer = useCallback((e) => {
    // Prevent event bubbling that could cause double-triggering
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('Toggle viewer button clicked, current state:', isViewerOpen);
    setIsViewerOpen(prevState => !prevState);
  }, [isViewerOpen]);
  
  // Use ref to track click count and detect potential double-clicks or repeated calls
  const downloadClickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);
  
  // Memoize the download handler to prevent recreating it on every render
  const handleDownload = useCallback(() => {
    // Increment click counter and track time to debug multiple invocations
    downloadClickCountRef.current += 1;
    const currentTime = new Date().getTime();
    const timeSinceLastClick = currentTime - lastClickTimeRef.current;
    lastClickTimeRef.current = currentTime;
    
    console.log('Download button clicked:', {
      clickCount: downloadClickCountRef.current,
      timeSinceLastClick,
      pdfBlobExists: !!pdfBlob,
      isCustomHandlerProvided: !!onDownload
    });
    
    // First try the provided download handler
    if (onDownload) {
      console.log('Using custom download handler');
      onDownload();
      return;
    }
    
    // Fall back to direct download if we have the blob
    if (!pdfBlob) {
      console.log('PDF blob not available for download');
      return;
    }
    
    try {
      console.log('Starting direct PDF download process');
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      console.log('Triggering download click');
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('Download process completed');
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  }, [pdfBlob, invoiceId, onDownload]);
  
  return (
    <Card className="sticky top-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Invoice PDF</CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleViewer}
              className="flex items-center gap-1"
            >
              {isViewerOpen ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide PDF
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  View PDF
                </>
              )}
            </Button>
            {/* Use memo to prevent button recreation during loading state changes */}
            {useMemo(() => {
              // Only show button when PDF is available (regardless of loading state)
              const isPdfAvailable = !!pdfBlob;
              return (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={(e) => {
                    // Prevent event bubbling
                    e.preventDefault();
                    e.stopPropagation();
                    // Call download handler
                    handleDownload();
                  }}
                  disabled={!isPdfAvailable}
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  {loading && isPdfAvailable ? 'Preparing...' : 'Download'}
                </Button>
              );
            }, [pdfBlob, handleDownload, loading])}
          </div>
        </div>
      </CardHeader>
      {isViewerOpen && (
        <CardContent className="p-4 pt-0">
          {loading ? (
            <div className="flex justify-center items-center h-[600px]">
              <Spinner size="lg" />
            </div>
          ) : (
            <PDFPreview pdfBlob={pdfBlob} estimateId={invoiceId} />
          )}
        </CardContent>
      )}
    </Card>
  );
};
