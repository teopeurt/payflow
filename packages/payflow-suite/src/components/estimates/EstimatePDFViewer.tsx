
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { Spinner } from "@/components/shared/Spinner";
import { PDFPreview } from "@/components/shared/PDFPreview";

interface EstimatePDFViewerProps {
  pdfBlob: Blob | null;
  loading: boolean;
  estimateId: string;
}

export const EstimatePDFViewer = ({ pdfBlob, loading, estimateId }: EstimatePDFViewerProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <FileText size={18} className="mr-2" />
          Estimate PDF
        </h3>
        
        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="text-center">
              <Spinner className="mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Generating PDF...</p>
            </div>
          </div>
        ) : (
          <PDFPreview pdfBlob={pdfBlob} estimateId={estimateId} />
        )}
      </CardContent>
    </Card>
  );
};
