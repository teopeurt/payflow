import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { EstimateFormValues, estimateFormSchema } from './EstimateFormSchema';
import { EstimateOrganizationProjectFields } from './EstimateOrganizationProjectFields';
import { EstimateDateFields } from './EstimateDateFields';
import { EstimateLineItems } from './EstimateLineItems';
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface EstimateFormProps {
  projectId?: string | null;
  projectData?: any;
  isFromProject: boolean;
  organizations?: any[];
  projects?: any[];
}

export const EstimateForm = ({ 
  projectId, 
  projectData, 
  isFromProject,
  organizations,
  projects
}: EstimateFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const form = useForm<EstimateFormValues & {
    companyName?: string,
    companyAddress?: string,
    companyEmail?: string,
    companyPhone?: string
  }>({
    resolver: zodResolver(estimateFormSchema),
    defaultValues: {
      organization_id: "",
      issue_date: new Date(),
      expiry_date: new Date(),
      lineItems: [{ 
        description: "", 
        quantity: 1, 
        unit_price: 0, 
        amount: 0,
        billable: true,
        unit_type: 'hours'
      }],
      companyName: "",
      companyAddress: "",
      companyEmail: "",
      companyPhone: ""
    },
  });

  useEffect(() => {
    if (projectData && form) {
      if (projectData.organization) {
        form.setValue('organization_id', projectData.organization.id);
        form.setValue('companyName', projectData.organization.company_name || '');
        form.setValue('companyAddress', projectData.organization.company_address || '');
        form.setValue('companyEmail', projectData.organization.company_email || '');
        form.setValue('companyPhone', projectData.organization.company_phone || '');
      }
      form.setValue('project_id', projectId);

      if (projectData.milestones && projectData.milestones.length > 0) {
        const lineItems = [];
        
        projectData.milestones.forEach((milestone) => {
          lineItems.push({
            description: `Milestone: ${milestone.name}${milestone.description ? ` - ${milestone.description}` : ''}`,
            quantity: 1,
            unit_price: 0,
            amount: 0,
            billable: true,
            unit_type: 'hours'
          });
          
          if (milestone.deliverables && milestone.deliverables.length > 0) {
            milestone.deliverables.forEach((deliverable) => {
              lineItems.push({
                description: `    - ${deliverable.name}${deliverable.description ? ` - ${deliverable.description}` : ''}`,
                quantity: 1,
                unit_price: 0,
                amount: 0,
                billable: true,
                unit_type: 'hours'
              });
            });
          }
        });
        
        form.setValue('lineItems', lineItems);
      }
    }
  }, [projectData, form, projectId]);

  const onSubmit = async (values: any) => {
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const random = Math.random().toString(36).substring(2, 7).toUpperCase();

      const referenceNumber = `EST-${year}${month}${day}-${random}`;

      const totalAmount = values.lineItems?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0;

      // Map form fields to database columns names
      const estimateData = {
        reference_number: referenceNumber,
        organization_id: values.organization_id,
        project_id: values.project_id,
        issue_date: values.issue_date.toISOString(),
        expiry_date: values.expiry_date.toISOString(),
        notes: values.notes,
        terms: values.terms,
        amount: totalAmount,
        status: 'Draft',
        company_name: values.companyName || "",
        company_address: values.companyAddress || "",
        company_email: values.companyEmail || "",
        company_phone: values.companyPhone || "",
      };

      const { data, error } = await supabase
        .from('estimates')
        .insert([estimateData])
        .select();

      if (error) {
        console.error("Database insertion error:", error);
        toast({
          title: "Error",
          description: "Failed to create estimate. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data && data.length > 0 && values.lineItems) {
        const estimateId = data[0].id;

        const lineItemsToInsert = values.lineItems.map((item: any) => ({
          estimate_id: estimateId,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
          billable: item.billable,
          unit_type: item.unit_type
        }));

        const { error: lineItemsError } = await supabase
          .from('estimate_items')
          .insert(lineItemsToInsert);

        if (lineItemsError) {
          console.error("Line items insertion error:", lineItemsError);
          toast({
            title: "Error",
            description: "Failed to create line items. Please try again.",
            variant: "destructive",
          });
          return;
        }
      }

      toast({
        title: "Success",
        description: "Estimate created successfully!",
      });

      navigate("/estimates");
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: "Failed to create estimate. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        {/* Company "From" Fields */}
        <div className="rounded-md border p-4 mb-2 bg-muted/30">
          <div className="text-lg font-medium mb-2">Company ("From") Information</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormLabel>Company Name</FormLabel>
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormControl>
                    <Input placeholder="Your Company Name" {...field} />
                  </FormControl>
                )}
              />
            </div>
            <div>
              <FormLabel>Email</FormLabel>
              <FormField
                control={form.control}
                name="companyEmail"
                render={({ field }) => (
                  <FormControl>
                    <Input placeholder="example@email.com" {...field} />
                  </FormControl>
                )}
              />
            </div>
            <div>
              <FormLabel>Address</FormLabel>
              <FormField
                control={form.control}
                name="companyAddress"
                render={({ field }) => (
                  <FormControl>
                    <Textarea placeholder="Company Address" className="min-h-[54px]" {...field} />
                  </FormControl>
                )}
              />
            </div>
            <div>
              <FormLabel>Phone</FormLabel>
              <FormField
                control={form.control}
                name="companyPhone"
                render={({ field }) => (
                  <FormControl>
                    <Input placeholder="Company Phone" {...field} />
                  </FormControl>
                )}
              />
            </div>
          </div>
        </div>

        <EstimateOrganizationProjectFields 
          form={form} 
          isFromProject={isFromProject} 
          organizations={organizations} 
          projects={projects} 
        />

        <EstimateDateFields form={form} />

        <EstimateLineItems form={form} />

        <div>
          <FormLabel>Notes (Optional)</FormLabel>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormControl>
                <Textarea
                  placeholder="Enter any notes here."
                  className="min-h-[80px]"
                  {...field} />
              </FormControl>
            )}
          />
        </div>

        <div>
          <FormLabel>Terms & Conditions (Optional)</FormLabel>
          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormControl>
                <Textarea
                  placeholder="Enter your terms and conditions here."
                  className="min-h-[80px]"
                  {...field} />
              </FormControl>
            )}
          />
        </div>

        <Button type="submit">Create Estimate</Button>
      </form>
    </Form>
  );
};
