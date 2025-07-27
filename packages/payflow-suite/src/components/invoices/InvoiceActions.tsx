
import { 
  ChevronDown, 
  Printer, 
  Download, 
  Copy, 
  CreditCard,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InvoiceActionsProps {
  isPaid: boolean;
  onRecordPayment: () => void;
  onPreview: () => void;
  onDownload?: () => void;
}

export const InvoiceActions = ({ isPaid, onRecordPayment, onPreview, onDownload }: InvoiceActionsProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          Actions
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onPreview}>
          <FileText className="mr-2 h-4 w-4" />
          Preview
        </DropdownMenuItem>
        {!isPaid && (
          <DropdownMenuItem onClick={onRecordPayment}>
            <CreditCard className="mr-2 h-4 w-4" />
            Record Payment
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
