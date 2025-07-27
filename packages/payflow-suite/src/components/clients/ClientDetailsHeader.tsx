
import React from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface ClientDetailsHeaderProps {
  clientId: string;
  clientName: string;
}

export const ClientDetailsHeader = ({ clientId, clientName }: ClientDetailsHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <PageHeader 
        title={clientName} 
        description={`Client ID: ${clientId}`}
      />
      <Button asChild>
        <Link to={`/clients/${clientId}/edit`}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Client
        </Link>
      </Button>
    </div>
  );
};
