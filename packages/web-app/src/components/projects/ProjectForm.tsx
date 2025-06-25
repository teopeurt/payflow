
import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Define the project status type
export type ProjectStatus = "active" | "completed" | "on-hold";

// Define the form schema with Zod
const projectFormSchema = z.object({
  name: z.string().min(2, {
    message: "Project name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  status: z.enum(["active", "completed", "on-hold"]),
  organization_id: z.string().uuid({
    message: "Please select a client.",
  }),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  defaultValues?: Partial<ProjectFormValues & { id?: string }>;
  isEditing?: boolean;
}

export function ProjectForm({ defaultValues, isEditing = false }: ProjectFormProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Create form
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      description: defaultValues?.description || "",
      status: defaultValues?.status || "active",
      organization_id: defaultValues?.organization_id || "",
      start_date: defaultValues?.start_date ? new Date(defaultValues.start_date) : undefined,
      end_date: defaultValues?.end_date ? new Date(defaultValues.end_date) : undefined,
    },
  });
  
  // Fetch clients (organizations)
  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name");
        
      if (error) throw error;
      return data || [];
    },
  });
  
  // Create project mutation
  const createProject = useMutation({
    mutationFn: async (values: ProjectFormValues) => {
      const projectData = {
        name: values.name,
        description: values.description || null,
        status: values.status,
        organization_id: values.organization_id,
        start_date: values.start_date ? format(values.start_date, 'yyyy-MM-dd') : null,
        end_date: values.end_date ? format(values.end_date, 'yyyy-MM-dd') : null
      };
      
      const { data, error } = await supabase
        .from("projects")
        .insert(projectData)
        .select();
        
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Project created",
        description: "Your new project has been created successfully.",
      });
      navigate("/projects");
    },
    onError: (error) => {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: "There was an error creating your project. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Update project mutation
  const updateProject = useMutation({
    mutationFn: async (values: ProjectFormValues & { id?: string }) => {
      if (!defaultValues?.id) throw new Error("Project ID is required for updates");
      
      const projectData = {
        name: values.name,
        description: values.description || null,
        status: values.status as ProjectStatus,
        organization_id: values.organization_id,
        start_date: values.start_date ? format(values.start_date, 'yyyy-MM-dd') : null,
        end_date: values.end_date ? format(values.end_date, 'yyyy-MM-dd') : null
      };
      
      const { data, error } = await supabase
        .from("projects")
        .update(projectData)
        .eq("id", defaultValues.id)
        .select();
        
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", defaultValues?.id] });
      toast({
        title: "Project updated",
        description: "Your project has been updated successfully.",
      });
      navigate("/projects");
    },
    onError: (error) => {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: "There was an error updating your project. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Submit handler
  function onSubmit(values: ProjectFormValues) {
    if (isEditing && defaultValues?.id) {
      updateProject.mutate({ ...values, id: defaultValues.id });
    } else {
      createProject.mutate(values);
    }
  }
  
  const isPending = createProject.isPending || updateProject.isPending;
  const buttonText = isEditing 
    ? (isPending ? "Saving..." : "Save Changes") 
    : (isPending ? "Creating..." : "Create Project");
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter project name" {...field} />
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter project description (optional)" 
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="organization_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoadingClients || clients.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project status" />
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
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate("/projects")}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isPending}
          >
            {buttonText}
          </Button>
        </div>
      </form>
    </Form>
  );
}
