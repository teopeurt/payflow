import React, { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  projects: number;
  status: "active" | "inactive";
  startDate: string;
};

export const ClientList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        // Get current user's profile to determine current organization
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        // Get the user's current organization
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single();
        
        // Directly fetch client profiles with their organizations
        // This automatically excludes the user's own organizations since they're in profiles, not client_profiles
        const { data: clientProfiles, error: clientError } = await supabase
          .from('client_profiles')
          .select(`
            id, 
            first_name, 
            last_name, 
            email, 
            phone, 
            organization_id,
            created_at,
            organizations(id, name)
          `);
        
        if (clientError) throw clientError;
        
        // Map the client profiles to the client data structure
        const clientsData = clientProfiles.map(client => {
          const org = client.organizations;
          // Format the date to display in readable format
          const startDate = client.created_at ? 
            new Date(client.created_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            }) : 'Unknown';
            
          return {
            id: client.organization_id,
            name: org?.name || 'Unknown Organization',
            email: client.email || 'No email available',
            phone: client.phone || 'No phone available',
            projects: 0, // We'll implement project count in future
            status: 'active' as const,
            startDate
          };
        });

        setClients(clientsData);
      } catch (error) {
        console.error("Error fetching clients:", error);
        toast({
          title: "Error",
          description: "Failed to load clients. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [toast]);

  if (loading) {
    return (
      <div className="py-10 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
        <p className="mt-2 text-muted-foreground">Loading clients...</p>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">No clients found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Get started by adding your first client.
        </p>
        <Button className="mt-4" asChild>
          <Link to="/clients/new">Add Client</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>Projects</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">{client.name}</TableCell>
              <TableCell>{client.email}</TableCell>
              <TableCell>{client.phone}</TableCell>
              <TableCell>{client.startDate}</TableCell>
              <TableCell>{client.projects}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    client.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {client.status === "active" ? "Active" : "Inactive"}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                  >
                    <Link to={`/clients/${client.id}`}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                  >
                    <Link to={`/clients/${client.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
