
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled" | "partially-paid" | "converted" | string;

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

const statusConfig = {
  draft: {
    label: "Draft",
    variant: "outline" as const,
    className: "border-muted text-muted-foreground"
  },
  sent: {
    label: "Sent",
    variant: "default" as const,
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-800 dark:text-blue-100"
  },
  paid: {
    label: "Paid",
    variant: "default" as const,
    className: "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-800 dark:text-green-100"
  },
  "partially-paid": {
    label: "Partially Paid",
    variant: "default" as const,
    className: "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-800 dark:text-amber-100"
  },
  overdue: {
    label: "Overdue",
    variant: "default" as const,
    className: "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-800 dark:text-red-100"
  },
  cancelled: {
    label: "Cancelled",
    variant: "default" as const,
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300"
  }
};

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  // Convert status to lowercase for case-insensitive matching
  const normalizedStatus = status.toLowerCase();
  
  // Get config or use default for unknown status
  const config = statusConfig[normalizedStatus as keyof typeof statusConfig] || {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    variant: "secondary" as const,
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300"
  };
  
  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
