
import React from "react";
import { useParams } from "react-router-dom";
import { ProjectForm, ProjectStatus } from "@/components/projects/ProjectForm";
import { PageHeader } from "@/components/shared/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Spinner } from "@/components/shared/Spinner";

interface Project {
  id: string;
  name: string;
  description: string | null;
  organization_id: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

const EditProject: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();
        
      if (error) throw error;
      return data as Project;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Spinner />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-medium">Project not found</h2>
        <p className="text-muted-foreground mt-2">
          The project you're looking for doesn't exist or has been removed.
        </p>
      </div>
    );
  }

  // Prepare form values with proper typing
  const formValues = {
    id: project.id,
    name: project.name,
    description: project.description || "",
    organization_id: project.organization_id,
    status: project.status as ProjectStatus,
    start_date: project.start_date ? new Date(project.start_date) : undefined,
    end_date: project.end_date ? new Date(project.end_date) : undefined
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Edit Project" 
        description="Update project details and manage milestones" 
      />
      
      <div className="rounded-md border p-6 bg-card">
        <ProjectForm defaultValues={formValues} isEditing={true} />
      </div>
    </div>
  );
};

export default EditProject;
