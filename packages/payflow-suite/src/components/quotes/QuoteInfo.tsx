
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, type StatusType } from "@/components/shared/StatusBadge";
import { formatCurrency } from "@/lib/formatters";

interface ClientInfo {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  currency?: string;
}

interface ProjectInfo {
  id: string;
  name: string;
}

interface QuoteInfoProps {
  status: string | StatusType;
  client: ClientInfo;
  project: ProjectInfo;
  date: string;
  dueDate: string;
  amount: number;
  currency: string;
}

export const QuoteInfo = ({
  status,
  client,
  project,
  date,
  dueDate,
  amount,
  currency
}: QuoteInfoProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-base font-medium mb-1">Client</h3>
            <p className="text-muted-foreground mb-4">{client.name}</p>
            
            <h3 className="text-base font-medium mb-1">Project</h3>
            <p className="text-muted-foreground">{project.name}</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status:</span>
              <StatusBadge status={status as StatusType} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span>{new Date(date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valid until:</span>
              <span>{new Date(dueDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-lg font-medium">Total:</span>
              <span className="text-lg font-medium">{formatCurrency(amount, currency)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
