
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { getSupabase } from '@payflow/core/integrations/supabase/client';
import { InviteInsert } from '@/types/invite';

const clientFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  organizationName: z.string().min(1, 'Organization name is required'),
  phone: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

const NewClient = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      organizationName: '',
      phone: '',
    }
  });
  
  const onSubmit = async (values: ClientFormValues) => {
    setIsLoading(true);
    try {
      // 1. Create the organization
      const { data: orgData, error: orgError } = await getSupabase()
        .from('organizations')
        .insert({ name: values.organizationName })
        .select('id')
        .single();
      
      if (orgError) throw orgError;
      
      // 2. Create the client profile linked to this organization
      const { error: profileError } = await getSupabase()
        .from('client_profiles')
        .insert({
          email: values.email,
          first_name: values.firstName,
          last_name: values.lastName,
          phone: values.phone || null,
          organization_id: orgData.id
        });
      
      if (profileError) throw profileError;
      
      // 3. Generate a random token
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
      
      // 4. Create the invite with the organization ID
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // Token expires in 7 days
      
      // Define the invite data with the correct type
      const inviteData: InviteInsert = {
        email: values.email,
        token: token,
        organization_id: orgData.id,
        role: 'client',
        expires_at: expiryDate.toISOString(),
        used: false
      };
      
      // Use any type for the result to work around the TypeScript error
      const result: any = await getSupabase()
        .from('invites')
        .insert(inviteData);
      
      if (result.error) throw result.error;
      
      // Create invite URL
      const inviteUrl = `${window.location.origin}/auth?invite=${token}`;
      
      toast({
        title: "Client invitation created",
        description: "The client has been invited successfully."
      });
      
      // Show the invitation link
      toast({
        title: "Invitation Link",
        description: (
          <div className="mt-2 p-2 bg-muted rounded break-all">
            <p className="text-sm font-medium mb-2">Share this link with the client:</p>
            <p className="text-xs">{inviteUrl}</p>
          </div>
        ),
        duration: 10000, // Show for longer
      });
      
      navigate('/clients');
    } catch (error: any) {
      console.error('Error creating client:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Invite New Client" 
        description="Create a new client account and organization" 
      />
      
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Client Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
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
                      <FormLabel>Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Organization Details</h3>
                <FormField
                  control={form.control}
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => navigate('/clients')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create & Invite Client"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewClient;
