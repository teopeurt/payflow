
import React from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/Spinner";
import { ClientDetailsHeader } from "@/components/clients/ClientDetailsHeader";
import { ClientInfoCard } from "@/components/clients/ClientInfoCard";
import { ClientProjectsCard } from "@/components/clients/ClientProjectsCard";
import { useClientData } from "@/hooks/useClientData";

const ClientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  const {
    client,
    isClientLoading,
    clientError,
    projects,
    isProjectsLoading,
    projectsError
  } = useClientData(id);

  // Loading state
  if (isClientLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner />
        <p className="ml-2 text-muted-foreground">Loading client details...</p>
      </div>
    );
  }

  // Error state
  if (clientError || !client) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-destructive">Error Loading Client</h2>
        <p className="text-muted-foreground mt-2">
          {(clientError as Error)?.message || "Client not found"}
        </p>
        <Button className="mt-4" asChild>
          <Link to="/clients">Back to Clients</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ClientDetailsHeader 
        clientId={id || ''} 
        clientName={client.name} 
      />
      
      <ClientInfoCard 
        clientName={client.name}
        contactName={client.contactName}
        email={client.email}
        phone={client.phone}
        address={client.address}
        website={client.website}
        status={client.status}
      />

      <ClientProjectsCard 
        clientId={id || ''} 
        projects={projects}
        isLoading={isProjectsLoading}
        error={projectsError as Error}
      />
    </div>
  );
};

export default ClientDetails;
