
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, PlusCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getSupabase } from "@payflow/core/integrations/supabase/client";

const formSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
});

interface OrganizationCreationFormProps {
  userId: string;
  onSuccess: () => void;
}

export function OrganizationCreationForm({ userId, onSuccess }: OrganizationCreationFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_name: "",
    },
  });
  
  const createNewOrganization = async (values: z.infer<typeof formSchema>) => {
    try {
      // Insert new organization
      const { data: newOrg, error: createError } = await getSupabase()
        .from('organizations')
        .insert({
          name: values.company_name,
          company_name: values.company_name,
        })
        .select()
        .single();
        
      if (createError) throw createError;
      
      if (newOrg?.id) {
        // Update user profile with new organization ID
        const { error: updateError } = await getSupabase()
          .from('profiles')
          .update({ organization_id: newOrg.id })
          .eq('id', userId);
          
        if (updateError) throw updateError;
        
        toast({
          title: "Organization created",
          description: "Your organization has been created successfully.",
        });
        
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast({
        title: "Error",
        description: `Failed to create organization: ${error.message || "Please try again."}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(createNewOrganization)} className="space-y-6">
        <FormField
          control={form.control}
          name="company_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Enter organization name" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full md:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Organization
        </Button>
      </form>
    </Form>
  );
}
