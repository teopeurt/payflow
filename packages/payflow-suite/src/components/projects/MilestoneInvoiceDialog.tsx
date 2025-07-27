import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@payflow/core/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CalendarIcon, Receipt } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/shared/Spinner";

const invoiceFormSchema = z.object({
  invoice_number: z.string().min(1, "Invoice number is required"),
  issue_date: z.date(),
  due_date: z.date(),
  selected_milestones: z.array(z.string()).min(1, "Select at least one milestone")
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface MilestoneInvoiceDialogProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MilestoneInvoiceDialog({ projectId, isOpen, onClose }: MilestoneInvoiceDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedMilestones, setSelectedMilestones] = useState<string[]>([]);
  const [currency, setCurrency] = useState<string>("USD");
  
  const issueDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);
  
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoice_number: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
      issue_date: issueDate,
      due_date: dueDate,
      selected_milestones: []
    },
  });
  
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("projects")
        .select(`
          *,
          organization:organizations(id, name, default_currency)
        `)
        .eq("id", projectId)
        .single();
        
      if (error) throw error;
      
      if (data?.organization?.default_currency) {
        setCurrency(data.organization.default_currency);
      }
      
      return data;
    },
    enabled: isOpen && !!projectId,
  });
  
  const { data: milestones = [], isLoading: isLoadingMilestones } = useQuery({
    queryKey: ["completed-milestones", projectId],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("milestones")
        .select(`
          id,
          name,
          description,
          status,
          due_date,
          deliverables(*)
        `)
        .eq("project_id", projectId)
        .eq("status", "completed")
        .order("due_date", { ascending: true });
        
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && !!projectId,
  });
  
  useEffect(() => {
    if (milestones.length > 0 && selectedMilestones.length === 0) {
      const milestoneIds = milestones.map(milestone => milestone.id);
      setSelectedMilestones(milestoneIds);
      form.setValue("selected_milestones", milestoneIds);
    }
  }, [milestones, form]);
  
  const toggleMilestoneSelection = (milestoneId: string) => {
    setSelectedMilestones(prev => {
      const newSelection = prev.includes(milestoneId)
        ? prev.filter(id => id !== milestoneId)
        : [...prev, milestoneId];
      
      form.setValue("selected_milestones", newSelection);
      return newSelection;
    });
  };
  
  const createInvoiceMutation = useMutation({
    mutationFn: async (values: InvoiceFormValues) => {
      const selectedMilestonesData = milestones.filter(milestone => 
        values.selected_milestones.includes(milestone.id)
      );
      
      const amount = selectedMilestonesData.length * 500;
      
      const newInvoiceData = {
        invoice_number: values.invoice_number,
        organization_id: project?.organization?.id,
        project_id: projectId,
        amount: amount,
        issue_date: values.issue_date.toISOString().split('T')[0],
        due_date: values.due_date.toISOString().split('T')[0],
        status: 'draft',
        notes: `Invoice for completed milestones: ${selectedMilestonesData.map(m => m.name).join(', ')}`,
      };
      
      const { data: createdInvoice, error: invoiceError } = await getSupabase()
        .from("invoices")
        .insert(newInvoiceData)
        .select("id")
        .single();
      
      if (invoiceError) throw invoiceError;
      
      const invoiceItems = selectedMilestonesData.map(milestone => ({
        invoice_id: createdInvoice.id,
        description: `Milestone: ${milestone.name}`,
        quantity: 1,
        unit_price: 500,
        amount: 500
      }));
      
      if (invoiceItems.length > 0) {
        const { error: itemsError } = await getSupabase()
          .from("invoice_items")
          .insert(invoiceItems);
        
        if (itemsError) throw itemsError;
      }
      
      return createdInvoice;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      
      toast({
        title: "Invoice created",
        description: "Invoice has been created successfully.",
      });
      
      onClose();
      form.reset();
      navigate(`/invoices/${data.id}`);
    },
    onError: (error) => {
      console.error("Error creating invoice:", error);
      toast({
        title: "Error",
        description: "There was an error creating the invoice. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  function onSubmit(values: InvoiceFormValues) {
    if (values.selected_milestones.length === 0) {
      toast({
        title: "No milestones selected",
        description: "Please select at least one milestone to create an invoice.",
        variant: "destructive",
      });
      return;
    }
    
    createInvoiceMutation.mutate(values);
  }
  
  const isSubmitting = createInvoiceMutation.isPending;
  const isLoading = isLoadingProject || isLoadingMilestones;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Create Invoice from Completed Milestones</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : milestones.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No completed milestones available for invoicing.</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="invoice_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="issue_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Issue Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="selected_milestones"
                render={() => (
                  <FormItem>
                    <FormLabel>Select Milestones to Invoice</FormLabel>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Milestone</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Deliverables</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {milestones.map((milestone) => (
                          <TableRow key={milestone.id}>
                            <TableCell>
                              <Checkbox 
                                checked={selectedMilestones.includes(milestone.id)} 
                                onCheckedChange={() => toggleMilestoneSelection(milestone.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{milestone.name}</TableCell>
                            <TableCell>
                              {milestone.due_date ? format(new Date(milestone.due_date), "MMM d, yyyy") : "-"}
                            </TableCell>
                            <TableCell>{milestone.deliverables?.length || 0}</TableCell>
                            <TableCell className="text-right">{currency} 500.00</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="bg-muted p-4 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Amount:</span>
                  <span className="font-bold text-lg">{currency} {selectedMilestones.length * 500}.00</span>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || selectedMilestones.length === 0}
                >
                  {isSubmitting ? "Creating..." : "Create Invoice"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
