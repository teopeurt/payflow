
import React from "react";
import { Button } from "@/components/ui/button";
import { ClientList } from "@/components/clients/ClientList";
import { PageHeader } from "@/components/shared/PageHeader";
import { PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Clients: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Clients" description="Manage your client relationships" />
        <Button asChild>
          <Link to="/clients/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Client
          </Link>
        </Button>
      </div>
      
      <ClientList />
    </div>
  );
};

export default Clients;
