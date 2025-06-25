
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/Spinner";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const clientFormSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  email: z.string().email("Valid email is required").or(z.string().length(0)),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  status: z.string().default("active")
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

const EditClient = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingClient, setIsFetchingClient] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [clientProfileId, setClientProfileId] = useState<string | null>(null);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      website: "",
      status: "active"
    }
  });

  // Fetch client data
  useEffect(() => {
    const fetchClientData = async () => {
      if (!id) return;

      try {
        setIsFetchingClient(true);
        
        // Get organization data
        const { data: organization, error: orgError } = await supabase
          .from("organizations")
          .select("id, name")
          .eq("id", id)
          .single();
        
        if (orgError) throw orgError;
        
        // First try to get client profile data
        const { data: clientProfile, error: clientProfileError } = await supabase
          .from("client_profiles")
          .select("id, first_name, last_name, email, phone, organization_id")
          .eq("organization_id", id)
          .maybeSingle();
          
        console.log("Client profile data:", clientProfile);
        
        // If client profile exists, use that data
        if (clientProfile) {
          setClientProfileId(clientProfile.id);
          
          form.reset({
            name: organization.name,
            contactName: `${clientProfile.first_name || ''} ${clientProfile.last_name || ''}`.trim(),
            email: clientProfile.email || '',
            phone: clientProfile.phone || '',
            address: '',
            website: '',
            status: 'active'
          });
          
          return;
        }
        
        // Fallback to regular profile if no client profile exists
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .eq("organization_id", id);
        
        if (profilesError) throw profilesError;
        
        console.log("Regular profiles data:", profilesData);
        
        // Get the first profile to use as the main contact
        const mainProfile = profilesData && profilesData.length > 0 ? profilesData[0] : null;

        if (mainProfile) {
          setProfileId(mainProfile.id);
        }
        
        // Set form values
        form.reset({
          name: organization.name,
          contactName: mainProfile
            ? `${mainProfile.first_name || ''} ${mainProfile.last_name || ''}`.trim() 
            : '',
          email: "",
          phone: "",
          address: "",
          website: "",
          status: "active"
        });
      } catch (error: any) {
        console.error("Error fetching client:", error);
        toast({
          title: "Error",
          description: "Failed to load client data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsFetchingClient(false);
      }
    };

    fetchClientData();
  }, [id, form]);

  const onSubmit = async (values: ClientFormValues) => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      // Update organization name
      const { error: orgError } = await supabase
        .from("organizations")
        .update({ name: values.name })
        .eq("id", id);
      
      if (orgError) throw orgError;
      
      // Handle contact name update (would need to split first and last name)
      const nameParts = values.contactName.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      
      // If we have a client profile ID, update that
      if (clientProfileId) {
        const { error: clientProfileError } = await supabase
          .from("client_profiles")
          .update({
            first_name: firstName,
            last_name: lastName,
            email: values.email,
            phone: values.phone
          })
          .eq("id", clientProfileId);
        
        if (clientProfileError) throw clientProfileError;
      }
      // Otherwise, if we have a regular profile ID, update that
      else if (profileId) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            first_name: firstName,
            last_name: lastName
          })
          .eq("id", profileId);
        
        if (profileError) throw profileError;
      }
      // If neither exists, create a new client profile
      else {
        const { error: newClientProfileError } = await supabase
          .from("client_profiles")
          .insert({
            first_name: firstName,
            last_name: lastName,
            email: values.email,
            phone: values.phone,
            organization_id: id
          });
        
        if (newClientProfileError) throw newClientProfileError;
      }
      
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
      
      navigate(`/clients/${id}`);
    } catch (error: any) {
      console.error("Error updating client:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingClient) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner />
        <p className="ml-2 text-muted-foreground">Loading client details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Edit Client" 
        description="Update client information"
      />
      
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Client Details</h3>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="client@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, City, Country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => navigate(`/clients/${id}`)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditClient;
