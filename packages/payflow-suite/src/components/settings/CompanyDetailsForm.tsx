import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Mail, Globe, Phone } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getSupabase } from "@payflow/core/integrations/supabase/client";
import { useAuth } from "@payflow/core/auth";

const formSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  company_email: z.string().email("Invalid email address").optional().nullable(),
  company_website: z.string().url("Invalid website URL").optional().nullable(),
  company_phone: z.string().optional().nullable(),
  company_address: z.string().optional().nullable(),
});

interface CompanyDetailsFormProps {
  organizationId: string;
  initialData: z.infer<typeof formSchema>;
}

export function CompanyDetailsForm({ organizationId, initialData }: CompanyDetailsFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });
  
  // Reset form when initialData changes (organization switch)
  useEffect(() => {
    // Reset the form with new values when the organization changes
    form.reset(initialData);
  }, [initialData, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user?.id) return;
    
    try {
      // Update organization details
      const { error: updateError } = await getSupabase()
        .from('organizations')
        .update(values)
        .eq('id', organizationId);

      if (updateError) throw updateError;

      // Set this organization as primary
      // First, get the membership record for this organization
      const { data: membership, error: membershipError } = await getSupabase()
        .from('organization_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .single();
        
      if (membershipError) throw membershipError;
      
      if (membership) {
        // Update the membership to be primary
        const { error: primaryError } = await getSupabase()
          .from('organization_members')
          .update({ is_primary: true })
          .eq('id', membership.id);
          
        if (primaryError) throw primaryError;
      }

      toast({
        title: "Settings updated",
        description: "Your company details have been saved and set as your primary organization.",
      });
    } catch (error: unknown) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="company_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Enter company name" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Enter company email" {...field} value={field.value || ''} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company_website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Enter website URL" {...field} value={field.value || ''} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Enter phone number" {...field} value={field.value || ''} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="Enter company address" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  );
}
