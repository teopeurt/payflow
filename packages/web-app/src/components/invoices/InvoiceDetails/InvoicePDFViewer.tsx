
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { Spinner } from "@/components/shared/Spinner";
import { PDFPreview } from "@/components/shared/PDFPreview";

interface InvoicePDFViewerProps {
  pdfBlob: Blob | null;
  loading: boolean;
  invoiceId: string;
}

export const InvoicePDFViewer = ({ pdfBlob, loading, invoiceId }: InvoicePDFViewerProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <FileText size={18} className="mr-2" />
          Invoice PDF
        </h3>
        
        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="text-center">
              <Spinner className="mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Generating PDF...</p>
            </div>
          </div>
        ) : (
          <PDFPreview pdfBlob={pdfBlob} estimateId={invoiceId} />
        )}
      </CardContent>
    </Card>
  );
};
