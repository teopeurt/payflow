
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface Project {
  id: string;
  name: string;
}

interface EstimateInfoProps {
  status: string;
  client: Client;
  project: Project;
  date: string;
  dueDate: string;
  amount: number;
  currency?: string; // Add optional currency prop
}

export const EstimateInfo = ({ 
  status, 
  client, 
  project, 
  date, 
  dueDate, 
  amount,
  currency = "USD" // Default to USD if not provided
}: EstimateInfoProps) => {
  // Format currency based on the currency prop
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(value);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
            <StatusBadge status={status as any} className="mt-1" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Client</h3>
            <p className="font-medium">{client.name}</p>
            <p className="text-sm text-muted-foreground mt-1">{client.email}</p>
            <p className="text-sm text-muted-foreground">{client.phone}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Project</h3>
            <p className="font-medium">{project.name}</p>
            <p className="text-sm text-muted-foreground mt-1">{project.id}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              <Calendar size={16} className="inline mr-1" />
              Issue Date
            </h3>
            <p>{new Date(date).toLocaleDateString()}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              <Calendar size={16} className="inline mr-1" />
              Expiry Date
            </h3>
            <p>{new Date(dueDate).toLocaleDateString()}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Amount</h3>
            <p className="text-xl font-bold">{formatCurrency(amount)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
