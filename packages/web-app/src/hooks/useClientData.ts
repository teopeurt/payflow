
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientData {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  status: string;
  currency: string; // Add currency field
}

export interface Project {
  id: string;
  name: string;
  startDate: string;
  dueDate: string;
  status: string;
  value: number;
}

export const useClientData = (clientId: string | undefined) => {
  // Fetch client data
  const { 
    data: client, 
    isLoading: isClientLoading, 
    error: clientError 
  } = useQuery({
    queryKey: ["client", clientId],
    queryFn: async (): Promise<ClientData> => {
      if (!clientId) throw new Error("Client ID is required");
      
      // First, get the organization info
      const { data: organization, error: orgError } = await supabase
        .from("organizations")
        .select("id, name, default_currency")
        .eq("id", clientId)
        .single();
        
      if (orgError) throw orgError;
      
      // Try to get client profile data first
      const { data: clientProfile, error: clientProfileError } = await supabase
        .from("client_profiles")
        .select("id, first_name, last_name, email, phone")
        .eq("organization_id", clientId)
        .maybeSingle();
      
      // If client profile exists, use that data
      if (clientProfile) {
        return {
          id: organization.id,
          name: organization.name,
          contactName: `${clientProfile.first_name || ''} ${clientProfile.last_name || ''}`.trim(),
          email: clientProfile.email || '',
          phone: clientProfile.phone || '',
          address: '',
          website: '',
          status: 'active', // Default status
          currency: organization.default_currency || 'USD' // Add organization's currency
        };
      }
      
      // If no client profile, check regular profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("organization_id", clientId);
        
      if (profilesError) throw profilesError;
      
      // Get the first profile to use as the main contact
      const mainProfile = profilesData && profilesData.length > 0 ? profilesData[0] : null;
      
      // Transform the data to match our expected format
      return {
        id: organization.id,
        name: organization.name,
        contactName: mainProfile
          ? `${mainProfile.first_name || ''} ${mainProfile.last_name || ''}`.trim() 
          : 'No contact assigned',
        email: '', // These fields don't exist in the regular profiles table
        phone: '',
        address: '',
        website: '',
        status: 'active', // Assuming all clients are active by default
        currency: organization.default_currency || 'USD' // Add organization's currency
      };
    },
    enabled: !!clientId
  });

  // Fetch projects for this client
  const { 
    data: projects, 
    isLoading: isProjectsLoading, 
    error: projectsError 
  } = useQuery({
    queryKey: ["client-projects", clientId],
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          id,
          name,
          start_date,
          end_date,
          status,
          invoices(amount)
        `)
        .eq("organization_id", clientId)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      
      // Transform the data to calculate project value from invoices
      return data.map(project => ({
        id: project.id,
        name: project.name,
        startDate: project.start_date || '',
        dueDate: project.end_date || '',
        status: project.status,
        // Calculate value by summing up invoice amounts
        value: project.invoices?.reduce((sum: number, invoice: any) => sum + (invoice.amount || 0), 0) || 0
      }));
    },
    enabled: !!clientId
  });

  return {
    client,
    isClientLoading,
    clientError,
    projects,
    isProjectsLoading,
    projectsError
  };
};
