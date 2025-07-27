
import { 
  ChevronDown, 
  Printer, 
  Download, 
  Copy, 
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EstimateActionsProps {
  onPreview?: () => void;
  onDownload?: () => void;
}

export const EstimateActions = ({ onPreview, onDownload }: EstimateActionsProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          Actions
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
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
        {onPreview && (
          <DropdownMenuItem onClick={onPreview}>
            <FileText className="mr-2 h-4 w-4" />
            Preview
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
