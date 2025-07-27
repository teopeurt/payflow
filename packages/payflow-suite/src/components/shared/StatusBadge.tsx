
import { cn } from "@/lib/utils";

export type StatusType = 'draft' | 'pending' | 'approved' | 'rejected' | 'completed' | 'overdue' | 'paid';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string, className: string }> = {
    draft: {
      label: 'Draft',
      className: 'status-badge-draft'
    },
    pending: {
      label: 'Pending Approval',
      className: 'status-badge-pending'
    },
    approved: {
      label: 'Approved',
      className: 'status-badge-approved'
    },
    rejected: {
      label: 'Rejected',
      className: 'status-badge-rejected'
    },
    completed: {
      label: 'Completed',
      className: 'status-badge-completed'
    },
    overdue: {
      label: 'Overdue',
      className: 'bg-danger/20 text-danger'
    },
    paid: {
      label: 'Paid',
      className: 'bg-success/20 text-success'
    }
  };

  // Get config or use fallback for unknown statuses
  const config = statusConfig[status as string] || {
    label: status as string,
    className: 'bg-gray-200 text-gray-800'
  };

  return (
    <span className={cn("status-badge", config.className, className)}>
      {config.label}
    </span>
  );
}
