
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Define the milestone form schema
const milestoneFormSchema = z.object({
  name: z.string().min(2, {
    message: "Milestone name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  status: z.enum(["active", "completed", "on-hold"]),
  due_date: z.date().optional(),
});

type MilestoneFormValues = z.infer<typeof milestoneFormSchema>;

interface MilestoneDialogProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MilestoneDialog({ projectId, isOpen, onClose }: MilestoneDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Create form
  const form = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneFormSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "active",
    },
  });

  // Create milestone mutation
  const createMilestone = useMutation({
    mutationFn: async (values: MilestoneFormValues) => {
      const milestoneData = {
        name: values.name,
        description: values.description || null,
        status: values.status,
        // Convert Date to ISO string format when sending to Supabase
        due_date: values.due_date ? values.due_date.toISOString().split('T')[0] : null,
        project_id: projectId
      };
      
      const { data, error } = await supabase
        .from("milestones")
        .insert(milestoneData)
        .select();
        
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones", projectId] });
      toast({
        title: "Milestone created",
        description: "Your milestone has been created successfully.",
      });
      onClose();
      form.reset();
    },
    onError: (error) => {
      console.error("Error creating milestone:", error);
      toast({
        title: "Error",
        description: "There was an error creating your milestone. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Submit handler
  function onSubmit(values: MilestoneFormValues) {
    createMilestone.mutate(values);
  }
  
  const isSubmitting = createMilestone.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Milestone</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Milestone Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter milestone name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter milestone description" 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select milestone status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on-hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date (Optional)</FormLabel>
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
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="mt-6">
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
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Milestone"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
