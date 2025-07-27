import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { useSearchParams } from 'react-router-dom';
import { schemaClient } from '@/lib/database';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@/components/shared/Spinner';
import { EstimateForm } from '@/components/estimates/EstimateForm';

const NewEstimate = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const [isFromProject, setIsFromProject] = useState(false);

  const { data: organizations, isLoading: isLoadingOrganizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data, error } = await schemaClient.app
        .organizations()
        .select("id, name, company_name, company_address, company_email, company_phone")
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await schemaClient.app.projects().select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: projectData, isLoading: isLoadingProject } = useQuery({
    queryKey: ['project-for-estimate', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await schemaClient.app
        .projects()
        .select(`
          *,
          organization:app.organizations(
            id, 
            name, 
            company_name,
            company_address,
            company_email,
            company_phone
          ),
          milestones:app.milestones(
            id, 
            name, 
            description,
            deliverables:app.deliverables(id, name, description)
          )
        `)
        .eq('id', projectId)
        .single();
        
      if (error) throw error;
      setIsFromProject(true);
      return data;
    },
    enabled: !!projectId,
  });

  if (projectId && isLoadingProject) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <PageHeader title="New Estimate" description="Create a new estimate for your client" />
        <div className="flex items-center justify-center min-h-[300px]">
          <Spinner />
        </div>
      </div>
    );
  }

  if (isLoadingOrganizations || isLoadingProjects) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <PageHeader title="New Estimate" description="Create a new estimate for your client" />
        <div className="flex items-center justify-center min-h-[300px]">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader title="New Estimate" description="Create a new estimate for your client" />
      <Card className="rounded-md border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          <EstimateForm 
            projectId={projectId}
            projectData={projectData}
            isFromProject={isFromProject}
            organizations={organizations}
            projects={projects}
          />
        </div>
      </Card>
    </div>
  );
};

export default NewEstimate;
