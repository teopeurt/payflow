
import { Card, CardContent } from "@/components/ui/card";

interface ClientDetailsProps {
  clientName: string;
  clientAddress: string;
  clientEmail?: string;
  clientPhone?: string;
  clientWebsite?: string;
}

export const ClientDetails = ({ 
  clientName, 
  clientAddress,
  clientEmail,
  clientPhone,
  clientWebsite
}: ClientDetailsProps) => {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-medium text-muted-foreground">Client</h3>
      <p className="font-medium">{clientName}</p>
      {clientAddress && <p className="text-sm whitespace-pre-line text-muted-foreground">{clientAddress}</p>}
      {clientEmail && <p className="text-sm text-muted-foreground">{clientEmail}</p>}
      {clientPhone && <p className="text-sm text-muted-foreground">{clientPhone}</p>}
      {clientWebsite && (
        <p className="text-sm">
          <a href={clientWebsite} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {clientWebsite}
          </a>
        </p>
      )}
    </div>
  );
};
