
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { EstimateFormValues } from './EstimateFormSchema';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EstimateOrganizationProjectFieldsProps {
  form: UseFormReturn<EstimateFormValues>;
  isFromProject: boolean;
  organizations?: any[];
  projects?: any[];
}

export const EstimateOrganizationProjectFields = ({ 
  form, 
  isFromProject,
  organizations,
  projects 
}: EstimateOrganizationProjectFieldsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={form.control}
        name="organization_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Organization</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              value={field.value} 
              disabled={isFromProject}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select an organization" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {organizations?.map((organization) => (
                  <SelectItem key={organization.id} value={organization.id}>
                    {organization.name}
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
        name="project_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project {!isFromProject && "(Optional)"}</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              value={field.value}
              disabled={isFromProject}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
