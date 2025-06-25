
import { RefreshCw } from "lucide-react";

interface RecurringInfoProps {
  recurringFrequency: string;
  recurringStartDate: string;
  recurringUntil: string;
  recurringEndDate?: string;
  recurringCount?: number;
  formatDate: (date: string) => string;
}

export const RecurringInfo = ({ 
  recurringFrequency, 
  recurringStartDate, 
  recurringUntil, 
  recurringEndDate, 
  recurringCount,
  formatDate
}: RecurringInfoProps) => {
  let endConditionText = "Until cancelled";
  
  if (recurringUntil === "on_date" && recurringEndDate) {
    endConditionText = `Until ${formatDate(recurringEndDate)}`;
  } else if (recurringUntil === "count" && recurringCount) {
    endConditionText = `After ${recurringCount} occurrences`;
  }
  
  return (
    <div className="mt-6 p-4 border rounded-md bg-muted/20">
      <div className="flex items-center gap-2 mb-2">
        <RefreshCw className="h-4 w-4 text-primary" />
        <h3 className="font-medium">Recurring Invoice</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Frequency:</span>
          <span className="ml-2 capitalize">{recurringFrequency}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Start Date:</span>
          <span className="ml-2">{formatDate(recurringStartDate)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">End Condition:</span>
          <span className="ml-2 capitalize">{endConditionText}</span>
        </div>
      </div>
    </div>
  );
};
